import { Box3, Matrix4x4, Quaternion, Ray3, Vector3 } from '@feng3d/math';
import { batchRun, computed, Computed, reactive } from '@feng3d/reactivity';
import { BufferBinding, RenderObject } from '@feng3d/webgpu';
import { Camera } from '../cameras/Camera';
import { Scene } from '../scene/Scene';
import { Transform } from './Transform';

declare module '@feng3d/webgpu'
{
    export interface BindingResources
    {
        transform: BufferBinding<TransformUniforms>;
    }
}

/**
 * Transform 逻辑处理输出。
 *
 * 包含由 transform 计算得出的 computed 属性与行为函数。
 * 所有响应式依赖封装在 transformLogic 闭包内。
 */
export interface TransformLogic
{
    /** 本地四元数旋转 */
    readonly orientation: Computed<Quaternion>;
    /** 本地变换矩阵 */
    readonly matrix: Computed<Matrix4x4>;
    /** 本地旋转矩阵 */
    readonly rotationMatrix: Computed<Matrix4x4>;
    /** 本地转世界矩阵 */
    readonly local2world: Computed<Matrix4x4>;
    /** 本地转世界逆转置矩阵 */
    readonly ITlocal2world: Computed<Matrix4x4>;
    /** 世界转本地矩阵 */
    readonly world2local: Computed<Matrix4x4>;
    /** 本地转世界旋转矩阵 */
    readonly local2worldRotation: Computed<Matrix4x4>;
    /** 世界转本地旋转矩阵 */
    readonly world2localRotation: Computed<Matrix4x4>;
    /** 世界坐标 */
    readonly worldPosition: Computed<Vector3>;

    /** 渲染前写入 transform uniform */
    beforeRender(renderObject: RenderObject, scene: Scene | null, camera: Camera | null): void;

    setMatrix(v: Matrix4x4): void;
    setLocal2world(value: Matrix4x4): void;

    moveForward(distance: number): void;
    moveBackward(distance: number): void;
    moveLeft(distance: number): void;
    moveRight(distance: number): void;
    moveUp(distance: number): void;
    moveDown(distance: number): void;
    translate(axis: Vector3, distance: number): void;
    translateLocal(axis: Vector3, distance: number): void;
    pitch(angle: number): void;
    yaw(angle: number): void;
    roll(angle: number): void;
    rotateTo(ax: number, ay: number, az: number): void;
    rotate(axis: Vector3, angle: number, pivotPoint?: Vector3): void;
    lookAt(target: Vector3, upAxis?: Vector3): void;

    transformDirection(direction: Vector3): Vector3;
    local2worldDirection(direction: Vector3): Vector3;
    local2worldBox(box: Box3, out?: Box3): Box3;
    transformPoint(position: Vector3): Vector3;
    local2worldPoint(position: Vector3): Vector3;
    transformVector(vector: Vector3): Vector3;
    local2worldVector(vector: Vector3): Vector3;
    inverseTransformDirection(direction: Vector3): Vector3;
    world2localDirection(direction: Vector3): Vector3;
    world2localPoint(position: Vector3, out?: Vector3): Vector3;
    world2localVector(vector: Vector3): Vector3;
    rayWorld2local(worldRay: Ray3, localRay?: Ray3): Ray3;
}

const logicMap = new WeakMap<Transform, TransformLogic>();

/**
 * 获取 Transform 的逻辑处理输出（computed + 行为函数）。
 *
 * 使用 WeakMap 缓存，同一 Transform 始终返回同一组 computed。
 * 响应式依赖封装在闭包内，通过 reactive(transform) 读取 parent 等属性建立依赖。
 */
export function transformLogic(transform: Transform): TransformLogic
{
    let logic = logicMap.get(transform);
    if (logic) return logic;

    logic = createTransformLogic(transform);
    logicMap.set(transform, logic);

    return logic;
}

function createTransformLogic(transform: Transform): TransformLogic
{
    const r_transform = reactive(transform) as Transform;

    // ---- computed ----

    const orientation = computed<Quaternion>(() =>
    {
        const r_rotation = reactive(transform.rotation);
        const { x, y, z } = r_rotation;

        return new Quaternion().fromEuler(x, y, z);
    });

    const matrix = computed<Matrix4x4>(() =>
    {
        const r_position = reactive(transform.position);
        const r_rotation = reactive(transform.rotation);
        const r_scale = reactive(transform.scale);

        const position = new Vector3(r_position.x, r_position.y, r_position.z);
        const rotation = new Vector3(r_rotation.x, r_rotation.y, r_rotation.z);
        const scale = new Vector3(r_scale.x, r_scale.y, r_scale.z);

        return new Matrix4x4().fromTRS(position, rotation, scale);
    });

    const rotationMatrix = computed<Matrix4x4>(() =>
    {
        const r_rotation = reactive(transform.rotation);
        const rotation = new Vector3(r_rotation.x, r_rotation.y, r_rotation.z);

        return new Matrix4x4().setRotation(rotation);
    });

    const local2world = computed<Matrix4x4>(() =>
    {
        const parent = r_transform.parent;
        if (parent)
        {
            return matrix.value.clone().append(transformLogic(parent).local2world.value);
        }

        return matrix.value.clone();
    });

    const ITlocal2world = computed<Matrix4x4>(() =>
        local2world.value.clone().invert().transpose());

    const world2local = computed<Matrix4x4>(() =>
        local2world.value.clone().invert());

    const local2worldRotation = computed<Matrix4x4>(() =>
    {
        const m = rotationMatrix.value.clone();
        const parent = r_transform.parent;
        if (parent)
        {
            m.append(transformLogic(parent).local2worldRotation.value);
        }

        return m;
    });

    const world2localRotation = computed<Matrix4x4>(() =>
        local2worldRotation.value.clone().invert());

    const worldPosition = computed<Vector3>(() =>
        local2world.value.getPosition());

    // ---- beforeRender ----

    function beforeRender(renderObject: RenderObject, _scene: Scene | null, _camera: Camera | null)
    {
        const bindingResources = renderObject.bindingResources as Record<string, any>;
        const transformUniforms = (bindingResources.transform ||= { value: {} as TransformUniforms }).value as TransformUniforms;
        //
        const r_transformUniforms = reactive(transformUniforms);
        r_transformUniforms.u_modelMatrix = local2world.value;
        r_transformUniforms.u_ITModelMatrix = ITlocal2world.value;
    }

    // ---- setters ----

    function setMatrix(v: Matrix4x4)
    {
        const position = new Vector3();
        const rotation = new Vector3();
        const scale = new Vector3();
        v.toTRS(position, rotation, scale);

        const r_position = reactive(transform.position);
        const r_rotation = reactive(transform.rotation);
        const r_scale = reactive(transform.scale);

        batchRun(() =>
        {
            r_position.x = position.x;
            r_position.y = position.y;
            r_position.z = position.z;

            r_rotation.x = rotation.x;
            r_rotation.y = rotation.y;
            r_rotation.z = rotation.z;

            r_scale.x = scale.x;
            r_scale.y = scale.y;
            r_scale.z = scale.z;
        });
    }

    function setLocal2world(value: Matrix4x4)
    {
        value = value.clone();
        const parent = r_transform.parent;
        parent && value.append(transformLogic(parent).world2local.value);
        setMatrix(value);
    }

    // ---- movement ----

    function translate(axis: Vector3, distance: number)
    {
        const x = axis.x; const y = axis.y; const
            z = axis.z;
        const len = distance / Math.sqrt(x * x + y * y + z * z);

        const r_position = reactive(transform.position);
        batchRun(() =>
        {
            r_position.x += x * len;
            r_position.y += y * len;
            r_position.z += z * len;
        });
    }

    function translateLocal(axis: Vector3, distance: number)
    {
        const x = axis.x; const y = axis.y; const
            z = axis.z;
        const len = distance / Math.sqrt(x * x + y * y + z * z);
        const m = matrix.value.clone();
        m.prependTranslation(x * len, y * len, z * len);
        const p = m.getPosition();

        const r_position = reactive(transform.position);
        batchRun(() =>
        {
            r_position.x = p.x;
            r_position.y = p.y;
            r_position.z = p.z;
        });
    }

    function moveForward(distance: number) { translateLocal(Vector3.Z_AXIS, distance); }
    function moveBackward(distance: number) { translateLocal(Vector3.Z_AXIS, -distance); }
    function moveLeft(distance: number) { translateLocal(Vector3.X_AXIS, -distance); }
    function moveRight(distance: number) { translateLocal(Vector3.X_AXIS, distance); }
    function moveUp(distance: number) { translateLocal(Vector3.Y_AXIS, distance); }
    function moveDown(distance: number) { translateLocal(Vector3.Y_AXIS, -distance); }

    function pitch(angle: number) { rotate(Vector3.X_AXIS, angle); }
    function yaw(angle: number) { rotate(Vector3.Y_AXIS, angle); }
    function roll(angle: number) { rotate(Vector3.Z_AXIS, angle); }

    function rotateTo(ax: number, ay: number, az: number)
    {
        const r_rotation = reactive(transform.rotation);
        batchRun(() =>
        {
            r_rotation.x = ax;
            r_rotation.y = ay;
            r_rotation.z = az;
        });
    }

    function rotate(axis: Vector3, angle: number, pivotPoint?: Vector3): void
    {
        // 转换位移
        const positionMatrix = Matrix4x4.fromPosition(transform.position.x, transform.position.y, transform.position.z);
        positionMatrix.appendRotation(axis, angle, pivotPoint);
        const position = positionMatrix.getPosition();

        // 转换旋转
        const rx = transform.rotation.x;
        const ry = transform.rotation.y;
        const rz = transform.rotation.z;

        const rotMatrix = Matrix4x4.fromRotation(rx, ry, rz);
        rotMatrix.appendRotation(axis, angle, pivotPoint);
        const newrotation = rotMatrix.toTRS()[1];
        const v = Math.round((newrotation.x - rx) / 180);
        if (v % 2 !== 0)
        {
            newrotation.x += 180;
            newrotation.y = 180 - newrotation.y;
            newrotation.z += 180;
        }
        //
        const toRound = (a: number, b: number, c = 360) =>
            Math.round((b - a) / c) * c + a;
        newrotation.x = toRound(newrotation.x, rx);
        newrotation.y = toRound(newrotation.y, ry);
        newrotation.z = toRound(newrotation.z, rz);

        const r_position = reactive(transform.position);
        const r_rotation = reactive(transform.rotation);
        batchRun(() =>
        {
            r_position.x = position.x;
            r_position.y = position.y;
            r_position.z = position.z;

            r_rotation.x = newrotation.x;
            r_rotation.y = newrotation.y;
            r_rotation.z = newrotation.z;
        });
    }

    function lookAt(target: Vector3, upAxis?: Vector3)
    {
        const m = matrix.value.clone();
        m.lookAt(target, upAxis);
        setMatrix(m);
    }

    // ---- coordinate transforms ----

    function transformDirection(direction: Vector3)
    {
        return local2worldDirection(direction);
    }

    function local2worldDirection(direction: Vector3)
    {
        const parent = r_transform.parent;
        if (!parent)
        {
            return direction.clone();
        }
        const m = transformLogic(parent).local2worldRotation.value;
        direction = m.transformPoint3(direction);

        return direction;
    }

    function local2worldBox(box: Box3, out = new Box3())
    {
        const parent = r_transform.parent;
        if (!parent)
        {
            return out.copy(box);
        }
        const m = transformLogic(parent).local2world.value;
        box.applyMatrixTo(m, out);

        return out;
    }

    function transformPoint(position: Vector3)
    {
        return local2worldPoint(position);
    }

    function local2worldPoint(position: Vector3)
    {
        const parent = r_transform.parent;
        if (!parent)
        {
            return position.clone();
        }
        position = transformLogic(parent).local2world.value.transformPoint3(position);

        return position;
    }

    function transformVector(vector: Vector3)
    {
        return local2worldVector(vector);
    }

    function local2worldVector(vector: Vector3)
    {
        const parent = r_transform.parent;
        if (!parent)
        {
            return vector.clone();
        }
        const m = transformLogic(parent).local2world.value;
        vector = m.transformVector3(vector);

        return vector;
    }

    function inverseTransformDirection(direction: Vector3)
    {
        return world2localDirection(direction);
    }

    function world2localDirection(direction: Vector3)
    {
        const parent = r_transform.parent;
        if (!parent)
        {
            return direction.clone();
        }
        const m = transformLogic(parent).local2worldRotation.value.clone().invert();
        direction = m.transformPoint3(direction);

        return direction;
    }

    function world2localPoint(position: Vector3, out = new Vector3())
    {
        const parent = r_transform.parent;
        if (!parent)
        {
            return out.copy(position);
        }
        position = transformLogic(parent).world2local.value.transformPoint3(position, out);

        return position;
    }

    function world2localVector(vector: Vector3)
    {
        const parent = r_transform.parent;
        if (!parent)
        {
            return vector.clone();
        }
        vector = transformLogic(parent).world2local.value.transformVector3(vector);

        return vector;
    }

    function rayWorld2local(worldRay: Ray3, localRay = new Ray3())
    {
        world2local.value.transformRay(worldRay, localRay);

        return localRay;
    }

    return {
        orientation,
        matrix,
        rotationMatrix,
        local2world,
        ITlocal2world,
        world2local,
        local2worldRotation,
        world2localRotation,
        worldPosition,

        beforeRender,

        setMatrix,
        setLocal2world,

        moveForward,
        moveBackward,
        moveLeft,
        moveRight,
        moveUp,
        moveDown,
        translate,
        translateLocal,
        pitch,
        yaw,
        roll,
        rotateTo,
        rotate,
        lookAt,

        transformDirection,
        local2worldDirection,
        local2worldBox,
        transformPoint,
        local2worldPoint,
        transformVector,
        local2worldVector,
        inverseTransformDirection,
        world2localDirection,
        world2localPoint,
        world2localVector,
        rayWorld2local,
    };
}
