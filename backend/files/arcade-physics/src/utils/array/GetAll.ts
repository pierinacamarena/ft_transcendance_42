/* eslint-disable no-prototype-builtins */
/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

import { SafeRange } from './SafeRange'

/**
 * Returns all elements in the array.
 *
 * You can optionally specify a matching criteria using the `property` and `value` arguments.
 *
 * For example: `getAll('visible', true)` would return only elements that have their visible property set.
 *
 * Optionally you can specify a start and end index. For example if the array had 100 elements,
 * and you set `startIndex` to 0 and `endIndex` to 50, it would return matches from only
 * the first 50 elements.
 *
 * @function Phaser.Utils.Array.GetAll
 * @since 3.4.0
 *
 * @param {array} array - The array to search.
 * @param {string} [property] - The property to test on each array element.
 * @param {*} [value] - The value to test the property against. Must pass a strict (`===`) comparison check.
 * @param {number} [startIndex] - An optional start index to search from.
 * @param {number} [endIndex] - An optional end index to search to.
 *
 * @return {array} All matching elements from the array.
 */
export const GetAll = (array, property, value, startIndex, endIndex) => {
  if (startIndex === undefined) {
    startIndex = 0
  }
  if (endIndex === undefined) {
    endIndex = array.length
  }

  const output: any[] = []

  if (SafeRange(array, startIndex, endIndex)) {
    for (let i = startIndex; i < endIndex; i++) {
      const child = array[i]

      if (
        !property ||
        (property && value === undefined && child.hasOwnProperty(property)) ||
        (property && value !== undefined && child[property] === value)
      ) {
        output.push(child)
      }
    }
  }

  return output
}
