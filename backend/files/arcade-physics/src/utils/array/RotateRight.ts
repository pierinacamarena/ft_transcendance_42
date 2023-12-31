/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

/**
 * Moves the element at the end of the array to the start, shifting all items in the process.
 * The "rotation" happens to the right.
 *
 * @function Phaser.Utils.Array.RotateRight
 * @since 3.0.0
 *
 * @param {array} array - The array to shift to the right. This array is modified in place.
 * @param {number} [total=1] - The number of times to shift the array.
 *
 * @return {*} The most recently shifted element.
 */
const RotateRight = (array, total) => {
  if (total === undefined) {
    total = 1
  }

  let element = null

  for (let i = 0; i < total; i++) {
    element = array.pop()
    array.unshift(element)
  }

  return element
}

export { RotateRight }
