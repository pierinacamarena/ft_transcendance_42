/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

/**
 * Add an `amount` to a `value`, limiting the maximum result to `max`.
 *
 * @function Phaser.Math.MaxAdd
 * @since 3.0.0
 *
 * @param {number} value - The value to add to.
 * @param {number} amount - The amount to add.
 * @param {number} max - The maximum value to return.
 *
 * @return {number} The resulting value.
 */
const MaxAdd = (value, amount, max) => {
  return Math.min(value + amount, max)
}

export default MaxAdd
