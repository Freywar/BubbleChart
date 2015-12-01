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
    return this._data && this._data.getNumeric() ? this._data.min(this._path) : -1
  }
});
/**
 * @property {number} maxItem Maximum item in slice.
 */
B.Transformer.property('maxItem', {
  get: function() {
    return this._data && this._data.getNumeric() ? this._data.max(this._path) : 1
  }
});

/**
 * @method Linear interpolation.
 */
B.Transformer.method('_interpolate', function _interpolate(minV, v, maxV, minR, maxR) {
  var dataRange = maxV - minV;
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