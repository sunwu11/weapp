import { observable, action } from 'mobx'

export default class userStore {

  @observable
  username = null

  @observable
  userCode = null

  @observable
  roleName = null

  @action
  setUsername(name) {
    this.username = name;
  }

  @action
  setUserCode(code) {
    this.userCode = code;
  }

  @action
  setRoleName(role) {
    this.roleName = role;
  }
}