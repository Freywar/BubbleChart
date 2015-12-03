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