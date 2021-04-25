import axios, { PostData, FileData } from 'taro-axios'
import Taro from '@tarojs/taro'
import dayjs from 'dayjs';
import md5 from 'md5';

axios.defaults.baseURL = API_HOST;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

axios.interceptors.request.use(config => {
  const tokenData = Taro.getStorageSync('token');
  const timestamp = new Date().getTime().toString();
  const nonce = Math.floor((Math.random() * 1000) + 1).toString();
  const token = tokenData ? tokenData.access_token : '';
  const params = JSON.stringify(config.data);
  const signature = (md5(timestamp + nonce + token + params + REQUEST_SIGNATURE_FIXEDVALUE)).toUpperCase();

  // 在发送请求之前做些什么
  const headers = {
    ...config.headers,
    timestamp,
    nonce,
    token,
    signature,
  }

  return { ...config, headers }
}, function (error) {
  // 对请求错误做些什么
  return Promise.reject(error);
});

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
  // 对响应数据做点什么
  return response;
}, function (error) {
  // 对响应错误做点什么
  return Promise.reject(error);
});

export async function post(url, data) {
  return new Promise((resolve, reject) => {
    refreshToken().then(() => {
      axios.post(url, data).then(res => {
        const { ResultCode } = res.data;
        if (ResultCode === 200) {
          resolve(res.data.Data);
        } else {
          reject(res.data)
        }
      }).catch(err => {
        reject(err);
      });
    }).catch(err => {
      reject(err);
    })
  });
}

export async function refreshToken() {
  return new Promise((resolve, reject) => {
    const tokenData = Taro.getStorageSync('token');
    if (tokenData instanceof Object && dayjs().unix() < tokenData.expire_time) {
      resolve();
    } else {
      const options = {
        method: 'POST',
        data: {
          appKey: TOKEN_APPKEY,
          appSecret: TOKEN_APPSECRET,
          grant_type: TOKEN_GRANT_TYPE,
        },
        url: "/btBasic_v1.0/Token/GetToken",
      };

      axios(options).then(res => {
        if (res.data.ResultCode == 200) {
          const token = {
            access_token: res.data.Data.access_token,
            expire_time: dayjs().unix() + res.data.Data.expires_in - 10,
          };
          // console.log('new token', res)
          Taro.setStorageSync('token', token);
          resolve();
        } else {
          reject(`${res.data.ResultCode}: ${res.data.Message}`);
        }
      }).catch(error => {
        reject(error);
      })
    }
  });
}