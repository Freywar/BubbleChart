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