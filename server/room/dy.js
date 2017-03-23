const events = require('events')
const http = require('http')
const net = require('net')

const Data = require('./data')
const Protocol = require('./dyProtocol')
const host = 'openbarrage.douyutv.com'
const port = 8601
const api = 'http://open.douyucdn.cn/api/RoomApi/room/'

function getRoomInfo () {
  http.get(api.concat(this.data.roomId), (res) => {
    if (res.statusCode === 200) {
      let buf = new Buffer(0)
      res.on('data', (data) => {
        buf = Buffer.concat([buf, data], data.length + buf.length)
      })
      res.on('end', () => {
        try {
          let obj = JSON.parse(buf)
          if (obj && obj.error === 0) {
            let info = obj.data
            Object.assign(this.data.info, {
              avatar: info.avatar,
              room_name: info.room_name,
              room_id: info.room_id,
              owner_name: info.owner_name,
              room_thumb: info.room_thumb,
              room_href: `https://www.douyu.com/${info.room_id}`,
              room_status: info.room_status,
              owner_value: info.owner_weight,
              fans: info.fans_num,
              online: parseInt(info.online, 10)
            })
            for (let gift of info.gift) {
              this.data.gifts[gift.id] = {
                id: gift.id,
                name: gift.name,
                type: gift.type,
                pc: gift.pc
              }
            }
            this.emit('onInfo', this.data)
            connectServer.call(this)
          } else {
            this.emit('onInfo', null)
          }
        } catch (e) {
          this.emit('onInfo', null)
        }
      }).on('error', (e) => {
        this.emit('onInfo', null)
      })
    } else {
      this.emit('onInfo', null)
    }
  })
}
function connectServer () {
  this.socket = new net.Socket()
  this.socket.setEncoding('hex')
  this.socket.connect(port, host, () => {
    this.emit('onConnect', true)
    this.socket.write(Protocol.toBuffer({
      type: 'loginreq',
      roomid: this.data.info.room_id
    }))
    this.timer = setInterval(() => {
      this.socket.write(Protocol.toBuffer({
        type: 'keepalive',
        tick: Math.floor(new Date().getTime() * 0.001)
      }))
    }, 45 * 1000)
    this.socket.on('error', (e) => {
      this.emit('onConnect', false)
      this.timer_out = setTimeout(() => {
        connectServer.call(this)
      }, 3 * 1000)
    })
    this.socket.on('data', (buf) => {
      let msg = Protocol.toJson(buf)
      if (msg) {
        let type = msg.type
        if (type === 'loginres') {
          this.socket.write(Protocol.toBuffer({
            type: 'joingroup',
            rid: this.data.info.room_id,
            gid: '-9999'
          }))
        } else {
          if (['chatmsg', 'dgb', 'uenter', 'srres'].includes(type)) {
            this.emit('onData', convert.call(this, msg))
          }
        }
      }
    })
  })
}
function convert (obj) {
  let msg = {
    time: new Date().getTime(),
    type: obj.type,
    user: {
      plat: obj.ct || '0',
      uid: obj.uid,
      nickName: obj.nn,
      level: obj.level
    }
  }
  switch (obj.type) {
    case 'chatmsg':
      msg.content = obj.txt
      break
    case 'dgb':
     let gift = this.data.gifts[obj.gfid]
      msg.content = {
        gfid: obj.gfid,
        giftName: gift && gift.name,
        hits: obj.hits || 1
      }
      break
    case 'uenter':
      msg.content = '进入了直播间'
      break
    case 'srres':
      msg.content = '分享了直播间'
      break
  }
  return msg
}
class Dy extends events {
  constructor (roomId) {
    super()
    this.data = new Data(roomId)
  }
  init () {
    getRoomInfo.call(this)
    return this
  }
  close () {
    clearTimeout(this.timer_out)
    clearInterval(this.timer)
    this.socket.destroy()
  }
}
module.exports = Dy
