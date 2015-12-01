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