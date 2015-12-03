/**
 * @class B.BubbleLabel Bubble with label.
 * @type {Function}
 */
B.BubbleLabel = cls('B.BubbleLabel', B.Control, function(options) {
  B.BubbleLabel.base.constructor.apply(this, arguments);
  this._bubble = new B.Bubble();
  this._label = new B.Label();
});

B.BubbleLabel.property('bubble');
B.BubbleLabel.property('label');

/**
 * @property {String} text Text of a label.
 */
B.BubbleLabel.property('text', {get: true, set: true});
/**
 * @property {B.Font} font Font of a label.
 */
B.BubbleLabel.property('font', {get: true, set: true, type: B.Font});
/**
 * @property {number} radius Radius of a bubble.
 */
B.BubbleLabel.property('radius', {value: 8, get: true, set: true});
/**
 * @property {B.Color} color Color of a bubble.
 */
B.BubbleLabel.property('color', {value: '#888888', get: true, set: true, type: B.Color});

B.BubbleLabel.method('reflow', function(space) {
  if (this._assertReflow(!this._text ||!this._radius))
    return;

  this._label.setContext(this._context);
  this._label.setHAlign(B.HAlign.auto);
  this._label.setVAlign(B.VAlign.auto);
  this._label.setText(this._text);
  this._label.setFont(this._font);
  this._label.reflow(space);

  this._bubble.setContext(this._context);

  var width = this._radius * 2 + this._label.getWidth();
  if (this._hAlign !== B.HAlign.none) {

    this._width = width;
    this._width = this._width - this.getInnerWidth() + width;
  }

  var height = Math.max(this._radius * 2, this._label.getHeight());
  if (this._vAlign !== B.VAlign.none) {

    this._height = height;
    this._height = this._height - this.getInnerHeight() + height;
  }

  B.BubbleLabel.base.reflow.apply(this, arguments);

  this._bubble.setX(this.getInnerLeft() + this.getInnerWidth() / 2 - width / 2 + this._radius);
  this._bubble.setY(this.getInnerTop() + this.getInnerHeight() / 2);
  this._bubble.setR(this._radius);
  this._bubble.setColor(this._color);
  this._bubble.skip();

  this._label.setLeft(this.getInnerLeft() + this.getInnerWidth() / 2 - width / 2 + this._radius * 2);
  this._label.setTop(this.getInnerTop() + this.getInnerHeight() / 2 - this._label.getHeight() / 2);
});

B.BubbleLabel.method('repaint', function() {
  if (this._assertRepaint(!this._text ||!this._radius))
    return;
  B.BubbleLabel.base.repaint.apply(this, arguments);
  this._bubble.repaint();
  this._label.repaint();
});