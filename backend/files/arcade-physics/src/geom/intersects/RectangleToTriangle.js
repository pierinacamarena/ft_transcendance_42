/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

import LineToLine from './LineToLine'

import Contains from '../rectangle/Contains'
import ContainsArray from '../triangle/ContainsArray'
import Decompose from '../rectangle/Decompose'

/**
 * Checks for intersection between Rectangle shape and Triangle shape.
 *
 * @function Phaser.Geom.Intersects.RectangleToTriangle
 * @since 3.0.0
 *
 * @param {Phaser.Geom.Rectangle} rect - Rectangle object to test.
 * @param {Phaser.Geom.Triangle} triangle - Triangle object to test.
 *
 * @return {boolean} A value of `true` if objects intersect; otherwise `false`.
 */
const RectangleToTriangle = (rect, triangle) => {
  //  First the cheapest ones:

  if (
    triangle.left > rect.right ||
    triangle.right < rect.left ||
    triangle.top > rect.bottom ||
    triangle.bottom < rect.top
  ) {
    return false
  }

  const triA = triangle.getLineA()
  const triB = triangle.getLineB()
  const triC = triangle.getLineC()

  //  Are any of the triangle points within the rectangle?

  if (Contains(rect, triA.x1, triA.y1) || Contains(rect, triA.x2, triA.y2)) {
    return true
  }

  if (Contains(rect, triB.x1, triB.y1) || Contains(rect, triB.x2, triB.y2)) {
    return true
  }

  if (Contains(rect, triC.x1, triC.y1) || Contains(rect, triC.x2, triC.y2)) {
    return true
  }

  //  Cheap tests over, now to see if any of the lines intersect ...

  const rectA = rect.getLineA()
  const rectB = rect.getLineB()
  const rectC = rect.getLineC()
  const rectD = rect.getLineD()

  if (LineToLine(triA, rectA) || LineToLine(triA, rectB) || LineToLine(triA, rectC) || LineToLine(triA, rectD)) {
    return true
  }

  if (LineToLine(triB, rectA) || LineToLine(triB, rectB) || LineToLine(triB, rectC) || LineToLine(triB, rectD)) {
    return true
  }

  if (LineToLine(triC, rectA) || LineToLine(triC, rectB) || LineToLine(triC, rectC) || LineToLine(triC, rectD)) {
    return true
  }

  //  None of the lines intersect, so are any rectangle points within the triangle?

  const points = Decompose(rect)
  const within = ContainsArray(triangle, points, true)

  return within.length > 0
}

export default RectangleToTriangle
