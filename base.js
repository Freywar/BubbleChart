/**
 * @namespace Main chart's namespace.
 */
var B = namespace();

//region Basic enumerations

/**
 * @enum {string}. Direction enumeration.
 */
B.Direction = enumeration({
  up: 'up',
  left: 'left',
  bottom: 'bottom',
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

//region B.Rect

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

//region B.Spacing

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

//region B.Color

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

//region B.Font

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

//region B.Border

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

//region B.Control
/**
 * @class Basic control.
 */
B.Control = cls('B.Control', B.Rect);

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
B.Control.property('background', {value: '#FFFFFF', get: true, set: true, type: B.Color});

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
 * @method Render current state on current context property.
 */
B.Control.method('repaint', function repaint() {
  if (!this._context || !this._visible)
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

B.Control.property('_invalidateTimeout', {value: null});
/**
 * @method Parameterized reflow/repaint call.
 * @param {boolean} reflow Perform reflow.
 * @param {boolean} repaint Perform repaint.

 */
B.Control.method('_invalidate', function _invalidate(reflow, repaint) {
  if (reflow)
    this.reflow(this);
  if (repaint)
    this.repaint();
  this._invalidateTimeout = null;
});
/**
 * @method Asynchronous reflow/repaint call. Ensures that no matter how much times it was called during one stream, actual reflow/repaint will be done once.
 * @param {boolean} reflow Perform reflow.
 * @param {boolean} repaint Perform repaint.

 */
B.Control.method('invalidate', function(reflow, repaint) {
  if (this._invalidateTimeout)
    return;
  this._invalidateTimeout = setTimeout(this._invalidate.bind(this, reflow, repaint));
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
  Utils.DOM.bind(node, 'mousewheel', this._nativeHandler);
  //TODO add other events
});
/**
 * @method Handle native mouse event, convert it to simpler parameters and pass to _handle method.
 * @param {Event} e Native mouse event.

 */
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
/**
 * @method Unbind control from DOM element mouse events.
 * @param {Element} node DOM element.

 */
B.Control.method('_unbindNative', function(node) {
  if (this._nativeHandler) {
    Utils.DOM.unbind(node, 'mousemove', this._nativeHandler);
    Utils.DOM.unbind(node, 'mousedown', this._nativeHandler);
    Utils.DOM.unbind(node, 'mouseup', this._nativeHandler);
    Utils.DOM.unbind(node, 'mousewheel', this._nativeHandler);
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