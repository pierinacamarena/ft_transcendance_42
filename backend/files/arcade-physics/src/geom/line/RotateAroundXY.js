/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

/**
 * Rotate a line around the given coordinates by the given angle in radians.
 *
 * @function Phaser.Geom.Line.RotateAroundXY
 * @since 3.0.0
 *
 * @generic {Phaser.Geom.Line} O - [line,$return]
 *
 * @param {Phaser.Geom.Line} line - The line to rotate.
 * @param {number} x - The horizontal coordinate to rotate the line around.
 * @param {number} y - The vertical coordinate to rotate the line around.
 * @param {number} angle - The angle of rotation in radians.
 *
 * @return {Phaser.Geom.Line} The rotated line.
 */
const RotateAroundXY = (line, x, y, angle) => {
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  let tx = line.x1 - x
  let ty = line.y1 - y

  line.x1 = tx * c - ty * s + x
  line.y1 = tx * s + ty * c + y

  tx = line.x2 - x
  ty = line.y2 - y

  line.x2 = tx * c - ty * s + x
  line.y2 = tx * s + ty * c + y

  return line
}

export default RotateAroundXY
