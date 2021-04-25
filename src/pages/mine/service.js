import { post } from '@/utils/request';

export async function getOpenID(code) {
    return post('/tciApp_v1.0/User/GetWeChatOpenID', { UserCode: code })
}

export async function getUserInfo(data) {
    return post('/tciApp_v1.0/User/CheckPhone', data)
}