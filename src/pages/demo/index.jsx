import React, { useEffect } from 'react'
import { View, Button, Text } from '@tarojs/components'
import { AtTabBar } from 'taro-ui'
import { observer } from 'mobx-react'
import { useStores } from '@/hooks/useStores'

import './index.scss'

const Index = () => {

  const { counterStore } = useStores()

  const { count, doubleCount } = counterStore

  const increment = () => {
    counterStore.increment()
  }

  const decrement = () => {
    counterStore.decrement()
  }

  const incrementAsync = () => {
    counterStore.incrementAsync()
  }

  return (
    <View className='index'>
      <Button onClick={increment}>+</Button>
      <Button onClick={decrement}>-</Button>
      <Button onClick={incrementAsync}>Add Async</Button>
      <View><Text>{count}</Text></View>
      <View><Text>{doubleCount}</Text></View>
      <AtTabBar
        fixed
        tabList={[
          { title: '首页', iconType: 'home' },
          { title: '我的', iconType: 'user' },
        ]}
      />
    </View>
  )
}

export default observer(Index);