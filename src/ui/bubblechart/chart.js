B.Chart = cls('B.Chart', B.Control, function(options) {
  delegate(this, '_onSliderPositionChange');
  delegate(this, '_onPlotScaleChange');
  delegate(this, '_onBubbleHover');
  delegate(this, '_onChildInvalidated');
  B.Chart.base.constructor.apply(this, arguments);
});

/**
 * @property {B.Color[]} Default colors of bubbles if no color transformer provided.
 */
B.Chart.property('palette', {
  value: [
    '#82BAB6', '#B1CA40', '#EBAF36', '#60A1FA', '#FF462C',
    '#933DA8', '#FFD900', '#FF9191', '#6BBC80', '#A0CBC8',
    '#C3D66C', '#EFC164', '#86B7FB', '#FF705B', '#AC6BBC',
    '#FFE23D', '#FFABAB', '#8ECC9E', '#B7D7D5', '#D2E090',
    '#F3D08B', '#A3C8FC', '#FF9384', '#C08ECC', '#FFE86A',
    '#FFBFBF', '#A9D8B5', '#CDE3E2', '#DFE9B2', '#F7DFAF',
    '#C0D9FD', '#FFB6AC', '#E9D8ED', '#FFEF99', '#FFD3D3'
  ],
  get: true,
  set: true
});

B.Chart.property('context', {
  value: null, get: true, set: function(value) {
    if (this._context)
      this._unbindNative(this._context.canvas);
    this._context = value;
    if (this._context)
      this._bindNative(this._context.canvas);
  }
});

B.Chart.property('data', {value: null, get: true, set: true, type: B.Data});
B.Chart.property('xTransformer', {value: null, get: true, set: true, type: B.Transformer});
B.Chart.property('yTransformer', {value: null, get: true, set: true, type: B.Transformer});
B.Chart.property('rTransformer', {value: null, get: true, set: true, type: B.Transformer});
B.Chart.property('cTransformer', {value: null, get: true, set: true, type: B.ColorTransformer});

/**
 * @property {B.Bubble[]} Bubbles to show on the plot.
 */
B.Chart.property('bubbles', {
  value: null, get: true, set: function(value) {
    if (this._bubbles !== value) {
      if (this._bubbles)
        for (var i = 0; i < value.length; i++) {
          this._bubbles[i].hover.remove(this._onBubbleHover);
          this._bubbles[i].invalidated.remove(this._onChildInvalidated);
        }

      this._bubbles = [];
      if (value) {
        for (var i = 0; i < value.length; i++) {
          this._bubbles.push(new B.Bubble(value[i]));
          this._bubbles[i].hover.add(this._onBubbleHover);
          this._bubbles[i].invalidated.add(this._onChildInvalidated);
        }
      }
    }
  }

});

B.Chart.property('title', {value: null, get: true, set: true, type: B.Label});
B.Chart.property('plot', {
  value: null, get: true, set: function(value) {
    if (this._plot !== value) {
      if (this._plot)
        this._plot.scaleChange.remove(this._onPlotScaleChange);
      if (!(value instanceof B.Plot))
        value = new B.Plot(value);
      this._plot = value;
      if (this._plot)
        this._plot.scaleChange.add(this._onPlotScaleChange);
    }

  }, type: B.Plot
});
B.Chart.property('slider', {
  value: null, get: true, set: function(value) {
    if (this._slider)
      this._slider.positionChange.remove(this._onSliderPositionChange);
    if (!(value instanceof  B.Slider))
      value = new B.Slider(value);
    this._slider = value;
    if (this._slider)
      this._slider.positionChange.add(this._onSliderPositionChange)
  }, type: B.Slider
});
B.Chart.property('bubblesLegend', {value: null, get: true, set: true, type: B.Legend});
B.Chart.property('colorLegend', {value: null, get: true, set: true, type: B.ValueLegend});
B.Chart.property('radiusLegend', {value: null, get: true, set: true, type: B.ValueLegend});
B.Chart.property('tooltip', {value: null, get: true, set: true, type: B.Tooltip});

B.Chart.method('_onSliderPositionChange', function(sender, args) {
  this._updateData(args.animation);
  this.repaint();
});

B.Chart.method('_onPlotScaleChange', function(sender, args) {
  this._plot.reflow(this._plot.getOuterRect());

  var labels;

  if (this._plot && this._plot.getX() && (labels = this._plot.getX().getLabels()))
    labels.reflow(labels.getOuterRect(), true);

  if (this._plot && this._plot.getY() && (labels = this._plot.getY().getLabels()))
    labels.reflow(labels.getOuterRect(), true);

  this._updateData(true);
  this.repaint();
});

B.Chart.method('_onBubbleHover', function(sender, args) {
  if (sender !== this._hoveredBubble || !args.hover) {
    this._hoveredBubble = args.hover ? sender : null;
    this._reflowTooltip();
    this.invalidate(false, true);
  }
});

B.Chart.method('_onChildInvalidated', function(sender, args) {
  this.invalidate(false, true);
});

B.Chart.method('_handle', function(args) {
  if (this._bubbles)
    for (var i = this._bubbles.length - 1; i >= 0; i--)
      this._bubbles[i]._handle(args);

  if (this._plot)
    this._plot._handle(args);
  if (this._slider)
    this._slider._handle(args);

  this._invalidate(args.reflow, args.repaint);
});

B.Chart.method('_updateData', function(isAnimation) {
  if (!this._plot)
    return;

  var bubbles = this._bubbles;
  if (!bubbles)
    return;

  var sliderF = this._slider.floor();
  var sliderO = this._slider.offset();
  var sliderC = this._slider.ceil();
  var scale = this._plot.getScale();
  for (var i = 0; i < bubbles.length; i++) {
    var bubble = bubbles[i],
      pathF = bubble.getPath().concat(sliderF),
      pathC = bubble.getPath().concat(sliderC);

    bubble.setContext(this._context);

    if (this._xTransformer)
      bubble.setX(scale.x(this._xTransformer.transformedItem(pathF, pathC, sliderO)));

    if (this._yTransformer)
      bubble.setY(scale.y(1 - this._yTransformer.transformedItem(pathF, pathC, sliderO)));

    if (!isAnimation && bubble.getState() === B.Bubble.States.waiting)
      bubble.skip();

    if (this._rTransformer)
      bubble.setR(50 * this._rTransformer.transformedItem(pathF, pathC, sliderO));

    if (this._cTransformer && this._cTransformer.getPath())
      bubble.setColor(this._cTransformer.transformedItem(pathF, pathC, sliderO));
    else
      bubble.setColor(this._palette[i % this._palette.length]);

    if (isAnimation)
      bubble.skip();
  }
});

B.Chart.property('_hoveredBubble');
B.Chart.method('_reflowTooltip', function() {
  if (!this._plot || !this._tooltip)
    return;
  if (this._hoveredBubble) {
    var sliderF = this._slider.floor();
    var sliderO = this._slider.offset();
    var sliderC = this._slider.ceil();
    var pathF = this._hoveredBubble.getPath().concat(sliderF),
      pathC = this._hoveredBubble.getPath().concat(sliderC),
      name = this._data.name([''].concat(this._hoveredBubble.getPath())),
      nameF = this._data.name([''].concat(pathF)),
      nameC = this._data.name([''].concat(pathC));

    var lines = [name + ', ' + (nameF === nameC ? nameF : nameF + ' - ' + nameC)], value;

    if (this._xTransformer)
      lines.push(this._xTransformer.name() + ': ' + ((value = this._xTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    if (this._yTransformer)
      lines.push(this._yTransformer.name() + ': ' + ((value = this._yTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    if (this._rTransformer)
      lines.push(this._rTransformer.name() + ': ' + ((value = this._rTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    if (this._cTransformer && this._cTransformer.getPath())
      lines.push(this._cTransformer.name() + ': ' + ((value = this._cTransformer.item(pathF, pathC, sliderO)) !== null ? value.toFixed(2) : 'no data'));

    this._tooltip.setText(Utils.Array.unique(lines).join('\n'));

    this._tooltip.setContext(this._context);
    this._tooltip.setVisible(true);
    this._tooltip.setX(this._hoveredBubble.getX());
    this._tooltip.setY(this._hoveredBubble.getY());
    this._tooltip.setOffset(this._hoveredBubble.getR());
    this._tooltip.getBorder().setColor(this._hoveredBubble.getColor());
    this._tooltip.reflow(this._plot.getInnerRect());
  }
  else
    this._tooltip.setVisible(false);
});

B.Chart.method('reflow', function reflow(space) {
  if (this._assertReflow())
    return;

  if (this._hAlign !== B.HAlign.none) {
    this._left = space.getLeft();
    this._width = space.getWidth();
  }
  if (this._vAlign !== B.VAlign.none) {
    this._top = space.getTop();
    this._height = space.getHeight();
  }

  var innerSpace = new B.Rect({
    left: this.getInnerLeft(),
    top: this.getInnerTop(),
    width: this.getInnerWidth(),
    height: this.getInnerHeight()
  });

  if (this._title) {
    this._title.setContext(this._context);
    this._title.setHAlign(B.HAlign.center);
    this._title.setVAlign(B.VAlign.top);
    this._title.reflow(innerSpace);
    innerSpace.setTop(innerSpace.getTop() + this._title.getHeight());
    innerSpace.setHeight(innerSpace.getHeight() - this._title.getHeight());
  }

  if (this._slider) {
    this._slider.setContext(this._context);
    this._slider.setHAlign(B.HAlign.fit);
    this._slider.setVAlign(B.VAlign.bottom);

    var ticks = this._slider.getTicks();
    for (var i = 0; i < ticks.length; i++)
      ticks[i].setText(this._data.name(['', ''].concat(ticks[i].getPath())));

    this._slider.reflow(innerSpace);
    innerSpace.setHeight(innerSpace.getHeight() - this._slider.getHeight());
  }

  if (this._xTransformer)
    this._xTransformer.setData(this._data);
  if (this._yTransformer)
    this._yTransformer.setData(this._data);
  if (this._rTransformer)
    this._rTransformer.setData(this._data);
  if (this._cTransformer)
    this._cTransformer.setData(this._data);

  var legendSpace = innerSpace.clone(), legendHeight = 0, legendVAlign = B.VAlign.bottom;

  if (this._rTransformer && this._rTransformer.getPath() && this._radiusLegend) {
    this._radiusLegend.setContext(this._context);
    this._radiusLegend.setTransformer(this._rTransformer);
    this._radiusLegend.setHAlign(B.HAlign.right);
    this._radiusLegend.setVAlign(B.VAlign.bottom);
    this._radiusLegend.reflow(legendSpace);
    legendSpace.setTop(this._radiusLegend.getTop());
    legendSpace.setHeight(this._radiusLegend.getHeight());
    legendSpace.setWidth(this._radiusLegend.getLeft() - legendSpace.getLeft());
    legendHeight = Math.max(this._radiusLegend.getHeight(), legendHeight);
    legendVAlign = B.VAlign.top;
  }

  if (this._cTransformer && this._cTransformer.getPath() && this._colorLegend) {
    this._colorLegend.setContext(this._context);
    this._colorLegend.setTransformer(this._cTransformer);
    this._colorLegend.setHAlign(B.HAlign.left);
    this._colorLegend.setVAlign(legendVAlign);
    this._colorLegend.reflow(legendSpace);
    legendHeight = Math.max(this._colorLegend.getHeight(), legendHeight);
  }

  if (!(this._cTransformer && this._cTransformer.getPath()) && this._bubblesLegend && this._plot && this._bubbles) {
    var bubbles = this._bubbles, items = [];
    for (i = 0; i < bubbles.length; i++)
      items.push({
        text: this._data.name([''].concat(bubbles[i].getPath())),
        color: this._palette[i % this._palette.length]
      });

    this._bubblesLegend.setContext(this._context);
    this._bubblesLegend.setItems(items); //TODO do not recreate items each time
    this._bubblesLegend.setHAlign(B.HAlign.left);
    this._bubblesLegend.setVAlign(legendVAlign);
    this._bubblesLegend.reflow(legendSpace);

    legendHeight = Math.max(this._bubblesLegend.getHeight(), legendHeight);
  }

  //TODO current placing algorithm assumes that size legend is much taller than others because of items' bigger radiuses
  //TODO and much narrower because of  their lower count
  //TODO so it places size legend into right bottom corner
  //TODO and limits other legends' space to size legend's height and remaining chart's width
  //TODO but bubbles legend can have many items and require much more height than size legen
  //TODO think about independent size calculation of every legend

  innerSpace.setHeight(innerSpace.getHeight() - legendHeight);

  var title;
  if (this._plot && this._plot.getX() && (title = this._plot.getX().getTitle())) {
    title.setContext(this._context);
    title.setHAlign(B.HAlign.center);
    title.setVAlign(B.VAlign.bottom);
    title.setText(this._xTransformer.name() || 'X')
    title.reflow(innerSpace);
    innerSpace.setHeight(title.getTop() - innerSpace.getTop());
  }

  if (this._plot && this._plot.getX() && (title = this._plot.getY().getTitle())) {
    title.setContext(this._context);
    title.setHAlign(B.HAlign.left);
    title.setVAlign(B.VAlign.center);
    title.setDirection(B.Direction.up);
    title.setText(this._yTransformer.name() || 'Y');
    title.reflow(innerSpace);
    innerSpace.setLeft(title.getLeft() + title.getWidth());
    innerSpace.setWidth(innerSpace.getWidth() - title.getWidth());
  }

  var labels, labelsBottom = innerSpace.getBottom();
  var scale = this._plot.getScale();
  this._plot.setPadding(0);
  this._plot.update(innerSpace.serialize());
  scale.update(this._plot.getInnerRect().serialize());
  scale.setPadding(50);

  if (this._plot && this._plot.getX() && (labels = this._plot.getX().getLabels())) {
    labels.setContext(this._context);
    labels.setTransformer(this._xTransformer);
    labels.setMin(this._xTransformer.getMinItem()); //TODO move this into collection class.
    labels.setMax(this._xTransformer.getMaxItem());
    labels.setHAlign(B.HAlign.fit);
    labels.setVAlign(B.VAlign.bottom);
    labels.setDirection(B.Direction.right);
    labels.setScale(scale);
    labels.reflow(innerSpace);
    innerSpace.setHeight(labels.getTop() - innerSpace.getTop());
    this._plot.update(innerSpace.serialize());
    scale.update(this._plot.getInnerRect().serialize());
  }

  if (this._plot && this._plot.getY() && (labels = this._plot.getY().getLabels())) {
    labels.setContext(this._context);
    labels.setTransformer(this._yTransformer);
    labels.setMin(this._yTransformer.getMinItem());
    labels.setMax(this._yTransformer.getMaxItem());
    labels.setHAlign(B.HAlign.left);
    labels.setVAlign(B.VAlign.fit);
    labels.setDirection(B.Direction.up);
    labels.setScale(scale);
    labels.reflow(innerSpace);
    innerSpace.setLeft(labels.getLeft() + labels.getWidth());
    innerSpace.setWidth(innerSpace.getWidth() - labels.getWidth());
    this._plot.update(innerSpace.serialize());
    scale.update(this._plot.getInnerRect().serialize());
    if (this._plot && this._plot.getX() && (labels = this._plot.getX().getLabels())) {
      //we have to reflow them again because Y labels have took some innerSpace and width of the plot and therefore width of X labels has changed
      //TODO however some optimizations can be done like flag to reposition the items instead of full reflow
      innerSpace.setHeight(labelsBottom - innerSpace.getTop());
      labels.reflow(innerSpace);
      innerSpace.setHeight(labels.getTop() - innerSpace.getTop());
    }
  }

  //TODO think about moving this code into Plot class
  var grid;
  if (this._plot && this._plot.getX() && (grid = this._plot.getX().getGrid())) {
    grid.setTransformer(this._xTransformer);
    grid.setMin(this._xTransformer.getMinItem());
    grid.setMax(this._xTransformer.getMaxItem());
    grid.setScale(scale);
    grid.setDirection(B.Direction.right);
  }

  if (this._plot && this._plot.getY() && (grid = this._plot.getY().getGrid())) {
    grid.setTransformer(this._yTransformer);
    grid.setMin(this._yTransformer.getMinItem());
    grid.setMax(this._yTransformer.getMaxItem());
    grid.setScale(scale);
    grid.setDirection(B.Direction.up);
  }

  if (this._plot) {
    this._plot.setContext(this._context);
    this._plot.setHAlign(B.HAlign.fit);
    this._plot.setVAlign(B.VAlign.fit);
    this._plot.reflow(innerSpace);
  }

  this._updateData();

  this._reflowTooltip();

  //TODO support user defined alignments

  B.Chart.base.reflow.apply(this, arguments);
});

B.Chart.method('repaint', function repaint() {
  if (this._assertRepaint())
    return;

  this._context.canvas.width = this._context.canvas.width;

  B.Chart.base.repaint.apply(this, arguments);

  if (this._title)
    this._title.repaint();

  if (this._slider)
    this._slider.repaint();

  if (this._rTransformer && this._rTransformer.getPath() && this._radiusLegend)
    this._radiusLegend.repaint();

  if (this._cTransformer && this._cTransformer.getPath() && this._colorLegend)
    this._colorLegend.repaint();

  if (!(this._cTransformer && this._cTransformer.getPath()) && this._bubblesLegend && this._plot && this._bubbles)
    this._bubblesLegend.repaint();

  var title;
  if (this._plot && this._plot.getX() && (title = this._plot.getX().getTitle()))
    title.repaint();

  if (this._plot && this._plot.getY() && (title = this._plot.getY().getTitle()))
    title.repaint();

  var labels;
  if (this._plot && this._plot.getX() && (labels = this._plot.getX().getLabels()))
    labels.repaint();

  if (this._plot && this._plot.getY() && (labels = this._plot.getY().getLabels()))
    labels.repaint();

  //TODO think about moving this code into Plot class

  if (this._plot) {
    this._plot._clip(); //TODO remove cheating, maybe events? however storing bubbles inside plot was worse
    this._plot.repaint();
  }

  if (this._bubbles)
    for (var i = 0; i < this._bubbles.length; i++)
      this._bubbles[i].repaint();

  if (this._tooltip)
    this._tooltip.repaint();

  if (this._plot)
    this._plot._unclip();
});

B.Chart.default = {
  title: {text: 'Title', font: {color: '#888888'}},

  hAlign: B.HAlign.fit,
  vAlign: B.VAlign.fit,

  xTransformer: {},
  yTransformer: {},
  cTransformer: {},
  rTransformer: {min: 0.1},

  bubbles: [],

  plot: {
    border: {
      color: '#BBBBBB',
      Width: 4
    },
    background: '#EEEEEE',
    hAlign: B.HAlign.none,
    vAlign: B.VAlign.none,

    x: {
      title: {text: 'X', font: {color: '#888888'}},
      grid: {
        count: 5,
        options: {
          stroke: {
            color: '#FFFFFF',
            width: 2
          }
        },
        subcollection: {
          count: 5,
          options: {
            stroke: {
              color: '#FFFFFF',
              width: 1
            }
          }
        }
      },
      labels: {
        count: 5,
        options: {font: {color: '#888888'}},
        subcollection: {
          count: 5,
          options: {font: {color: '#888888'}}
        }
      }
    },
    y: {
      title: {text: 'Y', font: {color: '#888888'}},
      grid: {
        count: 5,
        options: {
          stroke: {
            color: '#FFFFFF',
            width: 2
          }
        },
        subcollection: {
          count: 5,
          options: {
            stroke: {
              color: '#FFFFFF',
              width: 1
            }
          }
        }
      },
      labels: {
        count: 5,
        options: {font: {color: '#888888'}},
        subcollection: {
          count: 5,
          options: {font: {color: '#888888'}}
        }
      }
    }
  },
  slider: {},
  colorLegend: {title: {font: {color: '#888888'}}, font: {color: '#888888'}},
  radiusLegend: {title: {font: {color: '#888888'}}, font: {color: '#888888'}},
  bubblesLegend: {title: {text: 'Bubbles', font: {color: '#888888'}}, font: {color: '#888888'}},
  tooltip: {
    font: {color: '#888888'},
    background: 'rgba(255,255,255,0.5)',
    border: {
      width: 1,
      radius: 3
    },
    padding: 0,
    margin: 0
  }
};