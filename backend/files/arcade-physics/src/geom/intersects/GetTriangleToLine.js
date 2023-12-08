/**
 * @author       Florian Vazelle
 * @author       Geoffrey Glaive
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

import Point from '../point/Point'

import TriangleToLine from './TriangleToLine'
import LineToLine from './LineToLine'

/**
 * Checks if a Triangle and a Line intersect, and returns the intersection points as a Point object array.
 *
 * The Line intersects the Triangle if it starts inside of it, ends inside of it, or crosses any of the Triangle's sides. Thus, the Triangle is considered "solid".
 *
 * @function Phaser.Geom.Intersects.GetTriangleToLine
 * @since 3.0.0
 *
 * @param {Phaser.Geom.Triangle} triangle - The Triangle to check with.
 * @param {Phaser.Geom.Line} line - The Line to check with.
 * @param {array} [out] - An optional array in which to store the points of intersection.
 *
 * @return {array} An array with the points of intersection if objects intersect, otherwise an empty array.
 */
const GetTriangleToLine = (triangle, line, out) => {
  if (out === undefined) {
    out = []
  }

  if (TriangleToLine(triangle, line)) {
    const lineA = triangle.getLineA()
    const lineB = triangle.getLineB()
    const lineC = triangle.getLineC()

    const output = [new Point(), new Point(), new Point()]

    const result = [
      LineToLine(lineA, line, output[0]),
      LineToLine(lineB, line, output[1]),
      LineToLine(lineC, line, output[2])
    ]

    for (let i = 0; i < 3; i++) {
      if (result[i]) {
        out.push(output[i])
      }
    }
  }

  return out
}

export default GetTriangleToLine
