import { observable, action } from 'mobx'

export default class DeliveryStore {

    @observable
    itemList = []

    @observable
    list = []

    @observable
    files = []

    @observable
    doing = {}

    @action
    setList(list) {
        this.list = list
    }

    @action
    setItemList(itemList) {
        this.itemList = itemList
    }

    @action
    setFiles(files) {
        this.files = files
    }

    @action
    setdoingItem(doing) {
        this.doing = doing
    }
}