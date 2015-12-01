/**
 * @class B.Slider Slider to travel between slices in one of data dimensions.
 */
B.Slider = cls('B.Slider', B.Control, function(options) {
  evt(this, 'positionChange');
  B.Slider.base.constructor.apply(this, arguments);
});

B.Slider.property('_buttonHovered', {value: false});
B.Slider.property('_sliderHovered', {value: false});
B.Slider.property('_sliderDragged', {value: false});

B.Slider.property('_sliderAnimated', {value: false});
B.Slider.property('_sliderAnimatedPrevTime', {value: null});

B.Slider.method('_onMouseDown', function(args) {
  var start = this.getInnerLeft() + 32 + this._padding.getLeft() + 9;
  var length = this.getInnerLeft() + this.getInnerWidth() - start - 18;
  var st = this.getInnerTop() + 16.5;
  this._sliderDragged = args.x >= start && args.x <= start + length && args.y >= st - 9 && args.y <= st + 9;
  if (this._sliderDragged)
    this._onMouseMove(args);
});

B.Slider.method('_onMouseMove', function(args) {

  var start = this.getInnerLeft() + 32 + this._padding.getLeft() + 9;
  var length = this.getInnerLeft() + this.getInnerWidth() - start - 18;

  if (!this._sliderDragged) {

    var sl = start + length * this._position;
    var st = this.getInnerTop() + 16.5;
    var capture = false, changed = false;
    if (args.x >= this.getInnerLeft() && args.x <= this.getInnerLeft() + 32 && args.y >= this.getInnerTop() && args.y <= this.getInnerTop() + 32)
      changed = changed || (this._buttonHovered !== (capture = this._buttonHovered = true));
    else
      changed = changed || (this._buttonHovered !== (capture = this._buttonHovered = false));
    changed = changed || (this._sliderHovered !== (capture = capture || ( this._sliderHovered = args.x >= sl - 9 && args.x <= sl + 9 && args.y >= st - 9 && args.y <= st + 9)));
    this._capture = capture;
    if (changed)
      this.positionChange.invoke(this, {
        position: this._position,
        animation: this._sliderAnimated
      });
  }
  else {
    this._position = Utils.Number.normalize((args.x - start) / length);
    if (this.offset() < 0.03)
      this._position = Math.floor((this._position * (this._ticks.length - 1))) / (this._ticks.length - 1);
    if (this.offset() > 0.97)
      this._position = Math.ceil((this._position * (this._ticks.length - 1))) / (this._ticks.length - 1);

    this.positionChange.invoke(this, {
      position: this._position,
      animation: this._sliderAnimated
    });
  }
});

B.Slider.method('_onMouseUp', function(args) {
  this._sliderDragged = false;
  if (this._buttonHovered) {
    this._sliderAnimated = !this._sliderAnimated;
    if (this._sliderAnimated && this._position === 1)
      this._position = 0;
    this._sliderAnimatedPrevTime = new Date();
    this.positionChange.invoke(this, {
      position: this._position,
      animation: this._sliderAnimated
    });
  }
});

B.Slider.method('_onAnimationFrame', function(args) {
  if (this._sliderAnimated) {
    var time = new Date();
    var delta = (time - this._sliderAnimatedPrevTime) * this._speed / 1000 / (this._ticks.length - 1);
    this._position = Utils.Number.normalize(this._position + delta);
    if (this._position === 1)
      this._sliderAnimated = false;
    this._sliderAnimatedPrevTime = time;
    this.positionChange.invoke(this, {
      position: this._position,
      animation: this._sliderAnimated
    });
  }
});

/**
 * @property {number} position Position between slices. 0 - first slice, 1 - last slice, all intermediate values are supported.
 */
B.Slider.property('position', {
  value: 0, get: true, set: function(value) {
    this._position = value;
    this.positionChange.invoke(this, {
      position: this._position,
      animation: this._sliderAnimated
    });
  }
});
B.Slider.property('ticks', {
  value: null, get: true, set: function(value) {
    if (this._ticks === value)
      return;
    this._ticks = [];
    if (value) {
      for (var i = 0; i < value.length; i++)
        this._ticks.push(new B.SliderTick(value[i]));
    }
  }
});
/**
 * @property {number} speed Animation speed, ticks per second.
 */
B.Slider.property('speed', {value: 1, get: true, set: true});

/**
 * @method Get path of closest tick before current position.
 */
B.Slider.method('floor', function() {
  return this._ticks[Math.floor(this._position * (this._ticks.length - 1))].getPath();
});

/**
 * @method Get position between two closest ticks from 0 to 1.
 */
B.Slider.method('offset', function() {
  return this._position * (this._ticks.length - 1) - Math.floor((this._position * (this._ticks.length - 1)));
});

/**
 * @method Get path of closest tick after current position.
 */
B.Slider.method('ceil', function() {
  return this._ticks[Math.ceil(this._position * (this._ticks.length - 1))].getPath();
});

B.Slider.method('reflow', function(space) {

  var height = 0;
  for (var i = 0; i < this._ticks.length; i++) {
    this._ticks[i].setContext(this._context);
    this._ticks[i].setHAlign(B.HAlign.auto);
    this._ticks[i].setVAlign(B.VAlign.auto);
    this._ticks[i].reflow(space);
    height = Math.max(height, this._ticks[i].getHeight());
  }
  if (this._vAlign !== B.VAlign.none) {
    this._height = Math.max(16 + 5 + height, 32);
    this._height = this._height - this.getInnerHeight() + this._height;
  }

  B.Slider.base.reflow.apply(this, arguments);

  var start = this.getInnerLeft() + 32 + this._padding.getLeft() + 9;//TODO extract magic numbers to properties, maybe constant
  var length = this.getInnerLeft() + this.getInnerWidth() - start - 18;
  for (i = 0; i < this._ticks.length; i++) {
    this._ticks[i].setLeft(start + i * length / (this._ticks.length - 1) - this._ticks[i].getWidth() / 2);
    this._ticks[i].setTop(this.getInnerTop() + 16 + 9);
  }

});

B.Slider.method('repaint', function() {

  this._context.fillStyle = this._buttonHovered ? '#888888' : '#BBBBBB';

  this._context.beginPath(); //TODO extract to Button class
  if (!this._sliderAnimated) {
    this._context.moveTo(this.getInnerLeft(), this.getInnerTop());
    this._context.lineTo(this.getInnerLeft() + 32, this.getInnerTop() + 16);
    this._context.lineTo(this.getInnerLeft(), this.getInnerTop() + 32);
    this._context.closePath();
  }
  else {
    this._context.moveTo(this.getInnerLeft(), this.getInnerTop());
    this._context.lineTo(this.getInnerLeft(), this.getInnerTop() + 32);
    this._context.lineTo(this.getInnerLeft() + 10, this.getInnerTop() + 32);
    this._context.lineTo(this.getInnerLeft() + 10, this.getInnerTop());
    this._context.lineTo(this.getInnerLeft(), this.getInnerTop());

    this._context.moveTo(this.getInnerLeft() + 22, this.getInnerTop());
    this._context.lineTo(this.getInnerLeft() + 22, this.getInnerTop() + 32);
    this._context.lineTo(this.getInnerLeft() + 32, this.getInnerTop() + 32);
    this._context.lineTo(this.getInnerLeft() + 32, this.getInnerTop());
    this._context.lineTo(this.getInnerLeft() + 22, this.getInnerTop());
  }
  this._context.fill();


  this._context.fillStyle = '#BBBBBB';

  var start = this.getInnerLeft() + 32 + this._padding.getLeft();
  var length = this.getInnerLeft() + this.getInnerWidth() - start;

  this._context.fillRect(start, this.getInnerTop() + 16 - 2, length, 5);

  start += 9;
  length -= 18;

  for (var i = 0; i < this._ticks.length; i++) {
    this._context.fillStyle = '#BBBBBB';
    this._context.beginPath(); //TODO draw as single path
    this._context.arc(start + i * length / (this._ticks.length - 1), this.getInnerTop() + 16.5, 5, 0, Math.PI * 2);
    this._context.fill();
    this._ticks[i].repaint();
  }

  this._context.fillStyle = this._context.strokeStyle = this._sliderHovered ? '#888888' : '#BBBBBB';
  this._context.lineWidth = 2;
  this._context.globalAlpha = 0.5;
  this._context.beginPath();
  this._context.arc(start + length * this._position, this.getInnerTop() + 16.5, 9 + 1, 0, Math.PI * 2);
  this._context.fill();
  this._context.globalAlpha = 1;
  this._context.stroke();

  this._context.fillStyle = this._context.strokeStyle = '#888888';
  this._context.beginPath();
  this._context.arc(start + length * this._position, this.getInnerTop() + 16.5, 2, 0, Math.PI * 2);
  this._context.fill();


});