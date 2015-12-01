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