/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

/**
 * Reverses the columns in the given Array Matrix.
 *
 * A matrix is a two-dimensional array (array of arrays), where all sub-arrays (rows)
 * have the same length. There must be at least two rows. This is an example matrix:
 *
 * ```
 * [
 *    [ 1, 1, 1, 1, 1, 1 ],
 *    [ 2, 0, 0, 0, 0, 4 ],
 *    [ 2, 0, 1, 2, 0, 4 ],
 *    [ 2, 0, 3, 4, 0, 4 ],
 *    [ 2, 0, 0, 0, 0, 4 ],
 *    [ 3, 3, 3, 3, 3, 3 ]
 * ]
 * ```
 *
 * @function Phaser.Utils.Array.Matrix.ReverseColumns
 * @since 3.0.0
 *
 * @generic T
 * @genericUse {T[][]} - [matrix,$return]
 *
 * @param {T[][]} [matrix] - The array matrix to reverse the columns for.
 *
 * @return {T[][]} The column reversed matrix.
 */
const ReverseColumns = matrix => {
  return matrix.reverse()
}

export { ReverseColumns }
