/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

//  Adapted from [gl-matrix](https://github.com/toji/gl-matrix) by toji
//  and [vecmath](https://github.com/mattdesl/vecmath) by mattdesl

import Class from '../utils/Class'

/**
 * @classdesc
 * A representation of a vector in 4D space.
 *
 * A four-component vector.
 *
 * @class Vector4
 * @memberof Phaser.Math
 * @constructor
 * @since 3.0.0
 *
 * @param {number} [x] - The x component.
 * @param {number} [y] - The y component.
 * @param {number} [z] - The z component.
 * @param {number} [w] - The w component.
 */
class Vector4 {
  constructor(x, y, z, w) {
    /**
     * The x component of this Vector.
     *
     * @name Phaser.Math.Vector4#x
     * @type {number}
     * @default 0
     * @since 3.0.0
     */
    this.x = 0

    /**
     * The y component of this Vector.
     *
     * @name Phaser.Math.Vector4#y
     * @type {number}
     * @default 0
     * @since 3.0.0
     */
    this.y = 0

    /**
     * The z component of this Vector.
     *
     * @name Phaser.Math.Vector4#z
     * @type {number}
     * @default 0
     * @since 3.0.0
     */
    this.z = 0

    /**
     * The w component of this Vector.
     *
     * @name Phaser.Math.Vector4#w
     * @type {number}
     * @default 0
     * @since 3.0.0
     */
    this.w = 0

    if (typeof x === 'object') {
      this.x = x.x || 0
      this.y = x.y || 0
      this.z = x.z || 0
      this.w = x.w || 0
    } else {
      this.x = x || 0
      this.y = y || 0
      this.z = z || 0
      this.w = w || 0
    }
  }

  /**
   * Make a clone of this Vector4.
   *
   * @method Phaser.Math.Vector4#clone
   * @since 3.0.0
   *
   * @return {Phaser.Math.Vector4} A clone of this Vector4.
   */
  clone() {
    return new Vector4(this.x, this.y, this.z, this.w)
  }

  /**
   * Copy the components of a given Vector into this Vector.
   *
   * @method Phaser.Math.Vector4#copy
   * @since 3.0.0
   *
   * @param {Phaser.Math.Vector4} src - The Vector to copy the components from.
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  copy(src) {
    this.x = src.x
    this.y = src.y
    this.z = src.z || 0
    this.w = src.w || 0

    return this
  }

  /**
   * Check whether this Vector is equal to a given Vector.
   *
   * Performs a strict quality check against each Vector's components.
   *
   * @method Phaser.Math.Vector4#equals
   * @since 3.0.0
   *
   * @param {Phaser.Math.Vector4} v - The vector to check equality with.
   *
   * @return {boolean} A boolean indicating whether the two Vectors are equal or not.
   */
  equals(v) {
    return this.x === v.x && this.y === v.y && this.z === v.z && this.w === v.w
  }

  /**
   * Set the `x`, `y`, `z` and `w` components of the this Vector to the given `x`, `y`, `z` and `w` values.
   *
   * @method Phaser.Math.Vector4#set
   * @since 3.0.0
   *
   * @param {(number|object)} x - The x value to set for this Vector, or an object containing x, y, z and w components.
   * @param {number} y - The y value to set for this Vector.
   * @param {number} z - The z value to set for this Vector.
   * @param {number} w - The z value to set for this Vector.
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  set(x, y, z, w) {
    if (typeof x === 'object') {
      this.x = x.x || 0
      this.y = x.y || 0
      this.z = x.z || 0
      this.w = x.w || 0
    } else {
      this.x = x || 0
      this.y = y || 0
      this.z = z || 0
      this.w = w || 0
    }

    return this
  }

  /**
   * Add a given Vector to this Vector. Addition is component-wise.
   *
   * @method Phaser.Math.Vector4#add
   * @since 3.0.0
   *
   * @param {(Phaser.Math.Vector2|Phaser.Math.Vector3|Phaser.Math.Vector4)} v - The Vector to add to this Vector.
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  add(v) {
    this.x += v.x
    this.y += v.y
    this.z += v.z || 0
    this.w += v.w || 0

    return this
  }

  /**
   * Subtract the given Vector from this Vector. Subtraction is component-wise.
   *
   * @method Phaser.Math.Vector4#subtract
   * @since 3.0.0
   *
   * @param {(Phaser.Math.Vector2|Phaser.Math.Vector3|Phaser.Math.Vector4)} v - The Vector to subtract from this Vector.
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  subtract(v) {
    this.x -= v.x
    this.y -= v.y
    this.z -= v.z || 0
    this.w -= v.w || 0

    return this
  }

  /**
   * Scale this Vector by the given value.
   *
   * @method Phaser.Math.Vector4#scale
   * @since 3.0.0
   *
   * @param {number} scale - The value to scale this Vector by.
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  scale(scale) {
    this.x *= scale
    this.y *= scale
    this.z *= scale
    this.w *= scale

    return this
  }

  /**
   * Calculate the length (or magnitude) of this Vector.
   *
   * @method Phaser.Math.Vector4#length
   * @since 3.0.0
   *
   * @return {number} The length of this Vector.
   */
  length() {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w

    return Math.sqrt(x * x + y * y + z * z + w * w)
  }

  /**
   * Calculate the length of this Vector squared.
   *
   * @method Phaser.Math.Vector4#lengthSq
   * @since 3.0.0
   *
   * @return {number} The length of this Vector, squared.
   */
  lengthSq() {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w

    return x * x + y * y + z * z + w * w
  }

  /**
   * Normalize this Vector.
   *
   * Makes the vector a unit length vector (magnitude of 1) in the same direction.
   *
   * @method Phaser.Math.Vector4#normalize
   * @since 3.0.0
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  normalize() {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    let len = x * x + y * y + z * z + w * w

    if (len > 0) {
      len = 1 / Math.sqrt(len)

      this.x = x * len
      this.y = y * len
      this.z = z * len
      this.w = w * len
    }

    return this
  }

  /**
   * Calculate the dot product of this Vector and the given Vector.
   *
   * @method Phaser.Math.Vector4#dot
   * @since 3.0.0
   *
   * @param {Phaser.Math.Vector4} v - The Vector4 to dot product with this Vector4.
   *
   * @return {number} The dot product of this Vector and the given Vector.
   */
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w
  }

  /**
   * Linearly interpolate between this Vector and the given Vector.
   *
   * Interpolates this Vector towards the given Vector.
   *
   * @method Phaser.Math.Vector4#lerp
   * @since 3.0.0
   *
   * @param {Phaser.Math.Vector4} v - The Vector4 to interpolate towards.
   * @param {number} [t=0] - The interpolation percentage, between 0 and 1.
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  lerp(v, t) {
    if (t === undefined) {
      t = 0
    }

    const ax = this.x
    const ay = this.y
    const az = this.z
    const aw = this.w

    this.x = ax + t * (v.x - ax)
    this.y = ay + t * (v.y - ay)
    this.z = az + t * (v.z - az)
    this.w = aw + t * (v.w - aw)

    return this
  }

  /**
   * Perform a component-wise multiplication between this Vector and the given Vector.
   *
   * Multiplies this Vector by the given Vector.
   *
   * @method Phaser.Math.Vector4#multiply
   * @since 3.0.0
   *
   * @param {(Phaser.Math.Vector2|Phaser.Math.Vector3|Phaser.Math.Vector4)} v - The Vector to multiply this Vector by.
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  multiply(v) {
    this.x *= v.x
    this.y *= v.y
    this.z *= v.z || 1
    this.w *= v.w || 1

    return this
  }

  /**
   * Perform a component-wise division between this Vector and the given Vector.
   *
   * Divides this Vector by the given Vector.
   *
   * @method Phaser.Math.Vector4#divide
   * @since 3.0.0
   *
   * @param {(Phaser.Math.Vector2|Phaser.Math.Vector3|Phaser.Math.Vector4)} v - The Vector to divide this Vector by.
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  divide(v) {
    this.x /= v.x
    this.y /= v.y
    this.z /= v.z || 1
    this.w /= v.w || 1

    return this
  }

  /**
   * Calculate the distance between this Vector and the given Vector.
   *
   * @method Phaser.Math.Vector4#distance
   * @since 3.0.0
   *
   * @param {(Phaser.Math.Vector2|Phaser.Math.Vector3|Phaser.Math.Vector4)} v - The Vector to calculate the distance to.
   *
   * @return {number} The distance from this Vector to the given Vector.
   */
  distance(v) {
    const dx = v.x - this.x
    const dy = v.y - this.y
    const dz = v.z - this.z || 0
    const dw = v.w - this.w || 0

    return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw)
  }

  /**
   * Calculate the distance between this Vector and the given Vector, squared.
   *
   * @method Phaser.Math.Vector4#distanceSq
   * @since 3.0.0
   *
   * @param {(Phaser.Math.Vector2|Phaser.Math.Vector3|Phaser.Math.Vector4)} v - The Vector to calculate the distance to.
   *
   * @return {number} The distance from this Vector to the given Vector, squared.
   */
  distanceSq(v) {
    const dx = v.x - this.x
    const dy = v.y - this.y
    const dz = v.z - this.z || 0
    const dw = v.w - this.w || 0

    return dx * dx + dy * dy + dz * dz + dw * dw
  }

  /**
   * Negate the `x`, `y`, `z` and `w` components of this Vector.
   *
   * @method Phaser.Math.Vector4#negate
   * @since 3.0.0
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  negate() {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
    this.w = -this.w

    return this
  }

  /**
   * Transform this Vector with the given Matrix.
   *
   * @method Phaser.Math.Vector4#transformMat4
   * @since 3.0.0
   *
   * @param {Phaser.Math.Matrix4} mat - The Matrix4 to transform this Vector4 with.
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  transformMat4(mat) {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = this.w
    const m = mat.val

    this.x = m[0] * x + m[4] * y + m[8] * z + m[12] * w
    this.y = m[1] * x + m[5] * y + m[9] * z + m[13] * w
    this.z = m[2] * x + m[6] * y + m[10] * z + m[14] * w
    this.w = m[3] * x + m[7] * y + m[11] * z + m[15] * w

    return this
  }

  /**
   * Transform this Vector with the given Quaternion.
   *
   * @method Phaser.Math.Vector4#transformQuat
   * @since 3.0.0
   *
   * @param {Phaser.Math.Quaternion} q - The Quaternion to transform this Vector with.
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  transformQuat(q) {
    const x = this.x
    const y = this.y
    const z = this.z
    const qx = q.x
    const qy = q.y
    const qz = q.z
    const qw = q.w

    // calculate quat * vec
    const ix = qw * x + qy * z - qz * y
    const iy = qw * y + qz * x - qx * z
    const iz = qw * z + qx * y - qy * x
    const iw = -qx * x - qy * y - qz * z

    // calculate result * inverse quat
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx

    return this
  }

  /**
   * Make this Vector the zero vector (0, 0, 0, 0).
   *
   * @method Phaser.Math.Vector4#reset
   * @since 3.0.0
   *
   * @return {Phaser.Math.Vector4} This Vector4.
   */
  reset() {
    this.x = 0
    this.y = 0
    this.z = 0
    this.w = 0

    return this
  }
}

Vector4.prototype.sub = Vector4.prototype.subtract
Vector4.prototype.mul = Vector4.prototype.multiply
Vector4.prototype.div = Vector4.prototype.divide
Vector4.prototype.dist = Vector4.prototype.distance
Vector4.prototype.distSq = Vector4.prototype.distanceSq
Vector4.prototype.len = Vector4.prototype.length
Vector4.prototype.lenSq = Vector4.prototype.lengthSq

export default Vector4
