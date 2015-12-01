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