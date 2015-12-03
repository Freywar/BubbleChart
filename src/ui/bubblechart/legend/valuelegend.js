/**
 * @class B.ValueLegend Autofilling legend to show some dimension scale.
 * @type {Function}
 */
B.ValueLegend = cls('B.ValueLegend', B.Legend);

/**
 * @property {B.Transformer} transformer Transformer to get range and transform values.
 */
B.ValueLegend.property('transformer', {value: null, get: true, set: true, type: B.Transformer});
/**
 * @property {number} count Count of interpolated items.
 */
B.ValueLegend.property('count', {value: 3, get: true, set: true});

B.ValueLegend.method('_recreate', function() {
  if (!this._visible || !this._context || !this._transformer)
    return;

  var min = this._transformer.getMinItem();
  var max = this._transformer.getMaxItem();


  if (this._items && this._items.length === this._count &&
    this._items[0].getText() === min.toFixed(2) && this._items[this._items.length - 1].getText() === max.toFixed(2))
    return;

  this._items = [];
  if (Utils.Types.isNumber(min) && Utils.Types.isNumber(max)) {

    for (var i = 0; i < this._count; i++) {
      var value = min + i * (max - min) / (this._count - 1),
        tValue = this._transformer.transform(value);
      var options = {
        text: value.toFixed(2)//TODO move formatting into label
      };
      if (Utils.Types.isString(tValue))
        options.color = tValue;
      else
        options.radius = tValue * 50;//TODO get this constant from chart somehow

      this._items.push(new B.BubbleLabel(options));
    }

  }

  var noptions = {text: 'no data'};
  var nValue = this._transformer.transform(null);
  if (Utils.Types.isString(tValue))
    noptions.color = nValue;
  else
    noptions.radius = nValue * 50;

  this._items.push(new B.BubbleLabel(noptions));

});

B.ValueLegend.method('reflow', function(space) {
  if (this._title && this._transformer)
    this._title.setText(this._transformer.name());
  this._recreate();

  B.ValueLegend.base.reflow.apply(this, arguments);
});