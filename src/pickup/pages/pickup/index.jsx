import React, { useEffect } from 'react'
import Taro, { useDidShow, useDidHide, usePullDownRefresh } from '@tarojs/taro'
import { AtCard, AtIcon, AtActivityIndicator } from "taro-ui"
import { View, Image, Text, ScrollView } from '@tarojs/components'
import { observer } from 'mobx-react'
import { useStores } from '@/hooks/useStores'
import { getPickupList, ScanPickupNo } from './service'
import { toastNone, toastSuccess } from '@/utils/message';
import pickup_item from '@/assets/images/pickup_item.png'
import scan from '@/assets/images/scan.png'
import Empty from '@/components/Empty'

import './index.scss'

const Index = () => {

  const { userStore, pickupStore } = useStores()

  const { userCode } = userStore
  const { pickList } = pickupStore

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
    // console.log('列表隐藏')
  })

  usePullDownRefresh(async () => {
    await getList()
    Taro.stopPullDownRefresh()
  })

  const getList = () => {
    Taro.showLoading({ title: '加载中...' })
    getPickupList({ UserCode: userCode }).then(resList => {
      pickupStore.setPickList(resList);
      Taro.hideLoading()
    }).catch(error => {
      Taro.hideLoading()
      toastNone(`获取列表失败：${error.Message}`);
    });
  }

  const handleClick = (item) => {
    const url = `/pickup/pages/pickupItem/index?NodeType=${item.NodeType}&TruckOrder=${item.TruckOrder}`;
    Taro.navigateTo({ url })
  }

  const handleScan = () => {
    // 只允许从相机扫码
    Taro.scanCode({
      scanType: 'barCode',
      // onlyFromCamera: true,
      success: ({ result }) => {
        Taro.showLoading({ title: '识别中...' })
        ScanPickupNo({ UserCode: userCode, TruckOrder: result }).then(() => {
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

  return (
    <View className='index'>
      <View>
        <View className='scanCode' onClick={handleScan}>
          <Image className='scanCode-img' src={scan} />
        </View>
        {
          pickList.length !== 0 ?
            <ScrollView
              className='itemWrapper'
              scrollY
              scrollWithAnimation
            >
              {
                pickList && pickList.map(i => <AtCard
                  className='card'
                  key={i.TruckOrder}
                  onClick={handleClick.bind(this, i)}
                >
                  <View className='at-row card-view'>
                    <View className='at-col-1 card-pic-wrapper'>
                      <Image className='card-pic' src={pickup_item} />
                    </View>
                    <View className='at-col-9 card-content'>
                      <View className='at-row card-phone'>手机号：{i.Tel}</View>
                      <View className='at-row card-item'>车牌号：<Text className='card-text'>{i.TruckNo}</Text></View>
                      <View className='at-row card-item'>地址：{i.Adress}</View>
                      <View className='at-row card-item'>系统批次号：{i.TruckOrder}</View>
                    </View>
                    <View className='at-col-1 card-right'>
                      <AtIcon value='chevron-right' size='35' color='#cccccc'></AtIcon>
                    </View>
                  </View>
                </AtCard>)
              }
            </ScrollView> :
            <Empty />
        }
      </View>
    </View>
  )
}

export default observer(Index);