/**
 * @class B.Scale Transformer from relative coordinates(0,1) to screen.
 * Rect properties define area to which relative coordinates should be mapped.
 */
B.Scale = cls('B.Scale', B.Rect);

/**
 * @property {B.Spacing} padding Scale-independent padding, screen pixels.
 */
B.Scale.property('padding', {value: 0, get: true, set: true, type: B.Spacing});

/**
 * @property {number} offsetX Horizontal offset, screen pixels.
 */
B.Scale.property('offsetX', {
  value: 0, get: true, set: function(value) {
    var sx = 1 - this._scaleX;
    this._offsetX = Utils.Number.clip(
      (this.getLeft() + this._padding.getLeft()) * (1 - this._scaleX),
      value,
      (this.getRight() - this._padding.getRight()) * (1 - this._scaleX)
    );
  }
});

/**
 * @property {number} offsetY Vertical offset, screen pixels.
 */
B.Scale.property('offsetY', {
  value: 0, get: true, set: function(value) {
    var sx = 1 - this._scaleY;
    this._offsetY = Utils.Number.clip(
      (this.getTop() + this._padding.getTop()) * (1 - this._scaleY),
      value,
      (this.getBottom() - this._padding.getBottom()) * (1 - this._scaleY)
    );
  }
});

/**
 * @property {number} scaleX Horizontal scale.
 */
B.Scale.property('scaleX', {
  value: 1, get: true, set: function(value) {
    this._scaleX = Utils.Number.clip(this._minScaleX, value, this._maxScaleX);
  }
});
/**
 * @property {number} scaleY Vertical scale.
 */
B.Scale.property('scaleY', {
  value: 1, get: true, set: function(value) {
    this._scaleY = Utils.Number.clip(this._minScaleY, value, this._maxScaleY);
  }
});

/**
 * @property {number} minScaleX Horizontal scale lower limit.
 */
B.Scale.property('minScaleX', {
  value: 1, get: true, set: function(value) {
    this._minScaleX = value;
    this._maxScaleX = Math.max(value, this._maxScaleX);
    this.setScaleX(this._scaleX);
  }
});
/**
 * @property {number} minScaleY Vertical scale lower limit.
 */
B.Scale.property('minScaleY', {
  value: 1, get: true, set: function(value) {
    this._minScaleY = value;
    this._maxScaleY = Math.max(value, this._maxScaleY);
    this.setScaleY(this._scaleY);
  }
});

/**
 * @property {number} maxScaleX Horizontal scale upper limit.
 */
B.Scale.property('maxScaleX', {
  value: 10, get: true, set: function(value) {
    this._maxScaleX = value;
    this._minScaleX = Math.min(value, this._minScaleX);
    this.setScaleX(this._scaleX);
  }
});
/**
 * @property {number} maxScaleY Vertical scale upper limit.
 */
B.Scale.property('maxScaleY', {
  value: 10, get: true, set: function(value) {
    this._maxScaleY = value;
    this._minScaleY = Math.min(value, this._minScaleY);
    this.setScaleY(this._scaleY);
  }
});

/**
 * @method Scale to rect, screen pixels.
 */
B.Scale.method('scaleTo', function(rect) {
  var pScaleX = this._scaleX,
    pScaleY = this._scaleY;

  this.setScaleX(this._scaleX * this.getWidth() / rect.getWidth());
  this.setScaleY(this._scaleY * this.getHeight() / rect.getHeight());

  this.setOffsetX(this._offsetX + this.getLeft() - rect.getLeft() + (this._offsetX - rect.getLeft()) * (this._scaleX / pScaleX - 1));
  this.setOffsetY(this._offsetY + this.getTop() - rect.getTop() + (this._offsetY - rect.getTop()) * (this._scaleY / pScaleY - 1));
});

/**
 * @method Scale around a point.
 * @param {number} addend Addend for scale.
 * @param {number} x X-coordinate of a center point, screen pixels. Result area center by default.
 * @param {number} y Y-coordinate of a center point, screen pixels. Result area center by default.
 */
B.Scale.method('scaleBy', function(addend, x, y) {
  if (!Utils.Types.isNumber(x))
    x = this.getCenterX();
  if (!Utils.Types.isNumber(y))
    y = this.getCenterY();

  var pScaleX = this._scaleX,
    pScaleY = this._scaleY;

  this.setScaleX(this._scaleX + addend);
  this.setScaleY(this._scaleY + addend);

  this.setOffsetX(this._offsetX + (this._offsetX - x) * (this._scaleX / pScaleX - 1));
  this.setOffsetY(this._offsetY + (this._offsetY - y) * (this._scaleY / pScaleY - 1));
});

/**
 * @method Move by vector.
 * @param {number} dx Vector X value, screen pixels.
 * @param {number} dy Vector Y value, screen pixels.
 */
B.Scale.method('moveBy', function(dx, dy) {
  this.setOffsetX(this._offsetX + dx);
  this.setOffsetY(this._offsetY + dy);
});

/**
 * @method Transform relative X-coordinate to screen.
 * @param {number} x Relative X-coordinate.
 */
B.Scale.method('x', function(x) {
  return ((this.getLeft() + this._padding.getLeft()) * (1 - x) + (this.getRight() - this._padding.getRight()) * x) * this._scaleX + this._offsetX;
});

/**
 * @method Transform relative Y-coordinate to screen.
 * @param {number} x Relative Y-coordinate.
 */
B.Scale.method('y', function(y) {
  return ((this.getTop() + this._padding.getTop()) * (1 - y) + (this.getBottom() - this._padding.getBottom()) * y) * this._scaleY + this._offsetY;
});