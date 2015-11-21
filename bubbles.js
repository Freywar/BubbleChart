//region B.Data

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

//region B.Transformer

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

//endregion

//region B.ColorTransformer

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

//region B.SliderTick

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

//region B.Slider

/**
 * @class B.Slider Slider to travel between slices in one of data dimensions.
 */
B.Slider = cls('B.Slider', B.Control);

B.Slider.property('_buttonHovered', {value: false});
B.Slider.property('_sliderHovered', {value: false});
B.Slider.property('_sliderDragged', {value: false});

B.Slider.method('_onMouseDown', function(args) {
  var start = this.getInnerLeft() + 32 + this._padding.getLeft() + 9;
  var length = this.getInnerLeft() + this.getInnerWidth() - start - 18;
  var sl = start + length * this._position;
  var st = this.getInnerTop() + 16.5;
  this._sliderDragged = args.x >= sl - 9 && args.x <= sl + 9 && args.y >= st - 9 && args.y <= st + 9;
});

B.Slider.method('_onMouseMove', function(args) {
  var start = this.getInnerLeft() + 32 + this._padding.getLeft() + 9;
  var length = this.getInnerLeft() + this.getInnerWidth() - start - 18;

  if (!this._sliderDragged) {

    var sl = start + length * this._position;
    var st = this.getInnerTop() + 16.5;
    var capture = false;
    if (args.x >= this.getInnerLeft() && args.x <= this.getInnerLeft() + 32 && args.y >= this.getInnerTop() && args.y <= this.getInnerTop() + 32)
      args.repaint = args.repaint || (this._buttonHovered !== (capture = this._buttonHovered = true));
    else
      args.repaint = args.repaint || (this._buttonHovered !== (capture = this._buttonHovered = false));
    args.repaint = args.repaint || (this._sliderHovered !== (capture = capture || ( this._sliderHovered = args.x >= sl - 9 && args.x <= sl + 9 && args.y >= st - 9 && args.y <= st + 9)));
    this._capture = capture;
  }
  else {
    this._position = Utils.Number.normalize((args.x - start) / length);
    if (this.offset() < 0.03)
      this._position = Math.floor((this._position * (this._ticks.length - 1))) / (this._ticks.length - 1);
    if (this.offset() > 0.97)
      this._position = Math.ceil((this._position * (this._ticks.length - 1))) / (this._ticks.length - 1);

    args.repaint = true;
    args.reflow = true;//TODO maybe implement some invokable events mechanism and use it
  }
});

B.Slider.method('_onMouseUp', function(args) {
  this._sliderDragged = false;
});

/**
 * @property {number} position Position between slices. 0 - first slice, 1 - last slice, all intermediate values are supported.
 */
B.Slider.property('position', {value: 0, get: true, set: true});
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

  var start = this.getInnerLeft() + 32 + this._padding.getLeft() + 9;//TODO extract magic numbers to properties, maybe constant
  var length = this.getInnerLeft() + this.getInnerWidth() - start - 18;
  for (i = 0; i < this._ticks.length; i++) {
    this._ticks[i].setLeft(start + i * length / (this._ticks.length - 1) - this._ticks[i].getWidth() / 2);
    this._ticks[i].setTop(this.getInnerTop() + 16 + 9);
  }

});

B.Slider.method('repaint', function() {

  this._context.fillStyle = this._buttonHovered ? '#888888' : '#BBBBBB';

  this._context.beginPath(); //TODO extract to Button class
  this._context.moveTo(this.getInnerLeft(), this.getInnerTop());
  this._context.lineTo(this.getInnerLeft() + 32, this.getInnerTop() + 16);
  this._context.lineTo(this.getInnerLeft(), this.getInnerTop() + 32);
  this._context.closePath();
  this._context.fill();


  this._context.fillStyle = '#BBBBBB';

  var start = this.getInnerLeft() + 32 + this._padding.getLeft();
  var length = this.getInnerLeft() + this.getInnerWidth() - start;

  this._context.fillRect(start, this.getInnerTop() + 16 - 2, length, 5);

  start += 9;
  length -= 18;

  for (i = 0; i < this._ticks.length; i++) {
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

//region B.Line

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

//region B.ControlCollection

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

      this._items[i].setTop(this.getInnerTop() + 50 + (this.getInnerHeight() - 100) * position - this._items[i].getHeight() / 2);
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

      this._items[i].setLeft(this.getInnerLeft() + 50 + (this.getInnerWidth() - 100) * position - this._items[i].getWidth() / 2); //TODO extract this values as scale object
    }
    if (this._subcollections && this._subcollections[i])
      this._subcollections[i]._realignChildren();
  }
});

B.ControlCollection.method('reflow', function(space) {
  if (!this._context || !this._visible)
    return;
  this._reflowChildren(space); //first we have to recursively calculate all items sizes in all subcollections and calculate own size depending on them
  this._reflowSelf(space, true); //then we can apply self alignment and recursively align subcollections with self
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
  this._repaint(0);
});

//endregion

//region B.LineCollection

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
      this._items[i].setY1(this.getInnerTop() + 50 + (this.getInnerHeight() - 100) * position); //TODO move this values to scale object
      this._items[i].setX2(this.getInnerLeft() + this.getInnerWidth());
      this._items[i].setY2(this.getInnerTop() + 50 + (this.getInnerHeight() - 100) * position);
    }
    else {
      if (this._direction === B.Direction.left)
        position = 1 - position;

      this._items[i].setX1(this.getInnerLeft() + 50 + (this.getInnerWidth() - 100) * position);
      this._items[i].setY1(this.getInnerTop());
      this._items[i].setX2(this.getInnerLeft() + 50 + (this.getInnerWidth() - 100) * position);
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

//endregion

//region B.LabelCollection

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
    else
      left = this._items[i].getLeft() + this._items[i].getWidth();
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
  B.LabelCollection.base.reflow.apply(this, arguments)

  if (this._items && this._direction === B.Direction.right) {
    this._items[0].setLeft(Math.max(this._items[0].getLeft(), this.getInnerLeft()));
    this._items[this._items.length - 1].setLeft(Math.min(this._items[this._items.length - 1].getLeft(), this.getInnerLeft() + this.getInnerWidth() - this._items[this._items.length - 1].getWidth()));
    this._hideOverlappingChildren(this.getInnerLeft(), this.getInnerLeft() + this.getInnerWidth());
  }
});

//endregion

//region B.Axis

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
  if (!this._context || !this._visible)
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
  if (!this._context || !this._visible)
    return;
  if (this._grid)
    this._grid.repaint();
});

//endregion

//region B.Bubble

/**
 * @class B.Bubble Bubble.
 */
B.Bubble = cls('B.Bubble', B.Control);

B.Bubble.method('_check', function(x, y) {
  x -= this.getX();
  y -= this.getY();
  return Math.sqrt(x * x + y * y) <= this.getR();
});

B.Bubble.method('_onMouseMove', function(args) {
  var isInside = this._check(args.x, args.y);
  args.repaint = (this._hovered !== (this._hovered = this._capture = (isInside && !args.cancel)));
  args.cancel = args.cancel || isInside;
});

/**
 * @property {String[]} path Path to data slice to which bubble is assigned.
 */
B.Bubble.property('path', {value: null, get: true, set: true});

/**
 * @property {number} x X-coordinate of center. Utilizes Left/Right properties so they form bounding rectangle.
 */
B.Bubble.property('x', {
  get: function() {
    return this._left + this.getR();
  },
  set: function(value) {
    this._left = value - this.getR();
  }
});

/**
 * @property {number} y Y-coordinate of center. Utilizes Left/Right properties so they form bounding rectangle.
 */
B.Bubble.property('y', {
  get: function() {
    return this._top + this.getR();
  },
  set: function(value) {
    this._top = value - this.getR();
  }
});

/**
 * @property {number} r Bubble radius. Utilizes Left/Right properties so they form bounding rectangle.
 */
B.Bubble.property('r', {
  get: function() {
    return this._width / 2;
  },
  set: function(value) {
    var x = this.getX(), y = this.getY();
    this._width = this._height = value * 2;
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

B.Bubble.method('reflow', function() {

});

B.Bubble.method('repaint', function() {
  if (!this._context || !this._visible || !this.getR())
    return;

  this._context.beginPath();
  this._context.arc(this.getX(), this.getY(), this.getR() - this._border.getWidth() / 2, 0, 2 * Math.PI);
  this._context.closePath();

  this._background.add(this._hovered ? -0.2 : 0).apply(this._context);//TODO make hovered effects configurable
  this._context.fill();
  this._border.getColor().add(this._hovered ? -0.2 : 0).apply(this._context);
  this._context.stroke();
});

//endregion

//region B.BubbleLabel

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
  if (!this._context || !this._visible)
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

  this._label.setLeft(this.getInnerLeft() + this.getInnerWidth() / 2 - width / 2 + this._radius * 2);
  this._label.setTop(this.getInnerTop() + this.getInnerHeight() / 2 - this._label.getHeight() / 2);
});

B.BubbleLabel.method('repaint', function() {
  B.BubbleLabel.base.repaint.apply(this, arguments);
  this._bubble.repaint();
  this._label.repaint();
});

//endregion

//region B.Legend

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
  B.Legend.base.repaint.apply(this, arguments);
  if (this._title)
    this._title.repaint();
  for (var i = 0; i < this._rows.length; i++)
    for (var j = 0; j < this._rows[i].items.length; j++)
      this._rows[i].items[j].repaint();
});

//endregion

//region B.ValueLegend

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

  if (!Utils.Types.isNumber(min) || !Utils.Types.isNumber(max)) {
    this._items = null;
    return;
  }

  if (this._items && this._items.length === this._count &&
    this._items[0].getText() === min.toFixed(2) && this._items[this._items.length - 1].getText() === max.toFixed(2))
    return;

  this._items = [];
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
});

B.ValueLegend.method('reflow', function(space) {
  if (this._title && this._transformer)
    this._title.setText(this._transformer.name());
  this._recreate();
  B.ValueLegend.base.reflow.apply(this, arguments);
});

//endregion

//region B.Plot
/**
 * @class Plot area.
 */
B.Plot = cls('B.Plot', B.Control);

/**
 * @property {B.Bubble[]} Bubbles to show on the plot.
 */
B.Plot.property('bubbles', {
  value: null, get: true, set: function(value) {
    if (this._bubbles !== value) {
      this._bubbles = [];
      if (value) {
        for (var i = 0; i < value.length; i++) {
          this._bubbles.push(new B.Bubble(value[i]));
        }
      }
    }
  }
});
/**
 * @property {B.Axis} x X-axis.
 */
B.Plot.property('x', {value: null, get: true, set: true, type: B.Axis});
/**
 * @property {B.Axis} y Y-axis.
 */
B.Plot.property('y', {value: null, get: true, set: true, type: B.Axis});

B.Plot.method('_handle', function(args) {
  if (this._bubbles)
    for (var i = this._bubbles.length - 1; i >= 0; i--)
      this._bubbles[i]._handle(args);
  B.Plot.base._handle.call(this, args);
});

B.Plot.method('reflow', function(space) {
  if (!this._context || !this._visible)
    return;

  this.setPadding(0);

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
  if (!this._context || !this._visible)
    return;
  B.Plot.base.repaint.apply(this, arguments);
  if (this._x)
    this._x.repaint();
  if (this._y)
    this._y.repaint();

  if (this._bubbles)
    for (var i = 0; i < this._bubbles.length; i++)
      this._bubbles[i].repaint();
});

//endregion

//region B.Chart

B.Chart = cls('B.Chart', B.Control, function(options) {
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

B.Chart.property('title', {value: null, get: true, set: true, type: B.Label});
B.Chart.property('plot', {value: null, get: true, set: true, type: B.Plot});
B.Chart.property('slider', {value: null, get: true, set: true, type: B.Slider});
B.Chart.property('bubblesLegend', {value: null, get: true, set: true, type: B.Legend});
B.Chart.property('colorLegend', {value: null, get: true, set: true, type: B.ValueLegend});
B.Chart.property('radiusLegend', {value: null, get: true, set: true, type: B.ValueLegend});
B.Chart.property('tooltip', {value: null, get: true, set: true, type: B.Tooltip});

B.Chart.method('_handle', function(args) {
  if (this._plot)
    this._plot._handle(args);
  if (this._slider)
    this._slider._handle(args);

  if (args.reflow || args.repaint)
    this._reflowTooltip();

  this._invalidate(args.reflow, args.repaint);
});

B.Chart.method('_updateData', function() {
  if (!this._plot)
    return;

  var bubbles = this._plot.getBubbles();
  if (!bubbles)
    return;

  var sliderF = this._slider.floor();
  var sliderO = this._slider.offset();
  var sliderC = this._slider.ceil();
  for (var i = 0; i < bubbles.length; i++) {
    var bubble = bubbles[i],
      pathF = bubble.getPath().concat(sliderF),
      pathC = bubble.getPath().concat(sliderC);

    bubble.setContext(this._context);

    if (this._xTransformer)
      bubble.setX(this._plot.getInnerLeft() + 50 + (this._plot.getInnerWidth() - 100) * this._xTransformer.transformedItem(pathF, pathC, sliderO));

    if (this._yTransformer)
      bubble.setY(this._plot.getInnerTop() + 50 + (this._plot.getInnerHeight() - 100) * (1 - this._yTransformer.transformedItem(pathF, pathC, sliderO)));

    if (this._rTransformer)
      bubble.setR(50 * this._rTransformer.transformedItem(pathF, pathC, sliderO));

    if (this._cTransformer && this._cTransformer.getPath())
      bubble.setColor(this._cTransformer.transformedItem(pathF, pathC, sliderO));
    else
      bubble.setColor(this._palette[i % this._palette.length]);

    //TODO use relative coordinates here and transform them into absolute on Plot reflow
  }
});

B.Chart.property('_hoveredBubble');
B.Chart.method('_reflowTooltip', function() {
  if (!this._plot || !this._tooltip)
    return;

  var hoveredBubble = this._plot.getBubbles().filter(function(b) {
    return b.getHovered()
  })[0];
  if (hoveredBubble && hoveredBubble !== this._hoveredBubble) {

    var bubbles = this._plot.getBubbles();
    if (!bubbles)
      return;

    var sliderF = this._slider.floor();
    var sliderO = this._slider.offset();
    var sliderC = this._slider.ceil();
    var pathF = hoveredBubble.getPath().concat(sliderF),
      pathC = hoveredBubble.getPath().concat(sliderC),
      name = this._data.name([''].concat(hoveredBubble.getPath())),
      nameF = this._data.name([''].concat(pathF)),
      nameC = this._data.name([''].concat(pathC));

    var lines = [name + ', ' + (nameF === nameC ? nameF : nameF + ' - ' + nameC)], value;


    if (this._xTransformer)
      lines.push(this._xTransformer.name() + ': ' + ((value = this._xTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    if (this._yTransformer)
      lines.push(this._yTransformer.name() + ': ' + ((value = this._yTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    if (this._rTransformer)
      lines.push(this._rTransformer.name() + ': ' + ((value = this._rTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    if (this._cTransformer && this._cTransformer.getPath())
      lines.push(this._cTransformer.name() + ': ' + ((value = this._cTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    this._tooltip.setText(Utils.Array.unique(lines).join('\n'));

  }

  this._hoveredBubble = hoveredBubble;

  this._tooltip.setContext(this._context);
  this._tooltip.setVisible(!!hoveredBubble);
  if (hoveredBubble) {
    this._tooltip.setX(hoveredBubble.getX());
    this._tooltip.setY(hoveredBubble.getY());
    this._tooltip.setOffset(hoveredBubble.getR());
    this._tooltip.getBorder().setColor(hoveredBubble.getColor());
  }
  this._tooltip.reflow(this._plot.getInnerRect());
});

B.Chart.method('reflow', function reflow(space) {
  if (!this._context || !this._visible)
    return;

  if (this._hAlign !== B.HAlign.none) {
    this._left = space.getLeft();
    this._width = space.getWidth();
  }
  if (this._vAlign !== B.VAlign.none) {
    this._top = space.getTop();
    this._height = space.getHeight();
  }

  innerSpace = new B.Rect({
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

  if (!(this._cTransformer && this._cTransformer.getPath()) && this._bubblesLegend && this._plot && this._plot.getBubbles()) {
    var bubbles = this._plot.getBubbles(), items = [];
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

  //TODO also think about user-defined alignments for everything except Plot


  innerSpace.setHeight(innerSpace.getHeight() - legendHeight);

  var title;
  if (this._plot && this._plot.getX() && (title = this._plot.getX().getTitle())) {
    title.setContext(this._context);
    title.setHAlign(B.HAlign.center);
    title.setVAlign(B.VAlign.bottom);
    title.setText(this._xTransformer.name() || 'X')
    title.reflow(innerSpace);
    innerSpace.setHeight(title.getTop() - innerSpace.getTop());
  }

  if (this._plot && this._plot.getX() && (title = this._plot.getY().getTitle())) {
    title.setContext(this._context);
    title.setHAlign(B.HAlign.left);
    title.setVAlign(B.VAlign.center);
    title.setDirection(B.Direction.up);
    title.setText(this._yTransformer.name() || 'Y')
    title.reflow(innerSpace);
    innerSpace.setLeft(title.getLeft() + title.getWidth());
    innerSpace.setWidth(innerSpace.getWidth() - title.getWidth());
  }

  var labels, labelsBottom = innerSpace.getBottom();

  if (this._plot && this._plot.getX() && (labels = this._plot.getX().getLabels())) {
    labels.setContext(this._context);
    labels.setTransformer(this._xTransformer);
    labels.setMin(this._xTransformer.getMinItem()); //TODO move this into collection class.
    labels.setMax(this._xTransformer.getMaxItem());
    labels.setHAlign(B.HAlign.fit);
    labels.setVAlign(B.VAlign.bottom);
    labels.setDirection(B.Direction.right);
    labels.reflow(innerSpace);
    innerSpace.setHeight(labels.getTop() - innerSpace.getTop());
  }

  if (this._plot && this._plot.getY() && (labels = this._plot.getY().getLabels())) {
    labels.setContext(this._context);
    labels.setTransformer(this._yTransformer);
    labels.setMin(this._yTransformer.getMinItem());
    labels.setMax(this._yTransformer.getMaxItem());
    labels.setHAlign(B.HAlign.left);
    labels.setVAlign(B.VAlign.fit);
    labels.setDirection(B.Direction.up);
    labels.reflow(innerSpace);
    innerSpace.setLeft(labels.getLeft() + labels.getWidth());
    innerSpace.setWidth(innerSpace.getWidth() - labels.getWidth());

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
    grid.setDirection(B.Direction.right);
  }

  if (this._plot && this._plot.getY() && (grid = this._plot.getY().getGrid())) {
    grid.setTransformer(this._yTransformer);
    grid.setMin(this._yTransformer.getMinItem());
    grid.setMax(this._yTransformer.getMaxItem());
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
  B.Chart.base.repaint.apply(this, arguments);

  if (!this._context || !this._visible)
    return;

  this._context.canvas.width = this._context.canvas.width;

  if (this._title)
    this._title.repaint();

  if (this._slider)
    this._slider.repaint();

  if (this._rTransformer && this._rTransformer.getPath() && this._radiusLegend)
    this._radiusLegend.repaint();

  if (this._cTransformer && this._cTransformer.getPath() && this._colorLegend)
    this._colorLegend.repaint();

  if (!(this._cTransformer && this._cTransformer.getPath()) && this._bubblesLegend && this._plot && this._plot.getBubbles())
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

  if (this._plot)
    this._plot.repaint();

  if (this._tooltip)
    this._tooltip.repaint();
});

B.Chart.default = {
  title: {text: 'Title', font: {color: '#888888'}},

  hAlign: B.HAlign.fit,
  vAlign: B.VAlign.fit,

  xTransformer: {},
  yTransformer: {},
  cTransformer: {},
  rTransformer: {min: 0.1},

  plot: {
    border: {
      color: '#BBBBBB',
      Width: 4,
    },
    background: '#EEEEEE',
    hAlign: B.HAlign.none,
    vAlign: B.VAlign.none,
    bubbles: [],
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