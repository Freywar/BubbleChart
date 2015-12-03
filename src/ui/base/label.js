/**
 * @class Simple label.
 */
B.Label = cls('B.Label', B.Control);

/**
 * @property {String[]} lines Lines to render after splitting, ellipsis and other internal calculations.
 */
B.Label.property('lines');
/**
 * @property {String} text Text to render. If no text specified with any alignment except non - sizes collapse to zero and nothing is rendered.
 */
B.Label.property('text', {value: '', get: true, set: true});
/**
 * @property {B.Direction} direction Text direction.
 */
B.Label.property('direction', {value: B.Direction.right, get: true, set: true});
/**
 * @property {B.Font} direction Text font.
 */
B.Label.property('font', {value: null, get: true, set: true, type: B.Font});
/**
 * @property {B.Direction} textAlign Horizontal alignment of text inside label.
 */
B.Label.property('textAlign', {value: B.HAlign.left, get: true, set: true});

B.Label.method('reflow', function reflow(space) {
  if (this._assertReflow(!this._text))
    return;

  if (this._hAlign !== B.HAlign.none) {
    this._width = space.getWidth();
  }
  if (this._vAlign !== B.VAlign.none) {
    this._height = space.getHeight();
  }

  var width = this._direction === B.Direction.left || this._direction === B.Direction.right ? this.getInnerWidth() : this.getInnerHeight();
  var height = this._direction === B.Direction.left || this._direction === B.Direction.right ? this.getInnerHeight() : this.getInnerWidth();

  var spaceSize = this._font.measure(' ');
  var spaceWidth = spaceSize.width;
  var threeDotsWidth = this._font.measure('...').width;
  var lineHeight = spaceSize.height;
  var lines = this._text.split('\n'),
    maxWidth = 0,
    isLastLine = false;
  for (var i = 0; i < lines.length && !isLastLine; i++) {
    isLastLine = (i + 1) * lineHeight <= height && (i + 2) * lineHeight > height;
    var line = '',
      lineWidth = 0,
      words = lines[i].split(' '),
      lineSplitted = false;

    for (var j = 0; j < words.length; j++) {
      var rSpaceWidth = lineWidth ? spaceWidth : 0;
      var llAdd = isLastLine ? threeDotsWidth : 0;
      var wordWidth = this._font.measure(words[j]).width;
      if (lineWidth + rSpaceWidth + wordWidth + llAdd < width) {
        line += (line ? ' ' : '') + words[j];
        lineWidth += rSpaceWidth + wordWidth;
        maxWidth = Math.max(maxWidth, lineWidth);
      }
      else {
        if (!line)
          isLastLine = true;

        if (isLastLine && j < words.length - 1) {
          line += '...';
          lineWidth += llAdd;
        }
        maxWidth = Math.max(maxWidth, lineWidth);
        lines.splice(i, 0, line);
        lineSplitted = true;
        break;
      }
    }
    if (!lineSplitted) {
      if (line) {
        lines[i] = line;
      }
      else {
        lines.splice(i, 1);
        i--;
      }
      if (isLastLine && lines.length > i - 1) {
        lines[i] += '...';
      }
    }
  }
  if (isLastLine) {
    lines.splice(i, lines.length - i);
  }
  //TODO add truncating of long words

  this._lines = lines;

  if (this._hAlign !== B.HAlign.none) {
    this._width = maxWidth;
    this._width = this._width - this.getInnerWidth() + maxWidth;
  }
  if (this._vAlign !== B.VAlign.none) {
    this._height = lines.length * lineHeight; //TODO implement and use setInnerHeight
    this._height = this._height - this.getInnerHeight() + lines.length * lineHeight;
  }

  if (this._direction === B.Direction.up || this._direction === B.Direction.down) {
    var t = this._width;
    this._width = this._height;
    this._height = t;
  }

  B.Label.base.reflow.apply(this, arguments);
});

B.Label.method('_repaintText', function() {
  var oh = -this.getInnerHeight() / 2,
    rotation = 0;
  this._context.translate(Math.round(this._left + this._width / 2), Math.round(this._top + this._height / 2));
  if (this._direction === B.Direction.up) {
    this._context.rotate(rotation = -Math.PI / 2);
    oh = -this.getInnerWidth() / 2;
  }
  else if (this._direction === B.Direction.down) {
    this._context.rotate(rotation = Math.PI / 2);
    oh = -this.getInnerWidth() / 2;
  }
  else if (this._direction === B.Direction.left) {
    this._context.rotate(rotation = -Math.PI);
  }

  this._context.fillStyle = this._font.getColor().toString();
  this._context.font = this._font.toString();
  this._context.textBaseline = 'top';
  for (var i = 0; i < this._lines.length; i++) {
    var size = this._font.measure(this._lines[i]), //TODO calculate this on reflow
      x = Math.round(-size.width / 2);
    if (this._textAlign === B.Direction.left)
      x = Math.round(-this.getInnerWidth() / 2);
    if (this._textAlign === B.Direction.right)
      x = Math.round((-this.getInnerWidth() - size.width) / 2);

    this._context.fillText(this._lines[i], x, Math.round(oh + i * size.height));
  }

  this._context.rotate(-rotation);
  this._context.translate(-Math.round(this._left + this._width / 2), -Math.round(this._top + this._height / 2));
});

B.Label.method('repaint', function repaint() {
  if (this._assertRepaint(!this._text))
    return;

  B.Label.base.repaint.apply(this, arguments);

  this._repaintText();
});