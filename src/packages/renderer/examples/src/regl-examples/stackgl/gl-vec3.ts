export const EPSILON = 0.000001;

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
export function create()
{
    const out = new Float32Array(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;

    return out;
}

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
export function clone(a)
{
    const out = new Float32Array(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];

    return out;
}

/**
 * Get the angle between two 3D vectors
 * @param {vec3} a The first operand
 * @param {vec3} b The second operand
 * @returns {Number} The angle in radians
 */
export function angle(a, b)
{
    const tempA = fromValues(a[0], a[1], a[2]);
    const tempB = fromValues(b[0], b[1], b[2]);

    normalize(tempA, tempA);
    normalize(tempB, tempB);

    const cosine = dot(tempA, tempB);

    if (cosine > 1.0)
    {
        return 0;
    }

    return Math.acos(cosine);
}

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
export function fromValues(x, y, z)
{
    const out = new Float32Array(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;

    return out;
}

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
export function copy(out, a)
{
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];

    return out;
}

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
export function set(out, x, y, z)
{
    out[0] = x;
    out[1] = y;
    out[2] = z;

    return out;
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
export function equals(a, b)
{
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];
    const b0 = b[0];
    const b1 = b[1];
    const b2 = b[2];

    return (Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0))
        && Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1))
        && Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)));
}

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
export function exactEquals(a, b)
{
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
export function add(out, a, b)
{
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];

    return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
export function subtract(out, a, b)
{
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];

    return out;
}

export const sub = subtract;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
export function multiply(out, a, b)
{
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];

    return out;
}

export const mul = multiply;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
export function divide(out, a, b)
{
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];

    return out;
}

export const div = divide;

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
export function min(out, a, b)
{
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);

    return out;
}

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
export function max(out, a, b)
{
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);

    return out;
}

/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to floor
 * @returns {vec3} out
 */
export function floor(out, a)
{
    out[0] = Math.floor(a[0]);
    out[1] = Math.floor(a[1]);
    out[2] = Math.floor(a[2]);

    return out;
}

/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to ceil
 * @returns {vec3} out
 */
export function ceil(out, a)
{
    out[0] = Math.ceil(a[0]);
    out[1] = Math.ceil(a[1]);
    out[2] = Math.ceil(a[2]);

    return out;
}

/**
 * Math.round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to round
 * @returns {vec3} out
 */
export function round(out, a)
{
    out[0] = Math.round(a[0]);
    out[1] = Math.round(a[1]);
    out[2] = Math.round(a[2]);

    return out;
}

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
export function scale(out, a, b)
{
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;

    return out;
}

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
export function scaleAndAdd(out, a, b, scale)
{
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);

    return out;
}

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
export function distance(a, b)
{
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    const z = b[2] - a[2];

    return Math.sqrt(x * x + y * y + z * z);
}

export const dist = distance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
export function squaredDistance(a, b)
{
    const x = b[0] - a[0];
    const y = b[1] - a[1];
    const z = b[2] - a[2];

    return x * x + y * y + z * z;
}

export const sqrDist = squaredDistance;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
export function length(a)
{
    const x = a[0];
    const y = a[1];
    const z = a[2];

    return Math.sqrt(x * x + y * y + z * z);
}

export const len = length;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
export function squaredLength(a)
{
    const x = a[0];
    const y = a[1];
    const z = a[2];

    return x * x + y * y + z * z;
}

export const sqrLen = squaredLength;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
export function negate(out, a)
{
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];

    return out;
}

/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to invert
 * @returns {vec3} out
 */
export function inverse(out, a)
{
    out[0] = 1.0 / a[0];
    out[1] = 1.0 / a[1];
    out[2] = 1.0 / a[2];

    return out;
}

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
export function normalize(out, a)
{
    const x = a[0];
    const y = a[1];
    const z = a[2];
    let len = x * x + y * y + z * z;
    if (len > 0)
    {
        // TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
    }

    return out;
}

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
export function dot(a, b)
{
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
export function cross(out, a, b)
{
    const ax = a[0]; const ay = a[1]; const az = a[2];
    const bx = b[0]; const by = b[1]; const
        bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;

    return out;
}

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
export function lerp(out, a, b, t)
{
    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);

    return out;
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */
export function random(out, scale)
{
    scale = scale || 1.0;

    const r = Math.random() * 2.0 * Math.PI;
    const z = (Math.random() * 2.0) - 1.0;
    const zScale = Math.sqrt(1.0 - z * z) * scale;

    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;

    return out;
}

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
export function transformMat4(out, a, m)
{
    const x = a[0]; const y = a[1]; const z = a[2];
    let w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1.0;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;

    return out;
}

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
export function transformMat3(out, a, m)
{
    const x = a[0]; const y = a[1]; const
        z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];

    return out;
}

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
export function transformQuat(out, a, q)
{
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

    const x = a[0]; const y = a[1]; const z = a[2];
    const qx = q[0]; const qy = q[1]; const qz = q[2]; const qw = q[3];

    // calculate quat * vec
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return out;
}

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
export function rotateX(out, a, b, c)
{
    const by = b[1];
    const bz = b[2];

    // Translate point to the origin
    const py = a[1] - by;
    const pz = a[2] - bz;

    const sc = Math.sin(c);
    const cc = Math.cos(c);

    // perform rotation and translate to correct position
    out[0] = a[0];
    out[1] = by + py * cc - pz * sc;
    out[2] = bz + py * sc + pz * cc;

    return out;
}

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
export function rotateY(out, a, b, c)
{
    const bx = b[0];
    const bz = b[2];

    // translate point to the origin
    const px = a[0] - bx;
    const pz = a[2] - bz;

    const sc = Math.sin(c);
    const cc = Math.cos(c);

    // perform rotation and translate to correct position
    out[0] = bx + pz * sc + px * cc;
    out[1] = a[1];
    out[2] = bz + pz * cc - px * sc;

    return out;
}

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
export function rotateZ(out, a, b, c)
{
    const bx = b[0];
    const by = b[1];

    // Translate point to the origin
    const px = a[0] - bx;
    const py = a[1] - by;

    const sc = Math.sin(c);
    const cc = Math.cos(c);

    // perform rotation and translate to correct position
    out[0] = bx + px * cc - py * sc;
    out[1] = by + px * sc + py * cc;
    out[2] = a[2];

    return out;
}

const vec = create();
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
export function forEach(a, stride, offset, count, fn, arg)
{
    let i; let
        l;
    if (!stride)
    {
        stride = 3;
    }

    if (!offset)
    {
        offset = 0;
    }

    if (count)
    {
        l = Math.min((count * stride) + offset, a.length);
    }
    else
    {
        l = a.length;
    }

    for (i = offset; i < l; i += stride)
    {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
    }

    return a;
}
