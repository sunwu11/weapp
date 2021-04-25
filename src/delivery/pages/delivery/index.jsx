import React, { useEffect } from 'react'
import Taro, { useDidShow, useDidHide, usePullDownRefresh } from '@tarojs/taro'
import { AtCard, AtIcon } from "taro-ui"
import { View, Image, Text, ScrollView } from '@tarojs/components'
import { observer } from 'mobx-react'
import { useStores } from '@/hooks/useStores'
import dayjs from 'dayjs';
import _ from 'lodash'
import delivery_item from '../../../assets/images/delivery_item.png'
import { getDeliveryList, update, ScanDeliveryNo } from './service'
import { toastNone, toastSuccess } from '../../../utils/message';
import scan from '../../../assets/images/scan.png'
import Empty from '../../../components/Empty'

import './index.scss'

import QQMapWX from '../../../sdks/qqmap-wx-jssdk'

const key = 'DRHBZ-OE5WK-UFSJE-AS5JZ-T6SZJ-LVB2F';
let qqmapsdk = new QQMapWX({
  key
})

const Index = () => {

  const { userStore, deliveryStore } = useStores()

  const { userCode } = userStore
  const { list } = deliveryStore

  useEffect(() => {
    if (!userCode) {
      toastNone('请先登录');
    };
  }, [userCode]);

  // 对应 onShow
  useDidShow(() => {
    getList()
  })

  // 对应 onHide
  useDidHide(() => {

  })

  usePullDownRefresh(async () => {
    await getList()
    Taro.stopPullDownRefresh()
  })

  const getList = () => {
    Taro.showLoading({ title: '加载中...' })
    getDeliveryList({ UserCode: userCode }).then(resList => {
      deliveryStore.setList(resList);
      Taro.hideLoading()
    }).catch(() => {
      Taro.hideLoading()
    });
  }

  const handleClick = (item) => {
    const url = `/delivery/pages/deliveryItem/index?NodeType=${item.NodeType}&TruckOrder=${item.TruckOrder}`;
    Taro.navigateTo({ url })
  }

  const handleScan = () => {
    Taro.scanCode({
      scanType: 'barCode',
      // onlyFromCamera: true, // 只允许从相机扫码
      success: ({ result }) => {
        Taro.showLoading({ title: '识别中...' })
        ScanDeliveryNo({ UserCode: userCode, TruckOrder: result }).then(() => {
          Taro.hideLoading()
          toastSuccess('扫描成功');
          getList()
        }).catch(error => {
          toastNone(`扫描失败：${error.Message}`);
          Taro.hideLoading()
        });
      },
      fail: () => {
        toastNone('扫描失败，请重试');
        Taro.hideLoading()
      }
    })
  }

  const handleClock = () => {
    if (list.length === 0) {
      toastNone('当前不存在数据')
      return;
    }
    const deliveryList = list ? _.cloneDeep(list.slice()).filter(item => item.NodeType === '开始送货') : []
    if (deliveryList.length === 0) {
      toastNone('当前已全部送货打卡完成，请勿重复操作')
      return;
    }
    // promise.all
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
    Taro.showLoading({ title: '开始批量打卡...' })
    Taro.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 5000,
      success: function (res) {
        Taro.showLoading({ title: '定位中...' })
        const { latitude, longitude } = res
        getReverseLocation(latitude, longitude)
      }
      , fail: (() => {
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
        // 每一个都是 update(data) data = { UserCode: userCode, TruckOrder, NodeType, DateTime: dayjs().format('YYYY-MM-DD HH:mm'), Address: locationRes.address, Longitude: longitude, Latitude: latitude }
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
    const deliveryList = list ? _.cloneDeep(list.slice()).filter(item => item.NodeType === '开始送货') : []
    Promise.all(deliveryList.map(item => {
      let obj = {
        UserCode: userCode,
        TruckOrder: item.TruckOrder,
        NodeType: item.NodeType,
        DateTime: dayjs().format('YYYY-MM-DD HH:mm'),
        Address: address,
        Longitude: longitude,
        Latitude: latitude,
        BusinessType: 'Delivery'
      }
      return update(obj)
    })).then(() => {
      Taro.hideLoading()
      toastSuccess('批量打卡完成')
      getList()
    }).catch(() => {
      Taro.hideLoading()
      toastNone('批量打卡失败，请重试')
    });
  }

  return (
    <View className='index'>
      <View className='scanCode' onClick={handleScan}>
        <Image className='scanCode-img' src={scan} />
      </View>
      {
        list.length !== 0 ? <View>
          <ScrollView
            className='itemWrapper'
            scrollY
            scrollWithAnimation
          >
            {
              list && list.map(i => <AtCard
                className='card'
                onClick={handleClick.bind(this, i)}
                key={i.TruckOrder}
              >
                <View className='at-row card-view'>
                  <View className='at-col-1 card-pic-wrapper'>
                    <Image className='card-pic' src={delivery_item} />
                  </View>
                  <View className='at-col-9 card-content'>
                    <View className='at-row card-code'>出库单号：{i.TruckOrder}</View>
                    <View className='at-row card-item'>司机手机号:<Text>{i.Tel}</Text><Text className='card-text'>{i.TruckNo}</Text></View>
                    <View className='at-row card-item'>地址：{i.Address}</View>
                    <View className='at-row card-item card-item-time'>截单时间：{i.DeadLine}</View>
                  </View>
                  <View className='at-col-1 card-right'>
                    <AtIcon value='chevron-right' size='35' color='#cccccc'></AtIcon>
                  </View>
                </View>
              </AtCard>)
            }
          </ScrollView>
        </View> : <View>
            <Empty />
          </View>
      }
      <View className='index-bottom' onClick={handleClock}>
        开始送货打卡
      </View>
    </View>
  )
}

export default observer(Index);