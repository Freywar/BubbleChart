/**
 * @class B.Bubble Bubble.
 */
B.Bubble = cls('B.Bubble', B.Control, function(options) {
  evt(this, 'hover');
  evt(this, 'dblClick');
  evt(this, 'stateChange');
  B.Bubble.base.constructor.apply(this, arguments);
});

B.Bubble.method('_check', function(x, y) {
  x -= this.getX();
  y -= this.getY();
  return Math.sqrt(x * x + y * y) <= this.getR();
});

B.Bubble.method('_onMouseMove', function(args) {
  var isInside = this._check(args.x, args.y);
  var changed = (this._hovered !== (this._hovered = this._capture = (isInside && !args.cancel)));
  args.cancel = args.cancel || isInside;
  if (changed)
    this.hover.invoke(this, Utils.extend({
      hover: isInside
    }, args))
});

B.Bubble.method('_onDblClick', function(args) {
  this.dblClick.invoke(this, args);
});

B.Bubble.method('_onAnimationFrame', function(args) {
  //TODO make color animatable too
  var changed = !!(this.getLeft(true).animate() + this.getTop(true).animate() + this.getWidth(true).animate() + this.getHeight(true).animate());

  var state = this._state;
  if (changed && this._state === B.Bubble.States.waiting)
    this._state = B.Bubble.States.appearing;
  if (!changed && this._state === B.Bubble.States.appearing)
    this._state = B.Bubble.States.normal;
  if (!changed && this._state === B.Bubble.States.disappearing)
    this._state = B.Bubble.States.disappeared;
  if (changed)
    this.invalidated.invoke(this);
  if (state !== this._state)
    this.stateChange.invoke(this, {state: this._state});
});

/**
 * @method Skip all animations.
 */
B.Bubble.method('skip', function() {
  this.getLeft(true).skip();
  this.getTop(true).skip();
  this.getWidth(true).skip();
  this.getHeight(true).skip();
});

/**
 * @property {String[]} path Path to data slice to which bubble is assigned.
 */
B.Bubble.property('path', {value: null, get: true, set: true});

B.Bubble.property('left', {get: B.Animatable.getter('left'), set: B.Animatable.setter('left')});
B.Bubble.property('top', {get: B.Animatable.getter('top'), set: B.Animatable.setter('top')});
B.Bubble.property('width', {get: B.Animatable.getter('width'), set: B.Animatable.setter('width')});
B.Bubble.property('height', {get: B.Animatable.getter('height'), set: B.Animatable.setter('height')});

/**
 * @property {number} x X-coordinate of center. Utilizes Left/Right properties so they form bounding rectangle.
 */
B.Bubble.property('x', {
  get: function() {
    return this.getLeft() + this.getR();
  },
  set: function(value) {
    this.setLeft(value - this.getWidth(true).getNextValue() / 2);
  }
});

/**
 * @property {number} y Y-coordinate of center. Utilizes Left/Right properties so they form bounding rectangle.
 */
B.Bubble.property('y', {
  get: function() {
    return this.getTop() + this.getR();
  },
  set: function(value) {
    this.setTop(value - this.getWidth(true).getNextValue() / 2);
  }
});

/**
 * @property {number} r Bubble radius. Utilizes Left/Right properties so they form bounding rectangle.
 */
B.Bubble.property('r', {
  get: function() {
    return this.getWidth() / 2;
  },
  set: function(value) {
    var x = this.getLeft(true).getNextValue() + this.getWidth(true).getNextValue() / 2,
      y = this.getTop(true).getNextValue() + this.getWidth(true).getNextValue() / 2;
    this.setWidth(value * 2);
    this.setHeight(value * 2);
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

B.Bubble.States = enumeration({
  waiting: 'waiting',
  appearing: 'appearing',
  normal: 'normal',
  disappearing: 'disappearing',
  disappeared: 'disappeared'
});

B.Bubble.property('state', {
  value: B.Bubble.States.waiting, get: true, set: function(value) {
    this._state = value;
    this.stateChange.invoke(this, {state: value});
  }
});

B.Bubble.method('reflow', function() {

});

B.Bubble.method('repaint', function() {
  if (this._assertRepaint(!this.getR()))
    return;

  this._context.beginPath();
  this._context.arc(this.getX(), this.getY(), Math.max(0, this.getR() - this._border.getWidth() / 2), 0, 2 * Math.PI);
  this._context.closePath();

  this._background.add(this._hovered ? -0.2 : 0).apply(this._context);//TODO make hovered effects configurable
  this._context.fill();
  this._border.apply(this._context);
  this._border.getColor().add(this._hovered ? -0.2 : 0).apply(this._context);
  this._context.stroke();
});