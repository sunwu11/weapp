import { post } from '../../../utils/request';

export async function GetDeliveryNodeList(data) {
    return post('/tciApp_v1.0/Truck/GetDeliveryNodeList', data);
}

export async function update(data) {
    return post('/tciApp_v1.0/Truck/UpdateDate', data);
}

export async function ScanDeliveryNo(data) {
    return post('/tciApp_v1.0/Truck/UpdateDate', data);
}