import { post } from '@/utils/request';

export async function getDeliveryList(data) {
    return post('/tciApp_v1.0/Truck/GetDeliveryList', data);
}

export async function update(data) {
    return post('/tciApp_v1.0/Truck/UpdateDate', data);
}

export async function ScanDeliveryNo(data) {
    return post('/tciApp_v1.0/Truck/ScanDeliveryNo', data);
}