import React, { useEffect, useRef } from 'react'
import Taro, { getCurrentInstance, useDidShow, useDidHide } from '@tarojs/taro'
import _ from 'lodash'
import Anime, { anime } from 'react-anime'
import { AtCard, AtImagePicker } from "taro-ui"
import { View, Image, Text, ScrollView, Canvas } from '@tarojs/components'
import { observer } from 'mobx-react'
import { toastSuccess, toastNone } from '@/utils/message';
import { useStores } from '@/hooks/useStores'
import dayjs from 'dayjs';
import safety from '@/assets/images/safety.png'
import position from '@/assets/images/position.png'
import { GetPickupNodeList, update } from './service'
import Time from '@/components/Time'

import './index.scss'

import QQMapWX from '../../../sdks/qqmap-wx-jssdk'

const key = 'DRHBZ-OE5WK-UFSJE-AS5JZ-T6SZJ-LVB2F';
let qqmapsdk = new QQMapWX({
  key
})

const Index = () => {

  const { userStore, pickupStore } = useStores()

  const { userCode } = userStore
  const { itemList, doing } = pickupStore

  const [touchTime, setTouchTime] = React.useState({
    startTime: null,
    endTime: null,
  });

  useEffect(() => {
    const { TruckOrder } = getCurrentInstance().router.params;
    Taro.setNavigationBarTitle({
      title: `提货单${TruckOrder}`
    })
  }, []);

  // 对应 onShow
  useDidShow(() => {
    getList()
  })

  // 对应 onHide
  useDidHide(() => {

  })

  // const startProgress = () => {
  //   console.log('摁下')
  //   status.current = 'down'
  //   const countTimer = setInterval(() => {
  //     if (status.current === 'up') {
  //       clearInterval(countTimer)
  //     }
  //     if (timer.current < 20) {
  //       ++timer.current
  //       drawCircle(timer.current)
  //     } else {
  //       clearInterval(countTimer);
  //       doing.NodeType === '装车完成' ? handleFinished() : handleClick()
  //     }
  //   }, 100)
  // }

  // const endProgress = () => {
  //   console.log('抬起')
  //   status.current = 'up'
  //   const countTimer = setInterval(() => {
  //     if (status.current === 'down') {
  //       clearInterval(countTimer)
  //     }
  //     if (timer.current > 0) {
  //       --timer.current
  //       drawCircle(timer.current)
  //     } else {
  //       clearInterval(countTimer);
  //     }
  //   }, 100)
  // }

  // const clearProgress = () => {
  //   timer.current = 0;
  //   const context = Taro.createCanvasContext('canvas_timer');
  //   context.clearRect(0, 0, 600, 600);
  //   context.draw()
  // }

  /**
   * 画progress进度
   */
  // const drawCircle = (step) => {
  //   console.log('进度', step)
  //   const context = Taro.createCanvasContext('canvas_timer');
  //   context.clearRect(0, 0, 600, 600);
  //   context.setLineWidth(2);
  //   context.setStrokeStyle('#02A7F0');
  //   // context.setLineCap('round')
  //   context.beginPath();
  //   context.arc(58, 58, 58, -0.5 * Math.PI, (-0.5 + step / 10) * Math.PI, false);
  //   context.stroke();
  //   context.draw()
  // }

  const getList = () => {
    const { TruckOrder } = getCurrentInstance().router.params;
    GetPickupNodeList({ UserCode: userCode, TruckOrder }).then(list => {
      if (list.length === 0) {
        toastNone('当前没有打卡数据哦');
      }
      const doingItem = _.find(list, i => !i.DateTime)
      const newList = list && list.map(i => {
        i.status = doingItem && i.NodeType === doingItem.NodeType ? 'doing' : i.DateTime ? 'finished' : 'unfinished'
        return i
      })
      if (!doingItem) {
        toastSuccess('操作结束')
        const timer = setTimeout(() => { // 跳转回去
          Taro.navigateBack({
            delta: 1
          });
          clearTimeout(timer)
        }, 1300)
      }
      pickupStore.setItemList(newList);
      pickupStore.setDoingItem(doingItem);
    });
  }

  const handleClick = () => {
    // clearProgress()
    // Taro.showLoading({ title: '开始打卡...' })
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
        if (!doing.Distance) {  // 无需对比距离;
          Taro.showLoading({ title: '无需对比距离...' })
          getReverseLocation(latitude, longitude)
        } else { // 需要对比距离;
          Taro.showLoading({ title: '即将对比距离...' })
          calculateDistance(latitude, longitude)
        }
      },
      fail: () => { // 兼容 那些手机开启了位置权限，获取不到位置 则 直接打卡;
        Taro.showLoading({
          title: '获取经纬度失败，即将打卡...',
          icon: 'none',
          duration: 2000,
        })
        UpdateInfo()
      },
    })
  }

  const calculateDistance = (latitude, longitude) => {  // 计算一个点到多点的步行、驾车距离。
    qqmapsdk.calculateDistance({
      mode: 'straight',
      from: {
        latitude,
        longitude,
      },
      to: [{
        latitude: Number(doing.Latitude),
        longitude: Number(doing.Longitude)
      }],
      // complete: (distanceRes) => {
      //   console.log('已经获取位置距离', distanceRes)
      //   if (!distanceRes.status) { // 获取成功;
      //     Taro.showLoading({ title: '已获取位置距离，开始计算...' })
      //     const { result: elements } = distanceRes
      //     if (elements[0].distance > doing.Distance) { // 未到达指定距离;
      //       Taro.hideLoading()
      //       toastNone('未到达指定位置，请到达后重试');
      //       return;
      //     } else { // 当前距离合适;
      //       Taro.showLoading({ title: '已到达指定位置...' })
      //       getReverseLocation(latitude, longitude)
      //     }
      //   } else { // 获取失败
      //     Taro.hideLoading()
      //     toastNone(`获取位置距离失败，${distanceRes.message}...`);
      //     // getReverseLocation(latitude, longitude)
      //   }
      // },
      success: (distanceRes) => {
        Taro.showLoading({ title: '已获取位置距离，开始计算...' })
        const { result: { elements } } = distanceRes

        const { distance } = elements[0];
        const distanceString = (distance / 1000) > 1 ? `${distance / 1000}km` : `${distance}m`
        Taro.showLoading({ title: `当前距离${distanceString}...` })
        if (distance > doing.Distance) { // 未到达指定距离;
          Taro.hideLoading()
          toastNone(`未到达指定位置,当前距离${distanceString}，请到达后重试`);
          return;
        } else { // 当前距离合适;
          Taro.showLoading({ title: '到达指定位置...' })
          getReverseLocation(latitude, longitude)
        }
      },
      fail: (error => {
        Taro.hideLoading()
        toastNone(`获取位置距离失败，${error.message}...`);
      })
    })
  }


  const getReverseLocation = (latitude, longitude) => { //逆地址编码; // 获取当前 address;
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
      BusinessType: 'Pickup'
    }).then(() => {
      Taro.hideLoading()
      toastSuccess('打卡成功')
      getList()
    }).catch(error => {
      Taro.hideLoading()
      toastNone(`打卡失败：${error.Message}`);
    });
  }

  const handleFinished = () => {
    // clearProgress()
    const url = `/pickup/pages/pickupItemFinished/index?NodeType=${doing.NodeType}&TruckOrder=${doing.TruckOrder}`;
    Taro.navigateTo({ url })
  }

  const handleFilesChange = ()=>{
    const url = `/pickup/pages/pickupItemTakePhotos/index?NodeType=${doing.NodeType}&TruckOrder=${doing.TruckOrder}&EmptyCW=${doing.EmptyCW}`;
    Taro.navigateTo({ url })
  }

  return (
    <View className='index'>
      <ScrollView
        className='pickup-wrapper'
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
              <View className='pickup-wrapper-item'
                key={item.NodeType}
              >
                <View className='pickup-wrapper-item-top'>
                  <View className={`pickup-wrapper-item-top-imgbox status_${item.status}_imgbox`}>
                    <Image className={`pickup-wrapper-item-top-imgbox-img status_${item.status}`} />
                  </View>
                  <View className='pickup-wrapper-item-top-message'>
                    <Text className={`pickup-wrapper-item-top-message-title status_${item.status}_title`}>
                      {item.NodeType}
                    </Text>
                    {
                      item.DateTime ? <View>
                        <Text className='pickup-wrapper-item-top-message-time'>
                          {/* 使用时 替换成 item.time */}
                      打卡时间 ： {item.DateTime}
                        </Text>
                        <View className='pickup-wrapper-item-top-message-position'>
                          <Image className='pickup-wrapper-item-top-message-position-img1' src={position} />
                          <Image className='pickup-wrapper-item-top-message-position-img2' src={safety} />
                          {
                            item.Address
                          }
                        </View>
                      </View> : null
                    }
                  </View>
                </View>
              </View>
            )
          })
        }
      </ScrollView>

      {doing && <View className='pickup-item-bottom'>
        <View
          // ref={touchRef}
          // ref={el => (touchRef = el)}
          className='pickup-item-bottom-done'
          hoverStartTime={2100}
          hoverStayTime={50}
          hoverClass='hover_time'
          onTouchStart={() => {
            toastNone('长按打卡')
            setTouchTime({ ...touchTime, startTime: dayjs().valueOf() })
          }}
          onTouchEnd={() => {
            if (dayjs().valueOf() - touchTime.startTime >= 1800) {
              doing.NodeType === '装车完成' ? handleFinished() : doing.NodeType === '到达内1' ? handleFilesChange() :  handleClick()
              return;
            } else {
              toastNone('长按时间不够，请重试')
            }
          }}
        >
          <Text className='pickup-item-bottom-done-text'>
            {doing.NodeType}
          </Text>
          <Time />
          {/* <Canvas
            className='canvas_timer'
            canvasId='canvas_timer'
            onTouchStart={startProgress}
            // onTouchMove
            onTouchEnd={endProgress}
            onTouchCancel={clearProgress}
          // onLongTap={startProgress}
          >
          </Canvas> */}
        </View>
      </View>}
    </View>
  )
}

export default observer(Index);
