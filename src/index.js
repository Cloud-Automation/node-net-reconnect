let debug = require('debug')('net-reconnect')
let NetKeepAlive = require('net-keepalive')

class NetReconnect {

  constructor (socket, options) {
    this._socket = socket
    this._options = options
    this._retryTime = options.retryTime || 1000
    this._retryAlways = options.retryAlways || false
    this._keepAliveDelay = Math.max(options.keepAliveDelay, 1000) || 1000
    this._keepAliveInterval = Math.max(options.keepAliveInterval, 1000) || 1000
    this._keepAliveProbes = Math.max(Math.min(options.keepAliveProbes, 1), 20) || 1
    this._closing = false

    this._socket.on('connect', this._onConnect.bind(this))
    this._socket.on('close', this._onClose.bind(this))
    this._socket.on('error', this._onError.bind(this))
  }

  static apply (socket, options) {
    return new NetReconnect(socket, options)
  }

  _reconnect () {
    debug('reconnecting in %d', this._retryTime)
    setTimeout(function () {
      this._socket.connect(this._options)
    }.bind(this), this._retryTime)
  }

  _onConnect () {
    if (this._closing) {
      return
    }

    this._socket.setKeepAlive(true, this._keepAliveDelay)
    NetKeepAlive.setKeepAliveInterval(this._socket, this._keepAliveInterval)
    NetKeepAlive.setKeepAliveProbes(this._socket, this._keepAliveProbes)

    debug('online')
  }

  _onClose (hadError) {
    if (this._closing) {
      return
    }
    debug('offline')
    this._state = 'offline'
    if (!hadError) {
      debug('connection closed on purpose')
      if (this._retryAlways) {
        debug('retryAlways flag active, reconnecting')
        this._reconnect()
        return
      } else {
        debug('not reconnecting')
        return
      }
    }

    debug('connection closed with errors, reconnecting')

    this._reconnect()
  }

  _onError () {
    if (this._closing) {
      return
    }

    debug('error')
  }

  end () {
    debug('closing socket permanently')
    this._closing = true
    this._socket.removeListener('connect', this._onConnect)
    this._socket.removeListener('close', this._onClose)
    this._socket.removeListener('error', this._onError)
    return this._socket.end.apply(this._socket, arguments)
  }

}

module.exports = NetReconnect
