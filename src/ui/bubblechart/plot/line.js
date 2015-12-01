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