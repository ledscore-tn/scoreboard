/* LED Scoreboard - shared sync + state helpers (ES5, works on old Android WebViews like the TB60) */
var LS = (function () {
  'use strict';

  // Two free public MQTT servers. The control panel sends to both, the display listens to both,
  // so if one server is down the scoreboard keeps working. Override with ?broker=wss://...,wss://...
  var DEFAULT_BROKERS = [
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://broker.emqx.io:8084/mqtt'
  ];
  var TOPIC_ROOT = 'ledscore/v1/';

  function qs(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }

  function store(key, val) {
    try {
      if (val === undefined) {
        var s = window.localStorage.getItem(key);
        return s ? JSON.parse(s) : null;
      }
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { /* storage disabled: fine */ }
    return null;
  }

  function rid(n) {
    var c = 'abcdefghjkmnpqrstuvwxyz23456789', s = '';
    for (var i = 0; i < n; i++) s += c.charAt(Math.floor(Math.random() * c.length));
    return s;
  }

  function defaultState() {
    return {
      v: 1, seq: 0, t: 0, src: '',
      home: { name: 'HOME', color: '#1e88e5', score: 0 },
      away: { name: 'AWAY', color: '#e53935', score: 0 },
      clock: { running: false, ms: 0, sentAt: 0, mode: 'up', lengthMs: 2400000, alertMs: 2400000 },
      period: '1H', halfMin: 40,
      msg: { on: false, text: '' }
    };
  }

  var PERIODS = { '1H': '1ST HALF', 'HT': 'HALF TIME', '2H': '2ND HALF', 'FT': 'FULL TIME', 'ET': 'EXTRA TIME', '': '' };

  // Clock offsets per sender: localNow - senderNow (learned from live messages).
  var offsets = {};

  function elapsed(state) {
    var c = state.clock;
    if (!c.running) return c.ms;
    var off = offsets[state.src] || 0;
    var senderNow = new Date().getTime() - off;
    return c.ms + Math.max(0, senderNow - c.sentAt);
  }

  // What the big clock should show, in ms
  function shown(state) {
    var e = elapsed(state), c = state.clock;
    if (c.mode === 'down') return Math.max(0, c.lengthMs - e);
    return e;
  }

  function alerting(state) {
    var c = state.clock;
    if (c.mode === 'down') return shown(state) <= 0;
    return c.alertMs > 0 && elapsed(state) >= c.alertMs;
  }

  function fmt(ms) {
    var total = Math.floor(ms / 1000);
    var m = Math.floor(total / 60), s = total % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // ---- MQTT connection to several brokers ----
  function Link(code, onMsg, onStatus) {
    this.code = code;
    this.prefix = TOPIC_ROOT + code + '/';
    this.onMsg = onMsg;
    this.onStatus = onStatus || function () {};
    this.onConnect = null;
    this.clients = [];
    var list = qs('broker');
    this.urls = list ? list.split(',') : DEFAULT_BROKERS;
    for (var i = 0; i < this.urls.length; i++) this._open(i);
  }

  Link.prototype._status = function () {
    var n = 0;
    for (var i = 0; i < this.clients.length; i++) if (this.clients[i] && this.clients[i].ok) n++;
    this.onStatus(n, this.urls.length);
  };

  Link.prototype._open = function (i) {
    var self = this, url = this.urls[i];
    var entry = { ok: false, c: null };
    this.clients[i] = entry;
    var client;
    try {
      client = new Paho.Client(url, 'ls_' + rid(10));
    } catch (e) { return; }
    entry.c = client;

    client.onMessageArrived = function (m) {
      var kind = m.destinationName.substr(self.prefix.length), data;
      try { data = JSON.parse(m.payloadString); } catch (e) { return; }
      if (!data) return;
      if (!m.retained && data.t && data.src) {
        offsets[data.src] = new Date().getTime() - data.t;
      }
      self.onMsg(kind, data, m.retained, i);
    };
    client.onConnectionLost = function () { entry.ok = false; self._status(); };
    client.onConnected = function () {
      entry.ok = true;
      try { client.subscribe(self.prefix + '#', { qos: 0 }); } catch (e) {}
      self._status();
      if (self.onConnect) self.onConnect(i);
    };

    function go() {
      try {
        client.connect({
          useSSL: url.indexOf('wss:') === 0,
          timeout: 10,
          keepAliveInterval: 20,
          cleanSession: true,
          reconnect: true,
          mqttVersion: 4,
          onSuccess: function () {},
          onFailure: function () { entry.ok = false; self._status(); setTimeout(go, 5000); }
        });
      } catch (e) { setTimeout(go, 5000); }
    }
    go();
  };

  Link.prototype.send = function (kind, obj, retained, only) {
    var payload = JSON.stringify(obj);
    for (var i = 0; i < this.clients.length; i++) {
      if (only !== undefined && only !== i) continue;
      var e = this.clients[i];
      if (!e || !e.ok) continue;
      try {
        var m = new Paho.Message(payload);
        m.destinationName = this.prefix + kind;
        m.qos = 0;
        m.retained = !!retained;
        e.c.send(m);
      } catch (err) {}
    }
  };

  return {
    qs: qs, store: store, rid: rid, defaultState: defaultState, PERIODS: PERIODS,
    elapsed: elapsed, shown: shown, alerting: alerting, fmt: fmt, Link: Link, offsets: offsets
  };
})();
