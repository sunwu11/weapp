import React, { useEffect } from 'react'
import { navigateTo } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { observer } from 'mobx-react'
import imgTrackArrive1 from '@/assets/images/truck_arrive1.png'
import imgTrackArrive2 from '@/assets/images/truck_arrive2.png'
import { refreshToken } from '@/utils/request';

import './index.scss'

const Index = () => {

  const handleNav = current => {
    const url = current == 0 ? '/delivery/pages/delivery/index' : '/pickup/pages/pickup/index'
    navigateTo({ url })
  }

  useEffect(() => {
    // Taro.clearStorage();
    refreshToken();
  }, [])

  return (
    <View>
      <View onClick={() => { handleNav(0) }} className='grid-content bg-color-1'>
        <View><Image className='operation-pic1' src={imgTrackArrive1} /></View>
        <View className='grid-text'>
          <Text className='grid-text-cn'>送货</Text>
          <Text className='grid-text-en'>Delivery</Text>
        </View>
      </View>
      <View onClick={() => { handleNav(1) }} className='grid-content bg-color-2'>
        <View className='grid-text'>
          <Text className='grid-text-cn'>提货</Text>
          <Text className='grid-text-en'>Pick up</Text>
        </View>
        <View><Image className='operation-pic2' src={imgTrackArrive2} /></View>
      </View>
    </View>
  )
}

export default observer(Index);