/**
 * Main chart's namespace.
 * @namespace
 */
var B = namespace();

//region Basic enumerations

/** Direction enumeration.
 * @enum {string}.
 */
B.Direction = enumeration({
  up: 'up',
  left: 'left',
  bottom: 'bottom',
  right: 'right'
});

/** Horizontal alignment for controls.
 * @enum {string}
 */
B.HAlign = enumeration({
  /** Align to left and calculate width by content. */
  left: 'left',
  /** Align to center and calculate width by content. */
  center: 'center',
  /** Align to right and calculate width by content. */
  right: 'right',
  /** Fill container width. */
  fit: 'fit',
  /** Calculate width by content but use user-defined position. */
  auto: 'auto',
  /** Use user-defined position and size */
  none: 'none'
});

/** Vertical alignment for controls.
 * @enum {string}
 */
B.VAlign = enumeration({
  /** Align to top and calculate height by content. */
  top: 'top',
  /** Align to center and calculate height by content. */
  center: 'center',
  /** Align to bottom and calculate height by content. */
  bottom: 'bottom',
  /** Fill container height. */
  fit: 'fit',
  /** Calculate height by content but use user-defined position. */
  auto: 'auto',
  /** Use user-defined position and size. */
  none: 'none'
});

//endregion

//region B.Font

B.FONT_SIZE = 12; //TODO add custom fonts for each component

//endregion

//region B.Color

/** Color class.
 * @param {string|object} options Either any of HTML/CSS notation of color or object with properties values.
 */
B.Color = cls('B.Color', MObject, function Color(options) {
  function rgb(r, g, b) {
    return {r: r / 255, g: g / 255, b: b / 255}
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
          b: parseInt(options[3], 16) / 255
        };
        break;
      case /^#[\da-f]{6}$/i.test(options):
        options = {
          r: parseInt(options.slice(1, 3), 16) / 255,
          g: parseInt(options.slice(3, 5), 16) / 255,
          b: parseInt(options.slice(5, 7), 16) / 255
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
/** @property {number} R value from 0 to 1 */
B.Color.property('r', {value: 0, get: true, set: true});
/** @property {number} G value from 0 to 1 */
B.Color.property('g', {value: 0, get: true, set: true});
/** @property {number} B value from 0 to 1 */
B.Color.property('b', {value: 0, get: true, set: true});
/** @property {number} A value from 0 to 1 */
B.Color.property('a', {value: 1, get: true, set: true});

/** Increase/decrease R/G/B by provided value with clamping. Creates new instance, except cases when nothing is modified.
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
/** Export color as rgba() string.
 * @returns {string}
 */
B.Color.method('toString', function toString() {
  return 'rgba(' + ((this._r * 255) | 0) + ',' + ((this._g * 255) | 0) + ',' + ((this._b * 255) | 0) + ',' + this._a + ')';
});

//endregion

//region B.Rect

B.Rect = cls('B.Rect', MObject, function Rect(options) {
  B.Rect.base.constructor.apply(this, arguments);
});

B.Rect.property('left', {value: 0, get: true, set: true});
B.Rect.property('top', {value: 0, get: true, set: true});
B.Rect.property('width', {value: 0, get: true, set: true});
B.Rect.property('height', {value: 0, get: true, set: true});

B.Rect.property('right', {
  get: function() {
    return this._left + this._width
  },
  set: function(value) {
    this._left = value - this._width;
  }
});
B.Rect.property('bottom', {
  get: function() {
    return this._top + this._height
  },
  set: function(value) {
    this._top = value - this._height;
  }
});
B.Rect.property('hCenter', {
  get: function() {
    return this._left + this._width / 2
  },
  set: function(value) {
    this._left = value - this._width / 2;
  }
});
B.Rect.property('vCenter', {
  get: function() {
    return this._top + this._height / 2
  },
  set: function(value) {
    this._top = value - this._height / 2;
  }
});

//endregion

//region B.Spacing

B.Spacing = cls('B.Spacing', MObject, function Spacing(options) {
  if (Utils.Types.isNumber(options)) {
    options = {left: options, top: options, right: options, bottom: options};
  }
  B.Spacing.base.constructor.call(this, options);
});

B.Spacing.property('left', {value: 0, get: true, set: true});
B.Spacing.property('top', {value: 0, get: true, set: true});
B.Spacing.property('right', {value: 0, get: true, set: true});
B.Spacing.property('bottom', {value: 0, get: true, set: true});

//endregion

//region B.Data

/**
 * @property {object} items Multidimentional associative array of data.
 * @property {object[]} names Names of subarrays. Each item is an object like {<id>:<name>} and corresponds to a deeper dimension.
 * @property {boolean} empty True if there are no primitive values in array.
 * @property {boolean} numeric True if all values on one dimension are numeric.
 * @property {number} min Minimum value if numeric==true. Otherwise null.
 * @property {number} max Maximum value if numeric==true. Otherwise null.
 */
B.Data = cls('B.Data', MObject, function Data(options) {
  B.Data.base.constructor.apply(this, arguments);
});

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
B.Data.property('names', {value: null, get: true, set: true});
B.Data.property('empty', {value: true, get: true});
B.Data.property('numeric', {value: false, get: true});

B.Data.property('minMaxCache', {value: null});

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
 * Extract item from array. If the path can not be traversed or item at the end of the path is not a primitive, consider it invalid item and return null,
 * @param {String[]} path Array of ids each corresponding to a deeper dimension.
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

B.Transformer.property('data', {value: null, get: true, set: true, type: B.Data});
B.Transformer.property('path', {value: null, get: true, set: true});
B.Transformer.property('min', {value: 0, get: true, set: true});
B.Transformer.property('max', {value: 1, get: true, set: true});
B.Transformer.property('nodata', {value: 0.5, get: true, set: true});

B.Transformer.property('minItem', {
  get: function() {
    return this._data && this._data.getNumeric() ? this._data.min(this._path) : -1
  }
});
B.Transformer.property('maxItem', {
  get: function() {
    return this._data && this._data.getNumeric() ? this._data.max(this._path) : 1
  }
});

B.Transformer.method('_interpolate', function _interpolate(minV, v, maxV, minR, maxR) {
  var dataRange = maxV - minV;
  var dataOffset = v - minV;
  var resultRange = maxR - minR;
  return minR + dataOffset * resultRange / dataRange;
});

B.Transformer.method('item', function(path) {
  if (!this._data || !this._data.getNumeric())
    return this._nodata;
  if (this._path)
    path = this._path.concat(path);
  return this._data && this._data.item(path);
});

B.Transformer.method('transform', function(value) {
  if (!Utils.Types.isNumber(value))
    return this._nodata;

  return this._interpolate(this.getMinItem(), value, this.getMaxItem(), this._min, this._max);
});

B.Transformer.method('transformedItem', function(path1, path2, offset) {
  if (!path2)
    return this.transform(this.item(path1));
  else {
    var data1 = this.transform(this.item(path1));
    var data2 = this.transform(this.item(path2));
    return this._interpolate(0, offset || 0, 1, data1, data2);
  }
});

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

//region B.Control

B.Control = cls('B.Control', B.Rect, function Control(options) {
  B.Control.base.constructor.apply(this, arguments);
});

B.Control.property('context', {value: null, get: true, set: true});
B.Control.property('enabled', {value: true, get: true, set: true});
B.Control.property('visible', {value: true, get: true, set: true});
B.Control.property('hAlign', {value: B.HAlign.none, get: true, set: true});
B.Control.property('vAlign', {value: B.VAlign.none, get: true, set: true});

B.Control.property('left', {value: 0, get: true, set: true});
B.Control.property('top', {value: 0, get: true, set: true});
B.Control.property('width', {value: 0, get: true, set: true});
B.Control.property('height', {value: 0, get: true, set: true});
B.Control.property('margin', {value: 0, get: true, set: true, type: B.Spacing});
B.Control.property('padding', {value: 4, get: true, set: true, type: B.Spacing});
B.Control.property('background', {value: '#FFFFFF', get: true, set: true, type: B.Color});
B.Control.property('borderColor', {value: '#000000', get: true, set: true, type: B.Color});
B.Control.property('borderWidth', {value: 0, get: true, set: true}); //TODO implement independent width for each side
B.Control.property('borderRadius', {value: 0, get: true, set: true});

B.Control.property('innerLeft', {
  get: function() {
    return this._left + this._margin.getLeft() + this._borderWidth + this._padding.getLeft() + this._borderRadius;
  }
});
B.Control.property('innerTop', {
  get: function() {
    return this._top + this._margin.getTop() + this._borderWidth + this._padding.getTop() + this._borderRadius;
  }
});
B.Control.property('innerWidth', {
  get: function() {
    return Math.max(0, this._width - this._margin.getLeft() - this._margin.getRight()
      - this._borderWidth - this._borderWidth
      - this._padding.getLeft() - this._padding.getRight()
      - this._borderRadius * 2)
      ;
  }
});
B.Control.property('innerHeight', {
  get: function() {
    return Math.max(0, this._height - this._margin.getTop() - this._margin.getBottom()
      - this._borderWidth - this._borderWidth
      - this._padding.getTop() - this._padding.getBottom()
      - this._borderRadius * 2)
      ;
  }
});

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

B.Control.method('repaint', function repaint() {
  if (!this._context || !this._visible)
    return;
  this._context.fillStyle = this._background.toString();
  this._context.fillRect(
    Math.round(this._left + this._margin.getLeft() + this._borderWidth / 2),
    Math.round(this._top + this._margin.getTop() + this._borderWidth / 2),
    Math.round(this._width - this._margin.getLeft() - this._margin.getRight() - this._borderWidth),
    Math.round(this._height - this._margin.getTop() - this._margin.getBottom() - this._borderWidth)
  ); //TODO add borders and radius
});

B.Control.property('_invalidateTimeout', {value: null});
B.Control.method('_invalidate', function _invalidate(reflow, repaint) {
  if (reflow)
    this.reflow(this);
  if (repaint)
    this.repaint();
  this._invalidateTimeout = null;
});
B.Control.method('invalidate', function(reflow, repaint) {
  if (this._invalidateTimeout)
    return;
  this._invalidateTimeout = setTimeout(this._invalidate.bind(this, reflow, repaint));
});

B.Control.method('_bindNativeOne', function(node, name, callback) { //TODO move to Utils.DOM
  if (window.addEventListener) {
    node.addEventListener(name, callback, false);
  } else if (window.attachEvent) {
    node.attachEvent('on' + name, callback);
  } else {
    node['on' + name] = callback;
  }
});
B.Control.method('_unbindNativeOne', function(node, name, callback) {
  if (window.addEventListener) {
    node.removeEventListener(name, callback, false);
  } else if (window.attachEvent) {
    node.detachEvent('on' + name, callback);
  } else {
    node['on' + name] = null;
  }
});

B.Control.property('nativeHandler');
B.Control.method('_bindNative', function(node) {
  this._nativeHandler = this._nativeHandler || this._handleNative.bind(this);
  this._bindNativeOne(node, 'mousemove', this._nativeHandler);
  this._bindNativeOne(node, 'mousedown', this._nativeHandler);
  this._bindNativeOne(node, 'mouseup', this._nativeHandler);
  this._bindNativeOne(node, 'mousewheel', this._nativeHandler);
  //TODO add other events
});
B.Control.method('_handleNative', function(e) {
  var args = {
    type: e.type,
    x: e.pageX - e.target.offsetLeft,
    y: e.pageY - e.target.offsetTop,
    cancel: false,
    reflow: false,
    repaint: false
  };
  this._handle(args);
});
B.Control.method('_unbindNative', function(node) {
  if (this._nativeHandler) {
    this._unbindNativeOne(node, 'mousemove', this._nativeHandler);
    this._unbindNativeOne(node, 'mousedown', this._nativeHandler);
    this._unbindNativeOne(node, 'mouseup', this._nativeHandler);
    this._unbindNativeOne(node, 'mousewheel', this._nativeHandler);
  }
});

B.Control.property('capture', {value: false, get: true});
B.Control.property('hovered', {value: false, get: true});
B.Control.property('pressed', {value: false, get: true});
B.Control.method('_check', function(x, y) {
  return this.getInnerLeft() <= x && x <= this.getInnerLeft() + this.getInnerWidth() &&
    this.getInnerTop() <= y && y <= this.getInnerTop() + this.getInnerHeight();
});
B.Control.method('_handle', function(args) {
  if (!this._capture && (args.cancel || !this._check(args.x, args.y)))
    return;
  var handlerName = '_on' + args.type.replace(/^(mouse)?(.*)$/, function(_, f, e) {
      return Utils.String.toUpperFirst(f || '') + Utils.String.toUpperFirst(e || '')
    });
  if (this[handlerName])
    this[handlerName](args);
  //TODO add some automatic way to pass event to children controls
});

//endregion

//region B.Label

B.Label = cls('B.Label', B.Control);

B.Label.property('height', {value: B.FONT_SIZE, get: true, set: true});
B.Label.property('lines', {value: ''});
B.Label.property('text', {value: '', get: true, set: true});
B.Label.property('direction', {value: B.Direction.right, get: true, set: true});
B.Label.property('color', {value: '#888888', get: true, set: true, type: B.Color}); //TODO encapsulate font into class

B.Label.method('reflow', function reflow(space) {
  if (!this._context || !this._visible)
    return;

  if (!this._text) {
    if (this._hAlign !== B.HAlign.none) {
      this._width = 0;
    }
    if (this._vAlign !== B.VAlign.none) {
      this._height = 0;
    }
    return;
  }

  if (this._hAlign !== B.HAlign.none) {
    this._width = space.getWidth();
  }
  if (this._vAlign !== B.VAlign.none) {
    this._height = space.getHeight();
  }

  var width = this._direction === B.Direction.left || this._direction === B.Direction.right ? this.getInnerWidth() : this.getInnerHeight();
  var height = this._direction === B.Direction.left || this._direction === B.Direction.right ? this.getInnerHeight() : this.getInnerWidth();

  this._context.font = this._context.font.replace(/\d+px/, B.FONT_SIZE + 'px');
  var spaceWidth = this._context.measureText(' ').width;
  var threeDotsWidth = this._context.measureText('...').width;
  var lines = this._text.split('\n'),
    maxWidth = 0,
    isLastLine = false;
  for (var i = 0; i < lines.length && !isLastLine; i++) {
    isLastLine = (i + 1) * B.FONT_SIZE <= height && (i + 2) * B.FONT_SIZE > height;
    var line = '',
      lineWidth = 0,
      words = lines[i].split(' '),
      lineSplitted = false;

    for (var j = 0; j < words.length; j++) {
      var rSpaceWidth = lineWidth ? spaceWidth : 0;
      var llAdd = isLastLine ? threeDotsWidth : 0;
      var wordWidth = this._context.measureText(words[j]).width;
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
    this._width = this._width - this.getInnerWidth() + maxWidth;
  }
  if (this._vAlign !== B.VAlign.none) {
    this._height = this._height - this.getInnerHeight() + lines.length * B.FONT_SIZE;
  }

  if (this._direction === B.Direction.up || this._direction === B.Direction.down) {
    var t = this._width;
    this._width = this._height;
    this._height = t;
  }

  B.Label.base.reflow.apply(this, arguments);
});

B.Label.method('repaint', function repaint() {
  if (!this._context || !this._visible || !this._text)
    return;

  B.Label.base.repaint.apply(this, arguments);

  var oh = -this.getInnerHeight() / 2;
  this._context.fillStyle = '#000000';

  // this._context.fillRect(-20, -20, 40, 40);
  this._context.translate(Math.round(this._left + this._width / 2), Math.round(this._top + this._height / 2));
//   this._context.fillRect(-20, -20, 40, 40);
  if (this._direction === B.Direction.up) {

    this._context.rotate(-Math.PI / 2);
    //     this._context.fillRect(-20, -20, 40, 40);
    oh = -this.getInnerWidth() / 2;
  }

  //TODO add other types of rotation

  this._context.fillStyle = this._color.toString();
  this._context.font = this._context.font.replace(/\d+px/, B.FONT_SIZE + 'px');
  this._context.textBaseline = 'top';
  for (var i = 0; i < this._lines.length; i++) {
    var w = this._context.measureText(this._lines[i]).width;
    this._context.fillText(this._lines[i], Math.round(-w / 2), Math.round(oh + i * B.FONT_SIZE));
  }
  this._context.fillStyle = '#FF0000';
  if (this._direction === B.Direction.up) {
    //      this._context.fillRect(-20, -20, 40, 40);
    this._context.rotate(Math.PI / 2);
  }
  //this._context.fillRect(-20, -20, 40, 40);
  this._context.translate(-Math.round(this._left + this._width / 2), -Math.round(this._top + this._height / 2));
  //this._context.fillRect(-20, -20, 40, 40);
});

//endregion

//region B.SliderTick

B.SliderTick = cls('B.SliderTick', B.Label);

B.SliderTick.property('path', {value: null, get: true, set: true});

//TODO add automatic text setup depending on data

//endregion

//region B.Slider

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
    if (this.offset() < 0.1)
      this._position = Math.floor((this._position * (this._ticks.length - 1))) / (this._ticks.length - 1);
    if (this.offset() > 0.9)
      this._position = Math.ceil((this._position * (this._ticks.length - 1))) / (this._ticks.length - 1);

    args.repaint = true;
    args.reflow = true;//TODO maybe implement some invokable events mechanism and use it
  }
});

B.Slider.method('_onMouseUp', function(args) {
  this._sliderDragged = false;
});


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

B.Slider.method('floor', function() {
  return this._ticks[Math.floor(this._position * (this._ticks.length - 1))].getPath();
});

B.Slider.method('offset', function() {
  return this._position * (this._ticks.length - 1) - Math.floor((this._position * (this._ticks.length - 1)));
});

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

  var start = this.getInnerLeft() + 32 + this._padding.getLeft() + 9;
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

  this._context.fillStyle = this._sliderHovered ? '#888888' : '#BBBBBB';
  this._context.beginPath();
  this._context.arc(start + length * this._position, this.getInnerTop() + 16.5, 9, 0, Math.PI * 2);
  this._context.fill();

});


//endregion

//region B.Line

B.Line = cls('B.Line', B.Control);

B.Line.property('x1', {
  get: function() {
    return this._left;
  },
  set: function(value) {
    this._left = value;
  }
});

B.Line.property('y1', {
  get: function() {
    return this._top;
  },
  set: function(value) {
    this._top = value;
  }
});

B.Line.property('x2', {
  get: function() {
    return this._left + this._width;
  },
  set: function(value) {
    this._width = value - this._left;
  }
});

B.Line.property('y2', {
  get: function() {
    return this._top + this._height;
  },
  set: function(value) {
    this._height = value - this._top;
  }
});

B.Line.alias('stroke', 'borderColor');
B.Line.alias('strokeWidth', 'borderWidth');

B.Line.method('reflow', function() {
  //lines are not alignable, nothing to do
});

B.Line.method('repaint', function() {
  if (!this._context || !this._visible || !this._borderWidth)
    return;

  var pixelOffset = (this._borderWidth % 2) / 2;
  this._context.strokeStyle = this._borderColor.toString();
  this._context.lineWidth = this._borderWidth;
  this._context.beginPath();
  this._context.moveTo(Math.round(this.getX1()) + pixelOffset, Math.round(this.getY1()) + pixelOffset);
  this._context.lineTo(Math.round(this.getX2()) + pixelOffset, Math.round(this.getY2()) + pixelOffset);
  this._context.stroke();
});

//endregion

//region B.ControlCollection

B.ControlCollection = cls('B.ControlCollection', B.Control);

B.ControlCollection.property('items', {value: null});
B.ControlCollection.property('values', {value: null});
B.ControlCollection.property('class', {value: B.Control, get: true});
B.ControlCollection.property('options', {value: null, get: true, set: true});

B.ControlCollection.property('min', {value: 0, get: true, set: true});
B.ControlCollection.property('max', {value: 0, get: true, set: true});
B.ControlCollection.property('count', {value: 0, get: true, set: true});
B.ControlCollection.property('transformer', {value: null, get: true, set: true, type: B.Transformer});
B.ControlCollection.property('direction', {value: B.Direction.right, get: true, set: true});

B.ControlCollection.property('subcollection', {value: null, get: true, set: true});
B.ControlCollection.property('subcollections', {value: null});

B.ControlCollection.property('master', {value: null});
B.ControlCollection.property('slave', {value: null});
B.ControlCollection.method('synchronize', function(other) {
  this._slave = other;
  if (other)
    other.master = this;
});

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

B.ControlCollection.method('_applyValue');

B.ControlCollection.method('_reflowChildren', function(space) {
  if (!this._context || !this._visible)
    return;

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

B.ControlCollection.method('_reflowSelf', function(space) {

  B.ControlCollection.base.reflow.apply(this, arguments);

  if (this._subcollections) {
    for (var i = 0; i < this._subcollections.length; i++) {
      this._subcollections[i].setTransformer(this._transformer);
      this._subcollections[i].setLeft(this._left);
      this._subcollections[i].setTop(this._top);
      this._subcollections[i].setWidth(this._width);
      this._subcollections[i].setHeight(this._height);
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

      this._items[i].setTop(this.getInnerTop() + this.getInnerHeight() * position - this._items[i].getHeight() / 2);
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

      this._items[i].setLeft(this.getInnerLeft() + this.getInnerWidth() * position - this._items[i].getWidth() / 2);
    }
    if (this._subcollections && this._subcollections[i])
      this._subcollections[i]._realignChildren();
  }
});

B.ControlCollection.method('reflow', function(space) {
  if (!this._context || !this._visible)
    return;
  this._reflowChildren(space);
  this._reflowSelf(space);
  this._realignChildren();
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
      this._items[i].setY1(this.getInnerTop() + this.getInnerHeight() * position);
      this._items[i].setX2(this.getInnerLeft() + this.getInnerWidth());
      this._items[i].setY2(this.getInnerTop() + this.getInnerHeight() * position);
    }
    else {
      if (this._direction === B.Direction.left)
        position = 1 - position;

      this._items[i].setX1(this.getInnerLeft() + this.getInnerWidth() * position);
      this._items[i].setY1(this.getInnerTop());
      this._items[i].setX2(this.getInnerLeft() + this.getInnerWidth() * position);
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

B.Axis = cls('B.Axis', B.Control);

B.Axis.property('title', {value: null, get: true, set: true, type: B.Label});
B.Axis.property('grid', {value: null, get: true, set: true, type: B.LineCollection});
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

//region B.Point

B.Point = cls('B.Point', B.Control);

B.Point.method('_check', function(x, y) {
  x -= this.getX();
  y -= this.getY();
  return Math.sqrt(x * x + y * y) <= this.getR();
});

B.Point.method('_onMouseMove', function(args) {
  var isInside = this._check(args.x, args.y);
  args.repaint = (this._hovered !== (this._hovered = this._capture = (isInside && !args.cancel)));
  args.cancel = args.cancel || isInside;
});

B.Point.property('path', {value: null, get: true, set: true});

B.Point.property('x', {
  get: function() {
    return this._left + this.getR();
  },
  set: function(value) {
    this._left = value - this.getR();
  }
});

B.Point.property('y', {
  get: function() {
    return this._top + this.getR();
  },
  set: function(value) {
    this._top = value - this.getR();
  }
});

B.Point.property('r', {
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

B.Point.property('color', {
  get: function() {
    return this._borderColor;
  },
  set: function(value) {
    this.setBorderColor(value);
    this.setBorderWidth(2);
    var fill = this._borderColor.clone();
    fill.setA(fill.getA() / 2);
    this.setBackground(fill);
  }
});

B.Point.method('reflow', function() {

});

B.Point.method('repaint', function() {
  if (!this._context || !this._visible || !this.getR())
    return;

  this._context.fillStyle = this._background.add(this._hovered ? -0.2 : 0).toString();//TODO make hovered effects configurable
  this._context.strokeStyle = this._borderColor.add(this._hovered ? -0.2 : 0).toString();
  this._context.strokeWidth = this._borderWidth;
  this._context.beginPath();
  this._context.arc(this.getX(), this.getY(), this.getR() - this._borderWidth / 2, 0, 2 * Math.PI);
  this._context.closePath();
  this._context.fill();
  this._context.stroke();
});

//endregion

//region B.PointLabel

B.PointLabel = cls('B.PointLabel', B.Control, function(options) {
  B.PointLabel.base.constructor.apply(this, arguments);
  this._point = new B.Point();
  this._label = new B.Label();
}); //TODO consider inheritance from Label or maybe make _label property public so label could be stylized

B.PointLabel.property('point');
B.PointLabel.property('label');

B.PointLabel.property('text', {get: true, set: true});
B.PointLabel.property('radius', {value: 8, get: true, set: true});
B.PointLabel.property('color', {value: '#888888', get: true, set: true, type: B.Color});

B.PointLabel.method('reflow', function(space) {
  if (!this._context || !this._visible)
    return;

  this._label.setContext(this._context);
  this._label.setHAlign(B.HAlign.auto);
  this._label.setVAlign(B.VAlign.auto);
  this._label.setText(this._text);
  this._label.reflow(space);

  this._point.setContext(this._context);

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

  B.PointLabel.base.reflow.apply(this, arguments);

  this._point.setX(this.getInnerLeft() + this.getInnerWidth() / 2 - width / 2 + this._radius);
  this._point.setY(this.getInnerTop() + this.getInnerHeight() / 2);
  this._point.setR(this._radius);
  this._point.setColor(this._color);

  this._label.setLeft(this.getInnerLeft() + this.getInnerWidth() / 2 - width / 2 + this._radius * 2);
  this._label.setTop(this.getInnerTop() + this.getInnerHeight() / 2 - this._label.getHeight() / 2);
});

B.PointLabel.method('repaint', function() {
  B.PointLabel.base.repaint.apply(this, arguments);
  this._point.repaint();
  this._label.repaint();
});

//endregion

//region B.Legend

B.Legend = cls('B.Legend', B.Control, function() {
  B.Legend.base.constructor.apply(this, arguments);
  this._contItem = new B.PointLabel({radius: 0, text: '...'});
});

B.Legend.property('rows');
B.Legend.property('contItem');

B.Legend.property('title', {value: null, get: true, set: true, type: B.Label});
B.Legend.property('items', {
  value: null, get: true, set: function(value) {
    if (value === this._items)
      return;
    this._items = [];
    if (value) {
      for (var i = 0; i < value.length; i++)
        this._items.push(new B.PointLabel(value[i]));
    }
  }
});


B.Legend.method('reflow', function(space) {

  for (var i = 0; i < this._items.length; i++) {
    this._items[i].setContext(this._context);
    this._items[i].setHAlign(B.HAlign.auto);
    this._items[i].setVAlign(B.VAlign.auto);
    this._items[i].reflow(space);
  }
  this._contItem.setContext(this._context);
  this._contItem.setHAlign(B.HAlign.auto);
  this._contItem.setVAlign(B.VAlign.auto);
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
      rows[i].items[j].reflow(space);//TODO add content coordinates update to PointLabel so full reflow could not be necessary
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

B.ValueLegend = cls('B.ValueLegend', B.Legend);

B.ValueLegend.property('transformer', {value: null, get: true, set: true, type: B.Transformer});

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

    this._items.push(new B.PointLabel(options));
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

B.Plot = cls('B.Plot', B.Control);

B.Plot.property('points', {
  value: null, get: true, set: function(value) {
    if (this._points !== value) {
      this._points = [];
      if (value) {
        for (var i = 0; i < value.length; i++) {
          this._points.push(new B.Point(value[i]));
        }
      }
    }
  }
});
B.Plot.property('x', {value: null, get: true, set: true, type: B.Axis});
B.Plot.property('y', {value: null, get: true, set: true, type: B.Axis});

B.Plot.method('_handle', function(args) {
  if (this._points)
    for (var i = this._points.length - 1; i >= 0; i--)
      this._points[i]._handle(args);
  B.Plot.base._handle.call(this, args);
});

B.Plot.method('reflow', function(space) {
  if (!this._context || !this._visible)
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
  if (!this._context || !this._visible)
    return;
  B.Plot.base.repaint.apply(this, arguments);
  if (this._x)
    this._x.repaint();
  if (this._y)
    this._y.repaint();

  if (this._points)
    for (var i = 0; i < this._points.length; i++)
      this._points[i].repaint();
});

//endregion

//region B.Chart

B.Chart = cls('B.Chart', B.Control, function(options) {
  B.Chart.base.constructor.apply(this, arguments);
});
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
B.Chart.property('pointsLegend', {value: null, get: true, set: true, type: B.Legend});
B.Chart.property('colorLegend', {value: null, get: true, set: true, type: B.ValueLegend});
B.Chart.property('radiusLegend', {value: null, get: true, set: true, type: B.ValueLegend});

B.Chart.method('_handle', function(args) {
  if (this._plot)
    this._plot._handle(args);
  if (this._slider)
    this._slider._handle(args);
  this._invalidate(args.reflow, args.repaint);
});

B.Chart.method('_updateData', function() {
  if (!this._plot)
    return;

  var points = this._plot.getPoints();
  if (!points)
    return;

  var sliderF = this._slider.floor();
  var sliderO = this._slider.offset();
  var sliderC = this._slider.ceil();
  for (var i = 0; i < points.length; i++) {
    var point = points[i],
      pathF = point.getPath().concat(sliderF),
      pathC = point.getPath().concat(sliderC);

    point.setContext(this._context);

    if (this._xTransformer)
      point.setX(this._plot.getInnerLeft() + this._plot.getInnerWidth() * this._xTransformer.transformedItem(pathF, pathC, sliderO));

    if (this._yTransformer)
      point.setY(this._plot.getInnerTop() + this._plot.getInnerHeight() * (1 - this._yTransformer.transformedItem(pathF, pathC, sliderO)));

    if (this._rTransformer)
      point.setR(50 * this._rTransformer.transformedItem(pathF, pathC, sliderO));

    if (this._cTransformer && this._cTransformer.getPath())
      point.setColor(this._cTransformer.transformedItem(pathF, pathC, sliderO));
    else
      point.setColor(this._palette[i % this._palette.length]);

    //TODO use relative coordinates here and transform them into absolute on Plot reflow
  }
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

  if (!(this._cTransformer && this._cTransformer.getPath()) && this._pointsLegend && this._plot && this._plot.getPoints()) {
    var points = this._plot.getPoints(), items = [];
    for (i = 0; i < points.length; i++)
      items.push({
        text: this._data.name([''].concat(points[i].getPath())),
        color: this._palette[i % this._palette.length]
      });

    this._pointsLegend.setContext(this._context);
    this._pointsLegend.setItems(items); //TODO do not recreate items each time
    this._pointsLegend.setHAlign(B.HAlign.left);
    this._pointsLegend.setVAlign(legendVAlign);
    this._pointsLegend.reflow(legendSpace);

    legendHeight = Math.max(this._pointsLegend.getHeight(), legendHeight);
  }

  //TODO current placing algorithm assumes that size legend is much taller than others because of items' bigger radiuses
  //TODO and much narrower because of  their lower count
  //TODO so it places size legend into right bottom corner
  //TODO and limits other legends' space to size legend's height and remaining chart's width
  //TODO but points legend can have many items and require much more height than size legen
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
    labels.setMin(this._xTransformer.getMinItem());
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

  if (!(this._cTransformer && this._cTransformer.getPath()) && this._pointsLegend && this._plot && this._plot.getPoints())
    this._pointsLegend.repaint();

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
});

B.Chart.default = {
  title: {text: 'Title'},

  hAlign: B.HAlign.fit,
  vAlign: B.VAlign.fit,

  xTransformer: {},
  yTransformer: {},
  cTransformer: {},
  rTransformer: {min: 0.1},

  plot: {
    padding: 50, //TODO remove when scale is implemented
    borderColor: '#888888',
    borderWidth: 4,
    background: '#EEEEEE',
    hAlign: B.HAlign.none,
    vAlign: B.VAlign.none,
    points: [],
    x: {
      title: {text: 'X'},
      grid: {
        count: 5,
        options: {
          'strokeWidth': 2,
          stroke: '#FFFFFF'
        },
        subcollection: {
          count: 5,
          options: {
            'strokeWidth': 1,
            stroke: '#FFFFFF'
          }
        }
      },
      labels: {
        padding: {left: 50, right: 50}, //TODO remove when scale is implemented
        count: 5,
        subcollection: {
          padding: {left: 50, left: 50}, //TODO remove when scale is implemented
          count: 5
        }
      }
    },
    y: {
      title: {text: 'Y'},
      grid: {
        count: 5,
        options: {
          'strokeWidth': 2,
          stroke: '#FFFFFF'
        },
        subcollection: {
          count: 5, options: {
            'strokeWidth': 1,
            stroke: '#FFFFFF'
          }
        }
      },
      labels: {
        padding: {top: 50, bottom: 50}, //TODO remove when scale is implemented
        count: 5,
        subcollection: {
          padding: {top: 50, bottom: 50}, //TODO remove when scale is implemented
          count: 5
        }
      }
    }
  },
  slider: {},
  colorLegend: {title: {}},
  radiusLegend: {title: {}},
  pointsLegend: {}
};

//endregion