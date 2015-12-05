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