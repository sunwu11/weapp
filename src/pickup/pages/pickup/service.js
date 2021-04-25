import { post } from '@/utils/request';

export async function getPickupList(data) {
    return post('/tciApp_v1.0/Truck/GetPickupList', data)
}

export async function ScanPickupNo(data) {
    return post('/tciApp_v1.0/Truck/ScanPickupNo', data);
}