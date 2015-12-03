/**
 * @class B.Axis Parts of a plot in one dimension.
 */
B.Axis = cls('B.Axis', B.Control);

/**
 * @property {B.Label} Axis title, rendered outside of actual plot.
 */
B.Axis.property('title', {value: null, get: true, set: true, type: B.Label});
/**
 * @property {B.LineCollection} Grid lines.
 */
B.Axis.property('grid', {value: null, get: true, set: true, type: B.LineCollection});
/**
 * @property {B.LabelCollection} Grid labels, rendered outside of actual plot.
 */
B.Axis.property('labels', {value: null, get: true, set: true, type: B.LabelCollection});

B.Axis.method('reflow', function(space) {
  if (this._assertReflow())
    return;

  B.Axis.base.reflow.apply(this, arguments);
  if (this._grid) {
    this._grid.setContext(this._context);
    this._grid.setHAlign(B.HAlign.fit);
    this._grid.setVAlign(B.VAlign.fit);
    this._grid.reflow(space);
  }
});

B.Axis.method('repaint', function() {
  if (this._assertRepaint())
    return;

  if (this._grid)
    this._grid.repaint();
});