window.Utils = {
  /**
   * Copy members from one object to another.
   * @param {Object} to
   * @param {Object} from
   * @returns {Object}
   */
  extend: function(to, from) {
    to = to || {};
    if (from)
      for (var i in from)
        to[i] = from[i];
    return to;
  },
  DOM: {
    /**
     * Get screen size.
     * @returns {{width: (Number|number), height: (Number|number)}}
     */
    getScreenSize: function() {
      var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x = w.innerWidth || e.clientWidth || g.clientWidth,
        y = w.innerHeight || e.clientHeight || g.clientHeight;
      return {width: x, height: y};
    },
    /**
     * Create DOM element.
     * @param {String} tagName
     * @param {String} className
     * @param {Element} parentNode
     * @param {String} innerHTML
     * @param {String} style
     * @returns {Element}
     */
    create: function(tagName, className, parentNode, innerHTML, style) {
      var result = document.createElement(tagName || 'div');
      result.className += className || '';
      result.innerHTML = innerHTML || result.innerHTML;
      Utils.extend(result.style, style);
      if (parentNode)
        parentNode.appendChild(result);
      return result;
    },
    /**
     * Crossbrowser bind event to DOM element.
     * @param {Element} node DOM Element to attach.
     * @param {string} name Event name.
     * @param {function} callback Callback.
     */
    bind: function(node, name, callback) {
      if (window.addEventListener) {
        node.addEventListener(name, callback, false);
      } else if (window.attachEvent) {
        node.attachEvent('on' + name, callback);
      } else {
        node['on' + name] = callback;
      }
    },
    /**
     * Crossbrowser unbind event from DOM element.
     * @param {Element} node DOM Element to detach.
     * @param {string} name Event name.
     * @param {function} callback Callback.
     */
    unbind: function(node, name, callback) {
      if (window.addEventListener) {
        node.removeEventListener(name, callback, false);
      } else if (window.attachEvent) {
        node.detachEvent('on' + name, callback);
      } else {
        node['on' + name] = null;
      }
    }
  },
  String: {
    /**
     * Make first letter upper.
     * @param {string} s String.
     * @returns {string}
     */
    toUpperFirst: function(s) {
      return s && (s[0].toUpperCase() + s.slice(1));
    },
    /**
     * Make first letter lower.
     * @param {string} s String.
     * @returns {string}
     */
    toLowerFirst: function toLowerFirst(s) {
      return s && (s[0].toLowerCase() + s.slice(1));
    }
  },
  Number: {
    /**
     * Clip number from 0 to 1.
     * @param {number} v
     * @returns {number}
     */
    normalize: function(v) {
      return Math.max(0, Math.min(v, 1));
    },
    /**
     * Clip number from min to max.
     * @param {number} min
     * @param {number} v
     * @param {number} max
     * @returns {number}
     */
    clip: function(min, v, max) {
      if (min > max) {
        var t = min;
        min = max;
        max = t;
      }
      return Math.max(min, Math.min(v, max));
    }
  },
  Types: {
    /**
     * Check if value is object.
     * @param value
     * @returns {boolean}
     */
    isObject: function(value) {
      return typeof value === 'object'
    },
    /**
     * Check if value is finite number and not a NaN.
     * @param value
     * @returns {boolean}
     */
    isNumber: function(value) {
      return typeof value === 'number' && !isNaN(value) && isFinite(value);
    },
    /**
     * Check if value is integer.
     * @param value
     * @returns {boolean}
     */
    isInt: function(value) {
      return this.isNumber(value) && ((value | 0) === value);
    },
    /**
     * Check if value is number and has fractional part. 1.0 won't be true.
     * @param value
     * @returns {*|boolean}
     */
    isFloat: function(value) {
      return this.isNumber(value) && !this.isInt(value);
    },
    /**
     * Check if value is string.
     * @param value
     * @returns {boolean}
     */
    isString: function(value) {
      return typeof value === 'string';
    },
    /**
     * Check if value is function.
     * @param value
     * @returns {boolean}
     */
    isFunction: function(value) {
      return typeof  value === 'function';
    }
  },
  Random: {
    _seed: 0,
    seed: function(seed) {
      Utils.Random._seed = seed || Math.round(Math.random() * 15054456);
      console.log('Random initialized with seed ' + Utils.Random._seed)
    },
    next: function() {
      var hi = Utils.Random._seed * 48271 / 2147483647,
        lo = Utils.Random._seed % (2147483647 / 48271),
        test = 48271 * lo - (2147483647 % 48271) * hi;
      return ((Utils.Random._seed = test > 0 ? test : test + 2147483647) / 2147483647);
    }
  },
  Array: {
    /**
     * Remove duplicates from array.
     * @param array
     * @returns {Array}
     */
    unique: function(array) {
      return array.filter(function(o, i, a) {
        return a.indexOf(o) === i
      });
    }
  },
  isOpera: !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0,
  isFF: typeof InstallTrigger !== 'undefined',
  isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
  isChrome: !!window.chrome && !(!!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0),
  isIe: /*@cc_on!@*/false || !!document.documentMode,
  AnimationFrame: {
    handlers: (function() {
      var result = [];
      (function loop() {
        (window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback, element) {
          window.setTimeout(callback, 13);
        })(function() {
          result.forEach(function(f) {
            f({type: 'animationframe', target: document.body});
          });
          loop();
        });
      })();
      return result;
    })(),
    add: function(func) {
      Utils.AnimationFrame.handlers && Utils.AnimationFrame.handlers.push(func);
    },
    remove: function(func) {
      Utils.AnimationFrame.handlers && Utils.AnimationFrame.handlers.splice(Utils.AnimationFrame.handlers.indexOf(func), 1);
    }
  }
};
