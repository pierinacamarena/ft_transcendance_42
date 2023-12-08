/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

/**
 * Returns the circumference of the given Ellipse.
 *
 * @function Phaser.Geom.Ellipse.Circumference
 * @since 3.0.0
 *
 * @param {Phaser.Geom.Ellipse} ellipse - The Ellipse to get the circumference of.
 *
 * @return {number} The circumference of th Ellipse.
 */
const Circumference = ellipse => {
  const rx = ellipse.width / 2
  const ry = ellipse.height / 2
  const h = Math.pow(rx - ry, 2) / Math.pow(rx + ry, 2)

  return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)))
}

export default Circumference
