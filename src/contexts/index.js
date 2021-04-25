import React from 'react'
import CounterStore from '@/stores/counter'
import UserStore from '@/stores/user'
import DeliveryStore from '@/stores/delivery'
import PickupStore from '@/stores/pickup'

export const storesContext = React.createContext({
  counterStore: new CounterStore(),
  userStore: new UserStore(),
  deliveryStore: new DeliveryStore(),
  pickupStore: new PickupStore(),
})