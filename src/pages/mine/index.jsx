import React, { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { observer } from 'mobx-react'
import avatar from '@/assets/images/avatar.png'
import { useStores } from '@/hooks/useStores'
import { toastNone, toastSuccess } from '@/utils/message';
import { getOpenID, getUserInfo } from './service'

import './index.scss'

const Index = () => {

  const { userStore } = useStores()

  const { username } = userStore

  useEffect(() => {
    if (username) {
      toastSuccess('登录成功');
    };
  }, [username]);

  const _handleLogin = (e) => {
    // session_key 已经失效，需要重新执行登录流程
    Taro.login({
      success(res) {
        if (res.code) {
          //发起网络请求
          getOpenID(res.code).then(resOpenid => {
            Taro.setStorageSync('resOpenid', resOpenid);
            getUserInfo({
              OpenID: resOpenid.OpenID,
              Session_Key: resOpenid.Session_Key,
              Phone: e.detail.encryptedData,
              IV: e.detail.iv,
            }).then(resUser => {
              Taro.setStorageSync('user', resUser);
              userStore.setUsername(resUser.UserName);
              userStore.setUserCode(resUser.UserCode);
              userStore.setRoleName(resUser.RoleName);
            }).catch(() => {
              Taro.showToast({
                title: '登录失败！请重试',
                icon: 'none',
                duration: 5000,
              });
            })
          }).catch(error => {
            Taro.showToast({
              title: '登录失败！' + error.errMsg,
              icon: 'none',
              duration: 5000,
            });
          })
        } else {
          Taro.showToast({
            title: '登录失败！' + res.errMsg,
            icon: 'none',
            duration: 5000,
          });
        }
      }
    })
  }

  const handleLogin = (e) => {
    if (e.detail.errMsg == "getPhoneNumber:fail user deny") {
      toastNone('你拒绝了授权,登录失败');
    } else if ('getPhoneNumber:ok') {
      Taro.checkSession({
        success() {
          const resOpenid = Taro.getStorageSync('resOpenid')
          if (!resOpenid) {
            _handleLogin(e);
            return;
          }
          getUserInfo({
            OpenID: resOpenid.OpenID,
            Session_Key: resOpenid.Session_Key,
            Phone: e.detail.encryptedData,
            IV: e.detail.iv,
          }).then(resUser => {
            Taro.setStorageSync('user', resUser);
            userStore.setUsername(resUser.UserName);
            userStore.setUserCode(resUser.UserCode);
            userStore.setRoleName(resUser.RoleName);
          }).catch(() => {
            Taro.showToast({
              title: '登录失败！请重试',
              icon: 'none',
              duration: 5000,
            });
          })
        },
        fail() {
          _handleLogin(e);
        }
      });
    }
  }

  return (
    <View>
      <View>
        <View className='avatarWrapper'>
          <Image className='avatar' src={avatar} />
          {
            username ? <Text>欢迎登陆，{username}</Text> :
              <AtButton type='primary' className='login' openType='getPhoneNumber' onGetPhoneNumber={handleLogin} size='normal'>点击登录</AtButton>
          }
        </View>
      </View>
      <View className='contentWrapper'>
        <View className='title'>
          温馨提示：
      </View>
        <Text className='content'>
          司机小程序是企业内部管理系统，需获取手机号，则可以查看到后台数据，否则无法获取后台数据，请谅解！
      </Text>
      </View>
      <Text className='version'>
        当前版本号：1.0.9
      </Text>
    </View>
  )
}

export default observer(Index);
