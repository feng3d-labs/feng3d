// @see https://github.com/mikolalysenko/orbit-camera

import * as glm from '../toji/gl-matrix';

const vec3 = glm.vec3;
const mat3 = glm.mat3;
const mat4 = glm.mat4;
const quat = glm.quat;

// Scratch variables
const scratch0 = new Float32Array(16);
const scratch1 = new Float32Array(16);

function OrbitCamera(rotation, center, distance)
{
    this.rotation = rotation;
    this.center = center;
    this.distance = distance;
}

const proto = OrbitCamera.prototype;

proto.view = function (out)
{
    if (!out)
    {
        out = mat4.create();
    }
    scratch1[0] = scratch1[1] = 0.0;
    scratch1[2] = -this.distance;
    mat4.fromRotationTranslation(out,
        quat.conjugate(scratch0, this.rotation),
        scratch1);
    mat4.translate(out, out, vec3.negate(scratch0, this.center));

    return out;
};

proto.lookAt = function (eye, center, up)
{
    mat4.lookAt(scratch0, eye, center, up);
    mat3.fromMat4(scratch0, scratch0);
    quat.fromMat3(this.rotation, scratch0);
    vec3.copy(this.center, center);
    this.distance = vec3.distance(eye, center);
};

proto.pan = function (dpan)
{
    const d = this.distance;
    scratch0[0] = -d * (dpan[0] || 0);
    scratch0[1] = d * (dpan[1] || 0);
    scratch0[2] = d * (dpan[2] || 0);
    vec3.transformQuat(scratch0, scratch0, this.rotation);
    vec3.add(this.center, this.center, scratch0);
};

proto.zoom = function (d)
{
    this.distance += d;
    if (this.distance < 0.0)
    {
        this.distance = 0.0;
    }
};

function quatFromVec(out, da)
{
    const x = da[0];
    const y = da[1];
    let s = x * x + y * y;
    if (s > 1.0)
    {
        s = 1.0;
    }
    out[0] = -da[0];
    out[1] = da[1];
    out[2] = da[2] || Math.sqrt(1.0 - s);
    out[3] = 0.0;
}

proto.rotate = function (da, db)
{
    quatFromVec(scratch0, da);
    quatFromVec(scratch1, db);
    quat.invert(scratch1, scratch1);
    quat.multiply(scratch0, scratch0, scratch1);
    if (quat.length(scratch0) < 1e-6)
    {
        return;
    }
    quat.multiply(this.rotation, this.rotation, scratch0);
    quat.normalize(this.rotation, this.rotation);
};

export function createOrbitCamera(eye, target, up)
{
    eye = eye || [0, 0, -1];
    target = target || [0, 0, 0];
    up = up || [0, 1, 0];
    const camera = new OrbitCamera(quat.create(), vec3.create(), 1.0);
    camera.lookAt(eye, target, up);

    return camera;
}
