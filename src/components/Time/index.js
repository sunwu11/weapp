import React from 'react'
import { Text } from '@tarojs/components'
import dayjs from 'dayjs';

export default class Time extends React.Component {//不受控组件避免重复渲染子组件
    constructor(props) {
        super(props);
        this.state = {
            time: dayjs()
        }
        setInterval(() => {
            this.setState({
                time: dayjs()
            })
        }, 1000)
    }
    render() {
        return <Text className='pickup-item-bottom-done-time'>
            {this.state.time.format('HH:mm:ss')}
        </Text>
    }
}