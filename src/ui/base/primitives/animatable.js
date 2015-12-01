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