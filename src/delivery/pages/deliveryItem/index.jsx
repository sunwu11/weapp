import React, { useEffect, useRef } from 'react'
import Taro, { getCurrentInstance, useDidShow, useDidHide } from '@tarojs/taro'
import { AtCard, AtTimeline, AtImagePicker } from "taro-ui"
import { View, Image, Text, ScrollView, Button } from '@tarojs/components'
import _ from 'lodash'
import dayjs from 'dayjs';
import { observer } from 'mobx-react'
import { toastSuccess } from '@/utils/message';
import { useStores } from '@/hooks/useStores'
// import safety from '@/assets/images/safety.png'
import safety from '../../../assets/images/safety.png'
import position from '../../../assets/images/position.png'
import { GetDeliveryNodeList, update } from './service'
// import Empty from '../../../components/Empty'
import Time from '@/components/Time'
import './index.scss'

import QQMapWX from '../../../sdks/qqmap-wx-jssdk'
import { toastNone } from '../../../utils/message'

const key = 'DRHBZ-OE5WK-UFSJE-AS5JZ-T6SZJ-LVB2F';
let qqmapsdk = new QQMapWX({
  key
})

const Index = () => {

  const { userStore, deliveryStore } = useStores()

  const { userCode } = userStore
  const { itemList, doing } = deliveryStore

  const [touchTime, setTouchTime] = React.useState({
    startTime: null,
    endTime: null,
  });
  const [filesDone, setfilesDone] = React.useState([]);
  // let timer = useRef(null);

  useEffect(() => {
    const { TruckOrder } = getCurrentInstance().router.params;
    Taro.setNavigationBarTitle({
      title: `出库单${TruckOrder}`
    })
  }, []);

  // 对应 onShow
  useDidShow(() => {
    getList()
  })

  // 对应 onHide
  useDidHide(() => {
    // console.log('节点隐藏')
    // clearTimer()
  })

  // const setTimer = () => {
  //   if (timer && timer.current) {
  //     clearTimer()
  //   }
  //   timer.current = setInterval(
  //     () => {
  //       setNowTime(dayjs().format('HH:mm:ss'))
  //     },
  //     1000
  //   )
  // }

  // const clearTimer = () => {
  //   clearInterval(timer.current)
  // }

  const getList = () => {
    const { TruckOrder } = getCurrentInstance().router.params;
    GetDeliveryNodeList({ UserCode: userCode, TruckOrder }).then(list => {
      if (list.length === 0) {
        toastNone('当前没有打卡数据哦');
      }
      const doingItem = _.find(list, i => !i.DateTime)
      const newList = list && list.map(i => {
        i.status = doingItem && i.NodeType === doingItem.NodeType ? 'doing' : i.DateTime ? 'finished' : 'unfinished'
        return i
      })
      const itemWithFiles = _.find(list, i => i.FilePath)
      if (itemWithFiles) {
        const file = itemWithFiles && itemWithFiles.FilePath.split(';').map(item => {
          const obj = {}
          obj.url = `https://www.tciwms.com:8080${item}`
          return obj
        })
        // deliveryStore.setFiles(file);
        setfilesDone(file)
      }
      deliveryStore.setItemList(newList);
      deliveryStore.setdoingItem(doingItem);
    });
  }

  const handleClick = () => {
    if (doing.NodeType === '开始送货') {
      Taro.showToast({
        title: '请到列表批量打卡',
        icon: 'none',
        duration: 5000,
      });
      return;
    }
    Taro.showLoading({ title: '开始获取授权信息...' })
    // const { TruckOrder, NodeType } = getCurrentInstance().router.params;
    Taro.getSetting({
      success: (res) => {
        // Taro.showLoading({ title: '获取当前位置信息...' })
        // res.authSetting['scope.userLocation'] == undefined    表示 初始化进入该页面
        // res.authSetting['scope.userLocation'] == false    表示 非初始化进入该页面,且未授权
        // res.authSetting['scope.userLocation'] == true    表示 地理位置授权
        if (res.authSetting['scope.userLocation'] != undefined && res.authSetting['scope.userLocation'] != true) {
          //未授权
          Taro.hideLoading()
          Taro.showModal({
            title: '请求授权当前位置',
            content: '需要获取您的地理位置，请确认授权',
            success: function (getSettingRes) {
              if (getSettingRes.cancel) {
                //取消授权
                Taro.showToast({
                  title: '拒绝授权',
                  icon: 'none',
                  duration: 1000
                })
              } else if (getSettingRes.confirm) {
                //确定授权，通过wx.openSetting发起授权请求
                Taro.openSetting({
                  success: function (openSettingRes) {
                    if (openSettingRes.authSetting["scope.userLocation"] == true) {
                      Taro.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      })
                      //再次授权，调用wx.getLocation的API
                      getLocation()
                    } else {
                      Taro.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 1000
                      })
                    }
                  }
                })
              }
            }
          })
        } else if (res.authSetting['scope.userLocation'] == undefined) {
          //用户首次进入页面,调用wx.getLocation的API
          getLocation()
        }
        else {
          // 授权成功;
          //调用wx.getLocation的API
          getLocation()
        }
      }
    })
  }

  const getLocation = () => {
    Taro.showLoading({ title: '开始打卡...' })
    Taro.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 5000,
      success: function (res) {
        Taro.showLoading({ title: '定位中...' })
        const { latitude, longitude } = res
        getReverseLocation(latitude, longitude)
      }, fail: (() => {
        Taro.showLoading({
          title: '获取经纬度失败，即将打卡...',
          icon: 'none',
          duration: 2000,
        })
        UpdateInfo()
      })
    })
  }

  const getReverseLocation = (latitude, longitude) => { //获取逆地址编码;
    qqmapsdk.reverseGeocoder({
      latitude,
      longitude,
      complete: function (locationRes) {
        let address = ''
        if (!locationRes.status) {
          Taro.showLoading({ title: '打卡中...' })
          address = locationRes.result.address;
        } else {
          toastNone(`获取详细地址失败，${locationRes.message}，打卡中...`);
          address = '获取地址位置失败';
        }
        UpdateInfo(latitude, longitude, address)
      }
      // , fail: (error => {
      //   Taro.hideLoading()
      //   toastNone(`获取详细地址失败，${error.message}`);
      //   return;
      // })
    })
  }

  const UpdateInfo = (latitude = '', longitude = '', address = '') => {
    update({
      UserCode: userCode,
      TruckOrder: doing.TruckOrder,
      NodeType: doing.NodeType,
      DateTime: dayjs().format('YYYY-MM-DD HH:mm'),
      Address: address,
      Longitude: longitude,
      Latitude: latitude,
      BusinessType: 'Delivery'
    }).then(() => {
      Taro.hideLoading()
      toastSuccess('打卡成功')
      getList()
    }).catch(error => {
      Taro.hideLoading()
      toastNone(`打卡失败：${error.Message}`);
    });
  }

  const handleFilesChange = () => {
    const { TruckOrder } = getCurrentInstance().router.params;
    const url = `/delivery/pages/deliveryItemTakePhotos/index?NodeType=${doing.NodeType}&TruckOrder=${TruckOrder}`;
    Taro.navigateTo({ url })
  }

  return (
    <View className='index'>
      <View className='index-withData'><ScrollView
        className={`delivery-wrapper ${doing ? '' : 'withoutData'}`}
        scrollY
        scrollWithAnimation
      // scrollTop={scrollTop}
      // style={scrollStyle}
      // lowerThreshold={Threshold}
      // upperThreshold={Threshold}
      // onScrollToUpper={onScrollToUpper} // 使用箭头函数的时候 可以这样写 `onScrollToUpper={this.onScrollToUpper}`
      // onScroll={onScroll}
      >
        {
          itemList && itemList.map(item => {
            return (
              <View className='delivery-wrapper-item'
                key={item.NodeType}
              >
                <View className='delivery-wrapper-item-top'>
                  <View className={`delivery-wrapper-item-top-imgbox status_${item.status}_imgbox`}>
                    <Image className={`delivery-wrapper-item-top-imgbox-img status_${item.status}`} />
                  </View>
                  <View className='delivery-wrapper-item-top-message'>
                    <Text className={`delivery-wrapper-item-top-message-title status_${item.status}_title`}>
                      {item.NodeType}
                    </Text>
                    {item.DateTime ? <View><Text className='delivery-wrapper-item-top-message-time'>
                      {/* 使用时 替换成 item.time */}
                        打卡时间 ： {item.DateTime}
                    </Text>
                      <View className={`delivery-wrapper-item-top-message-position ${item.FilePath ? 'withImgWrapper' : null}`}>
                        <Image className='delivery-wrapper-item-top-message-position-img1' src={position} />
                        <Image className='delivery-wrapper-item-top-message-position-img2' src={safety} />
                        {
                          item.Address
                        }
                      </View></View> : null}
                    {item.FilePath ? <View className='delivery-wrapper-item-top-message-imgWrapper'>
                      <Text className='delivery-wrapper-item-top-message-imgWrapper-text' >回单照片</Text>
                      <View className='delivery-wrapper-item-top-message-imgWrapper-imgPicker' ></View>
                      <AtImagePicker
                        files={filesDone}
                        // onChange={(files, operationType, index) => {
                        //   // console.log(files, operationType, index, '111')
                        // }}
                        showAddBtn={false}
                      />
                    </View> : null}
                  </View>
                </View>
              </View>
            )
          })
        }
      </ScrollView>
        {doing && <View className='delivery-item-bottom'>
          <View
            className='delivery-item-bottom-done'
            hoverStartTime={2100}
            hoverStayTime={50}
            hoverClass='hover_time'
            // onLongpress={() => {
            //   console.log('长按')
            //   console.log(touchTime,'touchTime')
            // }}
            onTouchStart={() => {
              toastNone('长按打卡')
              setTouchTime({ ...touchTime, startTime: dayjs().valueOf() })
            }}
            onTouchEnd={() => {
              if (dayjs().valueOf() - touchTime.startTime >= 1800) {
                doing.NodeType === '客户签收' ? handleFilesChange() : handleClick()
                return;
              } else {
                toastNone('长按时间不够，请重试')
              }
            }}
          // onClick={doing.NodeType === '客户签收' ? handleFilesChange : handleClick}
          >
            <Text className='delivery-item-bottom-done-text'>
              {doing.NodeType}
            </Text>
            <Time />
            {/* <Text className='delivery-item-bottom-done-time'>
              {
                nowTime
              }
            </Text> */}
          </View>
        </View>}
      </View>
    </View>
  )
}

export default observer(Index);