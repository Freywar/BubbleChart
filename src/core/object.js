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