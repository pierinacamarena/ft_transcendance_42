/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

import Factorial from './Factorial'

/**
 * Calculates the Bernstein basis from the three factorial coefficients.
 *
 * @function Phaser.Math.Bernstein
 * @since 3.0.0
 *
 * @param {number} n - The first value.
 * @param {number} i - The second value.
 *
 * @return {number} The Bernstein basis of Factorial(n) / Factorial(i) / Factorial(n - i)
 */
const Bernstein = (n, i) => {
  return Factorial(n) / Factorial(i) / Factorial(n - i)
}

export default Bernstein
