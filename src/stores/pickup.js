import { observable, action } from 'mobx'

export default class PickupStore {

    @observable
    itemList = []

    @observable
    pickList = []

    @observable
    doing = {}

    @action
    setItemList(itemList) {
        this.itemList = itemList
    }

    @action
    setPickList(pickList) {
        this.pickList = pickList
    }


    @action
    setDoingItem(doing) {
        this.doing = doing
    }
}