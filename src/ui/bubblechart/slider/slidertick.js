/**
 * @class B.SliderTick Slider tick.
 */

B.SliderTick = cls('B.SliderTick', B.Label);

/**
 * @property {String[]} path Path to slice with which tick is associated.
 */
B.SliderTick.property('path', {value: null, get: true, set: true});

//TODO add automatic text setup depending on data