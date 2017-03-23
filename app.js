const roomManage = require('./server/roomManage')
roomManage.on('onRoomUpdate', (obj) => {
  console.log(obj)
})
roomManage.on('onConnect', (obj) => {
  console.log(obj)
})
roomManage.on('onMessage', (obj) => {
  console.log(obj)
})
roomManage.addRoom('271934', 'dy')
