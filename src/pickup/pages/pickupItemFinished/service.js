import { post } from '@/utils/request';

export async function update(data) {
    return post('/tciApp_v1.0/Truck/UpdateDate', data);
}
