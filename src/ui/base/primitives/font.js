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