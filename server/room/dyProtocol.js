class DyProtocol {
  escape (str) {
    return str.toString()
      .replace(/@/g, '@A')
      .replace(/\//g, '@S')
  }
  unescape (str) {
    return str.replace(/@A/g, '@')
      .replace(/@S/g, '/')
  }
  serialize (obj) {
    if (!obj) {
      return
    }
    var kvPairs = []
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        kvPairs.push(this.escape(key)
          .concat('@=')
          .concat(this.escape(obj[key])))
      }
    }
    return kvPairs.join('/')
      .concat('/')
  }
  deserialize (objStr) {
    if (!objStr) {
      return
    }
    var obj = {}
    var kvPairs = objStr.split('/')
    kvPairs.forEach(function (kvStr) {
      var kv = kvStr.split('@=')
      if (kv.length !== 2) {
        return
      }
      var key = this.unescape(kv[0])
      var value = this.unescape(kv[1])
      if (value.indexOf('@=') >= 0) {
        value = this.deserialize(value)
      }
      obj[key] = value
    }.bind(this))
    return obj
  }
  toBuffer (msg) {
    let bodybuf = new Buffer(this.serialize(msg).concat('\0'))
    var headbuf = new Buffer(12)
    var buf = Buffer.concat([headbuf, bodybuf], bodybuf.length + headbuf.length)
    buf.writeInt32LE(buf.length - 4, 0)
    buf.writeInt32LE(buf.length - 4, 4)
    buf.writeInt16LE(689, 8)
    buf.writeInt16LE(0, 10)
    return buf
  }
  toJson (data) {
    try {
      if (data) {
        let buffer = new Buffer(data, 'hex')
        let body = buffer.toString('utf8', 12)
        return this.deserialize(body)
      }
    } catch (e) {
      return null
    }
  }
}
module.exports = new DyProtocol()
