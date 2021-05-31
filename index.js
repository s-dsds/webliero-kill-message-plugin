var DOUBLEKILL_PLUGIN = (function () {
  // DOUBLEKILL plugin
  // used to print "double kill" and "triple kill"
  //
  const chainFunction = (object, attribute, func) => {
    const original = object[attribute]
    if (original) {
      object[attribute] = (...arguments) => {
        let or = original.apply(object, arguments)
        let r = func.apply(object, arguments)
        if (false == r || false == or) {
          return false;
        }
      }
    } else {
      object[attribute] = func
    }
  }

  const log = (...arguments) => {
    console.log(...arguments.map(x => JSON.stringify(x)))
  }

  let room = null

  //default settings
  let settings = {
    double_kill_color: 0xDB6161,
    double_kill_msg: "> DOUBLE KILL! <",
    triple_kill_color: 0xEE6A6A,
    triple_kill_msg: ">> TRIPLE KILL!! <<",
    more_kill_color: 0xFF9A9A,
    more_kill_msg: ">>> M-M-M-MONSTER KILL!!! <<<",
    window_length: 250
  }

  const loadSettings = (confArgs) => {
    settings = {
      ...settings,
      ...confArgs
    }
  }

  // buffered by player id
  let buffers = {};

  let timeouts = {};
  const getKey = (cnt) => {
    if (cnt == 2) {
      return 'double_kill';
    }
    if (cnt == 3) {
      return 'triple_kill';
    }
    return 'more_kill';
  }

  const onPlayerKilled = (l, k) => {
    console.log("k", k);
    const now = Date.now();
    if (typeof k == 'undefined' || k == null) {
      return;
    }
    try {
      if (typeof buffers[k.id] == 'undefined' || buffers[k.id][buffers[k.id].length - 1].time - now > settings.window_length) {
        buffers[k.id] = [];
        if (typeof timeouts[k.id] != 'undefined') {
          clearTimeout(timeouts[k.id]);
        }
  
        timeouts[k.id] = setTimeout(() => {
          const cnt = (typeof buffers[k.id] == 'undefined') ? 0 : buffers[k.id].filter(e => (e.time - now) <= settings.window_length).length;
          console.log("cnt", cnt);
          if (cnt > 1) {
            const key = getKey(cnt);
            room.sendAnnouncement(settings[key + '_msg'], null, settings[key + '_color'], 'italic bold', 1)
          }
          clearTimeout(timeouts[k.id]);
          delete (timeouts[k.id]);
          delete (buffers[k.id]);
        }, settings.window_length);
      }
      if (typeof k != 'undefined' && k != null && k.id != l.id) {
        buffers[k.id].push({ killed: k.id, time: now });
      }
    } catch (error) {
      console.log("error on double kill script", error);
    }
    
  }


  const init = (argRoom, confArgs) => {
    if (window.DBKLUGIN) {
      log('double kill plugin is already loaded, you can change settings use DOUBLEKILL_PLUGIN.loadSettings()', settings)
      return
    }
    room = argRoom
    loadSettings(confArgs)
    log('loading double kill plugin', settings)
    window.DBKLUGIN = true

    chainFunction(room, 'onPlayerKilled', onPlayerKilled)
  }

  return {
    init: init,
    loadSettings: loadSettings,
  }
})()
