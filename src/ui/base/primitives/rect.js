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