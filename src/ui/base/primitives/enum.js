/**
 * @enum {string}. Direction enumeration.
 */
B.Direction = enumeration({
  up: 'up',
  left: 'left',
  down: 'down',
  right: 'right'
});

/**
 * @enum {string} Horizontal alignment for controls.
 */
B.HAlign = enumeration({
  /**
   * Align to left and calculate width by content.
   */
  left: 'left',
  /**
   * Align to center and calculate width by content.
   */
  center: 'center',
  /**
   * Align to right and calculate width by content.
   */
  right: 'right',
  /**
   * Fill container width.
   */
  fit: 'fit',
  /**
   * Calculate width by content but use user-defined position.
   */
  auto: 'auto',
  /**
   * Use user-defined position and size
   */
  none: 'none'
});

/**
 * @enum {string} Vertical alignment for controls.
 */
B.VAlign = enumeration({
  /**
   * Align to top and calculate height by content.
   */
  top: 'top',
  /**
   * Align to center and calculate height by content.
   */
  center: 'center',
  /**
   * Align to bottom and calculate height by content.
   */
  bottom: 'bottom',
  /**
   * Fill container height.
   */
  fit: 'fit',
  /**
   * Calculate height by content but use user-defined position.
   */
  auto: 'auto',
  /**
   * Use user-defined position and size.
   */
  none: 'none'
});