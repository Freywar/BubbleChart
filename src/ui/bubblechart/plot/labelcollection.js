/**
 * @class B.LineCollection ControlCollection modification for B.Label.
 */
B.LabelCollection = cls('B.LabelCollection', B.ControlCollection);

B.LabelCollection.property('class', {value: B.Label, get: true});

B.LabelCollection.method('_applyValue', function(item, value) {
  item.setText(value.toFixed(2));//TODO add number formatting into labels
});

B.LabelCollection.method('_hideOverlappingChildren', function(left, right) {
  for (var i = 0; i < this._items.length; i++) {
    if (this._items[i].getLeft() < left || this._items[i].getLeft() + this._items[i].getWidth() > right)
      this._items[i].setVisible(false);
    else
      left = this._items[i].getLeft() + this._items[i].getWidth();
  }
  for (i = 0; i < this._items.length - 1; i++) {
    if (this._subcollections && this._subcollections[i]) {
      if (this._items[i].getVisible() && this._items[i + 1].getVisible()) {
        this._subcollections[i]._hideOverlappingChildren(this._items[i].getRight(), this._items[i + 1].getLeft());
      }
      else {
        this._subcollections[i]._hideOverlappingChildren(1, -1);//TODO use subcollection Visible instead
      }
    }
  }
});

B.LabelCollection.method('reflow', function() {
  B.LabelCollection.base.reflow.apply(this, arguments)

  if (this._items && this._direction === B.Direction.right) {
    this._items[0].setLeft(Math.max(this._items[0].getLeft(), this.getInnerLeft()));
    this._items[this._items.length - 1].setLeft(Math.min(this._items[this._items.length - 1].getLeft(), this.getInnerLeft() + this.getInnerWidth() - this._items[this._items.length - 1].getWidth()));
    this._hideOverlappingChildren(this.getInnerLeft(), this.getInnerLeft() + this.getInnerWidth());
  }
});