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