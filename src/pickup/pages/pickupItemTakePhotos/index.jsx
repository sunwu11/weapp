import React, { useEffect } from 'react'
import Taro, { getCurrentInstance } from '@tarojs/taro'
import { AtImagePicker, AtModal, AtModalContent , AtInput } from "taro-ui"
import { View, Image, Text, ScrollView } from '@tarojs/components'
import { observer } from 'mobx-react'
import { useStores } from '@/hooks/useStores'
import dayjs from 'dayjs';
import { update, UpLoadFile } from './service'
import { toastNone, toastSuccess } from '@/utils/message';

import './index.scss'

import QQMapWX from '../../../sdks/qqmap-wx-jssdk'

const key = 'DRHBZ-OE5WK-UFSJE-AS5JZ-T6SZJ-LVB2F';
let qqmapsdk = new QQMapWX({
  key
})

const Index = () => {

  const { userStore, deliveryStore } = useStores()
  const { userCode } = userStore
  const { doing } = deliveryStore;
  const [fileState, setFileState] = React.useState([]);
  const [isOpened, setIsOpened] = React.useState(false);
  const [CGBWT, setCGBWT] = React.useState('');
  const [previewImage, setPreviewImage] = React.useState('');

  useEffect(() => {
    const { TruckOrder } = getCurrentInstance().router.params;
    Taro.setNavigationBarTitle({
      title: `送货单${TruckOrder}新增图片`
    })
  }, []);

  const onImageClick = (item, file) => {
    setIsOpened(true)
    setPreviewImage(file.url)
  }

  const handleFinished = () => {
    const { TruckOrder, NodeType , EmptyCW } = getCurrentInstance().router.params;
    if (!CGBWT || !(/^[1-9]\d*$/.test(CGBWT))) { // /^[1-9]{1,}$/
      toastNone('请输入数字哦')
      return;
    }
    if(0<EmptyCW){
      let value = Math.abs(CGBWT- EmptyCW)
      if( 300 < value){
        toastNone('系统重量错误，不可以打卡哦')
        return
      }else if(150 < value){
        toastNone('系统重量异常，可以打卡')
      }
    }
    Taro.showLoading({ title: '上传中...' })
    Promise.all(fileState.map(item => {
      return new Promise((resolve, reject) => {
        const tokenData = Taro.getStorageSync('token');
        const token = tokenData ? tokenData.access_token : '';
        const obj = {
          filePath: item.url,
          url: `${API_HOST}/tciApp_v1.0/File/UpLoadFile?UserCode=${userCode}&BusinessType=Delivery&FileType=${NodeType}&OperationNo=${TruckOrder}`,
          name: item.url,
          header: {
            token
          },
          formData: { file: item.url }
        }
        return Taro.uploadFile({
          ...obj,
          success: res => {
            resolve(res.data.Data);
          },
          fail: (err) => {
            reject(err.data)
          }
        })
      });
    })).then(() => {
      toastSuccess('上传成功')
      handleClick()
    });
  }

  const handleClick = () => {
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
            success: function (resLocation) {
              if (resLocation.cancel) {
                //取消授权
                Taro.showToast({
                  title: '拒绝授权',
                  icon: 'none',
                  duration: 1000
                })
              } else if (resLocation.confirm) {
                //确定授权，通过wx.openSetting发起授权请求
                Taro.openSetting({
                  success: function (resOpenSetting) {
                    if (resOpenSetting.authSetting["scope.userLocation"] == true) {
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
        Taro.showLoading({ title: '获取经纬度中...' })
        const { latitude, longitude } = res
        getReverseLocation(latitude, longitude)
      }, fail: (() => {
        Taro.showLoading({ title: '获取经纬度失败，即将打卡...', })
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
          Taro.showLoading({ title: `获取详细地址失败，${locationRes.message}，打卡中...` })
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

  const UpdateInfo = (latitude='', longitude='', address='') => {
    const { TruckOrder, NodeType  } = getCurrentInstance().router.params;
    update({
      CGBWT:Number(CGBWT), // 重量
      UserCode: userCode,
      TruckOrder: TruckOrder,
      NodeType: NodeType,
      DateTime: dayjs().format('YYYY-MM-DD HH:mm'),
      Address: address,
      Longitude: longitude,
      Latitude: latitude,
      BusinessType: 'Pickup'
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
      Taro.hideLoading()
      toastNone(`打卡失败：${error.Message}`);
    });
  }

  return (
    <View className='index'>
      <AtInput
        name='value2'
        title='磅重'
        type='number'
        placeholder='单位（KG）,不含小数'
        value={CGBWT}
        onChange={setCGBWT}
      />
      <AtImagePicker
        length={3}
        files={fileState}
        onChange={setFileState}
        onImageClick={onImageClick}
      />
      <Text className='btnWrapper' onClick={handleFinished}>
        确认
      </Text>
      <AtModal isOpened={isOpened} footer={null} onClose={() => { setIsOpened(false) }}>
        <AtModalContent>
          <Image alt='example' style={{ width: '100%' }} className='pickup-wrapper-item-top-message-position-img1' src={previewImage} />
        </AtModalContent>
      </AtModal>
    </View>
  )
}

export default observer(Index);
