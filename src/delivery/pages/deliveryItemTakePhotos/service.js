import { post, upLoadFile } from '@/utils/request';

export async function update(data) {
    return post('/tciApp_v1.0/Truck/UpdateDate', data);
}

export async function UpLoadFile(params) {
    return post('/tciApp_v1.0/File/UpLoadFile', params);
}
5