(function(){"use strict";
//region src/core/model.js
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
  if (!base)
    throw Error('Undefined base class for ' + name);

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
    else if (description.hasOwnProperty('type'))
      throw Error('Unknown type');

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

function MEvent() {
  this._handlers = null;
}
MEvent.prototype.add = function(handler) {
  this._handlers = this._handlers || [];
  this._handlers.push(handler);
};
MEvent.prototype.remove = function(handler) {
  if (this._handlers && ~this._handlers.indexOf(handler))
    this._handlers.splice(this._handlers.indexOf(handler), 1);
};
MEvent.prototype.clear = function(handler) {
  this._handlers = null;
};
MEvent.prototype.invoke = function(sender, args) {
  if (this._handlers)
    for (var i = 0; i < this._handlers.length; i++)
      this._handlers[i].handle(sender, args);
};

/// <summary> Event definition. Can attach delegates and call them when invoked. Must be defined in constructor and not in prototype. </summary>
/// <param name="object" type="Object"> Instance. </param>
/// <param name="name" type="String"> Event name. </param>
/// <returns type="Event"> Event. </returns>
function evt(obj, name) {
  obj[name] = new MEvent()
}

function Delegate(func, context) {
  this._func = func;
  this._context = context;
}
var delegateP = Delegate.prototype;
delegateP.handle = function(sender, args) {
  this._func.call(this._context, sender, args);
};
delegateP = null;

/// <summary> Delegate. Used with events, calls function in specified context. </summary>
/// <param name="func" type="Function"> Function. </param>
/// <param name="context" type="Object"> Context. </param>
/// <returns type="Delegate"> Delegate. </returns>
function delegate(obj_func, name_ctx) {
  if (typeof obj_func === 'function')
    return new Delegate(obj_func, name_ctx || window);

  var result = function(sender, args) {
    result.handle.call(result, sender, args);
  };
  Delegate.call(result, obj_func[name_ctx], obj_func);
  result.handle = Delegate.prototype.handle;
  obj_func[name_ctx] = result;
};

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
//endregion
//region src/core/object.js
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
      else if ((this[i] instanceof MEvent) && options[i] instanceof Delegate)
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
//endregion
//region src/core/utils.js
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

//endregion
//region src/ui/export.js
/**
 * @namespace Main chart's namespace.
 */
window.B = namespace();
window.delegate = delegate;
//endregion
//region src/ui/base/primitives/enum.js
/**
 * @enum {string}. Direction enumeration.
 */
B.Direction = enumeration({
  up: 'up',
  left: 'left',
  down: 'down',
  right: 'right'
});

/**
 * @enum {string} Horizontal alignment for controls.
 */
B.HAlign = enumeration({
  /**
   * Align to left and calculate width by content.
   */
  left: 'left',
  /**
   * Align to center and calculate width by content.
   */
  center: 'center',
  /**
   * Align to right and calculate width by content.
   */
  right: 'right',
  /**
   * Fill container width.
   */
  fit: 'fit',
  /**
   * Calculate width by content but use user-defined position.
   */
  auto: 'auto',
  /**
   * Use user-defined position and size
   */
  none: 'none'
});

/**
 * @enum {string} Vertical alignment for controls.
 */
B.VAlign = enumeration({
  /**
   * Align to top and calculate height by content.
   */
  top: 'top',
  /**
   * Align to center and calculate height by content.
   */
  center: 'center',
  /**
   * Align to bottom and calculate height by content.
   */
  bottom: 'bottom',
  /**
   * Fill container height.
   */
  fit: 'fit',
  /**
   * Calculate height by content but use user-defined position.
   */
  auto: 'auto',
  /**
   * Use user-defined position and size.
   */
  none: 'none'
});
//endregion
//region src/ui/base/primitives/color.js
/**
 * @class B.Color Color.
 * @param {string|object} options Either any of HTML/CSS notation of color or object with properties values.

 */
B.Color = cls('B.Color', MObject, function Color(options) {
  function rgb(r, g, b) {
    return {r: r / 255, g: g / 255, b: b / 255, a: 1}
  }

  function rgba(r, g, b, a) {
    return {r: r / 255, g: g / 255, b: b / 255, a: a}
  }

  function tryParse(value) {
    var result = null;
    if (!Utils.Types.isString(value) || !value)
      return result;

    try {
      result = eval(value);
    }
    catch (e) {
      console.log(e);
    }
    return result;
  }

  //TODO test performance for eval and parsing with RegExp and choose faster one
  //TODO add other possible color notations

  var parsedAsFunction;
  if (Utils.Types.isString(options)) {
    switch (true) {
      case /^#[\da-f]{3}$/i.test(options):
        options = {
          r: parseInt(options[1], 16) / 255,
          g: parseInt(options[2], 16) / 255,
          b: parseInt(options[3], 16) / 255,
          a: 1
        };
        break;
      case /^#[\da-f]{6}$/i.test(options):
        options = {
          r: parseInt(options.slice(1, 3), 16) / 255,
          g: parseInt(options.slice(3, 5), 16) / 255,
          b: parseInt(options.slice(5, 7), 16) / 255,
          a: 1
        };
        break;
      case !!(parsedAsFunction = tryParse(options)):
        options = parsedAsFunction;
        break;
      default:
        options = {};
    }
  }
  B.Color.base.constructor.call(this, options);
});
/**
 * @property {number} r R value from 0 to 1
 */
B.Color.property('r', {value: 0, get: true, set: true});
/**
 * @property {number} g G value from 0 to 1
 */
B.Color.property('g', {value: 0, get: true, set: true});
/**
 * @property {number} b B value from 0 to 1
 */
B.Color.property('b', {value: 0, get: true, set: true});
/**
 * @property {number} a A value from 0 to 1
 */
B.Color.property('a', {value: 0, get: true, set: true});

/**
 * @method Increase/decrease R/G/B by provided value with clamping. Creates new instance, except cases when nothing is modified.
 * @param {number} value Value to add.
 * @returns {B.Color}

 */
B.Color.method('add', function(value) {
  return !value ? this : new B.Color({ //TODO add check for no changes after normalization even if value is not zero
      r: Utils.Number.normalize(this._r + value),
      g: Utils.Number.normalize(this._g + value),
      b: Utils.Number.normalize(this._b + value),
      a: this._a
    }
  )
});

/**
 * @method Export color as rgba() string.
 * @returns {string}

 */
B.Color.method('toString', function toString() {
  return 'rgba(' + ((this._r * 255) | 0) + ',' + ((this._g * 255) | 0) + ',' + ((this._b * 255) | 0) + ',' + this._a + ')';
});

/**
 * @method Apply to Canvas.
 * @param {CanvasRenderingContext2D} ctx Canvas context.

 */
B.Color.method('apply', function(ctx) {
  ctx.fillStyle = ctx.strokeStyle = this.toString();
});
//endregion
//region src/ui/base/primitives/border.js
/**
 * @class B.Border Border.
 * @param {object|string} options Either options object or CSS string.

 */
B.Border = cls('B.Border', MObject, function(options) {
  if (Utils.Types.isString(options)) {
    options = /^(\w+)px (\w+) (\w+)$/.exec(options);
    if (options) {
      options = {
        width: options[0],
        color: options[2]
      }
    }
  }
  B.Border.base.constructor.call(this, options);
});
/**
 * @property {number} width Width, pixels.
 */
B.Border.property('width', {value: 0, get: true, set: true}); //TODO add independent widths for each side.
/**
 * @property {B.Color} color Color.
 */
B.Border.property('color', {value: 0, get: true, set: true, type: B.Color});
/**
 * @property {number} radius Radius, pixels.
 */
B.Border.property('radius', {value: 0, get: true, set: true});

/**
 * @method Export as CSS string.
 */
B.Border.method('toString', function() {
  return this._width + 'px solid ' + this._color.toString();
});

/**
 * @method Apply to Canvas.
 * @param {CanvasRenderingContext2D} ctx. Canvas context.

 */
B.Border.method('apply', function(ctx) {
  ctx.strokeStyle = this._color.toString();
  ctx.lineWidth = this._width;
});
//endregion
//region src/ui/base/primitives/font.js
/**
 * @class B.Font Font.
 * @param {string|object} options Either options object or Canvas string.
 */
B.Font = cls('B.Font', MObject, function(options) {
  if (Utils.Types.isString(options)) {
    options = /^(\w+ )?(\w+ )?(\w+ )?(\w+)px (\w+)$/.exec(options);
    if (options) {
      options = {
        family: options[options.length - 1],
        size: options[options.length - 2]
      }
    }
  }
  B.Font.base.constructor.call(this, options);
});

/**
 * @property {string} family Font family.
 */
B.Font.property('family', {value: 'Helvetica', get: true, set: true});
/**
 * @property {string} size Font size, pixels.
 */
B.Font.property('size', {value: 12, get: true, set: true});
/**
 * @property {B.Color} color Font color.
 */
B.Font.property('color', {value: '#000000', get: true, set: true, type: B.Color});
/**
 * @method Export font as Canvas string.
 * @returns {string}

 */
B.Font.method('toString', function() {
  return this._size + 'px ' + this._family;
});

/**
 * @method Apply to Canvas.
 * @param {CanvasRenderingContext2D} ctx Canvas context.

 */
B.Font.method('apply', function(ctx) {
  ctx.fillStyle = ctx.strokeStyle = this._color.toString();
  ctx.font = this.toString();
});

B.Font.measureCtx = null;
/**
 * @method Measure string size with current font.
 * @returns {object} {width:<px>, height:<px>}

 */
B.Font.method('measure', function(text) {
  B.Font.measureCtx = B.Font.measureCtx || document.createElement('canvas').getContext('2d');
  B.Font.measureCtx.font = this.toString();
  return {
    width: B.Font.measureCtx.measureText(text).width,
    height: this._size
  }
});
//endregion
//region src/ui/base/primitives/animatable.js
/**
 * @class Animatable value wrapper.
 */
B.Animatable = cls('B.Animatable', MObject);

B.Animatable.property('initialized', {value: false});
B.Animatable.property('currentValue', {value: null, get: true});
B.Animatable.property('nextValue', {value: null, get: true});

/**
 * @property {*} value Animatable value.
 */
B.Animatable.property('value', {
  get: function() {
    return this._currentValue;
  },
  set: function(value) {
    this._nextValue = value;
    if (!this._initialized) {
      this._currentValue = this._nextValue;
      this._initialized = true;
    }
  }
});

/**
 * @method Recalculate current value.
 * @returns {boolean} True if value actually changed.
 */
B.Animatable.method('animate', function() {
  if (this._currentValue === this._nextValue)
    return false;

  this._currentValue += (this._nextValue - this._currentValue) / 4; //TODO make it configurable and FPS-independable

  if (Math.abs(this._currentValue - this._nextValue) < 0.001)
    this._currentValue = this._nextValue;


  if (this._currentValue === this._nextValue)
    this._previousValue = this._currentValue;

  return true;
});

/**
 * @method Move to end immediately.
 */
B.Animatable.method('skip', function() {
  this._currentValue = this._nextValue
});


/**
 * @static Creates default getter to property treating animatable as primitive.
 * @param {string} name Property name.
 * @returns {Function}
 */
B.Animatable.getter = function(name) {
  /**
   * Default getter.
   * @param {boolean} asObject Override primitive treatment.
   */
  return function(asObject) {
    if (!(this['_' + name] instanceof  B.Animatable))
      this['_' + name] = new B.Animatable({value: this['_' + name]});
    return asObject ? this['_' + name] : this['_' + name].getValue();
  }
};

/**
 * @static Creates default setter to property treating animatable as primitive.
 * @param {string} name Property name.
 * @returns {Function}
 */
B.Animatable.setter = function(name) {
  /**
   * Default setter.
   * @param {*} value Value.
   * @param {boolean} asObject Override primitive treatment.
   */
  return function(value, asObject) {
    if (!(this['_' + name] instanceof  B.Animatable))
      this['_' + name] = new B.Animatable({value: this['_' + name]});
    if (asObject)
      this['_' + name] = !(value instanceof B.Animatable) ? new B.Animatable(value) : value;
    else
      this['_' + name].setValue(value)
  }
};
//endregion
//region src/ui/base/primitives/rect.js
/**
 * @class B.Rect Rectangle.
 */
B.Rect = cls('B.Rect', MObject, function Rect(options) {
  B.Rect.base.constructor.apply(this, arguments);
});

/**
 * @property {boolean} pinned Defines how Left/Top/Right/Bottom setters work
 * true - each side is pinned, coordinates setters modify size so opposite side remains its coordinate.
 * false - sizes are static, coordinates setters move rectangle.

 */
B.Rect.property('pinned', {value: false, get: true, set: true});

/**
 * @property {number} left Left coordinate.
 */
B.Rect.property('left', {
  value: 0, get: true, set: function(value) {
    if (this._pinned) {
      this._width -= value - this._left;
      if (this._width < 0) {
        this._left = this._left + this._width;
        this._width *= -1;
      }
    }
    else
      this._left = value;
  }
});
/**
 * @property {number} top Top coordinate.
 */
B.Rect.property('top', {
  value: 0, get: true, set: function(value) {
    if (this._pinned) {
      this._height -= value - this._top;
      if (this._height < 0) {
        this._top = this._top + this._height;
        this._height *= -1;
      }
    }
    else
      this._top = value;
  }
});
/**
 * @property {number} width Width.
 */
B.Rect.property('width', {value: 0, get: true, set: true});
/**
 * @property {number} height Height.
 */
B.Rect.property('height', {value: 0, get: true, set: true});
/**
 * @property {number} right Right. Has no internal field, but calculated from left and width.
 */
B.Rect.property('right', {
  get: function() {
    return this._left + this._width
  },
  set: function(value) {
    if (this._pinned) {
      this._width += value - this.getRight();
      if (this._width < 0) {
        this._left = this._left + this._width;
        this._width *= -1;
      }
    }
    else
      this._left = value - this._width;
  }
});
/**
 * @property {number} bottom Bottom. Has no internal field, but calculated from top and height.
 */
B.Rect.property('bottom', {
  get: function() {
    return this._top + this._height
  },
  set: function(value) {
    if (this._pinned) {
      this._height += value - this.getBottom();
      if (this._height < 0) {
        this._top = this._top + this._height;
        this._height *= -1;
      }
    }
    else
      this._top = value - this._height;
  }
});
/**
 * @property {number} hCenter Horizontal center. Has no internal field, but calculated from left and width.
 */
B.Rect.property('hCenter', {
  get: function() {
    return this._left + this._width / 2
  },
  set: function(value) {
    this._left = value - this._width / 2;
  }
});
/**
 * @property {number} vCenter Vertical center. Has no internal field, but calculated from top and height.
 */
B.Rect.property('vCenter', {
  get: function() {
    return this._top + this._height / 2
  },
  set: function(value) {
    this._top = value - this._height / 2;
  }
});
//endregion
//region src/ui/base/primitives/spacing.js
/**
 * @class B.Spacing Spacing around rectangle.
 * @param {number|object} options Either options object or number which is set to every side.

 */
B.Spacing = cls('B.Spacing', MObject, function(options) {
  if (Utils.Types.isNumber(options)) {
    options = {left: options, top: options, right: options, bottom: options};
  }
  B.Spacing.base.constructor.call(this, options);
});

/**
 * @param number left Left spacing.
 */
B.Spacing.property('left', {value: 0, get: true, set: true});
/**
 * @param number top Top spacing.
 */
B.Spacing.property('top', {value: 0, get: true, set: true});
/**
 * @param number right Right spacing.
 */
B.Spacing.property('right', {value: 0, get: true, set: true});
/**
 * @param number bottom Bottom spacing.
 */
B.Spacing.property('bottom', {value: 0, get: true, set: true});
//endregion
//region src/ui/base/control.js
/**
 * @class Basic control.
 */
B.Control = cls('B.Control', B.Rect, function(options) {
  evt(this, 'invalidated'); //TODO think of consistent name
  B.Control.base.constructor.apply(this, arguments);
});

/**
 * @property {CanvasRenderingContext2D} context Context in which rendering is to be done.
 */
B.Control.property('context', {value: null, get: true, set: true}); //TODO maybe do not store it but send as parameter to render
/**
 * @property {boolean} enabled Is control interactable.
 */
B.Control.property('enabled', {value: true, get: true, set: true});
/**
 * @property {boolean} visible Is control visible.
 */
B.Control.property('visible', {value: true, get: true, set: true});
/**
 * @property {B.HAlign} hAlign Horizontal alignment. Applied on reflow.
 */
B.Control.property('hAlign', {value: B.HAlign.none, get: true, set: true});
/**
 * @property {B.VAlign} vAlign Vertical alignment. Applied on reflow.
 */
B.Control.property('vAlign', {value: B.VAlign.none, get: true, set: true});

/**
 * @property {B.Spacing} margin Distance between outer coordinates and border, pixels.
 */
B.Control.property('margin', {value: 0, get: true, set: true, type: B.Spacing});
/**
 * @property {B.Spacing} margin Distance between border and content, pixels. Filled with background.
 */
B.Control.property('padding', {value: 4, get: true, set: true, type: B.Spacing});
/**
 * @property {B.Color} background Background color
 */
B.Control.property('background', {value: null, get: true, set: true, type: B.Color});

/**
 * @property {B.Border} Border. Radius is added to padding, so children controls are not overlapped by border curves.
 */
B.Control.property('border', {value: null, get: true, set: true, type: B.Border});

B.Control.property('outerRect', {
  get: function() {
    return this;
  }
});
// Just to be consistent with inner ones.
B.Control.alias('outerLeft', 'left');
B.Control.alias('outerTop', 'top');
B.Control.alias('outerWidth', 'width');
B.Control.alias('outerHeight', 'height');
B.Control.alias('outerRight', 'right');
B.Control.alias('outerBottom', 'bottom');
B.Control.alias('outerHCenter', 'hCenter');
B.Control.alias('outerVCenter', 'vCenter');

/**
 * @property {B.Rect} innerRect Inner rectangle allowed to content.
 */
B.Control.property('innerRect', {
  get: function() {
    return new B.Rect({
      left: this.getInnerLeft(),
      top: this.getInnerTop(),
      width: this.getInnerWidth(),
      height: this.getInnerHeight()
    });
  }
});
/**
 * @property {number} innerLeft Alias to innerRect property.
 */
B.Control.property('innerLeft', {
  get: function() {
    return this._left + this._margin.getLeft() + this._border.getWidth() + this._padding.getLeft() + this._border.getRadius();
  }
});
/**
 * @property {number} innerTop Alias to innerRect property.
 */
B.Control.property('innerTop', {
  get: function() {
    return this._top + this._margin.getTop() + this._border.getWidth() + this._padding.getTop() + this._border.getRadius();
  }
});
/**
 * @property {number} innerWidth Alias to innerRect property.
 */
B.Control.property('innerWidth', {
  get: function() {
    return Math.max(0, this._width - this._margin.getLeft() - this._margin.getRight()
      - this._border.getWidth() * 2
      - this._padding.getLeft() - this._padding.getRight()
      - this._border.getRadius() * 2);
  }
});
/**
 * @property {number} innerHeight Alias to innerRect property.
 */
B.Control.property('innerHeight', {
  get: function() {
    return Math.max(0, this._height - this._margin.getTop() - this._margin.getBottom()
      - this._border.getWidth() * 2
      - this._padding.getTop() - this._padding.getBottom()
      - this._border.getRadius() * 2);
  }
});
/**
 * @property {number} innerRight Alias to innerRect property.
 */
B.Control.property('innerRight', {
  get: function() {
    return this.getInnerRect().getRight();
  }
});
/**
 * @property {number} innerBottom Alias to innerRect property.
 */
B.Control.property('innerBottom', {
  get: function() {
    return this.getInnerRect().getBottom();
  }
});
/**
 * @property {number} innerHCenter Alias to innerRect property.
 */
B.Control.property('innerHCenter', {
  get: function() {
    return this.getInnerRect().getHCenter();
  }
});
/**
 * @property {number} innerVCenter Alias to innerRect property.
 */
B.Control.property('innerVCenter', {
  get: function() {
    return this.getInnerRect().getVCenter();
  }
});

/**
 * @method _assertReflow
 * Check if all required properties are set, if not - sets sizes to zero according to alignment.
 * @param {boolean} failed Some additional checks are failed.
 * @returns {boolean} Not all required properties are set.
 */
B.Control.method('_assertReflow', function(failed) {
  if (!this._context || !this._visible || failed) {
    if (this._hAlign !== B.HAlign.none)
      this._width = 0;
    if (this._vAlign !== B.VAlign.none)
      this._height = 0;
    return true;
  }
  return false;
});

/**
 * @method Recalculate all internal values after any property change.
 * @param {B.Rect} space Rectangle to which alignment should be applied.

 */
B.Control.method('reflow', function reflow(space) {
  switch (this._hAlign) {
    case B.HAlign.left:
      this._left = space.getLeft();
      break;
    case B.HAlign.center:
      this._left = space.getHCenter() - this._width / 2;
      break;
    case B.HAlign.right:
      this._left = space.getRight() - this._width;
      break;
    case B.HAlign.fit:
      this._left = space.getLeft();
      this._width = space.getWidth();
      break;
  }
  switch (this._vAlign) {
    case B.VAlign.top:
      this._top = space.getTop();
      break;
    case B.VAlign.center:
      this._top = space.getVCenter() - this._height / 2;
      break;
    case B.VAlign.bottom:
      this._top = space.getBottom() - this._height;
      break;
    case B.VAlign.fit:
      this._top = space.getTop();
      this._height = space.getHeight();
      break;
  }
});

/**
 * @method Clip current context by border.
 */
B.Control.method('_clip', function() {
  if (this._context) {
    this._context.save();
    this._context.beginPath();
    this._context.rect(
      Math.round(this._left + this._margin.getLeft() + this._border.getWidth()),
      Math.round(this._top + this._margin.getTop() + this._border.getWidth()),
      Math.round(this._width - this._margin.getLeft() - this._margin.getRight() - this._border.getWidth() * 2),
      Math.round(this._height - this._margin.getTop() - this._margin.getBottom() - this._border.getWidth() * 2)
    );
    this._context.clip();
  }
});

/**
 * @method Unclip current context.
 */
B.Control.method('_unclip', function() {
  if (this._context) {
    this._context.restore(); //TODO find a way to avoid full restoring and add check for clip called other that one time
  }
});

/**
 * @method _assertRepaint
 * Check if all required properties are set.
 * @param {boolean} failed Some additional checks are failed.
 * @returns {boolean} Not all required properties are set.
 */
B.Control.method('_assertRepaint', function(failed) {
  return !this._context || !this._visible || !this._width || !this._height || failed;
});

/**
 * @method Render current state on current context property.
 */
B.Control.method('repaint', function repaint() {
  if (this._assertRepaint())
    return;

  this._background.apply(this._context);
  this._context.fillRect(
    Math.round(this._left + this._margin.getLeft() + this._border.getWidth() / 2),
    Math.round(this._top + this._margin.getTop() + this._border.getWidth() / 2),
    Math.round(this._width - this._margin.getLeft() - this._margin.getRight() - this._border.getWidth()),
    Math.round(this._height - this._margin.getTop() - this._margin.getBottom() - this._border.getWidth())
  );

  this._border.apply(this._context);
  this._context.strokeRect(
    Math.round(this._left + this._margin.getLeft() + this._border.getWidth() / 2),
    Math.round(this._top + this._margin.getTop() + this._border.getWidth() / 2),
    Math.round(this._width - this._margin.getLeft() - this._margin.getRight() - this._border.getWidth()),
    Math.round(this._height - this._margin.getTop() - this._margin.getBottom() - this._border.getWidth())
  );

  //TODO add border radius support
});

B.Control.property('_invalidateArgs', {value: null});
/**
 * @method Parameterized reflow/repaint call.
 * @param {boolean} reflow Perform reflow.
 * @param {boolean} repaint Perform repaint.

 */
B.Control.method('_invalidate', function _invalidate(reflow, repaint) {
  if (reflow || this._invalidateArgs && this._invalidateArgs.reflow)
    this.reflow(this);
  if (repaint || this._invalidateArgs && this._invalidateArgs.repaint)
    this.repaint();
  this._invalidateArgs = null;
});
/**
 * @method Asynchronous reflow/repaint call. Ensures that no matter how much times it was called during one stream, actual reflow/repaint will be done once.
 * @param {boolean} reflow Perform reflow.
 * @param {boolean} repaint Perform repaint.

 */
B.Control.method('invalidate', function(reflow, repaint) {
  if (!this._invalidateArgs)
    setTimeout(this._invalidate.bind(this));
  this._invalidateArgs = this._invalidateArgs || {};
  this._invalidateArgs.reflow = this._invalidateArgs.reflow || reflow;
  this._invalidateArgs.repaint = this._invalidateArgs.repaint || repaint;
});

B.Control.property('nativeHandler');
/**
 * @method Bind Control to DOM element mouse events.
 * @param {Element} node DOM element.

 */
B.Control.method('_bindNative', function(node) {
  this._nativeHandler = this._nativeHandler || this._handleNative.bind(this);
  Utils.DOM.bind(node, 'mousemove', this._nativeHandler);
  Utils.DOM.bind(node, 'mousedown', this._nativeHandler);
  Utils.DOM.bind(node, 'mouseup', this._nativeHandler);
  Utils.DOM.bind(node, 'click', this._nativeHandler);
  Utils.DOM.bind(node, 'dblclick', this._nativeHandler);
  Utils.DOM.bind(node, Utils.isFF ? 'DOMMouseScroll' : 'mousewheel', this._nativeHandler);
  Utils.AnimationFrame.add(this._nativeHandler);
  //TODO add other events
});
/**
 * @method Handle native mouse event, convert it to simpler parameters and pass to _handle method.
 * @param {Event} e Native mouse event.

 */
B.Control.method('_handleNative', function(e) {
  var rect = e.target.getBoundingClientRect();
  var args = {
    type: e.type,
    x: e.pageX - rect.left,
    y: e.pageY - rect.top,
    cancel: false,
    reflow: false,
    repaint: false,
    native: e,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey
  };
  this._handle(args);
});
/**
 * @method Unbind control from DOM element mouse events.
 * @param {Element} node DOM element.

 */
B.Control.method('_unbindNative', function(node) {
  if (this._nativeHandler) {
    Utils.DOM.unbind(node, 'mousemove', this._nativeHandler);
    Utils.DOM.unbind(node, 'mousedown', this._nativeHandler);
    Utils.DOM.unbind(node, 'mouseup', this._nativeHandler);
    Utils.DOM.unbind(node, 'click', this._nativeHandler);
    Utils.DOM.unbind(node, 'dblclick', this._nativeHandler);
    Utils.DOM.unbind(node, Utils.isFF ? 'DOMMouseScroll' : 'mousewheel', this._nativeHandler);
    Utils.AnimationFrame.remove(this._nativeHandler);
  }
});

/**
 * @property {boolean} Catch all events regardless of mouse position inside/outside.
 */
B.Control.property('capture', {value: false, get: true});
/**
 * @property {boolean} Mouse is over Control.
 */
B.Control.property('hovered', {value: false, get: true});
/**
 * @property {boolean} Mouse was pressed over Control and not released yet.
 */
B.Control.property('pressed', {value: false, get: true});
/**
 * @method Check if coordinates are inside Control.
 */
B.Control.method('_check', function(x, y) {
  return this.getInnerLeft() <= x && x <= this.getInnerLeft() + this.getInnerWidth() &&
    this.getInnerTop() <= y && y <= this.getInnerTop() + this.getInnerHeight();
});
/**
 * @method Parse simplified arguments from native event and call corresponding handler.
 * Handlers should be defined in Control as _on<dom_event_name_in_UpperCamelCase> (_onMouseMove).
 */
B.Control.method('_handle', function(args) {
  if (!this._capture && (args.cancel || args.type !== 'animationframe' && !this._check(args.x, args.y)))
    return;
  var type = args.type;
  if (Utils.isFF && type === 'DOMMouseScroll')
    type = 'mousewheel';
  var handlerName = '_on' + type.replace(/^(mouse|animation|dbl|click)?(.*)$/, function(_, f, e) {
      return Utils.String.toUpperFirst(f || '') + Utils.String.toUpperFirst(e || '')
    });
  if (this[handlerName])
    this[handlerName](args);
  //TODO add some automatic way to pass event to children controls
});
//endregion
//region src/ui/base/label.js
/**
 * @class Simple label.
 */
B.Label = cls('B.Label', B.Control);

/**
 * @property {String[]} lines Lines to render after splitting, ellipsis and other internal calculations.
 */
B.Label.property('lines');
/**
 * @property {String} text Text to render. If no text specified with any alignment except non - sizes collapse to zero and nothing is rendered.
 */
B.Label.property('text', {value: '', get: true, set: true});
/**
 * @property {B.Direction} direction Text direction.
 */
B.Label.property('direction', {value: B.Direction.right, get: true, set: true});
/**
 * @property {B.Font} direction Text font.
 */
B.Label.property('font', {value: null, get: true, set: true, type: B.Font});
/**
 * @property {B.Direction} textAlign Horizontal alignment of text inside label.
 */
B.Label.property('textAlign', {value: B.HAlign.left, get: true, set: true});

B.Label.method('reflow', function reflow(space) {
  if (this._assertReflow(!this._text))
    return;

  if (this._hAlign !== B.HAlign.none) {
    this._width = space.getWidth();
  }
  if (this._vAlign !== B.VAlign.none) {
    this._height = space.getHeight();
  }

  var width = this._direction === B.Direction.left || this._direction === B.Direction.right ? this.getInnerWidth() : this.getInnerHeight();
  var height = this._direction === B.Direction.left || this._direction === B.Direction.right ? this.getInnerHeight() : this.getInnerWidth();

  var spaceSize = this._font.measure(' ');
  var spaceWidth = spaceSize.width;
  var threeDotsWidth = this._font.measure('...').width;
  var lineHeight = spaceSize.height;
  var lines = this._text.split('\n'),
    maxWidth = 0,
    isLastLine = false;
  for (var i = 0; i < lines.length && !isLastLine; i++) {
    isLastLine = (i + 1) * lineHeight <= height && (i + 2) * lineHeight > height;
    var line = '',
      lineWidth = 0,
      words = lines[i].split(' '),
      lineSplitted = false;

    for (var j = 0; j < words.length; j++) {
      var rSpaceWidth = lineWidth ? spaceWidth : 0;
      var llAdd = isLastLine ? threeDotsWidth : 0;
      var wordWidth = this._font.measure(words[j]).width;
      if (lineWidth + rSpaceWidth + wordWidth + llAdd < width) {
        line += (line ? ' ' : '') + words[j];
        lineWidth += rSpaceWidth + wordWidth;
        maxWidth = Math.max(maxWidth, lineWidth);
      }
      else {
        if (!line)
          isLastLine = true;

        if (isLastLine && j < words.length - 1) {
          line += '...';
          lineWidth += llAdd;
        }
        maxWidth = Math.max(maxWidth, lineWidth);
        lines.splice(i, 0, line);
        lineSplitted = true;
        break;
      }
    }
    if (!lineSplitted) {
      if (line) {
        lines[i] = line;
      }
      else {
        lines.splice(i, 1);
        i--;
      }
      if (isLastLine && lines.length > i - 1) {
        lines[i] += '...';
      }
    }
  }
  if (isLastLine) {
    lines.splice(i, lines.length - i);
  }
  //TODO add truncating of long words

  this._lines = lines;

  if (this._hAlign !== B.HAlign.none) {
    this._width = maxWidth;
    this._width = this._width - this.getInnerWidth() + maxWidth;
  }
  if (this._vAlign !== B.VAlign.none) {
    this._height = lines.length * lineHeight; //TODO implement and use setInnerHeight
    this._height = this._height - this.getInnerHeight() + lines.length * lineHeight;
  }

  if (this._direction === B.Direction.up || this._direction === B.Direction.down) {
    var t = this._width;
    this._width = this._height;
    this._height = t;
  }

  B.Label.base.reflow.apply(this, arguments);
});

B.Label.method('_repaintText', function() {
  var oh = -this.getInnerHeight() / 2,
    rotation = 0;
  this._context.translate(Math.round(this._left + this._width / 2), Math.round(this._top + this._height / 2));
  if (this._direction === B.Direction.up) {
    this._context.rotate(rotation = -Math.PI / 2);
    oh = -this.getInnerWidth() / 2;
  }
  else if (this._direction === B.Direction.down) {
    this._context.rotate(rotation = Math.PI / 2);
    oh = -this.getInnerWidth() / 2;
  }
  else if (this._direction === B.Direction.left) {
    this._context.rotate(rotation = -Math.PI);
  }

  this._context.fillStyle = this._font.getColor().toString();
  this._context.font = this._font.toString();
  this._context.textBaseline = 'top';
  for (var i = 0; i < this._lines.length; i++) {
    var size = this._font.measure(this._lines[i]), //TODO calculate this on reflow
      x = Math.round(-size.width / 2);
    if (this._textAlign === B.Direction.left)
      x = Math.round(-this.getInnerWidth() / 2);
    if (this._textAlign === B.Direction.right)
      x = Math.round((-this.getInnerWidth() - size.width) / 2);

    this._context.fillText(this._lines[i], x, Math.round(oh + i * size.height));
  }

  this._context.rotate(-rotation);
  this._context.translate(-Math.round(this._left + this._width / 2), -Math.round(this._top + this._height / 2));
});

B.Label.method('repaint', function repaint() {
  if (this._assertRepaint(!this._text))
    return;

  B.Label.base.repaint.apply(this, arguments);

  this._repaintText();
});
//endregion
//region src/ui/base/tooltip.js
/**
 * @class B.Tooltip Comic balloon-style tooltip.
 */
B.Tooltip = cls('B.Tooltip', B.Label);

/**
 * @property {number} x X-coordinate of point which balloon targets, pixels. Left/Right/Width/HAlign/Margin properties are always ignored.
 */
B.Tooltip.property('x', {value: 0, get: true, set: true});
/**
 * @property {number} y Y-coordinate of point which balloon targets, pixels. Top/Bottom/Height/VAlign/Margin properties are always ignored.
 */
B.Tooltip.property('y', {value: 0, get: true, set: true});
/**
 * @property {number} offset Offset from target point to ArrowDirection, pixels.
 * May be adjusted automatically if point is out of provided space, adjusted value is not stored.
 */
B.Tooltip.property('offset', {value: 0, get: true, set: true});

/**
 * @property {number} arrowWidth Width of ballon arrow, pixels.
 * Not a width in terms of screen coordinates but distance from one base point to other.
 */
B.Tooltip.property('arrowWidth', {value: 5, get: true, set: true});
/**
 * @property {number} arrowLength Length of ballon arrow, pixels.
 * Distance from tip to base.
 */
B.Tooltip.property('arrowLength', {value: 5, get: true, set: true});
/**
 * @property {number} arrowPosition Length of ballon arrow, relative (0-1) value of which side it is connected.
 * May be adjusted automatically if there is not enough space, adjusted value is not stored.
 */
B.Tooltip.property('arrowPosition', {value: 0.3, get: true, set: true});
/**
 * @property {B.Direction} arrowDirection Direction in which balloon grows from target point.
 * May be switched automatically if there is not enough space in that direction, adjusted value is not stored.
 * TODO confusing name, switch left-right/up-down, so it could define actual arrow direction
 */
B.Tooltip.property('arrowDirection', {value: B.Direction.up, get: true, set: true});
/**
 * @property {boolean} isOut Property shows if target point is out of space and offset is changed.
 */
B.Tooltip.property('isOut', {value: false, get: true});

/**
 * @method Simple check flipping side if it is out of bounds
 */
B.Tooltip.method('_flippingTest', function(coords, current, opposite, meaning) {
  var delta = 0,
    directionMultiplier = current === meaning ? -1 : 1,
    sd = coords[current].limit - coords[current].value;

  if (coords[current].side !== coords.side && sd * directionMultiplier < 0 && !coords.flipped) { //if this is not an arrowed side and it is out of bounds
    coords.side = coords[current].side; //switch arrow direction to opposite
    coords.flipped = true;
    var dvalue = coords[current].target - directionMultiplier * ( coords[current].value + this._offset + this._arrowLength ) - (1 - directionMultiplier) * coords[meaning].value; // set new coordinates
    coords[current].value += dvalue;
    coords[opposite].value += dvalue;
    sd -= dvalue;
  }

  delta = sd - directionMultiplier * this._arrowLength;//if this side is out of bounds
  if (sd * directionMultiplier < this._arrowLength) {
    this._isOut = true;
    coords[current].value += delta; // move tooltip back to bounds
    coords[opposite].value += delta;
  }
});

/**
 * @method Complex check rotating side if it is out of bounds.
 */
B.Tooltip.method('_rotatingTest', function(coords, current, opposite, otherIndex, otherOppositeIndex, otherMeaning, otherSecondary, meaning) {
  var delta = coords[current].limit - coords[current].value; //if side if out of bounds

  var mult = current === meaning ? -1 : 1;
  var check = current !== meaning;
  if (delta * mult < 0) {
    coords[current].value += delta; //return tooltip into bounds
    coords[opposite].value += delta;
    coords.arrowOffset -= delta; //and move arrow by it's side

    var so = check ? mult * (coords[current].value - coords[opposite].value) : 0;

    if (coords.arrowOffset * mult > so - coords.minOffset - this._arrowLength / 2) //if it is out of bounds now
    {
      coords.side = coords[current].side; //then move tail to next side clockwise
      coords.arrowOffset = -mult * (coords[otherIndex].value - coords[otherOppositeIndex].value) / 2; //to the center of the side
      var d1 = coords[otherIndex].target - coords.arrowOffset - coords[otherMeaning].value;
      coords[otherIndex].value += d1; //and adjust toolitp's vertical position
      coords[otherOppositeIndex].value += d1;
      var d2 = coords[meaning].target - mult * ( this._offset + this._arrowLength ) - so - coords[meaning].value;
      coords[current].value += d2; //and horizontal
      coords[opposite].value += d2;

      delta = coords[otherSecondary].limit - coords[otherSecondary].value; //if tooltip is out of bounds now
      if (delta < 0) {
        coords[otherMeaning].value += delta; //ireturn it into bounds
        coords[otherSecondary].value += delta;
        coords.arrowOffset = Math.min(coords[otherSecondary].value - coords[otherMeaning].value - coords.minOffset - this._arrowLength / 2, coords.arrowOffset - delta); //and adjust arrow so it do not overlap border radiuses
      }

      delta = coords[otherMeaning].limit - coords[otherMeaning].value;
      if (delta > 0) {
        coords[otherMeaning].value += delta;
        coords[otherSecondary].value += delta; //same check for another side
        coords.arrowOffset = Math.max(coords.minOffset + this._arrowLength / 2, coords.arrowOffset - delta);
      }


      delta = coords[current].limit - coords[current].value - mult * this._arrowLength;
      if (delta * mult < 0) {
        this._isOut = true;
        coords[current].value += delta; //and another
        coords[opposite].value += delta;
      }

    }
  }
});

/**
 * @method Adjust position and direction so tooltip is inside space and pointing to target.
 */
B.Tooltip.method('_calcPosition', function(top, left, arrowOffset, minOffset, space) {

  if (space) {
    var right = left + this.getWidth();
    var bottom = top + this.getHeight();

    var coords = {
      side: this._arrowDirection,
      arrowOffset: arrowOffset,
      minOffset: minOffset,
      left: {value: left, limit: space.getLeft(), side: B.Direction.right, target: this._x},
      up: {value: top, limit: space.getTop(), side: B.Direction.down, target: this._y},
      right: {value: right, limit: space.getRight(), side: B.Direction.left, target: this._x},
      down: {value: bottom, limit: space.getBottom(), side: B.Direction.up, target: this._y}
    };

    this._isOut = false;
    if (this._arrowDirection === B.Direction.up || this._arrowDirection === B.Direction.down) {
      this._flippingTest(coords, B.Direction.up, B.Direction.down, B.Direction.up);
      this._flippingTest(coords, B.Direction.down, B.Direction.up, B.Direction.up);
      this._rotatingTest(coords, B.Direction.left, B.Direction.right, B.Direction.down, B.Direction.up, B.Direction.up, B.Direction.down, B.Direction.left);
      this._rotatingTest(coords, B.Direction.right, B.Direction.left, B.Direction.up, B.Direction.down, B.Direction.up, B.Direction.down, B.Direction.left);

    }
    else {
      this._flippingTest(coords, B.Direction.left, B.Direction.right, B.Direction.left);
      this._flippingTest(coords, B.Direction.right, B.Direction.left, B.Direction.left);
      this._rotatingTest(coords, B.Direction.up, B.Direction.down, B.Direction.right, B.Direction.left, B.Direction.left, B.Direction.right, B.Direction.up);
      this._rotatingTest(coords, B.Direction.down, B.Direction.up, B.Direction.left, B.Direction.right, B.Direction.left, B.Direction.right, B.Direction.up);
    }

    top = coords[B.Direction.up].value;
    left = coords[B.Direction.left].value;

    return {top: top, left: left, side: coords.side, arrowOffset: coords.arrowOffset};
  }
});

B.Tooltip.method('reflow', function(space) {
  if (this._assertReflow(!this._text))
    return;

  this._hAlign = B.HAlign.auto;
  this._vAlign = B.VAlign.auto;

  B.Tooltip.base.reflow.apply(this, arguments);


  var left = 0, top = 0, arrowOffset = 0, side = this._arrowDirection, newCoords,
    innerWidth = this.getWidth(),
    innerHeight = this.getHeight();


  var borderR = this._border.getRadius();
  var borderW = this._border.getWidth();


  side = this._arrowDirection;
  var minOffset = borderR + this._arrowLength + 0;
  if (side === B.Direction.up || side === B.Direction.down) {
    arrowOffset = innerWidth * this._arrowPosition;

    if (arrowOffset < minOffset)
      arrowOffset = minOffset;
    if (arrowOffset > innerWidth - minOffset)
      arrowOffset = innerWidth - minOffset;

    left = this._x - arrowOffset;

    if (side === B.Direction.up)
      top = this._y - innerHeight - this._offset - this._arrowLength;

    if (side === B.Direction.down)
      top = this._y + this._offset + this._arrowLength;
  }

  else if (side === B.Direction.left || side === B.Direction.right) {
    arrowOffset = innerHeight * this._arrowPosition;

    if (arrowOffset < minOffset)
      arrowOffset = minOffset;
    if (arrowOffset > innerHeight - minOffset)
      arrowOffset = innerHeight - minOffset;

    top = this._y - arrowOffset;

    if (side === B.Direction.left)
      left = this._x - innerWidth - this._offset - this._arrowLength;

    if (side === B.Direction.right)
      left = this._x + this._offset + this._arrowLength;
  }
  else {
    left = this._x - innerWidth / 2;
    top = this._y - innerHeight / 2;
  }
  top -= borderW / 2;
  left -= borderW / 2;
  innerWidth += borderW + 1;
  innerHeight += borderW + 1;
  if (side) {
    newCoords = this._calcPosition(top, left, arrowOffset, minOffset - this._arrowLength, space);
    if (newCoords) {
      top = newCoords.top;
      left = newCoords.left;
      side = newCoords.side;
      arrowOffset = newCoords.arrowOffset;
    }
  }
  top += borderW / 2;
  left += borderW / 2;
  innerWidth -= borderW + 1;
  innerHeight -= borderW + 1;


  this._data = {
    width: innerWidth,
    height: innerHeight,
    side: side,
    arrowOffset: arrowOffset
  };

  this._left = left;
  this._top = top;
  this._width = innerWidth;
  this._height = innerHeight;
});

B.Tooltip.property('data', {value: null});

B.Tooltip.method('repaint', function() {
  if (this._assertRepaint(!this._text))
    return;

  var side = this._data.side,
    arrowOffset = this._data.arrowOffset,
    borderW = this._border.getWidth(),
    borderR = this._border.getRadius(),
    aliasOffset = (borderW % 2) / 2,
    arrowStart = arrowOffset - this._arrowLength / 2,
    arrowEnd = arrowOffset + this._arrowLength / 2,
    cRight = this._width - borderR,
    cBottom = this._height - borderR;

  this._context.translate(Math.round(this._left) + aliasOffset, Math.round(this._top) + aliasOffset);

  this._context.beginPath();

  this._context.moveTo(borderR, 0);

  if (side === B.Direction.down) {
    this._context.lineTo(arrowStart, 0);
    this._context.lineTo(arrowOffset, -this._arrowLength);
    this._context.lineTo(arrowEnd, 0);
  }

  this._context.arc(cRight, borderR, borderR, -Math.PI / 2, 0);

  if (side === B.Direction.left) {
    this._context.lineTo(this._width, arrowStart);
    this._context.lineTo(this._width + this._arrowLength, arrowOffset);
    this._context.lineTo(this._width, arrowEnd);
  }

  this._context.arc(cRight, cBottom, borderR, 0, Math.PI / 2);

  if (side === B.Direction.up) {
    this._context.lineTo(arrowEnd, this._height);
    this._context.lineTo(arrowOffset, this._height + this._arrowLength);
    this._context.lineTo(arrowStart, this._height);
  }

  this._context.arc(borderR, cBottom, borderR, Math.PI / 2, Math.PI);

  if (side === B.Direction.right) {
    this._context.lineTo(0, arrowEnd);
    this._context.lineTo(-this._arrowLength, arrowOffset);
    this._context.lineTo(0, arrowStart);
  }

  this._context.arc(borderR, borderR, borderR, Math.PI, 3 * Math.PI / 2);

  this._background.apply(this._context);
  this._context.fill();
  this._border.apply(this._context);
  this._context.stroke();

  this._context.translate(-Math.round(this._left) + aliasOffset, -Math.round(this._top) + aliasOffset);

  this._repaintText();

});
//endregion
//region src/ui/bubblechart/bubble.js
/**
 * @class B.Bubble Bubble.
 */
B.Bubble = cls('B.Bubble', B.Control, function(options) {
  evt(this, 'hover');
  evt(this, 'dblClick');
  evt(this, 'stateChange');
  B.Bubble.base.constructor.apply(this, arguments);
});

B.Bubble.method('_check', function(x, y) {
  x -= this.getX();
  y -= this.getY();
  return Math.sqrt(x * x + y * y) <= this.getR();
});

B.Bubble.method('_onMouseMove', function(args) {
  var isInside = this._check(args.x, args.y);
  var changed = (this._hovered !== (this._hovered = this._capture = (isInside && !args.cancel)));
  if (changed)
    this.hover.invoke(this, Utils.extend({
      hover: (isInside && !args.cancel)
    }, args));
  args.cancel = args.cancel || isInside;
});

B.Bubble.method('_onDblClick', function(args) {
  this.dblClick.invoke(this, args);
});

B.Bubble.method('_onAnimationFrame', function(args) {
  //TODO make color animatable too
  var changed = !!(this.getLeft(true).animate() + this.getTop(true).animate() + this.getWidth(true).animate() + this.getHeight(true).animate());

  var state = this._state;
  if (changed && this._state === B.Bubble.States.waiting)
    this._state = B.Bubble.States.appearing;
  if (!changed && this._state === B.Bubble.States.appearing)
    this._state = B.Bubble.States.normal;
  if (!changed && this._state === B.Bubble.States.disappearing)
    this._state = B.Bubble.States.disappeared;
  if (changed)
    this.invalidated.invoke(this);
  if (state !== this._state)
    this.stateChange.invoke(this, {state: this._state});
});

/**
 * @method Skip all animations.
 */
B.Bubble.method('skip', function() {
  this.getLeft(true).skip();
  this.getTop(true).skip();
  this.getWidth(true).skip();
  this.getHeight(true).skip();
});

/**
 * @property {String[]} path Path to data slice to which bubble is assigned.
 */
B.Bubble.property('path', {value: null, get: true, set: true});

B.Bubble.property('left', {get: B.Animatable.getter('left'), set: B.Animatable.setter('left')});
B.Bubble.property('top', {get: B.Animatable.getter('top'), set: B.Animatable.setter('top')});
B.Bubble.property('width', {get: B.Animatable.getter('width'), set: B.Animatable.setter('width')});
B.Bubble.property('height', {get: B.Animatable.getter('height'), set: B.Animatable.setter('height')});

/**
 * @property {number} x X-coordinate of center. Utilizes Left/Right properties so they form bounding rectangle.
 */
B.Bubble.property('x', {
  get: function() {
    return this.getLeft() + this.getR();
  },
  set: function(value) {
    this.setLeft(value - this.getWidth(true).getNextValue() / 2);
  }
});

/**
 * @property {number} y Y-coordinate of center. Utilizes Left/Right properties so they form bounding rectangle.
 */
B.Bubble.property('y', {
  get: function() {
    return this.getTop() + this.getR();
  },
  set: function(value) {
    this.setTop(value - this.getWidth(true).getNextValue() / 2);
  }
});

/**
 * @property {number} r Bubble radius. Utilizes Left/Right properties so they form bounding rectangle.
 */
B.Bubble.property('r', {
  get: function() {
    return this.getWidth() / 2;
  },
  set: function(value) {
    var x = this.getLeft(true).getNextValue() + this.getWidth(true).getNextValue() / 2,
      y = this.getTop(true).getNextValue() + this.getWidth(true).getNextValue() / 2;
    this.setWidth(value * 2);
    this.setHeight(value * 2);
    this.setX(x);
    this.setY(y);
  }
});

/**
 * @property {B.Color} color Bubble color. Utilizes background and border to draw some magic.
 */
B.Bubble.property('color', {
  get: function() {
    return this._border.getColor();
  },
  set: function(value) {
    this._border.setColor(value);
    this._border.setWidth(2);
    var fill = this._border.getColor().clone();
    fill.setA(fill.getA() / 2);
    this.setBackground(fill);
  }
});

B.Bubble.States = enumeration({
  waiting: 'waiting',
  appearing: 'appearing',
  normal: 'normal',
  disappearing: 'disappearing',
  disappeared: 'disappeared'
});

B.Bubble.property('state', {
  value: B.Bubble.States.waiting, get: true, set: function(value) {
    this._state = value;
    this.stateChange.invoke(this, {state: value});
  }
});

B.Bubble.method('reflow', function() {

});

B.Bubble.method('repaint', function() {
  if (this._assertRepaint(!this.getR()))
    return;

  this._context.beginPath();
  this._context.arc(this.getX(), this.getY(), Math.max(0, this.getR() - this._border.getWidth() / 2), 0, 2 * Math.PI);
  this._context.closePath();

  this._background.add(this._hovered ? -0.2 : 0).apply(this._context);//TODO make hovered effects configurable
  this._context.fill();
  this._border.apply(this._context);
  this._border.getColor().add(this._hovered ? -0.2 : 0).apply(this._context);
  this._context.stroke();
});
//endregion
//region src/ui/bubblechart/data/data.js
/**
 * @class Multidimensional data storage.
 */
B.Data = cls('B.Data', MObject, function Data(options) {
  B.Data.base.constructor.apply(this, arguments);
});

/**
 * @property {object} items Multidimentional associative array of data.
 */
B.Data.property('items', {
  value: null, get: true, set: function(value) {
    this._items = value;
    var initialized = false;
    this._min = null;
    this._max = null;
    this._empty = true;
    this._numeric = true;//TODO check for same level of numeric values
    this._minMaxCache = null;
    var queue = [value];
    while (queue.length) {
      var item = queue.pop();
      switch (true) {
        case Utils.Types.isObject(item):
          for (var i in item) {
            queue.push(item[i]);
          }
          break;
        case Utils.Types.isNumber(parseFloat(item)):
          this._empty = false;
          if (!initialized) {
            this._min = this._max = parseFloat(item);
            initialized = true;
          }
          else if (this._numeric) {
            this._min = Math.min(this._min, item);
            this._max = Math.min(this._max, item);
          }
          break;
        default:
          this._empty = false;
          this._numeric = true;

      }
    }
  }

});
/**
 * @property {object[]} names Names of subarrays. Each item is an object like {<id>:<name>} and corresponds to a deeper dimension.
 */
B.Data.property('names', {value: null, get: true, set: true});
/**
 * @property {boolean} empty True if there are no primitive values in array.
 */
B.Data.property('empty', {value: true, get: true});
/**
 * @property {boolean} numeric True if all values on one dimension are numeric.
 */
B.Data.property('numeric', {value: false, get: true});

B.Data.property('minMaxCache', {value: null});

/**
 * @method Get minimum value in specified subarray.
 * @parameter {String[]} path Path to subarray.
 * @returns {number|null} Minimum value if this is numeric and subarray has any numeric values, otherwise null.
 */
B.Data.method('min', function(path) {
  if (!this._numeric)
    return null;
  if (!path)
    return this._min;
  var cache = this._minMaxCache = this._minMaxCache || {};
  var data = this._items;
  for (var i = 0; i < path.length; i++) {
    data = data[path[i]];
    cache = cache[path[i]] = cache[path[i]] || [];
    if (!data)
      return null;
  }
  if (!Utils.Types.isNumber(cache._min)) {
    var min = null;
    var queue = [data];
    while (queue.length) {
      data = queue.pop();
      switch (true) {
        case Utils.Types.isObject(data):
          for (i in data) {
            queue.push(data[i]);
          }
          break;
        case Utils.Types.isNumber(data):
          min = min === null ? data : Math.min(min, data);
          break;
      }
    }
    cache._min = min;
  }
  return cache._min;
});

/**
 * @method Get maximum value in specified subarray.
 * @parameter {String[]} path Path to subarray.
 * @returns {number|null} Maximum value if this is numeric and subarray has any numeric values, otherwise null.
 */
B.Data.method('max', function(path) {
  if (!this._numeric)
    return null;
  if (!path)
    return this._min;
  var cache = this._minMaxCache = this._minMaxCache || {};
  var data = this._items;
  for (var i = 0; i < path.length; i++) {
    data = data[path[i]];
    cache = cache[path[i]] = cache[path[i]] || [];
    if (!data)
      return null;
  }
  if (!Utils.Types.isNumber(cache._max)) {
    var max = null;
    var queue = [data];
    while (queue.length) {
      data = queue.pop();
      switch (true) {
        case Utils.Types.isObject(data):
          for (i in data) {
            queue.push(data[i]);
          }
          break;
        case Utils.Types.isNumber(data):
          max = max === null ? data : Math.max(max, data);
          break;
      }
    }
    cache._max = max;
  }
  return cache._max;
});


/**
 * @method Extract item from array. If the path can not be traversed or item at the end of the path is not a primitive, consider it invalid item and return null,
 * @param {String[]} path Array of ids each corresponding to a deeper dimension.
 * @returns {*}
 */
B.Data.method('item', function item(path) {
  path = [].concat(path);
  var data = this._items;
  while (typeof data === 'object' && path.length)
    data = data[path.shift()];
  if (typeof data === 'object' || path.length)
    return null;
  return data;
});

/**
 * Get name of a subarray or item.
 * @param {String[]} path Array of ids each corresponding to a deeper dimension.
 * * @returns {String||null}
 */
B.Data.method('name', function name(path) {
  path = [].concat(path);
  var names = this._names && this._names[path.length - 1];
  return names && names[path.pop()] || '';
});
//endregion
//region src/ui/bubblechart/data/transformer.js
/**
 * Data extraction and transformation helper.
 */
B.Transformer = cls('B.Transformer', MObject, function Transformer(options) {
  B.Transformer.base.constructor.apply(this, arguments);
});

/**
 * @property {B.Data} data Data.
 */
B.Transformer.property('data', {value: null, get: true, set: true, type: B.Data});
/**
 * @proprety {String[]} path Predefined path to a slice from which transformer should get data.
 */
B.Transformer.property('path', {value: null, get: true, set: true});
/**
 * @property {number} min Value to which minimum item in slice will be transformed.
 */
B.Transformer.property('min', {value: 0, get: true, set: true});
/**
 * @property {number} max Value to which minimum item in slice will be transformed.
 */
B.Transformer.property('max', {value: 1, get: true, set: true});
/**
 * @property {number} nodata Value to which null item in slice will be transformed.
 */
B.Transformer.property('nodata', {value: 0.5, get: true, set: true});

/**
 * @property {number} minItem Minimum item in slice.
 */
B.Transformer.property('minItem', {
  get: function() {
    if (!this._data || !this._data.getNumeric())
      return -1;
    var min = this._data.min(this._path);
    var max = this._data.max(this._path);
    return min === max ? min - 1 : min;
  }
});
/**
 * @property {number} maxItem Maximum item in slice.
 */
B.Transformer.property('maxItem', {
  get: function() {
    if (!this._data || !this._data.getNumeric())
      return -1;
    var min = this._data.min(this._path);
    var max = this._data.max(this._path);
    return min === max ? max + 1 : max;
  }
});

/**
 * @method Linear interpolation.
 */
B.Transformer.method('_interpolate', function _interpolate(minV, v, maxV, minR, maxR) {
  var dataRange = (maxV - minV) || 1;
  var dataOffset = v - minV;
  var resultRange = maxR - minR;
  return minR + dataOffset * resultRange / dataRange;
});

/**
 * @method Get item from data.
 * @param {String[]} path Path in slice.
 */
B.Transformer.method('item', function(path1, path2, offset) {
  if (!this._data || !this._data.getNumeric())
    return this._nodata;
  if (this._path) {
    path1 = this._path.concat(path1);
    if (path2)
      path2 = this._path.concat(path2);
  }
  if (!path2)
    return this._data.item(path1);
  else {
    var data1 = this._data.item(path1);
    var data2 = this._data.item(path2);
    if (!Utils.Types.isNumber(data1) || !Utils.Types.isNumber(data1))
      return null;
    return this._interpolate(0, offset, 1, data1, data2);
  }
});

/**
 * @method Transform item.
 * @param {Number|null} item Item.
 */
B.Transformer.method('transform', function(item) {
  if (!Utils.Types.isNumber(item))
    return this._nodata;

  return this._interpolate(this.getMinItem(), item, this.getMaxItem(), this._min, this._max);
});

/**
 * @method Get and transform item from data.
 * @param {String[]} path Path in slice.
 */
B.Transformer.method('transformedItem', function(path1, path2, offset) {
  if (!path2)
    return this.transform(this.item(path1));
  else {
    var data1 = this.transform(this.item(path1));
    var data2 = this.transform(this.item(path2));
    return this._interpolate(0, offset || 0, 1, data1, data2);
  }
});

/**
 * @method Get name of a subslice.
 * @param {String[]} path Path in slice.
 */
B.Transformer.method('name', function(path) {
  if (this._path)
    path = this._path.concat(path || []);
  return this._data && this._data.name(path);
});


B.ColorTransformer = cls('B.ColorTransformer', B.Transformer);

B.ColorTransformer.property('min', {value: '#FF0000', get: true, set: true, type: B.Color});
B.ColorTransformer.property('max', {value: '#00FF00', get: true, set: true, type: B.Color});
B.ColorTransformer.property('nodata', {value: '#AAAAAA', get: true, set: true, type: B.Color});

B.ColorTransformer.method('transform', function(value) {
  if (!Utils.Types.isNumber(value))
    return this._nodata;

  var result = new B.Color();
  result.setR(this._interpolate(this.getMinItem(), value, this.getMaxItem(), this._min.getR(), this._max.getR()));
  result.setG(this._interpolate(this.getMinItem(), value, this.getMaxItem(), this._min.getG(), this._max.getG()));
  result.setB(this._interpolate(this.getMinItem(), value, this.getMaxItem(), this._min.getB(), this._max.getB()));
  result.setA(this._interpolate(this.getMinItem(), value, this.getMaxItem(), this._min.getA(), this._max.getA()));
  return result.toString();
});

B.ColorTransformer.method('transformedItem', function(path1, path2, offset) {
  if (!path2)
    return this.transform(this.item(path1));
  else {
    var data1 = new B.Color(this.transform(this.item(path1)));
    var data2 = new B.Color(this.transform(this.item(path2)));


    var result = new B.Color();
    result.setR(this._interpolate(0, offset || 0, 1, data1.getR(), data2.getR()));
    result.setG(this._interpolate(0, offset || 0, 1, data1.getG(), data2.getG()));
    result.setB(this._interpolate(0, offset || 0, 1, data1.getB(), data2.getB()));
    result.setA(this._interpolate(0, offset || 0, 1, data1.getA(), data2.getA()));
    return result.toString();
  }
});
//endregion
//region src/ui/bubblechart/plot/line.js
/**
 * @class Line.
 */
B.Line = cls('B.Line', B.Control);

/**
 * @property {number} x1 X-coordinate of first bubble. Utilizes Control's Left/Right properties so they form line's bounding rectangle.
 */
B.Line.property('x1', {
  get: function() {
    return this._left;
  },
  set: function(value) {
    this._left = value;
  }
});

/**
 * @property {number} y1 Y-coordinate of first bubble. Utilizes Control's Top/Bottom properties so they form line's bounding rectangle.
 */
B.Line.property('y1', {
  get: function() {
    return this._top;
  },
  set: function(value) {
    this._top = value;
  }
});

/**
 * @property {number} x1 X-coordinate of second bubble. Utilizes Control's Left/Right properties so they form line's bounding rectangle.
 */
B.Line.property('x2', {
  get: function() {
    return this._left + this._width;
  },
  set: function(value) {
    this._width = value - this._left;
  }
});

/**
 * @property {number} y1 Y-coordinate of second bubble. Utilizes Control's Top/Bottom properties so they form line's bounding rectangle.
 */
B.Line.property('y2', {
  get: function() {
    return this._top + this._height;
  },
  set: function(value) {
    this._height = value - this._top;
  }
});

B.Line.alias('stroke', 'border');

B.Line.method('reflow', function() {
  //lines are not alignable, nothing to do
});

B.Line.method('repaint', function() {
  if (!this._context || !this._visible || !this._border.getWidth())
    return;

  var pixelOffset = (this._border.getWidth() % 2) / 2;
  this._border.apply(this._context);
  this._context.beginPath();
  this._context.moveTo(Math.round(this.getX1()) + pixelOffset, Math.round(this.getY1()) + pixelOffset);
  this._context.lineTo(Math.round(this.getX2()) + pixelOffset, Math.round(this.getY2()) + pixelOffset);
  this._context.stroke();
});
//endregion
//region src/ui/bubblechart/plot/scale.js
/**
 * @class B.Scale Transformer from relative coordinates(0,1) to screen.
 * Rect properties define area to which relative coordinates should be mapped.
 */
B.Scale = cls('B.Scale', B.Rect);

/**
 * @property {B.Spacing} padding Scale-independent padding, screen pixels.
 */
B.Scale.property('padding', {value: 0, get: true, set: true, type: B.Spacing});

/**
 * @property {number} offsetX Horizontal offset, screen pixels.
 */
B.Scale.property('offsetX', {
  value: 0, get: true, set: function(value) {
    var sx = 1 - this._scaleX;
    this._offsetX = Utils.Number.clip(
      (this.getLeft() + this._padding.getLeft()) * (1 - this._scaleX),
      value,
      (this.getRight() - this._padding.getRight()) * (1 - this._scaleX)
    );
  }
});

/**
 * @property {number} offsetY Vertical offset, screen pixels.
 */
B.Scale.property('offsetY', {
  value: 0, get: true, set: function(value) {
    var sx = 1 - this._scaleY;
    this._offsetY = Utils.Number.clip(
      (this.getTop() + this._padding.getTop()) * (1 - this._scaleY),
      value,
      (this.getBottom() - this._padding.getBottom()) * (1 - this._scaleY)
    );
  }
});

/**
 * @property {number} scaleX Horizontal scale.
 */
B.Scale.property('scaleX', {
  value: 1, get: true, set: function(value) {
    this._scaleX = Utils.Number.clip(this._minScaleX, value, this._maxScaleX);
  }
});
/**
 * @property {number} scaleY Vertical scale.
 */
B.Scale.property('scaleY', {
  value: 1, get: true, set: function(value) {
    this._scaleY = Utils.Number.clip(this._minScaleY, value, this._maxScaleY);
  }
});

/**
 * @property {number} minScaleX Horizontal scale lower limit.
 */
B.Scale.property('minScaleX', {
  value: 1, get: true, set: function(value) {
    this._minScaleX = value;
    this._maxScaleX = Math.max(value, this._maxScaleX);
    this.setScaleX(this._scaleX);
  }
});
/**
 * @property {number} minScaleY Vertical scale lower limit.
 */
B.Scale.property('minScaleY', {
  value: 1, get: true, set: function(value) {
    this._minScaleY = value;
    this._maxScaleY = Math.max(value, this._maxScaleY);
    this.setScaleY(this._scaleY);
  }
});

/**
 * @property {number} maxScaleX Horizontal scale upper limit.
 */
B.Scale.property('maxScaleX', {
  value: 10, get: true, set: function(value) {
    this._maxScaleX = value;
    this._minScaleX = Math.min(value, this._minScaleX);
    this.setScaleX(this._scaleX);
  }
});
/**
 * @property {number} maxScaleY Vertical scale upper limit.
 */
B.Scale.property('maxScaleY', {
  value: 10, get: true, set: function(value) {
    this._maxScaleY = value;
    this._minScaleY = Math.min(value, this._minScaleY);
    this.setScaleY(this._scaleY);
  }
});

/**
 * @method Scale to rect, screen pixels.
 */
B.Scale.method('scaleTo', function(rect) {
  var pScaleX = this._scaleX,
    pScaleY = this._scaleY;

  this.setScaleX(this._scaleX * this.getWidth() / rect.getWidth());
  this.setScaleY(this._scaleY * this.getHeight() / rect.getHeight());

  this.setOffsetX(this._offsetX + this.getLeft() - rect.getLeft() + (this._offsetX - rect.getLeft()) * (this._scaleX / pScaleX - 1));
  this.setOffsetY(this._offsetY + this.getTop() - rect.getTop() + (this._offsetY - rect.getTop()) * (this._scaleY / pScaleY - 1));
});

/**
 * @method Scale around a point.
 * @param {number} addend Addend for scale.
 * @param {number} x X-coordinate of a center point, screen pixels. Result area center by default.
 * @param {number} y Y-coordinate of a center point, screen pixels. Result area center by default.
 */
B.Scale.method('scaleBy', function(addend, x, y) {
  if (!Utils.Types.isNumber(x))
    x = this.getCenterX();
  if (!Utils.Types.isNumber(y))
    y = this.getCenterY();

  var pScaleX = this._scaleX,
    pScaleY = this._scaleY;

  this.setScaleX(this._scaleX + addend);
  this.setScaleY(this._scaleY + addend);

  this.setOffsetX(this._offsetX + (this._offsetX - x) * (this._scaleX / pScaleX - 1));
  this.setOffsetY(this._offsetY + (this._offsetY - y) * (this._scaleY / pScaleY - 1));
});

/**
 * @method Move by vector.
 * @param {number} dx Vector X value, screen pixels.
 * @param {number} dy Vector Y value, screen pixels.
 */
B.Scale.method('moveBy', function(dx, dy) {
  this.setOffsetX(this._offsetX + dx);
  this.setOffsetY(this._offsetY + dy);
});

/**
 * @method Transform relative X-coordinate to screen.
 * @param {number} x Relative X-coordinate.
 */
B.Scale.method('x', function(x) {
  return ((this.getLeft() + this._padding.getLeft()) * (1 - x) + (this.getRight() - this._padding.getRight()) * x) * this._scaleX + this._offsetX;
});

/**
 * @method Transform relative Y-coordinate to screen.
 * @param {number} x Relative Y-coordinate.
 */
B.Scale.method('y', function(y) {
  return ((this.getTop() + this._padding.getTop()) * (1 - y) + (this.getBottom() - this._padding.getBottom()) * y) * this._scaleY + this._offsetY;
});
//endregion
//region src/ui/bubblechart/plot/controlcollection.js
/**
 * @class B.ControlCollection Autofilling collection of controls, whose one of the coordinate connected to interpolatable value.
 */
B.ControlCollection = cls('B.ControlCollection', B.Control);

/**
 * @property {Control[]} items Collection of controls.
 */
B.ControlCollection.property('items', {value: null});
/**
 * @property [number[]} values Values associated for each item.
 */
B.ControlCollection.property('values', {value: null});
/**
 * @property {function} class Constructor of which instances to be created as items.
 */
B.ControlCollection.property('class', {value: B.Control, get: true});
/**
 * @property {object} options Options for every instantiated item.
 */
B.ControlCollection.property('options', {value: null, get: true, set: true});

/**
 * @property {number} min Value of first item. It can not be obtained from transformer by collection itself because subcollection have to have different ranges.
 */
B.ControlCollection.property('min', {value: 0, get: true, set: true});
/**
 * @property {number} max Value of last item. It can not be obtained from transformer by collection itself because subcollection have to have different ranges.
 */
B.ControlCollection.property('max', {value: 0, get: true, set: true});
/**
 * @property {number} count Items count.
 */
B.ControlCollection.property('count', {value: 0, get: true, set: true});
/**
 * @property {B.Transformer} transformer Transformer to transform values into relative coordinates of items.
 */
B.ControlCollection.property('transformer', {value: null, get: true, set: true, type: B.Transformer});
/**
 * @property {B.Scale} scale Transformer to transform relative coordinates of items to screen coordinates.
 */
B.ControlCollection.property('scale', {value: null, get: true, set: true, type: B.Scale});
/**
 * @property {B.Direction} direction Direction in which values grow, defines which coordinate of items will be variated.
 */
B.ControlCollection.property('direction', {value: B.Direction.right, get: true, set: true});

/**
 * @property {B.ControlCollection} subcollection Collection which is drawn between two each item. This one is not drawn actually but acts like a template.
 */
B.ControlCollection.property('subcollection', {value: null, get: true, set: true});
/**
 * @property {B.ControlCollection[]} subcollections Actual instances of subcollection for each itembetweenage.
 */
B.ControlCollection.property('subcollections', {value: null});

B.ControlCollection.property('master', {value: null});
B.ControlCollection.property('slave', {value: null});
/**
 * @method Ability to synchronize same levels of different collection, so deeper subcollections of other one could not overlap higher subcollections of current.
 * @param {B.ControlCollection} other Other collection. Each of it's subcollections level will be drawn right before correcponding level of current collection.
 */
B.ControlCollection.method('synchronize', function(other) {
  this._slave = other;
  if (other)
    other.master = this;
});

/**
 * @method Create items and values.
 */
B.ControlCollection.method('_recreate', function() {
  if (!this._class || !Utils.Types.isFunction(this._class) || !this._count) {
    this._items = this._values = this._subcollections = null;
    return;
  }

  this._items = [];
  this._values = [];
  for (var i = 0; i < this._count; i++) {
    this._items[i] = new this._class(this._options);
    this._values[i] = this._min + i * (this._max - this._min) / (this._count - 1);
  }

  if (this._subcollection) {
    this._subcollections = [];
    for (i = 0; i < this._values.length - 1; i++) {
      this._subcollections[i] = new this.constructor(this._subcollection);
      this._subcollections[i].setMin(this._values[i]);
      this._subcollections[i].setMax(this._values[i + 1]);
    }
  }
});

/**
 * @method Do some specific modifications for items depending on value.
 * @param {number} value
 */
B.ControlCollection.method('_applyValue');

B.ControlCollection.method('_reflowChildren', function(space) {
  if (!this._context || !this._visible)
    return;

  this.setPadding(0);

  if (
    !this._items || !this._values || (this._subcollection && !this._subcollections) ||
    this._items.length !== this._count || this._values.length !== this._count ||
    (this._subcollection && this._subcollections && this._subcollections.length !== this._count - 1) ||
    this._values[0] !== this._min || this._values[this._values.length - 1] !== this._max
  )
    this._recreate();

  var size = 0;
  for (var i = 0; i < this._items.length; i++) {
    this._applyValue(this._items[i], this._values[i]);
    this._items[i].setContext(this._context);
    this._items[i].setVisible(true);
    this._items[i].setHAlign(B.HAlign.auto);
    this._items[i].setVAlign(B.VAlign.auto);
    this._items[i].reflow(space);

    size = Math.max(size, this._direction === B.Direction.up || this._direction === B.Direction.down ? this._items[i].getWidth() : this._items[i].getHeight());

    if (this._subcollections && this._subcollections[i]) {
      this._subcollections[i].setContext(this._context);
      this._subcollections[i].setHAlign(this._hAlign);
      this._subcollections[i].setVAlign(this._vAlign);
      this._subcollections[i].setDirection(this._direction);
      this._subcollections[i].setScale(this._scale);
      size = Math.max(size, this._subcollections[i]._reflowChildren(space));
    }
  }

  if (this._direction === B.Direction.up || this._direction === B.Direction.down && this._hAlign !== B.HAlign.none) {
    this._width = size;
    this._width = this._width - this.getInnerWidth() + size;
  }
  if (this._direction === B.Direction.left || this._direction === B.Direction.right && this._vAlign !== B.VAlign.none) {
    this._height = size;
    this._height = this._height - this.getInnerHeight() + size;
  }

  return size;
});

B.ControlCollection.method('_reflowSelf', function(space, callBase) {

  if (callBase)
    B.ControlCollection.base.reflow.apply(this, arguments);

  if (this._subcollections) {
    for (var i = 0; i < this._subcollections.length; i++) {
      this._subcollections[i].setTransformer(this._transformer);
      this._subcollections[i].setLeft(this._left);
      this._subcollections[i].setTop(this._top);
      this._subcollections[i].setWidth(this._width);
      this._subcollections[i].setHeight(this._height);
      this._subcollections[i]._reflowSelf(space);
    }
  }
});

B.ControlCollection.method('_realignChildren', function() {
  for (var i = 0; i < this._items.length; i++) {
    var position = this._transformer.transform(this._values[i]);

    if (this._direction === B.Direction.up || this._direction === B.Direction.down) {
      if (this._hAlign === B.HAlign.left)
        this._items[i].setLeft(this.getInnerLeft() + this.getInnerWidth() - this._items[i].getWidth());
      else if (this._hAlign === B.HAlign.right)
        this._items[i].setLeft(this.getInnerLeft());
      else
        this._items[i].setLeft(this.getInnerLeft() + this.getInnerWidth() / 2 - this._items[i].getWidth() / 2);
      if (this._direction === B.Direction.up)
        position = 1 - position;

      this._items[i].setTop(this._scale.y(position) - this._items[i].getHeight() / 2);
    }
    else {
      if (this._vAlign === B.VAlign.top)
        this._items[i].setTop(this.getInnerTop() + this.getInnerHeight() - this._items[i].getHeight());
      else if (this._vAlign === B.HAlign.bottom)
        this._items[i].setTop(this.getInnerTop());
      else
        this._items[i].setTop(this.getInnerTop() + this.getInnerHeight() / 2 - this._items[i].getHeight() / 2);
      if (this._direction === B.Direction.left)
        position = 1 - position;

      this._items[i].setLeft(this._scale.x(position) - this._items[i].getWidth() / 2); //TODO extract this values as scale object
    }
    if (this._subcollections && this._subcollections[i])
      this._subcollections[i]._realignChildren();
  }
});

B.ControlCollection.method('reflow', function(space, realignOnly) {
  if (!this._context || !this._visible)
    return;
  if (!realignOnly) {
    this._reflowChildren(space); //first we have to recursively calculate all items sizes in all subcollections and calculate own size depending on them
    this._reflowSelf(space, true); //then we can apply self alignment and recursively align subcollections with self
  }
  this._realignChildren(); //finally we can set each item's position depending on self position and transformed value
});

B.ControlCollection.method('_repaint', function(currentLevel, levelToRender) {
  if (!this._context || !this._visible)
    return;
  if (levelToRender) {
    if (this._subcollections)
      for (var i = 0; i < this._subcollections.length; i++)
        this._subcollections[i]._repaint(currentLevel + 1, levelToRender - 1);
    return;
  }

  if (!Utils.Types.isNumber(levelToRender) && this._subcollections) {
    for (var i = 0; i < this._subcollections.length; i++)
      this._subcollections[i]._repaint(currentLevel + 1);
  }

  if (this._slave)
    this._slave._repaint(0, currentLevel);

  for (var i = 0; i < this._items.length; i++)
    this._items[i].repaint();
});

B.ControlCollection.method('repaint', function() {
  if (this._master)
    return; //master will call internal _repaint directly when he is repainted
  this._clip();
  this._repaint(0);
  this._unclip();
});
//endregion
//region src/ui/bubblechart/plot/linecollection.js
/**
 * @class B.LineCollection ControlCollection modification for B.Line.
 */
B.LineCollection = cls('B.LineCollection', B.ControlCollection);

B.LineCollection.property('class', {value: B.Line, get: true});
B.LineCollection.property('options', {value: {stroke: '#FFFFFF'}});


B.LineCollection.method('_reflowChildren', function(space) {
  if (!this._context || !this._visible)
    return;
  if (
    !this._items || !this._values || (this._subcollection && !this._subcollections) ||
    this._items.length !== this._count || this._values.length !== this._count ||
    (this._subcollection && this._subcollections && this._subcollections.length !== this._count - 1) ||
    this._values[0] !== this._min || this._values[this._values.length - 1] !== this._max
  )
    this._recreate();

  for (var i = 0; i < this._items.length; i++) {
    this._items[i].setContext(this._context);
    if (this._subcollections && this._subcollections[i]) {
      this._subcollections[i].setContext(this._context);
      this._subcollections[i].setScale(this._scale);
      this._subcollections[i]._reflowChildren(space);
    }
  }
});

B.LineCollection.method('_realignChildren', function() {
  for (var i = 0; i < this._items.length; i++) {
    var position = this._transformer.transform(this._values[i]);

    if (this._direction === B.Direction.up || this._direction === B.Direction.down) {

      if (this._direction === B.Direction.up)
        position = 1 - position;

      this._items[i].setX1(this.getInnerLeft());
      this._items[i].setY1(this._scale.y(position));
      this._items[i].setX2(this.getInnerLeft() + this.getInnerWidth());
      this._items[i].setY2(this._scale.y(position));
    }
    else {
      if (this._direction === B.Direction.left)
        position = 1 - position;

      this._items[i].setX1(this._scale.x(position));
      this._items[i].setY1(this.getInnerTop());
      this._items[i].setX2(this._scale.x(position));
      this._items[i].setY2(this.getInnerTop() + this.getInnerHeight());
    }

    if (this._subcollections && this._subcollections[i]) {
      this._subcollections[i].setHAlign(this._hAlign);
      this._subcollections[i].setVAlign(this._vAlign);
      this._subcollections[i].setDirection(this._direction);
      this._subcollections[i]._realignChildren();
    }
  }
});

B.LineCollection.method('reflow', function(space) {
  this.setPadding(0);
  B.LineCollection.base.reflow.apply(this, arguments);
});
//endregion
//region src/ui/bubblechart/plot/labelcollection.js
/**
 * @class B.LineCollection ControlCollection modification for B.Label.
 */
B.LabelCollection = cls('B.LabelCollection', B.ControlCollection);

B.LabelCollection.property('class', {value: B.Label, get: true});

B.LabelCollection.method('_applyValue', function(item, value) {
  item.setText(value.toFixed(2));//TODO add number formatting into labels
});

B.LabelCollection.method('_hideOverlappingChildren', function(left, right) {
  for (var i = 0; i < this._items.length; i++) {
    if (this._items[i].getLeft() < left || this._items[i].getLeft() + this._items[i].getWidth() > right)
      this._items[i].setVisible(false);
    else {
      this._items[i].setVisible(true);
      left = this._items[i].getLeft() + this._items[i].getWidth();
    }
  }
  for (i = 0; i < this._items.length - 1; i++) {
    if (this._subcollections && this._subcollections[i]) {
      if (this._items[i].getVisible() && this._items[i + 1].getVisible()) {
        this._subcollections[i]._hideOverlappingChildren(this._items[i].getRight(), this._items[i + 1].getLeft());
      }
      else {
        this._subcollections[i]._hideOverlappingChildren(1, -1);//TODO use subcollection Visible instead
      }
    }
  }
});

B.LabelCollection.method('reflow', function() {
  B.LabelCollection.base.reflow.apply(this, arguments);

  if (this._items && this._direction === B.Direction.right) {
    var first = this._items[0], last = this._items[this._items.length - 1];
    if (first.getRight() > this.getInnerLeft())
      first.setLeft(Math.max(first.getLeft(), this.getInnerLeft()));
    if (last.getRight() < this.getInnerRight())
      last.setRight(Math.min(last.getRight(), this.getInnerRight()));
    this._hideOverlappingChildren(-Infinity, Infinity);
  }
});
//endregion
//region src/ui/bubblechart/plot/axis.js
/**
 * @class B.Axis Parts of a plot in one dimension.
 */
B.Axis = cls('B.Axis', B.Control);

/**
 * @property {B.Label} Axis title, rendered outside of actual plot.
 */
B.Axis.property('title', {value: null, get: true, set: true, type: B.Label});
/**
 * @property {B.LineCollection} Grid lines.
 */
B.Axis.property('grid', {value: null, get: true, set: true, type: B.LineCollection});
/**
 * @property {B.LabelCollection} Grid labels, rendered outside of actual plot.
 */
B.Axis.property('labels', {value: null, get: true, set: true, type: B.LabelCollection});

B.Axis.method('reflow', function(space) {
  if (this._assertReflow())
    return;

  B.Axis.base.reflow.apply(this, arguments);
  if (this._grid) {
    this._grid.setContext(this._context);
    this._grid.setHAlign(B.HAlign.fit);
    this._grid.setVAlign(B.VAlign.fit);
    this._grid.reflow(space);
  }
});

B.Axis.method('repaint', function() {
  if (this._assertRepaint())
    return;

  if (this._grid)
    this._grid.repaint();
});
//endregion
//region src/ui/bubblechart/plot/plot.js
/**
 * @class Plot area.
 */
B.Plot = cls('B.Plot', B.Control, function(options) {
  evt(this, 'scaleChange');
  B.Plot.base.constructor.apply(this, arguments);
  this._scale = new B.Scale();
});

/**
 * @property {B.Axis} x X-axis.
 */
B.Plot.property('x', {value: null, get: true, set: true, type: B.Axis});
/**
 * @property {B.Axis} y Y-axis.
 */
B.Plot.property('y', {value: null, get: true, set: true, type: B.Axis});

B.Plot.property('scale', {get: true});

B.Plot.method('_onMouseWheel', function(event) {
  var delta = (Utils.isFF ? -event.native.detail : event.native.wheelDelta) > 0 ? 0.1 : -0.1;
  this._scale.scaleBy(delta, event.x, event.y);
  this.scaleChange.invoke(this);
});

B.Plot.property('_previousDragEvent');
B.Plot.method('_onMouseDown', function(event) {
  this._previousDragEvent = event;
  this._capture = true;
});

B.Plot.method('_onMouseMove', function(event) {
  if (this._previousDragEvent) {
    this._scale.moveBy(event.x - this._previousDragEvent.x, event.y - this._previousDragEvent.y);
    this._previousDragEvent = event;
    this.scaleChange.invoke(this);
  }
});

B.Plot.method('_onMouseUp', function(event) {
  this._previousDragEvent = null;
  this._capture = false;
});

B.Plot.method('reflow', function(space) {
  if (this._assertReflow())
    return;

  if (this._x && this._y && this._x.getGrid() && this._y.getGrid())
    this._x.getGrid().synchronize(this._y.getGrid());

  B.Plot.base.reflow.apply(this, arguments);

  var rect = new B.Rect({
    left: this.getInnerLeft(),
    top: this.getInnerTop(),
    width: this.getInnerWidth(),
    height: this.getInnerHeight()
  });

  if (this._x) {
    this._x.setContext(this._context);
    this._x.setHAlign(B.HAlign.fit);
    this._x.setVAlign(B.VAlign.fit);
    this._x.reflow(rect);
  }

  if (this._y) {
    this._y.setContext(this._context);
    this._y.setHAlign(B.HAlign.fit);
    this._y.setVAlign(B.VAlign.fit);
    this._y.reflow(rect);
  }
});

B.Plot.method('repaint', function() {
  if (this._assertRepaint())
    return;

  B.Plot.base.repaint.apply(this, arguments);

  this._clip();
  if (this._x)
    this._x.repaint();
  if (this._y)
    this._y.repaint();

  this._unclip();
});
//endregion
//region src/ui/bubblechart/legend/bubblelabel.js
/**
 * @class B.BubbleLabel Bubble with label.
 * @type {Function}
 */
B.BubbleLabel = cls('B.BubbleLabel', B.Control, function(options) {
  B.BubbleLabel.base.constructor.apply(this, arguments);
  this._bubble = new B.Bubble();
  this._label = new B.Label();
});

B.BubbleLabel.property('bubble');
B.BubbleLabel.property('label');

/**
 * @property {String} text Text of a label.
 */
B.BubbleLabel.property('text', {get: true, set: true});
/**
 * @property {B.Font} font Font of a label.
 */
B.BubbleLabel.property('font', {get: true, set: true, type: B.Font});
/**
 * @property {number} radius Radius of a bubble.
 */
B.BubbleLabel.property('radius', {value: 8, get: true, set: true});
/**
 * @property {B.Color} color Color of a bubble.
 */
B.BubbleLabel.property('color', {value: '#888888', get: true, set: true, type: B.Color});

B.BubbleLabel.method('reflow', function(space) {
  if (this._assertReflow(!this._text ||!this._radius))
    return;

  this._label.setContext(this._context);
  this._label.setHAlign(B.HAlign.auto);
  this._label.setVAlign(B.VAlign.auto);
  this._label.setText(this._text);
  this._label.setFont(this._font);
  this._label.reflow(space);

  this._bubble.setContext(this._context);

  var width = this._radius * 2 + this._label.getWidth();
  if (this._hAlign !== B.HAlign.none) {

    this._width = width;
    this._width = this._width - this.getInnerWidth() + width;
  }

  var height = Math.max(this._radius * 2, this._label.getHeight());
  if (this._vAlign !== B.VAlign.none) {

    this._height = height;
    this._height = this._height - this.getInnerHeight() + height;
  }

  B.BubbleLabel.base.reflow.apply(this, arguments);

  this._bubble.setX(this.getInnerLeft() + this.getInnerWidth() / 2 - width / 2 + this._radius);
  this._bubble.setY(this.getInnerTop() + this.getInnerHeight() / 2);
  this._bubble.setR(this._radius);
  this._bubble.setColor(this._color);
  this._bubble.skip();

  this._label.setLeft(this.getInnerLeft() + this.getInnerWidth() / 2 - width / 2 + this._radius * 2);
  this._label.setTop(this.getInnerTop() + this.getInnerHeight() / 2 - this._label.getHeight() / 2);
});

B.BubbleLabel.method('repaint', function() {
  if (this._assertRepaint(!this._text ||!this._radius))
    return;
  B.BubbleLabel.base.repaint.apply(this, arguments);
  this._bubble.repaint();
  this._label.repaint();
});
//endregion
//region src/ui/bubblechart/legend/legend.js
/**
 * @class Legend.
 */
B.Legend = cls('B.Legend', B.Control, function() {
  B.Legend.base.constructor.apply(this, arguments);
  this._contItem = new B.BubbleLabel({radius: 0, text: '...'});
});

B.Legend.property('rows');
B.Legend.property('contItem');

/**
 * @property {B.Label} title Title to show on top of a legend.
 */
B.Legend.property('title', {value: null, get: true, set: true, type: B.Label});
/**
 * @property {B.BubbleLabel[]} items Items to show.
 */
B.Legend.property('items', {
  value: null, get: true, set: function(value) {
    if (value === this._items)
      return;
    this._items = [];
    if (value) {
      for (var i = 0; i < value.length; i++)
        this._items.push(new B.BubbleLabel(value[i]));
    }
  }
});

B.Legend.property('font', {value: null, get: true, set: true, type: B.Font});

B.Legend.method('reflow', function(space) {
  if (this._assertReflow(!this._items || !this._items.length))
    return;

  for (var i = 0; i < this._items.length; i++) {
    this._items[i].setContext(this._context);
    this._items[i].setHAlign(B.HAlign.auto);
    this._items[i].setVAlign(B.VAlign.auto);
    this._items[i].setFont(this._font);
    this._items[i].reflow(space);
  }
  this._contItem.setContext(this._context);
  this._contItem.setHAlign(B.HAlign.auto);
  this._contItem.setVAlign(B.VAlign.auto);
  this._contItem.setFont(this._font);
  this._contItem.reflow(space);

  if (this._hAlign !== B.HAlign.none)
    this._width = space.getWidth();
  if (this._vAlign !== B.VAlign.none)
    this._height = space.getHeight();

  var width = 0, height = 0, rows = [], row = {
    items: [],
    width: 0,
    height: 0
  };

  var reached = false;
  for (i = 0; i < this._items.length; i++) {
    if (row.width + this._items[i].getWidth() <= this.getInnerWidth()) {
      row.items.push(this._items[i]);
      row.width += this._items[i].getWidth();
      row.height = Math.max(row.height, this._items[i].getHeight());
    }
    else if (height + row.height <= this.getInnerHeight()) {
      height += row.height;
      width = Math.max(row.width, width);
      rows.push(row);
      row = {
        items: [],
        width: 0,
        height: 0
      };
      i--;
    }
    else {
      if (rows.length && rows[rows.length - 1].items.length)
        rows[rows.length - 1].items[rows[rows.length - 1].items.length - 1] = this._contItem;
      row = null;
      break;
    }
  }
  if (row) {
    height += row.height;
    width = Math.max(row.width, width);
    rows.push(row);
  }

  if (this._title) {
    this._title.setContext(this._context);
    this._title.setHAlign(B.HAlign.auto);
    this._title.setVAlign(B.HAlign.auto);
    this._title.reflow(space);
    width = Math.max(width, this._title.getWidth());
    height += this._title.getHeight();
  }

  if (this._hAlign !== B.HAlign.none) {
    this._width = width;
    this._width = this._width - this.getInnerWidth() + width;
  }
  if (this._vAlign !== B.VAlign.none) {
    this._height = height;
    this._height = this._height - this.getInnerHeight() + height;
  }

  B.Legend.base.reflow.apply(this, arguments);

  var top = this.getInnerTop() + this.getInnerHeight() / 2 - height / 2;
  if (this._title) {
    this._title.setLeft(this.getInnerLeft() + this.getInnerWidth() / 2 - this._title.getWidth() / 2);
    this._title.setTop(top);
    top += this._title.getHeight();
    height -= this._title.getHeight();
  }

  var y = 0;
  for (i = 0; i < rows.length; i++) {
    var x = 0;
    for (var j = 0; j < rows[i].items.length; j++) {
      rows[i].items[j].setLeft(this.getInnerLeft() + this.getInnerWidth() / 2 - rows[i].width / 2 + x);
      rows[i].items[j].setTop(top + y + rows[i].height / 2 - rows[i].items[j].getHeight() / 2);
      rows[i].items[j].reflow(space);//TODO add content coordinates update to BubbleLabel so full reflow could not be necessary
      x += rows[i].items[j].getWidth();

    }
    y += rows[i].height;
  }

  this._rows = rows;
});

B.Legend.method('repaint', function() {
  if (this._assertRepaint(!this._items || !this._items.length))
    return;
  B.Legend.base.repaint.apply(this, arguments);
  if (this._title)
    this._title.repaint();
  for (var i = 0; i < this._rows.length; i++)
    for (var j = 0; j < this._rows[i].items.length; j++)
      this._rows[i].items[j].repaint();
});
//endregion
//region src/ui/bubblechart/legend/valuelegend.js
/**
 * @class B.ValueLegend Autofilling legend to show some dimension scale.
 * @type {Function}
 */
B.ValueLegend = cls('B.ValueLegend', B.Legend);

/**
 * @property {B.Transformer} transformer Transformer to get range and transform values.
 */
B.ValueLegend.property('transformer', {value: null, get: true, set: true, type: B.Transformer});
/**
 * @property {number} count Count of interpolated items.
 */
B.ValueLegend.property('count', {value: 3, get: true, set: true});

B.ValueLegend.method('_recreate', function() {
  if (!this._visible || !this._context || !this._transformer)
    return;

  var min = this._transformer.getMinItem();
  var max = this._transformer.getMaxItem();


  if (this._items && this._items.length === this._count &&
    this._items[0].getText() === min.toFixed(2) && this._items[this._items.length - 1].getText() === max.toFixed(2))
    return;

  this._items = [];
  if (Utils.Types.isNumber(min) && Utils.Types.isNumber(max)) {

    for (var i = 0; i < this._count; i++) {
      var value = min + i * (max - min) / (this._count - 1),
        tValue = this._transformer.transform(value);
      var options = {
        text: value.toFixed(2)//TODO move formatting into label
      };
      if (Utils.Types.isString(tValue))
        options.color = tValue;
      else
        options.radius = tValue * 50;//TODO get this constant from chart somehow

      this._items.push(new B.BubbleLabel(options));
    }

  }

  var noptions = {text: 'no data'};
  var nValue = this._transformer.transform(null);
  if (Utils.Types.isString(tValue))
    noptions.color = nValue;
  else
    noptions.radius = nValue * 50;

  this._items.push(new B.BubbleLabel(noptions));

});

B.ValueLegend.method('reflow', function(space) {
  if (this._title && this._transformer)
    this._title.setText(this._transformer.name());
  this._recreate();

  B.ValueLegend.base.reflow.apply(this, arguments);
});
//endregion
//region src/ui/bubblechart/slider/slider.js
/**
 * @class B.Slider Slider to travel between slices in one of data dimensions.
 */
B.Slider = cls('B.Slider', B.Control, function(options) {
  evt(this, 'positionChange');
  B.Slider.base.constructor.apply(this, arguments);
});

B.Slider.property('_buttonHovered', {value: false});
B.Slider.property('_sliderHovered', {value: false});
B.Slider.property('_sliderDragged', {value: false});

B.Slider.property('_sliderAnimated', {value: false});
B.Slider.property('_sliderAnimatedPrevTime', {value: null});

B.Slider.method('_startPadding', function() {
  if (this._ticks && this._ticks[0])
    return Math.max(9, this._ticks[0].getWidth() / 2);
  return 9;
});

B.Slider.method('_endPadding', function() {
  if (this._ticks && this._ticks[this._ticks.length - 1])
    return Math.max(9, this._ticks[this._ticks.length - 1].getWidth() / 2);
  return 9;
});

B.Slider.method('_onMouseDown', function(args) {
  var start = this.getInnerLeft() + 32 + this._padding.getLeft();
  var length = this.getInnerLeft() + this.getInnerWidth() - start;
  var st = this.getInnerTop() + 16.5;
  this._sliderDragged = args.x >= start && args.x <= start + length && args.y >= st - 9 && args.y <= st + 9;
  if (this._sliderDragged) {
    this._capture = true;
    this._sliderAnimated = false;
    this._onMouseMove(args);
  }
});

B.Slider.method('_onMouseMove', function(args) {

  var start = this.getInnerLeft() + 32 + this._padding.getLeft() + this._startPadding();
  var length = this.getInnerLeft() + this.getInnerWidth() - start - this._endPadding();

  if (!this._sliderDragged) {

    var sl = start + length * this._position;
    var st = this.getInnerTop() + 16.5;
    var capture = false, changed = false;
    if (args.x >= this.getInnerLeft() && args.x <= this.getInnerLeft() + 32 && args.y >= this.getInnerTop() && args.y <= this.getInnerTop() + 32)
      changed = changed || (this._buttonHovered !== (capture = this._buttonHovered = true));
    else
      changed = changed || (this._buttonHovered !== (capture = this._buttonHovered = false));
    changed = changed || (this._sliderHovered !== (capture = capture || ( this._sliderHovered = args.x >= sl - 9 && args.x <= sl + 9 && args.y >= st - 9 && args.y <= st + 9)));
    this._capture = capture;
    if (changed)
      this.positionChange.invoke(this, {
        position: this._position,
        animation: this._sliderAnimated
      });
  }
  else {
    this._position = Utils.Number.normalize((args.x - start) / length);
    if (this.offset() < 0.03)
      this._position = Math.floor((this._position * (this._ticks.length - 1))) / (this._ticks.length - 1);
    if (this.offset() > 0.97)
      this._position = Math.ceil((this._position * (this._ticks.length - 1))) / (this._ticks.length - 1);

    this.positionChange.invoke(this, {
      position: this._position,
      animation: this._sliderAnimated
    });
  }
});

B.Slider.method('_onMouseUp', function(args) {
  if (this._buttonHovered && !this._sliderDragged) {
    this._sliderAnimated = !this._sliderAnimated;
    if (this._sliderAnimated && this._position === 1)
      this._position = 0;
    this._sliderAnimatedPrevTime = new Date();
    this.positionChange.invoke(this, {
      position: this._position,
      animation: this._sliderAnimated
    });
  }
  this._sliderDragged = false;
  this._capture = this._buttonHovered || this._sliderHovered;
});

B.Slider.method('_onAnimationFrame', function(args) {
  if (this._sliderAnimated) {
    var time = new Date();
    var delta = (time - this._sliderAnimatedPrevTime) * this._speed / 1000 / (this._ticks.length - 1);
    this._position = Utils.Number.normalize(this._position + delta);
    if (this._position === 1)
      this._sliderAnimated = false;
    this._sliderAnimatedPrevTime = time;
    this.positionChange.invoke(this, {
      position: this._position,
      animation: this._sliderAnimated
    });
  }
});

/**
 * @property {number} position Position between slices. 0 - first slice, 1 - last slice, all intermediate values are supported.
 */
B.Slider.property('position', {
  value: 0, get: true, set: function(value) {
    this._position = value;
    this.positionChange.invoke(this, {
      position: this._position,
      animation: this._sliderAnimated
    });
  }
});
B.Slider.property('ticks', {
  value: null, get: true, set: function(value) {
    if (this._ticks === value)
      return;
    this._ticks = [];
    if (value) {
      for (var i = 0; i < value.length; i++)
        this._ticks.push(new B.SliderTick(value[i]));
    }
  }
});
/**
 * @property {number} speed Animation speed, ticks per second.
 */
B.Slider.property('speed', {value: 1, get: true, set: true});

/**
 * @method Get path of closest tick before current position.
 */
B.Slider.method('floor', function() {
  return this._ticks[Math.floor(this._position * (this._ticks.length - 1))].getPath();
});

/**
 * @method Get position between two closest ticks from 0 to 1.
 */
B.Slider.method('offset', function() {
  return this._position * (this._ticks.length - 1) - Math.floor((this._position * (this._ticks.length - 1)));
});

/**
 * @method Get path of closest tick after current position.
 */
B.Slider.method('ceil', function() {
  return this._ticks[Math.ceil(this._position * (this._ticks.length - 1))].getPath();
});

B.Slider.method('reflow', function(space) {
  if (this._assertReflow(!this._ticks || this._ticks.length < 2))
    return;

  var height = 0;
  for (var i = 0; i < this._ticks.length; i++) {
    this._ticks[i].setContext(this._context);
    this._ticks[i].setHAlign(B.HAlign.auto);
    this._ticks[i].setVAlign(B.VAlign.auto);
    this._ticks[i].reflow(space);
    height = Math.max(height, this._ticks[i].getHeight());
  }
  if (this._vAlign !== B.VAlign.none) {
    this._height = Math.max(16 + 5 + height, 32);
    this._height = this._height - this.getInnerHeight() + this._height;
  }

  B.Slider.base.reflow.apply(this, arguments);

  var start = this.getInnerLeft() + 32 + this._padding.getLeft() + this._startPadding();//TODO extract magic numbers to properties, maybe constant
  var length = this.getInnerLeft() + this.getInnerWidth() - start - this._endPadding();
  for (i = 0; i < this._ticks.length; i++) {
    this._ticks[i].setLeft(start + i * length / (this._ticks.length - 1) - this._ticks[i].getWidth() / 2);
    this._ticks[i].setTop(this.getInnerTop() + 16 + 9);
  }

});

B.Slider.method('repaint', function() {
  if (this._assertRepaint(!this._ticks || this._ticks.length < 2))
    return;

  this._context.fillStyle = this._buttonHovered ? '#888888' : '#BBBBBB';

  this._context.beginPath(); //TODO extract to Button class
  if (!this._sliderAnimated) {
    this._context.moveTo(this.getInnerLeft(), this.getInnerTop());
    this._context.lineTo(this.getInnerLeft() + 32, this.getInnerTop() + 16);
    this._context.lineTo(this.getInnerLeft(), this.getInnerTop() + 32);
    this._context.closePath();
  }
  else {
    this._context.moveTo(this.getInnerLeft(), this.getInnerTop());
    this._context.lineTo(this.getInnerLeft(), this.getInnerTop() + 32);
    this._context.lineTo(this.getInnerLeft() + 10, this.getInnerTop() + 32);
    this._context.lineTo(this.getInnerLeft() + 10, this.getInnerTop());
    this._context.lineTo(this.getInnerLeft(), this.getInnerTop());

    this._context.moveTo(this.getInnerLeft() + 22, this.getInnerTop());
    this._context.lineTo(this.getInnerLeft() + 22, this.getInnerTop() + 32);
    this._context.lineTo(this.getInnerLeft() + 32, this.getInnerTop() + 32);
    this._context.lineTo(this.getInnerLeft() + 32, this.getInnerTop());
    this._context.lineTo(this.getInnerLeft() + 22, this.getInnerTop());
  }
  this._context.fill();


  this._context.fillStyle = '#BBBBBB';

  var start = this.getInnerLeft() + 32 + this._padding.getLeft();
  var length = this.getInnerLeft() + this.getInnerWidth() - start;

  this._context.fillRect(start, this.getInnerTop() + 16 - 2, length, 5);

  start += this._startPadding();
  length -= this._startPadding() + this._endPadding();

  for (var i = 0; i < this._ticks.length; i++) {
    this._context.fillStyle = '#BBBBBB';
    this._context.beginPath(); //TODO draw as single path
    this._context.arc(start + i * length / (this._ticks.length - 1), this.getInnerTop() + 16.5, 5, 0, Math.PI * 2);
    this._context.fill();
    this._ticks[i].repaint();
  }

  this._context.fillStyle = this._context.strokeStyle = this._sliderHovered ? '#888888' : '#BBBBBB';
  this._context.lineWidth = 2;
  this._context.globalAlpha = 0.5;
  this._context.beginPath();
  this._context.arc(start + length * this._position, this.getInnerTop() + 16.5, 9 + 1, 0, Math.PI * 2);
  this._context.fill();
  this._context.globalAlpha = 1;
  this._context.stroke();

  this._context.fillStyle = this._context.strokeStyle = '#888888';
  this._context.beginPath();
  this._context.arc(start + length * this._position, this.getInnerTop() + 16.5, 2, 0, Math.PI * 2);
  this._context.fill();


});
//endregion
//region src/ui/bubblechart/slider/slidertick.js
/**
 * @class B.SliderTick Slider tick.
 */

B.SliderTick = cls('B.SliderTick', B.Label);

/**
 * @property {String[]} path Path to slice with which tick is associated.
 */
B.SliderTick.property('path', {value: null, get: true, set: true});

//TODO add automatic text setup depending on data
//endregion
//region src/ui/bubblechart/chart.js
B.Chart = cls('B.Chart', B.Control, function(options) {
  delegate(this, '_onSliderPositionChange');
  delegate(this, '_onPlotScaleChange');
  delegate(this, '_onBubbleHover');
  delegate(this, '_onBubbleStateChange');
  delegate(this, '_onChildInvalidated');
  B.Chart.base.constructor.apply(this, arguments);
});

/**
 * @property {B.Color[]} Default colors of bubbles if no color transformer provided.
 */
B.Chart.property('palette', {
  value: [
    '#82BAB6', '#B1CA40', '#EBAF36', '#60A1FA', '#FF462C',
    '#933DA8', '#FFD900', '#FF9191', '#6BBC80', '#A0CBC8',
    '#C3D66C', '#EFC164', '#86B7FB', '#FF705B', '#AC6BBC',
    '#FFE23D', '#FFABAB', '#8ECC9E', '#B7D7D5', '#D2E090',
    '#F3D08B', '#A3C8FC', '#FF9384', '#C08ECC', '#FFE86A',
    '#FFBFBF', '#A9D8B5', '#CDE3E2', '#DFE9B2', '#F7DFAF',
    '#C0D9FD', '#FFB6AC', '#E9D8ED', '#FFEF99', '#FFD3D3'
  ],
  get: true,
  set: true
});

B.Chart.property('context', {
  value: null, get: true, set: function(value) {
    if (this._context)
      this._unbindNative(this._context.canvas);
    this._context = value;
    if (this._context)
      this._bindNative(this._context.canvas);
  }
});

B.Chart.property('data', {value: null, get: true, set: true, type: B.Data});
B.Chart.property('xTransformer', {value: null, get: true, set: true, type: B.Transformer});
B.Chart.property('yTransformer', {value: null, get: true, set: true, type: B.Transformer});
B.Chart.property('rTransformer', {value: null, get: true, set: true, type: B.Transformer});
B.Chart.property('cTransformer', {value: null, get: true, set: true, type: B.ColorTransformer});

/**
 * @property {B.Bubble[]} Bubbles to show on the plot.
 */
B.Chart.property('bubbles', {
  value: null, get: true, set: function(value) {
    this._hoveredBubble = null;

    if (this._bubbles !== value) {
      var i;


      if (value) {
        for (i = 0; i < value.length; i++) {
          var newBubble = value[i],
            oldBubble = null,
            id = newBubble.path[0];

          if (this._bubbles && id) {
            for (var j = 0; j < this._bubbles.length && !oldBubble; j++)
              if (this._bubbles[j].getPath()[0] === id)
                oldBubble = this._bubbles[j];
          }

          if (oldBubble) {
            oldBubble.update(newBubble);
            value[i] = newBubble = oldBubble;
          }
          else {
            value[i] = newBubble = new B.Bubble(newBubble);
            newBubble.hover.add(this._onBubbleHover);
            newBubble.invalidated.add(this._onChildInvalidated);
            newBubble.stateChange.add(this._onBubbleStateChange);
          }
        }
      }

      var queue = [];
      if (this._bubbles) {
        for (i = 0; i < this._bubbles.length; i++) {
          if (value.indexOf(this._bubbles[i]) === -1) {
            queue.push(this._bubbles[i]);
            this._bubbles[i].setState(B.Bubble.States.disappearing);
          }
          else {
            queue.unshift(i, 0);
            value.splice.apply(value, queue);
            queue = [];
          }
        }
        if (queue.length)
          value = value.concat(queue);
      }

      this._bubbles = value;
    }
  }
});

B.Chart.property('title', {value: null, get: true, set: true, type: B.Label});
B.Chart.property('plot', {
  value: null, get: true, set: function(value) {
    if (this._plot !== value) {
      if (this._plot)
        this._plot.scaleChange.remove(this._onPlotScaleChange);
      if (!(value instanceof B.Plot))
        value = new B.Plot(value);
      this._plot = value;
      if (this._plot)
        this._plot.scaleChange.add(this._onPlotScaleChange);
    }

  }, type: B.Plot
});
B.Chart.property('slider', {
  value: null, get: true, set: function(value) {
    if (this._slider)
      this._slider.positionChange.remove(this._onSliderPositionChange);
    if (!(value instanceof  B.Slider))
      value = new B.Slider(value);
    this._slider = value;
    if (this._slider)
      this._slider.positionChange.add(this._onSliderPositionChange)
  }, type: B.Slider
});
B.Chart.property('bubblesLegend', {value: null, get: true, set: true, type: B.Legend});
B.Chart.property('colorLegend', {value: null, get: true, set: true, type: B.ValueLegend});
B.Chart.property('radiusLegend', {value: null, get: true, set: true, type: B.ValueLegend});
B.Chart.property('tooltip', {value: null, get: true, set: true, type: B.Tooltip});

B.Chart.method('_onSliderPositionChange', function(sender, args) {
  this._updateData(args.animation);
  this.repaint();
});

B.Chart.method('_onPlotScaleChange', function(sender, args) {
  this._plot.reflow(this._plot.getOuterRect());

  var labels;

  if (this._plot && this._plot.getX() && (labels = this._plot.getX().getLabels()))
    labels.reflow(labels.getOuterRect(), true);

  if (this._plot && this._plot.getY() && (labels = this._plot.getY().getLabels()))
    labels.reflow(labels.getOuterRect(), true);

  this._updateData(true);
  this.repaint();
});

B.Chart.method('_onBubbleHover', function(sender, args) {
  if ((sender !== this._hoveredBubble || !args.hover) && !args.cancel) {
    this._hoveredBubble = args.hover ? sender : null;
    this._reflowTooltip();
    this.invalidate(false, true);
  }
});

B.Chart.method('_onBubbleStateChange', function(sender, args) {
  if (sender.getState() === B.Bubble.States.disappeared) {
    var i = this._bubbles.indexOf(sender);
    this._bubbles[i].hover.remove(this._onBubbleHover);
    this._bubbles[i].invalidated.remove(this._onChildInvalidated);
    this._bubbles[i].stateChange.remove(this._onBubbleStateChange);
    this._bubbles.splice(i, 1);
  }
});

B.Chart.method('_onChildInvalidated', function(sender, args) {
  this.invalidate(false, true);
});

B.Chart.method('_handle', function(args) {
  if (this._invalidateArgs)
    this._invalidate();

  if (this._bubbles)
    for (var i = this._bubbles.length - 1; i >= 0; i--)
      this._bubbles[i]._handle(args);

  if (this._plot)
    this._plot._handle(args);
  if (this._slider)
    this._slider._handle(args);

  this._invalidate(args.reflow, args.repaint);
});

B.Chart.method('_updateData', function(isAnimation) {
  if (!this._plot)
    return;

  var bubbles = this._bubbles.filter(function(bubble) {
    return bubble.getState() !== B.Bubble.States.disappearing
  });

  var sliderF = this._slider.floor();
  var sliderO = this._slider.offset();
  var sliderC = this._slider.ceil();
  var scale = this._plot.getScale();
  for (var i = 0; i < bubbles.length; i++) {
    var bubble = bubbles[i],
      pathF = bubble.getPath().concat(sliderF),
      pathC = bubble.getPath().concat(sliderC);

    bubble.setContext(this._context);

    if (this._xTransformer)
      bubble.setX(scale.x(this._xTransformer.transformedItem(pathF, pathC, sliderO)));

    if (this._yTransformer)
      bubble.setY(scale.y(1 - this._yTransformer.transformedItem(pathF, pathC, sliderO)));

    if (!isAnimation && bubble.getState() === B.Bubble.States.waiting)
      bubble.skip();

    if (this._rTransformer)
      bubble.setR(50 * this._rTransformer.transformedItem(pathF, pathC, sliderO));

    if (this._cTransformer && this._cTransformer.getPath())
      bubble.setColor(this._cTransformer.transformedItem(pathF, pathC, sliderO));
    else
      bubble.setColor(this._palette[i % this._palette.length]);

    if (isAnimation)
      bubble.skip();
  }

  bubbles = this._bubbles.filter(function(bubble) {
    return bubble.getState() === B.Bubble.States.disappearing
  });

  for (i = 0; i < bubbles.length; i++) {
    bubbles[i].setContext(this._context);
    bubbles[i].setR(0);
    if (isAnimation)
      bubble.skip();
  }
});

B.Chart.property('_hoveredBubble');
B.Chart.method('_reflowTooltip', function() {
  if (!this._plot || !this._tooltip)
    return;
  if (this._hoveredBubble) {
    var sliderF = this._slider.floor();
    var sliderO = this._slider.offset();
    var sliderC = this._slider.ceil();
    var pathF = this._hoveredBubble.getPath().concat(sliderF),
      pathC = this._hoveredBubble.getPath().concat(sliderC),
      name = this._data.name([''].concat(this._hoveredBubble.getPath())),
      nameF = this._data.name([''].concat(pathF)),
      nameC = this._data.name([''].concat(pathC));

    var lines = [name + ', ' + (nameF === nameC ? nameF : nameF + ' - ' + nameC)], value;

    if (this._xTransformer && this._xTransformer.name())
      lines.push(this._xTransformer.name() + ': ' + ((value = this._xTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    if (this._yTransformer && this._yTransformer.name())
      lines.push(this._yTransformer.name() + ': ' + ((value = this._yTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    if (this._rTransformer && this._rTransformer.name())
      lines.push(this._rTransformer.name() + ': ' + ((value = this._rTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    if (this._cTransformer && this._cTransformer.name())
      lines.push(this._cTransformer.name() + ': ' + ((value = this._cTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    this._tooltip.setText(Utils.Array.unique(lines).join('\n'));

    this._tooltip.setContext(this._context);
    this._tooltip.setVisible(true);
    this._tooltip.setX(this._hoveredBubble.getX());
    this._tooltip.setY(this._hoveredBubble.getY());
    this._tooltip.setOffset(this._hoveredBubble.getR());
    this._tooltip.getBorder().setColor(this._hoveredBubble.getColor());
    this._tooltip.reflow(this._plot.getInnerRect());
  }
  else
    this._tooltip.setVisible(false);
});

B.Chart.method('reflow', function reflow(space) {
  if (this._assertReflow())
    return;

  if (this._hAlign !== B.HAlign.none) {
    this._left = space.getLeft();
    this._width = space.getWidth();
  }
  if (this._vAlign !== B.VAlign.none) {
    this._top = space.getTop();
    this._height = space.getHeight();
  }

  var innerSpace = new B.Rect({
    left: this.getInnerLeft(),
    top: this.getInnerTop(),
    width: this.getInnerWidth(),
    height: this.getInnerHeight()
  });

  if (this._title) {
    this._title.setContext(this._context);
    this._title.setHAlign(B.HAlign.center);
    this._title.setVAlign(B.VAlign.top);
    this._title.reflow(innerSpace);
    innerSpace.setTop(innerSpace.getTop() + this._title.getHeight());
    innerSpace.setHeight(innerSpace.getHeight() - this._title.getHeight());
  }

  if (this._slider) {
    this._slider.setContext(this._context);
    this._slider.setHAlign(B.HAlign.fit);
    this._slider.setVAlign(B.VAlign.bottom);

    var ticks = this._slider.getTicks();
    for (var i = 0; i < ticks.length; i++)
      ticks[i].setText(this._data.name(['', ''].concat(ticks[i].getPath())));

    this._slider.reflow(innerSpace);
    innerSpace.setHeight(innerSpace.getHeight() - this._slider.getHeight());
  }

  if (this._xTransformer)
    this._xTransformer.setData(this._data);
  if (this._yTransformer)
    this._yTransformer.setData(this._data);
  if (this._rTransformer)
    this._rTransformer.setData(this._data);
  if (this._cTransformer)
    this._cTransformer.setData(this._data);

  var legendSpace = innerSpace.clone(), legendHeight = 0, legendVAlign = B.VAlign.bottom;

  if (this._rTransformer && this._rTransformer.getPath() && this._radiusLegend) {
    this._radiusLegend.setContext(this._context);
    this._radiusLegend.setTransformer(this._rTransformer);
    this._radiusLegend.setHAlign(B.HAlign.right);
    this._radiusLegend.setVAlign(B.VAlign.bottom);
    this._radiusLegend.reflow(legendSpace);
    legendSpace.setTop(this._radiusLegend.getTop());
    legendSpace.setHeight(this._radiusLegend.getHeight());
    legendSpace.setWidth(this._radiusLegend.getLeft() - legendSpace.getLeft());
    legendHeight = Math.max(this._radiusLegend.getHeight(), legendHeight);
    legendVAlign = B.VAlign.top;
  }

  if (this._cTransformer && this._cTransformer.getPath() && this._colorLegend) {
    this._colorLegend.setContext(this._context);
    this._colorLegend.setTransformer(this._cTransformer);
    this._colorLegend.setHAlign(B.HAlign.left);
    this._colorLegend.setVAlign(legendVAlign);
    this._colorLegend.reflow(legendSpace);
    legendHeight = Math.max(this._colorLegend.getHeight(), legendHeight);
  }

  if (!(this._cTransformer && this._cTransformer.getPath()) && this._bubblesLegend && this._plot && this._bubbles) {
    var bubbles = this._bubbles.filter(function(bubble) {
      return bubble.getState() !== B.Bubble.States.disappearing
    }), items = [];
    for (i = 0; i < bubbles.length; i++)
      items.push({
        text: this._data.name([''].concat(bubbles[i].getPath())),
        color: this._palette[i % this._palette.length]
      });

    this._bubblesLegend.setContext(this._context);
    this._bubblesLegend.setItems(items); //TODO do not recreate items each time
    this._bubblesLegend.setHAlign(B.HAlign.left);
    this._bubblesLegend.setVAlign(legendVAlign);
    this._bubblesLegend.reflow(legendSpace);

    legendHeight = Math.max(this._bubblesLegend.getHeight(), legendHeight);
  }

  //TODO current placing algorithm assumes that size legend is much taller than others because of items' bigger radiuses
  //TODO and much narrower because of  their lower count
  //TODO so it places size legend into right bottom corner
  //TODO and limits other legends' space to size legend's height and remaining chart's width
  //TODO but bubbles legend can have many items and require much more height than size legen
  //TODO think about independent size calculation of every legend

  innerSpace.setHeight(innerSpace.getHeight() - legendHeight);

  var title;
  if (this._plot && this._plot.getX() && (title = this._plot.getX().getTitle())) {
    title.setContext(this._context);
    title.setHAlign(B.HAlign.center);
    title.setVAlign(B.VAlign.bottom);
    title.setText(this._xTransformer.name())
    title.reflow(innerSpace);
    innerSpace.setHeight(title.getTop() - innerSpace.getTop());
  }

  if (this._plot && this._plot.getX() && (title = this._plot.getY().getTitle())) {
    title.setContext(this._context);
    title.setHAlign(B.HAlign.left);
    title.setVAlign(B.VAlign.center);
    title.setDirection(B.Direction.up);
    title.setText(this._yTransformer.name());
    title.reflow(innerSpace);
    innerSpace.setLeft(title.getLeft() + title.getWidth());
    innerSpace.setWidth(innerSpace.getWidth() - title.getWidth());
  }

  var labels, labelsBottom = innerSpace.getBottom();
  var scale = this._plot.getScale();
  this._plot.setPadding(0);
  this._plot.update(innerSpace.serialize());
  scale.update(this._plot.getInnerRect().serialize());
  scale.setPadding(50);

  if (this._plot && this._plot.getX() && (labels = this._plot.getX().getLabels())) {
    labels.setContext(this._context);
    labels.setTransformer(this._xTransformer);
    labels.setMin(this._xTransformer.getMinItem()); //TODO move this into collection class.
    labels.setMax(this._xTransformer.getMaxItem());
    labels.setHAlign(B.HAlign.fit);
    labels.setVAlign(B.VAlign.bottom);
    labels.setDirection(B.Direction.right);
    labels.setScale(scale);
    labels.reflow(innerSpace);
    innerSpace.setHeight(labels.getTop() - innerSpace.getTop());
    this._plot.update(innerSpace.serialize());
    scale.update(this._plot.getInnerRect().serialize());
  }

  if (this._plot && this._plot.getY() && (labels = this._plot.getY().getLabels())) {
    labels.setContext(this._context);
    labels.setTransformer(this._yTransformer);
    labels.setMin(this._yTransformer.getMinItem());
    labels.setMax(this._yTransformer.getMaxItem());
    labels.setHAlign(B.HAlign.left);
    labels.setVAlign(B.VAlign.fit);
    labels.setDirection(B.Direction.up);
    labels.setScale(scale);
    labels.reflow(innerSpace);
    innerSpace.setLeft(labels.getLeft() + labels.getWidth());
    innerSpace.setWidth(innerSpace.getWidth() - labels.getWidth());
    this._plot.update(innerSpace.serialize());
    scale.update(this._plot.getInnerRect().serialize());
    if (this._plot && this._plot.getX() && (labels = this._plot.getX().getLabels())) {
      //we have to reflow them again because Y labels have took some innerSpace and width of the plot and therefore width of X labels has changed
      //TODO however some optimizations can be done like flag to reposition the items instead of full reflow
      innerSpace.setHeight(labelsBottom - innerSpace.getTop());
      labels.reflow(innerSpace);
      innerSpace.setHeight(labels.getTop() - innerSpace.getTop());
    }
  }

  //TODO think about moving this code into Plot class
  var grid;
  if (this._plot && this._plot.getX() && (grid = this._plot.getX().getGrid())) {
    grid.setTransformer(this._xTransformer);
    grid.setMin(this._xTransformer.getMinItem());
    grid.setMax(this._xTransformer.getMaxItem());
    grid.setScale(scale);
    grid.setDirection(B.Direction.right);
  }

  if (this._plot && this._plot.getY() && (grid = this._plot.getY().getGrid())) {
    grid.setTransformer(this._yTransformer);
    grid.setMin(this._yTransformer.getMinItem());
    grid.setMax(this._yTransformer.getMaxItem());
    grid.setScale(scale);
    grid.setDirection(B.Direction.up);
  }

  if (this._plot) {
    this._plot.setContext(this._context);
    this._plot.setHAlign(B.HAlign.fit);
    this._plot.setVAlign(B.VAlign.fit);
    this._plot.reflow(innerSpace);
  }

  this._updateData();

  this._reflowTooltip();

  //TODO support user defined alignments

  B.Chart.base.reflow.apply(this, arguments);
});

B.Chart.method('repaint', function repaint() {
  if (this._assertRepaint())
    return;

  this._context.canvas.width = this._context.canvas.width;

  B.Chart.base.repaint.apply(this, arguments);

  if (this._title)
    this._title.repaint();

  if (this._slider)
    this._slider.repaint();

  if (this._rTransformer && this._rTransformer.getPath() && this._radiusLegend)
    this._radiusLegend.repaint();

  if (this._cTransformer && this._cTransformer.getPath() && this._colorLegend)
    this._colorLegend.repaint();

  if (!(this._cTransformer && this._cTransformer.getPath()) && this._bubblesLegend && this._plot && this._bubbles)
    this._bubblesLegend.repaint();

  var title;
  if (this._plot && this._plot.getX() && (title = this._plot.getX().getTitle()))
    title.repaint();

  if (this._plot && this._plot.getY() && (title = this._plot.getY().getTitle()))
    title.repaint();

  var labels;
  if (this._plot && this._plot.getX() && (labels = this._plot.getX().getLabels()))
    labels.repaint();

  if (this._plot && this._plot.getY() && (labels = this._plot.getY().getLabels()))
    labels.repaint();

  //TODO think about moving this code into Plot class

  if (this._plot) {
    this._plot._clip(); //TODO remove cheating, maybe events? however storing bubbles inside plot was worse
    this._plot.repaint();
  }

  if (this._bubbles)
    for (var i = 0; i < this._bubbles.length; i++)
      this._bubbles[i].repaint();

  if (this._tooltip)
    this._tooltip.repaint();

  if (this._plot)
    this._plot._unclip();
});

B.Chart.default = {
  title: {text: 'Title', font: {color: '#888888'}},

  hAlign: B.HAlign.fit,
  vAlign: B.VAlign.fit,

  xTransformer: {},
  yTransformer: {},
  cTransformer: {},
  rTransformer: {min: 0.2, nodata: 0.1},

  bubbles: [],

  plot: {
    border: {
      color: '#BBBBBB',
      Width: 4
    },
    background: '#EEEEEE',
    hAlign: B.HAlign.none,
    vAlign: B.VAlign.none,

    x: {
      title: {text: 'X', font: {color: '#888888'}},
      grid: {
        count: 5,
        options: {
          stroke: {
            color: '#FFFFFF',
            width: 2
          }
        },
        subcollection: {
          count: 5,
          options: {
            stroke: {
              color: '#FFFFFF',
              width: 1
            }
          }
        }
      },
      labels: {
        count: 5,
        options: {font: {color: '#888888'}},
        subcollection: {
          count: 5,
          options: {font: {color: '#888888'}}
        }
      }
    },
    y: {
      title: {text: 'Y', font: {color: '#888888'}},
      grid: {
        count: 5,
        options: {
          stroke: {
            color: '#FFFFFF',
            width: 2
          }
        },
        subcollection: {
          count: 5,
          options: {
            stroke: {
              color: '#FFFFFF',
              width: 1
            }
          }
        }
      },
      labels: {
        count: 5,
        options: {font: {color: '#888888'}},
        subcollection: {
          count: 5,
          options: {font: {color: '#888888'}}
        }
      }
    }
  },
  slider: {},
  colorLegend: {title: {font: {color: '#888888'}}, font: {color: '#888888'}},
  radiusLegend: {title: {font: {color: '#888888'}}, font: {color: '#888888'}},
  bubblesLegend: {title: {text: 'Bubbles', font: {color: '#888888'}}, font: {color: '#888888'}},
  tooltip: {
    font: {color: '#888888'},
    background: 'rgba(255,255,255,0.5)',
    border: {
      width: 1,
      radius: 3
    },
    padding: 0,
    margin: 0
  }
};
//endregion
})();
//# sourceMappingURL=bubblechart.js.map