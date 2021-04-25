import React from 'react'
import { View, Image, Text } from '@tarojs/components'
import empty from '../../assets/images/empty.png'
import './index.scss'

export default () => (
    <View className='empty'>
        <Image className='empty-img' src={empty} />
    </View>
)