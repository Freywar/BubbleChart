//TODO match getter/setter casing, internal one and constructor options one

//Naming conventions:
//Class
//object._privateMember
//object.publicMember
//object._property
//object.getProperty
//object.setProperty
//new Class({property:value[,...]})

/**
 * Namespace definition. */
function namespace() {
  return {}
}

/**
 * Class definition.
 * @param {String} name Class name as to be shown in debugger.
 * @param {Function} base Base class.
 * @param {Function} constructor Constructor.
 * @returns {Function} Class.
 */
function cls(name, base, constructor) {
  constructor = constructor || eval(function(options) {
      constructor.base.constructor.apply(this, arguments);
    });

  //some tricky way to show dinamically assigned function name in debugger
  //TODO find some more optimized way or at least disable it in release mode
  var originalConstructor = constructor;
  if (name.indexOf('.') !== -1) {
    eval(
      'var ' + name.split('.')[0] + ' = {};\n' +
      name.split('.')[0] + '["' + name.split('.').slice(1).join('.') + '"] = function(){\n' +
      'originalConstructor.apply(this, arguments)\n' +
      '};\n' +
      'constructor = ' + name.split('.')[0] + '["' + name.split('.').slice(1).join('.') + '"];');
  }
  else {
    constructor = eval('constructor = function ' + name + '(options){\n' +
      'originalConstructor.apply(this, arguments)\n' +
      '}');
  }

  var f = new Function();
  f.prototype = base.prototype;
  constructor.prototype = new f();
  constructor.prototype.constructor = constructor;
  constructor.base = base.prototype;
  constructor.property = property.bind(this, constructor);
  constructor.method = method.bind(this, constructor);
  constructor.alias = alias.bind(this, constructor);

  constructor.displayName = name;

  return constructor;
}

/**
 * Property definition. Creates local private member with same name and getter/setter if necessary.
 * @param {Function} cls Class.
 * @param {String} name Name.
 * @param {Object} description
 * Optional description:
 * {
 *    [value:<default_value>,]
 *    [get:true|<getter_function>]
 *    [set:true|<setter_function>}
 *    [type:function]
 * }
 * 'true' creates default getter/setter automatically.
 * If type is defined, default setter is enabled and set value is not instance of MObject, setter will create new instance of type using value as first parameter.
 */
function property(cls, name, description) {
  var prototype = cls.prototype;
  description = description || {};
  if (description.hasOwnProperty('value'))
    prototype['_' + name] = description.value;
  if (description.get === true)
    prototype['get' + Utils.String.toUpperFirst(name)] = function() {
      return this['_' + name];
    };
  else if (description.get)
    prototype['get' + Utils.String.toUpperFirst(name)] = description.get;
  if (description.set === true) {
    if (typeof description.type === 'function') {
      prototype._objectProps = prototype._objectProps || [];
      prototype._objectProps.push(name);
    }

    var setter = prototype['set' + Utils.String.toUpperFirst(name)] = function(value) {
      if (typeof description.type === 'function' && !(value instanceof MObject)) {
        value = new description.type(value)
      }
      this['_' + name] = value;
    };

    if (typeof description.type === 'function')
      setter.initialize = true;
  }
  else if (description.set)
    prototype['set' + Utils.String.toUpperFirst(name)] = description.set;
}

/**
 * Property definition. Creates local private member with same name and getter/setter if necessary.
 * @param {Function} cls Class.
 * @param {String} name Name.
 * @param {Function} func Method. If not specified abstract method call exception will be created.
 */
function method(cls, name, func) {
  cls.prototype[name] = func || function() {
      abstract(name);
    };
  cls.prototype[name].displayName = (cls.displayName || cls.name) + '.' + name;
}

/**
 * Abstract method call exception.
 * @param {String} name Optional method name.
 */
function abstract(name) {
  throw Error((name || 'This') + ' is an abstract method.');
}

/**
 * Alias definition. If applied to property, aliasises only setter and getter.
 * @param {Function} cls Class.
 * @param {string} name Alias name.
 * @param {string} otherName Existing member name.
 */
function alias(cls, name, otherName) {
  if (cls.prototype[otherName]) {
    cls.prototype[name] = cls.prototype[otherName];
  }
  else if (cls.prototype['_' + otherName] || cls.prototype['get' + Utils.String.toUpperFirst(otherName)] || cls.prototype['get' + Utils.String.toUpperFirst(otherName)]) {
    cls.prototype['get' + Utils.String.toUpperFirst(name)] = cls.prototype['get' + Utils.String.toUpperFirst(otherName)];
    cls.prototype['set' + Utils.String.toUpperFirst(name)] = cls.prototype['set' + Utils.String.toUpperFirst(otherName)];
  }
}

/**
 * Enumeration definition.
 * @param {Object} fields Members of enumeration.
 * @returns {Object}
 */
function enumeration(fields) {
  return fields;
}


var Utils = {
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
      return s[0].toUpperCase() + s.slice(1)
    },
    /**
     * Make first letter lower.
     * @param {string} s String.
     * @returns {string}
     */
    toLowerFirst: function toLowerFirst(s) {
      return s[0].toLowerCase() + s.slice(1)
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
};


/**
 * Basic object.
 */
var MObject = cls('MObject', Object, function(options) {
  this._id = ('Object' + (Object.id = (Object.id || 0) + 1));
  for (var i in this) {
    var setter;
    if (i[0] === '_' && (setter = this['set' + Utils.String.toUpperFirst(i.slice(1))]) && setter.initialize) {
      setter.call(this, this[i])
    }
  }
  this.update(options);
});

MObject.prototype.update = function(options) {
  if (options)
    for (var i in options) {
      var ui = Utils.String.toUpperFirst(i);
      if (this['set' + ui])
        this['set' + ui](options[i]);
      else if ((this[i] instanceof Event) && options[i] instanceof Delegate)
        this[i].add(options[i]);
      else throw Error('Unknown member ' + i);
    }
};

/**
 * @method Object serialization.
 * @returns {Object} JSON with all properties which have setter and getter.
 */
MObject.prototype.serialize = function() {
  var result = {}, getter;
  for (var i in this)
    if (i.indexOf('set') === 0 && this[getter = i.replace(/^set/, 'get')]) {
      var r = this[getter]();
      if (r instanceof MObject)
        r = r.serialize();
      result[Utils.String.toLowerFirst(i.replace(/^set/, ''))] = r;
    }
  return result;
};

/**
 * @method Object cloning.
 * @returns {Object} New instance of current class with same public properties.
 */
MObject.prototype.clone = function() {
  return new this.constructor(this.serialize());
};