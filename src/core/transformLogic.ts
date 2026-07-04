import { Matrix4x4, Quaternion, Vector3 } from '@feng3d/math';
import { computed, Computed, reactive } from '@feng3d/reactivity';
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
 * 包含由 transform 计算得出的 computed 属性与 beforeRender。
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
}

const logicMap = new WeakMap<Transform, TransformLogic>();

/**
 * 获取 Transform 的逻辑处理输出（computed + beforeRender）。
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
    };
}
