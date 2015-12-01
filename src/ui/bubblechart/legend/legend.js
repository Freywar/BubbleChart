/**
 * @class Legend.
 */
B.Legend = cls('B.Legend', B.Control, function() {
  B.Legend.base.constructor.apply(this, arguments);
  this._contItem = new B.BubbleLabel({radius: 0, text: '...'});
});

B.Legend.property('rows');
B.Legend.property('contItem');

/**
 * @property {B.Label} title Title to show on top of a legend.
 */
B.Legend.property('title', {value: null, get: true, set: true, type: B.Label});
/**
 * @property {B.BubbleLabel[]} items Items to show.
 */
B.Legend.property('items', {
  value: null, get: true, set: function(value) {
    if (value === this._items)
      return;
    this._items = [];
    if (value) {
      for (var i = 0; i < value.length; i++)
        this._items.push(new B.BubbleLabel(value[i]));
    }
  }
});

B.Legend.property('font', {value: null, get: true, set: true, type: B.Font});

B.Legend.method('reflow', function(space) {

  for (var i = 0; i < this._items.length; i++) {
    this._items[i].setContext(this._context);
    this._items[i].setHAlign(B.HAlign.auto);
    this._items[i].setVAlign(B.VAlign.auto);
    this._items[i].setFont(this._font);
    this._items[i].reflow(space);
  }
  this._contItem.setContext(this._context);
  this._contItem.setHAlign(B.HAlign.auto);
  this._contItem.setVAlign(B.VAlign.auto);
  this._contItem.setFont(this._font);
  this._contItem.reflow(space);

  if (this._hAlign !== B.HAlign.none)
    this._width = space.getWidth();
  if (this._vAlign !== B.VAlign.none)
    this._height = space.getHeight();

  var width = 0, height = 0, rows = [], row = {
    items: [],
    width: 0,
    height: 0
  };

  var reached = false;
  for (i = 0; i < this._items.length; i++) {
    if (row.width + this._items[i].getWidth() <= this.getInnerWidth()) {
      row.items.push(this._items[i]);
      row.width += this._items[i].getWidth();
      row.height = Math.max(row.height, this._items[i].getHeight());
    }
    else if (height + row.height <= this.getInnerHeight()) {
      height += row.height;
      width = Math.max(row.width, width);
      rows.push(row);
      row = {
        items: [],
        width: 0,
        height: 0
      };
      i--;
    }
    else {
      if (rows.length && rows[rows.length - 1].items.length)
        rows[rows.length - 1].items[rows[rows.length - 1].items.length - 1] = this._contItem;
      row = null;
      break;
    }
  }
  if (row) {
    height += row.height;
    width = Math.max(row.width, width);
    rows.push(row);
  }

  if (this._title) {
    this._title.setContext(this._context);
    this._title.setHAlign(B.HAlign.auto);
    this._title.setVAlign(B.HAlign.auto);
    this._title.reflow(space);
    width = Math.max(width, this._title.getWidth());
    height += this._title.getHeight();
  }

  if (this._hAlign !== B.HAlign.none) {
    this._width = width;
    this._width = this._width - this.getInnerWidth() + width;
  }
  if (this._vAlign !== B.VAlign.none) {
    this._height = height;
    this._height = this._height - this.getInnerHeight() + height;
  }

  B.Legend.base.reflow.apply(this, arguments);

  var top = this.getInnerTop() + this.getInnerHeight() / 2 - height / 2;
  if (this._title) {
    this._title.setLeft(this.getInnerLeft() + this.getInnerWidth() / 2 - this._title.getWidth() / 2);
    this._title.setTop(top);
    top += this._title.getHeight();
    height -= this._title.getHeight();
  }

  var y = 0;
  for (i = 0; i < rows.length; i++) {
    var x = 0;
    for (var j = 0; j < rows[i].items.length; j++) {
      rows[i].items[j].setLeft(this.getInnerLeft() + this.getInnerWidth() / 2 - rows[i].width / 2 + x);
      rows[i].items[j].setTop(top + y + rows[i].height / 2 - rows[i].items[j].getHeight() / 2);
      rows[i].items[j].reflow(space);//TODO add content coordinates update to BubbleLabel so full reflow could not be necessary
      x += rows[i].items[j].getWidth();

    }
    y += rows[i].height;
  }

  this._rows = rows;
});

B.Legend.method('repaint', function() {
  B.Legend.base.repaint.apply(this, arguments);
  if (this._title)
    this._title.repaint();
  for (var i = 0; i < this._rows.length; i++)
    for (var j = 0; j < this._rows[i].items.length; j++)
      this._rows[i].items[j].repaint();
});