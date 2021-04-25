import React, { useEffect } from 'react'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import { AtSegmentedControl, AtForm, AtInput, AtButton, AtActionSheet, AtActionSheetItem } from "taro-ui"
import { View, Image, Text, ScrollView, Form, Input, Button } from '@tarojs/components'
import { observer } from 'mobx-react'
import { useStores } from '@/hooks/useStores'
import { toastNone, toastSuccess } from '@/utils/message';
import dayjs from 'dayjs';
import takePictures from '@/assets/images/takePictures.png'
import imgTrackArrive1 from '@/assets/images/truck_arrive1.png'
import { update } from './service'

import './index.scss'

import QQMapWX from '../../../sdks/qqmap-wx-jssdk'

const key = 'DRHBZ-OE5WK-UFSJE-AS5JZ-T6SZJ-LVB2F';
let qqmapsdk = new QQMapWX({
  key
})

const Index = () => {

  const { userStore } = useStores();
  const { userCode } = userStore;

  const [current, setCurrent] = React.useState(0);
  // const [SealNo, setSealNo] = React.useState('');
  // const [PassNo, setPassNo] = React.useState('');
  const [img, setImg] = React.useState(null);
  const [scanMsg, setscanMsg] = React.useState({
    SealNo: '',
    PassNo: ''
  });

  const [isOpened, setIsOpened] = React.useState(false);

  const onSubmit = () => {
    // if (!scanMsg.SealNo || !scanMsg.PassNo) {
    //   toastNone('有未完成项需要填写')
    //   return;
    // }

    handleClick()
  }

  const handleClick = () => {
    // Taro.showLoading({ title: '开始打卡...' })
    // const { TruckOrder, NodeType } = getCurrentInstance().router.params;
    Taro.showLoading({ title: '开始获取授权信息...' })
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
      },
      fail: () => {
        Taro.showLoading({
          title: '获取经纬度失败，即将打卡...',
          icon: 'none',
          duration: 2000,
        })
        UpdateInfo()
      }
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
    const { TruckOrder, NodeType } = getCurrentInstance().router.params;

    update({
      UserCode: userCode,
      TruckOrder: TruckOrder,
      NodeType: NodeType,
      DateTime: dayjs().format('YYYY-MM-DD HH:mm'),
      Address: address,
      Longitude: longitude,
      Latitude: latitude,
      BusinessType: 'Pickup',
      SealNo: scanMsg.SealNo,
      PassNo: scanMsg.PassNo
    }).then(() => {
      Taro.hideLoading()
      toastSuccess('打卡成功')
      const timer = setTimeout(() => {
        Taro.navigateBack({
          delta: 1
        });
        clearTimeout(timer)
      }, 800)
    }).catch(error => {
      toastNone(`打卡失败：${error.Message}`);
    });
  }


  const handleChangeScanMsg = () => {
    setIsOpened(!isOpened)
    setCurrent(1)
  }

  const scan = () => {
    setIsOpened(!isOpened)
    setImg(imgTrackArrive1)
    // 只允许从相机扫码
    Taro.scanCode({
      scanType: 'qrCode',
      onlyFromCamera: true,
      success: ({ result }) => {
        setscanMsg(result)
        setIsOpened(!isOpened)
        // setImg(imgTrackArrive1)
      },
      fail: (error) => {
      }
    })
  }

  return (
    <View className='index'>
      {/* <AtSegmentedControl
        values={['拍照识别', '手工输入']}
        onClick={setCurrent}
        current={current}
        fontSize={32}
      /> */}
      {/* {
        current === 0
          ? <View className='tab-content1'>
            {img ? <Image src={img} /> : <View className='tab-content1-takePictures' onClick={scan}>
              <Image className='tab-content1-takePictures-img' src={takePictures} />
              <Text className='tab-content1-takePictures-text' >
                拍立扫
            </Text>
            </View>}
          </View>
          : null
      } */}
      {/* {
        current === 1
          ?
          : null
      } */}
      <View className='tab-content2'>
        <AtForm
          className='form'
        // onSubmit={onSubmit.bind(this)}
        >
          <AtInput
            clear
            // required
            name='SealNo'
            title='封治号'
            type='text'
            value={scanMsg.SealNo}
            onChange={(SealNo) => { setscanMsg({ ...scanMsg, SealNo }) }}
          />
          <AtInput
            clear
            // required
            name='PassNo'
            title='电子锁号'
            type='text'
            value={scanMsg.PassNo}
            // onChange={setPassNo}
            onChange={(PassNo) => { setscanMsg({ ...scanMsg, PassNo }) }
            }
          />
          <AtButton
            // form-type='submit'
            className='form-btn'
            onClick={onSubmit}
          // formType='submit'
          >提交</AtButton>
        </AtForm>
      </View>

      {/* <AtActionSheet isOpened={isOpened}>
        <AtActionSheetItem>
          封治号:{scanMsg.SealNo}
        </AtActionSheetItem>
        <AtActionSheetItem>
          电子锁号:{scanMsg.PassNo}
        </AtActionSheetItem>
        <View className='btnWrapper' >
          <AtButton className='btn' onClick={handleChangeScanMsg}>扫描信息有误，去修改</AtButton>

          <AtButton className='btn' onClick={onSubmit}>扫描信息无误</AtButton>
        </View>

      </AtActionSheet> */}
    </View>
  )
}

export default observer(Index);
