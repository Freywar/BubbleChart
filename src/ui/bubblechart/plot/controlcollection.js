/**
 * @class B.ControlCollection Autofilling collection of controls, whose one of the coordinate connected to interpolatable value.
 */
B.ControlCollection = cls('B.ControlCollection', B.Control);

/**
 * @property {Control[]} items Collection of controls.
 */
B.ControlCollection.property('items', {value: null});
/**
 * @property [number[]} values Values associated for each item.
 */
B.ControlCollection.property('values', {value: null});
/**
 * @property {function} class Constructor of which instances to be created as items.
 */
B.ControlCollection.property('class', {value: B.Control, get: true});
/**
 * @property {object} options Options for every instantiated item.
 */
B.ControlCollection.property('options', {value: null, get: true, set: true});

/**
 * @property {number} min Value of first item. It can not be obtained from transformer by collection itself because subcollection have to have different ranges.
 */
B.ControlCollection.property('min', {value: 0, get: true, set: true});
/**
 * @property {number} max Value of last item. It can not be obtained from transformer by collection itself because subcollection have to have different ranges.
 */
B.ControlCollection.property('max', {value: 0, get: true, set: true});
/**
 * @property {number} count Items count.
 */
B.ControlCollection.property('count', {value: 0, get: true, set: true});
/**
 * @property {B.Transformer} transformer Transformer to transform values into relative coordinates of items.
 */
B.ControlCollection.property('transformer', {value: null, get: true, set: true, type: B.Transformer});
/**
 * @property {B.Scale} scale Transformer to transform relative coordinates of items to screen coordinates.
 */
B.ControlCollection.property('scale', {value: null, get: true, set: true, type: B.Scale});
/**
 * @property {B.Direction} direction Direction in which values grow, defines which coordinate of items will be variated.
 */
B.ControlCollection.property('direction', {value: B.Direction.right, get: true, set: true});

/**
 * @property {B.ControlCollection} subcollection Collection which is drawn between two each item. This one is not drawn actually but acts like a template.
 */
B.ControlCollection.property('subcollection', {value: null, get: true, set: true});
/**
 * @property {B.ControlCollection[]} subcollections Actual instances of subcollection for each itembetweenage.
 */
B.ControlCollection.property('subcollections', {value: null});

B.ControlCollection.property('master', {value: null});
B.ControlCollection.property('slave', {value: null});
/**
 * @method Ability to synchronize same levels of different collection, so deeper subcollections of other one could not overlap higher subcollections of current.
 * @param {B.ControlCollection} other Other collection. Each of it's subcollections level will be drawn right before correcponding level of current collection.
 */
B.ControlCollection.method('synchronize', function(other) {
  this._slave = other;
  if (other)
    other.master = this;
});

/**
 * @method Create items and values.
 */
B.ControlCollection.method('_recreate', function() {
  if (!this._class || !Utils.Types.isFunction(this._class) || !this._count) {
    this._items = this._values = this._subcollections = null;
    return;
  }

  this._items = [];
  this._values = [];
  for (var i = 0; i < this._count; i++) {
    this._items[i] = new this._class(this._options);
    this._values[i] = this._min + i * (this._max - this._min) / (this._count - 1);
  }

  if (this._subcollection) {
    this._subcollections = [];
    for (i = 0; i < this._values.length - 1; i++) {
      this._subcollections[i] = new this.constructor(this._subcollection);
      this._subcollections[i].setMin(this._values[i]);
      this._subcollections[i].setMax(this._values[i + 1]);
    }
  }
});

/**
 * @method Do some specific modifications for items depending on value.
 * @param {number} value
 */
B.ControlCollection.method('_applyValue');

B.ControlCollection.method('_reflowChildren', function(space) {
  if (!this._context || !this._visible)
    return;

  this.setPadding(0);

  if (
    !this._items || !this._values || (this._subcollection && !this._subcollections) ||
    this._items.length !== this._count || this._values.length !== this._count ||
    (this._subcollection && this._subcollections && this._subcollections.length !== this._count - 1) ||
    this._values[0] !== this._min || this._values[this._values.length - 1] !== this._max
  )
    this._recreate();

  var size = 0;
  for (var i = 0; i < this._items.length; i++) {
    this._applyValue(this._items[i], this._values[i]);
    this._items[i].setContext(this._context);
    this._items[i].setVisible(true);
    this._items[i].setHAlign(B.HAlign.auto);
    this._items[i].setVAlign(B.VAlign.auto);
    this._items[i].reflow(space);

    size = Math.max(size, this._direction === B.Direction.up || this._direction === B.Direction.down ? this._items[i].getWidth() : this._items[i].getHeight());

    if (this._subcollections && this._subcollections[i]) {
      this._subcollections[i].setContext(this._context);
      this._subcollections[i].setHAlign(this._hAlign);
      this._subcollections[i].setVAlign(this._vAlign);
      this._subcollections[i].setDirection(this._direction);
      this._subcollections[i].setScale(this._scale);
      size = Math.max(size, this._subcollections[i]._reflowChildren(space));
    }
  }

  if (this._direction === B.Direction.up || this._direction === B.Direction.down && this._hAlign !== B.HAlign.none) {
    this._width = size;
    this._width = this._width - this.getInnerWidth() + size;
  }
  if (this._direction === B.Direction.left || this._direction === B.Direction.right && this._vAlign !== B.VAlign.none) {
    this._height = size;
    this._height = this._height - this.getInnerHeight() + size;
  }

  return size;
});

B.ControlCollection.method('_reflowSelf', function(space, callBase) {

  if (callBase)
    B.ControlCollection.base.reflow.apply(this, arguments);

  if (this._subcollections) {
    for (var i = 0; i < this._subcollections.length; i++) {
      this._subcollections[i].setTransformer(this._transformer);
      this._subcollections[i].setLeft(this._left);
      this._subcollections[i].setTop(this._top);
      this._subcollections[i].setWidth(this._width);
      this._subcollections[i].setHeight(this._height);
      this._subcollections[i]._reflowSelf(space);
    }
  }
});

B.ControlCollection.method('_realignChildren', function() {
  for (var i = 0; i < this._items.length; i++) {
    var position = this._transformer.transform(this._values[i]);

    if (this._direction === B.Direction.up || this._direction === B.Direction.down) {
      if (this._hAlign === B.HAlign.left)
        this._items[i].setLeft(this.getInnerLeft() + this.getInnerWidth() - this._items[i].getWidth());
      else if (this._hAlign === B.HAlign.right)
        this._items[i].setLeft(this.getInnerLeft());
      else
        this._items[i].setLeft(this.getInnerLeft() + this.getInnerWidth() / 2 - this._items[i].getWidth() / 2);
      if (this._direction === B.Direction.up)
        position = 1 - position;

      this._items[i].setTop(this._scale.y(position) - this._items[i].getHeight() / 2);
    }
    else {
      if (this._vAlign === B.VAlign.top)
        this._items[i].setTop(this.getInnerTop() + this.getInnerHeight() - this._items[i].getHeight());
      else if (this._vAlign === B.HAlign.bottom)
        this._items[i].setTop(this.getInnerTop());
      else
        this._items[i].setTop(this.getInnerTop() + this.getInnerHeight() / 2 - this._items[i].getHeight() / 2);
      if (this._direction === B.Direction.left)
        position = 1 - position;

      this._items[i].setLeft(this._scale.x(position) - this._items[i].getWidth() / 2); //TODO extract this values as scale object
    }
    if (this._subcollections && this._subcollections[i])
      this._subcollections[i]._realignChildren();
  }
});

B.ControlCollection.method('reflow', function(space, realignOnly) {
  if (!this._context || !this._visible)
    return;
  if (!realignOnly) {
    this._reflowChildren(space); //first we have to recursively calculate all items sizes in all subcollections and calculate own size depending on them
    this._reflowSelf(space, true); //then we can apply self alignment and recursively align subcollections with self
  }
  this._realignChildren(); //finally we can set each item's position depending on self position and transformed value
});

B.ControlCollection.method('_repaint', function(currentLevel, levelToRender) {
  if (!this._context || !this._visible)
    return;
  if (levelToRender) {
    if (this._subcollections)
      for (var i = 0; i < this._subcollections.length; i++)
        this._subcollections[i]._repaint(currentLevel + 1, levelToRender - 1);
    return;
  }

  if (!Utils.Types.isNumber(levelToRender) && this._subcollections) {
    for (var i = 0; i < this._subcollections.length; i++)
      this._subcollections[i]._repaint(currentLevel + 1);
  }

  if (this._slave)
    this._slave._repaint(0, currentLevel);

  for (var i = 0; i < this._items.length; i++)
    this._items[i].repaint();
});

B.ControlCollection.method('repaint', function() {
  if (this._master)
    return; //master will call internal _repaint directly when he is repainted
  this._clip();
  this._repaint(0);
  this._unclip();
});