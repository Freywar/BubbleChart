/**
 * @class B.LineCollection ControlCollection modification for B.Line.
 */
B.LineCollection = cls('B.LineCollection', B.ControlCollection);

B.LineCollection.property('class', {value: B.Line, get: true});
B.LineCollection.property('options', {value: {stroke: '#FFFFFF'}});


B.LineCollection.method('_reflowChildren', function(space) {
  if (!this._context || !this._visible)
    return;
  if (
    !this._items || !this._values || (this._subcollection && !this._subcollections) ||
    this._items.length !== this._count || this._values.length !== this._count ||
    (this._subcollection && this._subcollections && this._subcollections.length !== this._count - 1) ||
    this._values[0] !== this._min || this._values[this._values.length - 1] !== this._max
  )
    this._recreate();

  for (var i = 0; i < this._items.length; i++) {
    this._items[i].setContext(this._context);
    if (this._subcollections && this._subcollections[i]) {
      this._subcollections[i].setContext(this._context);
      this._subcollections[i].setScale(this._scale);
      this._subcollections[i]._reflowChildren(space);
    }
  }
});

B.LineCollection.method('_realignChildren', function() {
  for (var i = 0; i < this._items.length; i++) {
    var position = this._transformer.transform(this._values[i]);

    if (this._direction === B.Direction.up || this._direction === B.Direction.down) {

      if (this._direction === B.Direction.up)
        position = 1 - position;

      this._items[i].setX1(this.getInnerLeft());
      this._items[i].setY1(this._scale.y(position));
      this._items[i].setX2(this.getInnerLeft() + this.getInnerWidth());
      this._items[i].setY2(this._scale.y(position));
    }
    else {
      if (this._direction === B.Direction.left)
        position = 1 - position;

      this._items[i].setX1(this._scale.x(position));
      this._items[i].setY1(this.getInnerTop());
      this._items[i].setX2(this._scale.x(position));
      this._items[i].setY2(this.getInnerTop() + this.getInnerHeight());
    }

    if (this._subcollections && this._subcollections[i]) {
      this._subcollections[i].setHAlign(this._hAlign);
      this._subcollections[i].setVAlign(this._vAlign);
      this._subcollections[i].setDirection(this._direction);
      this._subcollections[i]._realignChildren();
    }
  }
});

B.LineCollection.method('reflow', function(space) {
  this.setPadding(0);
  B.LineCollection.base.reflow.apply(this, arguments);
});