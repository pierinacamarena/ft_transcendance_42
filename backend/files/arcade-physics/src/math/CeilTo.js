/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

/**
 * Ceils to some place comparative to a `base`, default is 10 for decimal place.
 *
 * The `place` is represented by the power applied to `base` to get that place.
 *
 * @function Phaser.Math.CeilTo
 * @since 3.0.0
 *
 * @param {number} value - The value to round.
 * @param {number} [place=0] - The place to round to.
 * @param {number} [base=10] - The base to round in. Default is 10 for decimal.
 *
 * @return {number} The rounded value.
 */
const CeilTo = (value, place, base) => {
  if (place === undefined) {
    place = 0
  }
  if (base === undefined) {
    base = 10
  }

  const p = Math.pow(base, -place)

  return Math.ceil(value * p) / p
}

export default CeilTo
