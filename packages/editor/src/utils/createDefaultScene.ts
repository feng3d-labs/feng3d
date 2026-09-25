import { LightType, ShadowType, logic } from 'feng3d';
import type { Object3D, Scene } from 'feng3d';

/**
 * 角度 → 弧度。
 *
 * 旧资源文件里的 `Transform.rx/ry/rz` 是**角度**，新 `Object3D.rotation` 是**弧度**
 * （见 `packages/feng3d/src/core/Object3D.ts` 的 rotation 注释），迁移时必须换算。
 */
function degreesToRadians(degrees: number): number
{
    return degrees * Math.PI / 180;
}

/**
 * 创建编辑器默认场景（纯数据字面量声明，不经过 `serialization` / `classUtils` 旧链路）。
 *
 * **背景（P1 API 迁移）**：主仓 `Object3D` / `Scene` / `Camera` / `MeshRenderer` 等已迁移为
 * **纯数据接口**，运行时没有构造器；而 `packages/serialization/src/Serialization.ts` 与
 * `packages/assets/src/rs/ReadRS.ts` 仍按「`__class__` 类名 → 构造器」的旧机制反序列化
 * （`classUtils.getInstanceByName` → 内部 `new Cls()`，见 `packages/polyfill/src/ClassUtils.ts`）。
 * 因此 `resource/template/default.scene.json` 等**旧格式资源**（含 `GameObject` / `Transform`
 * 等已被删除的类型）必然加载失败，控制台报 `无法获取名称为 GameObject 的实例!`，
 * 结果是 `EditorData.editorData.gameScene` 为 `null`、层级面板显示 `No Data`。
 *
 * 序列化层的改造是**主仓级议题**（不在本包范围内），此处先用纯数据字面量构造默认场景，
 * 使编辑器启动即有可编辑内容。资源文件保留，待序列化层迁移完成后再切回读取。
 *
 * 结构与对象参照 `resource/template/default.scene.json`：
 * - 根对象 `Untitled`（挂 `Scene` 组件，Scene 是**组件**不是 Object3D 字段）
 * - `Main Camera`：主相机（`PerspectiveCamera`，投影参数已内联，无 `lens`）
 * - `DirectionalLight`：平行光（旧模板 `Transform.rx=50 / ry=-30`，此处换算为弧度）
 * - `Plane`：地面
 * - `Cube`：一个可编辑的模型
 *
 * @returns 场景根 `Object3D`（内部已调用 `logic(root)` 触发挂载：组件完成 init、父子关系建立）
 */
export function createDefaultScene(): Object3D
{
    const root: Object3D = {
        __type__: 'Object3D',
        name: 'Untitled',
        // Scene 是**组件**（旧 `View.createNewScene()` 同样把 Scene 声明在 components 中）
        components: [
            {
                __type__: 'Scene',
                background: { __type__: 'Color4', r: 0.2784, g: 0.2784, b: 0.2784, a: 1 },
                ambientColor: { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 },
            },
        ],
        children: [
            {
                __type__: 'Object3D',
                name: 'Main Camera',
                // 旧 `Transform.y = 1 / z = -10`（Transform 已删除，变换直接内联在 Object3D 上）
                position: { x: 0, y: 1, z: -10 },
                components: [
                    {
                        // 旧 `Camera + PerspectiveLens` 已合并为 PerspectiveCamera，
                        // fov / aspect / near / far 在接口上为**必填**（默认值在 Logic 侧兜底）
                        __type__: 'PerspectiveCamera',
                        fov: 60,
                        aspect: 1,
                        near: 0.3,
                        far: 5000,
                    },
                ],
            },
            {
                __type__: 'Object3D',
                name: 'DirectionalLight',
                // 旧 `Transform.y = 3`、`rx = 50°`、`ry = -30°`（角度 → 弧度）
                position: { x: 0, y: 3, z: 0 },
                rotation: { x: degreesToRadians(50), y: degreesToRadians(-30), z: 0 },
                components: [
                    {
                        // 注：`Light` 基接口（packages/feng3d/src/light/Light.ts）的这些字段在**类型上必填**，
                        // 但实现侧一律用 `?? 默认值` 兜底（如 ForwardRenderer 的 `intensity ?? 1`）。
                        // 类型与实现不一致属主仓已知问题（ARCHITECTURE_V2 §11.5：子接口字段应为可选），
                        // 这里按消费点默认值写全，保持行为与旧模板一致（旧模板 `shadowType: 1`）。
                        __type__: 'DirectionalLight',
                        lightType: LightType.Directional,
                        color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                        intensity: 1,
                        shadowType: ShadowType.Hard_Shadows,
                        // 深度偏移（shader 内 `depthRef = shadowPos.z - shadowBias`，见 StandardMaterial.getShadow）：
                        // 0 会让平面在自身阴影贴图里反复自遮挡（shadow acne，画布上呈大面积莫尔噪点）。
                        // 本场景阴影相机深度范围约 17.8 世界单位（near≈24.6 / far≈42.4），
                        // 每阴影 texel 的深度梯度约 1e-3，取 0.003 可完全消除噪点且不产生可见偏移。
                        shadowBias: 0.003,
                        shadowRadius: 0,
                        debugShadowMap: false,
                    },
                ],
            },
            {
                __type__: 'Object3D',
                name: 'Plane',
                // 旧 `MeshRenderer.geometry = { assetId: 'Plane', width: 10, height: 10 }`：
                // 新范式几何体数据内联（`assetId` 是旧资源系统字段，不再需要）
                components: [
                    {
                        __type__: 'MeshRenderer',
                        geometry: { __type__: 'PlaneGeometry', width: 10, height: 10 },
                        material: {
                            __type__: 'StandardMaterial',
                            uniforms: { u_diffuse: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } },
                        },
                    },
                ],
            },
            {
                __type__: 'Object3D',
                name: 'Cube',
                // CubeGeometry 默认尺寸 1×1×1，抬升半个单位使其坐落在地面上
                position: { x: 0, y: 0.5, z: 0 },
                components: [
                    {
                        __type__: 'MeshRenderer',
                        geometry: { __type__: 'CubeGeometry' },
                        material: {
                            __type__: 'StandardMaterial',
                            uniforms: { u_diffuse: { __type__: 'Color4', r: 0.9, g: 0.45, b: 0.2, a: 1 } },
                        },
                    },
                ],
            },
        ],
    };

    // 挂载：构造 Object3DLogic（含 EntityLogic / ContainerLogic 的结构同步 effect）——
    // 组件在此获得宿主并执行 init()，父子关系自动建立。
    // 从根开始 `logic()` 即可递归触达整棵树（ContainerLogic 的 effect 会为每个子对象创建 logic）。
    logic(root);

    return root;
}

/**
 * 创建默认场景并取出其中的 `Scene` 组件。
 *
 * `EditorData.editorData.gameScene` 需要的是 **`Scene` 组件数据**（不是根 Object3D），
 * 而 `Scene` 没有 `object3D` 字段——其宿主对象经 `logic(scene).entity` 取得。
 *
 * @returns 默认场景的 `Scene` 组件；理论上不会为 `null`（字面量中必然包含 Scene 组件）
 */
export function createDefaultSceneComponent(): Scene | null
{
    const root = createDefaultScene();

    return logic(root).getComponent<Scene>('Scene') ?? null;
}
