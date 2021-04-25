import { observable, action, computed } from 'mobx'

export default class CounterStore {

  @observable
  count = 0

  @action
  increment() {
    this.count++
  }

  @action
  decrement() {
    this.count--
  }

  @action
  incrementAsync() {
    setTimeout(() => {
      this.count++
    }, 1000)
  }

  @computed
  get doubleCount() {
    return this.count * 2
  }
}