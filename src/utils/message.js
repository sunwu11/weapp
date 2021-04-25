import Taro from '@tarojs/taro'

export function toastSuccess(title) {
  Taro.showToast({
    title,
    icon: 'none',
    duration: 1000,
  });
}

export function loading(title) {
  Taro.showLoading({title});
}

export function toastNone(title) {
  Taro.showToast({
    title,
    icon: 'none',
    duration: 2000,
  });
}