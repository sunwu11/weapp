export default {
  pages: [
    'pages/index/index',
    'pages/mine/index',
  ],
  permission: {
    "scope.userLocation": {
      "desc": "你的位置信息将用于小程序位置接口的效果展示" // 高速公路行驶持续后台定位
    }
  },
  tabBar: {
    borderStyle: "white",
    selectedColor: '#0182e5',
    list: [{
      pagePath: "pages/index/index",
      text: "首页",
      // color: '#0182e5',
      iconPath: "assets/images/home.png",
      selectedIconPath: "assets/images/home_active.png"
    },
    {
      pagePath: "pages/mine/index",
      text: "我的",
      // color: '#0182e5',
      iconPath: "assets/images/user.png",
      selectedIconPath: "assets/images/user_active.png"
    }]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  },
  subpackages: [
    {
      "root": "pickup",
      "pages": [
        'pages/pickup/index',
        'pages/pickupItem/index',
        'pages/pickupItemFinished/index',
        'pages/pickupItemTakePhotos/index',
      ]
    }, {
      "root": "delivery",
      "pages": [
        'pages/delivery/index',
        'pages/deliveryItem/index',
        'pages/deliveryItemTakePhotos/index',
      ]
    }
  ]
}
