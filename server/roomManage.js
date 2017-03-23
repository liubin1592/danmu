const events = require('events')
const Dy = require('./room/dy')
function getKey (roomId, platform) {
  return `${roomId}_${platform}`
}
class RoomManage extends events {
  constructor () {
    super()
    this.rooms = new Map()
  }
  addRoom (roomId, platform) {
    if (!(roomId && platform)) {
      throw new Error('直播间编号或所属平台不能为空!')
    }
    let key = getKey(roomId, platform)
    if (!this.rooms.has(key)) {
      let room = null
      switch (platform) {
        case 'dy':
          room = new Dy(roomId)
          room.count = 1
          break
      }
      if (room) {
        room.init()
        .on('onInfo', (info) => {
          this.emit('onRoomUpdate', {
            key,
            data: info
          })
        })
        .on('onConnect', (isConnect) => {
          this.emit('onConnect', {
            key,
            isConnect
          })
        })
        .on('onData', (msg) => {
          this.emit('onMessage', {
            key,
            msg
          })
        })
      }
    } else {
      let room = this.rooms.get(key)
      if (room) {
        room.count += 1
      }
    }
  }
  deleteRoom (roomId, platform) {
    let key = getKey(roomId, platform)
    let room = this.rooms.get(key)
    if (room) {
      room.count -= 1
      if (room.count === 0) {
        room.close()
        this.rooms.delete(key)
      }
    }
  }
}
module.exports = new RoomManage()
