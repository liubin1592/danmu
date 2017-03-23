class Data {
  constructor (roomId) {
    this.roomId = roomId
    this.info = {
      avatar: '', // 主播头像
      room_name: '', // 直播间标题
      room_id: '', // 直播间编号
      owner_name: '', // 主播名称
      room_thumb: '', // 直播间截图
      room_href: '', // 直播间地址
      room_state: 0, // 直播间状态
      owner_value: 0, // 主播等级
      fans: 0, // 粉丝数量
      online: 0,  // 在线人数
      state: 0 // 状态
    }
    this.gifts = {}
  }
}
module.exports = Data
