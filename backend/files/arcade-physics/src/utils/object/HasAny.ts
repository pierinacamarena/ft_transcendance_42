/* eslint-disable no-prototype-builtins */
/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

/**
 * Verifies that an object contains at least one of the requested keys
 *
 * @function Phaser.Utils.Objects.HasAny
 * @since 3.0.0
 *
 * @param {object} source - an object on which to check for key existence
 * @param {string[]} keys - an array of keys to search the object for
 *
 * @return {boolean} true if the source object contains at least one of the keys, false otherwise
 */
const HasAny = (source, keys) => {
  for (let i = 0; i < keys.length; i++) {
    if (source.hasOwnProperty(keys[i])) {
      return true
    }
  }

  return false
}

export default HasAny
