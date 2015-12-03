/**
 * @class B.Tooltip Comic balloon-style tooltip.
 */
B.Tooltip = cls('B.Tooltip', B.Label);

/**
 * @property {number} x X-coordinate of point which balloon targets, pixels. Left/Right/Width/HAlign/Margin properties are always ignored.
 */
B.Tooltip.property('x', {value: 0, get: true, set: true});
/**
 * @property {number} y Y-coordinate of point which balloon targets, pixels. Top/Bottom/Height/VAlign/Margin properties are always ignored.
 */
B.Tooltip.property('y', {value: 0, get: true, set: true});
/**
 * @property {number} offset Offset from target point to ArrowDirection, pixels.
 * May be adjusted automatically if point is out of provided space, adjusted value is not stored.
 */
B.Tooltip.property('offset', {value: 0, get: true, set: true});

/**
 * @property {number} arrowWidth Width of ballon arrow, pixels.
 * Not a width in terms of screen coordinates but distance from one base point to other.
 */
B.Tooltip.property('arrowWidth', {value: 5, get: true, set: true});
/**
 * @property {number} arrowLength Length of ballon arrow, pixels.
 * Distance from tip to base.
 */
B.Tooltip.property('arrowLength', {value: 5, get: true, set: true});
/**
 * @property {number} arrowPosition Length of ballon arrow, relative (0-1) value of which side it is connected.
 * May be adjusted automatically if there is not enough space, adjusted value is not stored.
 */
B.Tooltip.property('arrowPosition', {value: 0.3, get: true, set: true});
/**
 * @property {B.Direction} arrowDirection Direction in which balloon grows from target point.
 * May be switched automatically if there is not enough space in that direction, adjusted value is not stored.
 * TODO confusing name, switch left-right/up-down, so it could define actual arrow direction
 */
B.Tooltip.property('arrowDirection', {value: B.Direction.up, get: true, set: true});
/**
 * @property {boolean} isOut Property shows if target point is out of space and offset is changed.
 */
B.Tooltip.property('isOut', {value: false, get: true});

/**
 * @method Simple check flipping side if it is out of bounds
 */
B.Tooltip.method('_flippingTest', function(coords, current, opposite, meaning) {
  var delta = 0,
    directionMultiplier = current === meaning ? -1 : 1,
    sd = coords[current].limit - coords[current].value;

  if (coords[current].side !== coords.side && sd * directionMultiplier < 0 && !coords.flipped) { //if this is not an arrowed side and it is out of bounds
    coords.side = coords[current].side; //switch arrow direction to opposite
    coords.flipped = true;
    var dvalue = coords[current].target - directionMultiplier * ( coords[current].value + this._offset + this._arrowLength ) - (1 - directionMultiplier) * coords[meaning].value; // set new coordinates
    coords[current].value += dvalue;
    coords[opposite].value += dvalue;
    sd -= dvalue;
  }

  delta = sd - directionMultiplier * this._arrowLength;//if this side is out of bounds
  if (sd * directionMultiplier < this._arrowLength) {
    this._isOut = true;
    coords[current].value += delta; // move tooltip back to bounds
    coords[opposite].value += delta;
  }
});

/**
 * @method Complex check rotating side if it is out of bounds.
 */
B.Tooltip.method('_rotatingTest', function(coords, current, opposite, otherIndex, otherOppositeIndex, otherMeaning, otherSecondary, meaning) {
  var delta = coords[current].limit - coords[current].value; //if side if out of bounds

  var mult = current === meaning ? -1 : 1;
  var check = current !== meaning;
  if (delta * mult < 0) {
    coords[current].value += delta; //return tooltip into bounds
    coords[opposite].value += delta;
    coords.arrowOffset -= delta; //and move arrow by it's side

    var so = check ? mult * (coords[current].value - coords[opposite].value) : 0;

    if (coords.arrowOffset * mult > so - coords.minOffset - this._arrowLength / 2) //if it is out of bounds now
    {
      coords.side = coords[current].side; //then move tail to next side clockwise
      coords.arrowOffset = -mult * (coords[otherIndex].value - coords[otherOppositeIndex].value) / 2; //to the center of the side
      var d1 = coords[otherIndex].target - coords.arrowOffset - coords[otherMeaning].value;
      coords[otherIndex].value += d1; //and adjust toolitp's vertical position
      coords[otherOppositeIndex].value += d1;
      var d2 = coords[meaning].target - mult * ( this._offset + this._arrowLength ) - so - coords[meaning].value;
      coords[current].value += d2; //and horizontal
      coords[opposite].value += d2;

      delta = coords[otherSecondary].limit - coords[otherSecondary].value; //if tooltip is out of bounds now
      if (delta < 0) {
        coords[otherMeaning].value += delta; //ireturn it into bounds
        coords[otherSecondary].value += delta;
        coords.arrowOffset = Math.min(coords[otherSecondary].value - coords[otherMeaning].value - coords.minOffset - this._arrowLength / 2, coords.arrowOffset - delta); //and adjust arrow so it do not overlap border radiuses
      }

      delta = coords[otherMeaning].limit - coords[otherMeaning].value;
      if (delta > 0) {
        coords[otherMeaning].value += delta;
        coords[otherSecondary].value += delta; //same check for another side
        coords.arrowOffset = Math.max(coords.minOffset + this._arrowLength / 2, coords.arrowOffset - delta);
      }


      delta = coords[current].limit - coords[current].value - mult * this._arrowLength;
      if (delta * mult < 0) {
        this._isOut = true;
        coords[current].value += delta; //and another
        coords[opposite].value += delta;
      }

    }
  }
});

/**
 * @method Adjust position and direction so tooltip is inside space and pointing to target.
 */
B.Tooltip.method('_calcPosition', function(top, left, arrowOffset, minOffset, space) {

  if (space) {
    var right = left + this.getWidth();
    var bottom = top + this.getHeight();

    var coords = {
      side: this._arrowDirection,
      arrowOffset: arrowOffset,
      minOffset: minOffset,
      left: {value: left, limit: space.getLeft(), side: B.Direction.right, target: this._x},
      up: {value: top, limit: space.getTop(), side: B.Direction.down, target: this._y},
      right: {value: right, limit: space.getRight(), side: B.Direction.left, target: this._x},
      down: {value: bottom, limit: space.getBottom(), side: B.Direction.up, target: this._y}
    };

    this._isOut = false;
    if (this._arrowDirection === B.Direction.up || this._arrowDirection === B.Direction.down) {
      this._flippingTest(coords, B.Direction.up, B.Direction.down, B.Direction.up);
      this._flippingTest(coords, B.Direction.down, B.Direction.up, B.Direction.up);
      this._rotatingTest(coords, B.Direction.left, B.Direction.right, B.Direction.down, B.Direction.up, B.Direction.up, B.Direction.down, B.Direction.left);
      this._rotatingTest(coords, B.Direction.right, B.Direction.left, B.Direction.up, B.Direction.down, B.Direction.up, B.Direction.down, B.Direction.left);

    }
    else {
      this._flippingTest(coords, B.Direction.left, B.Direction.right, B.Direction.left);
      this._flippingTest(coords, B.Direction.right, B.Direction.left, B.Direction.left);
      this._rotatingTest(coords, B.Direction.up, B.Direction.down, B.Direction.right, B.Direction.left, B.Direction.left, B.Direction.right, B.Direction.up);
      this._rotatingTest(coords, B.Direction.down, B.Direction.up, B.Direction.left, B.Direction.right, B.Direction.left, B.Direction.right, B.Direction.up);
    }

    top = coords[B.Direction.up].value;
    left = coords[B.Direction.left].value;

    return {top: top, left: left, side: coords.side, arrowOffset: coords.arrowOffset};
  }
});

B.Tooltip.method('reflow', function(space) {
  if (this._assertReflow(!this._text))
    return;

  this._hAlign = B.HAlign.auto;
  this._vAlign = B.VAlign.auto;

  B.Tooltip.base.reflow.apply(this, arguments);


  var left = 0, top = 0, arrowOffset = 0, side = this._arrowDirection, newCoords,
    innerWidth = this.getWidth(),
    innerHeight = this.getHeight();


  var borderR = this._border.getRadius();
  var borderW = this._border.getWidth();


  side = this._arrowDirection;
  var minOffset = borderR + this._arrowLength + 0;
  if (side === B.Direction.up || side === B.Direction.down) {
    arrowOffset = innerWidth * this._arrowPosition;

    if (arrowOffset < minOffset)
      arrowOffset = minOffset;
    if (arrowOffset > innerWidth - minOffset)
      arrowOffset = innerWidth - minOffset;

    left = this._x - arrowOffset;

    if (side === B.Direction.up)
      top = this._y - innerHeight - this._offset - this._arrowLength;

    if (side === B.Direction.down)
      top = this._y + this._offset + this._arrowLength;
  }

  else if (side === B.Direction.left || side === B.Direction.right) {
    arrowOffset = innerHeight * this._arrowPosition;

    if (arrowOffset < minOffset)
      arrowOffset = minOffset;
    if (arrowOffset > innerHeight - minOffset)
      arrowOffset = innerHeight - minOffset;

    top = this._y - arrowOffset;

    if (side === B.Direction.left)
      left = this._x - innerWidth - this._offset - this._arrowLength;

    if (side === B.Direction.right)
      left = this._x + this._offset + this._arrowLength;
  }
  else {
    left = this._x - innerWidth / 2;
    top = this._y - innerHeight / 2;
  }
  top -= borderW / 2;
  left -= borderW / 2;
  innerWidth += borderW + 1;
  innerHeight += borderW + 1;
  if (side) {
    newCoords = this._calcPosition(top, left, arrowOffset, minOffset - this._arrowLength, space);
    if (newCoords) {
      top = newCoords.top;
      left = newCoords.left;
      side = newCoords.side;
      arrowOffset = newCoords.arrowOffset;
    }
  }
  top += borderW / 2;
  left += borderW / 2;
  innerWidth -= borderW + 1;
  innerHeight -= borderW + 1;


  this._data = {
    width: innerWidth,
    height: innerHeight,
    side: side,
    arrowOffset: arrowOffset
  };

  this._left = left;
  this._top = top;
  this._width = innerWidth;
  this._height = innerHeight;
});

B.Tooltip.property('data', {value: null});

B.Tooltip.method('repaint', function() {
  if (this._assertRepaint(!this._text))
    return;

  var side = this._data.side,
    arrowOffset = this._data.arrowOffset,
    borderW = this._border.getWidth(),
    borderR = this._border.getRadius(),
    aliasOffset = (borderW % 2) / 2,
    arrowStart = arrowOffset - this._arrowLength / 2,
    arrowEnd = arrowOffset + this._arrowLength / 2,
    cRight = this._width - borderR,
    cBottom = this._height - borderR;

  this._context.translate(Math.round(this._left) + aliasOffset, Math.round(this._top) + aliasOffset);

  this._context.beginPath();

  this._context.moveTo(borderR, 0);

  if (side === B.Direction.down) {
    this._context.lineTo(arrowStart, 0);
    this._context.lineTo(arrowOffset, -this._arrowLength);
    this._context.lineTo(arrowEnd, 0);
  }

  this._context.arc(cRight, borderR, borderR, -Math.PI / 2, 0);

  if (side === B.Direction.left) {
    this._context.lineTo(this._width, arrowStart);
    this._context.lineTo(this._width + this._arrowLength, arrowOffset);
    this._context.lineTo(this._width, arrowEnd);
  }

  this._context.arc(cRight, cBottom, borderR, 0, Math.PI / 2);

  if (side === B.Direction.up) {
    this._context.lineTo(arrowEnd, this._height);
    this._context.lineTo(arrowOffset, this._height + this._arrowLength);
    this._context.lineTo(arrowStart, this._height);
  }

  this._context.arc(borderR, cBottom, borderR, Math.PI / 2, Math.PI);

  if (side === B.Direction.right) {
    this._context.lineTo(0, arrowEnd);
    this._context.lineTo(-this._arrowLength, arrowOffset);
    this._context.lineTo(0, arrowStart);
  }

  this._context.arc(borderR, borderR, borderR, Math.PI, 3 * Math.PI / 2);

  this._background.apply(this._context);
  this._context.fill();
  this._border.apply(this._context);
  this._context.stroke();

  this._context.translate(-Math.round(this._left) + aliasOffset, -Math.round(this._top) + aliasOffset);

  this._repaintText();

});