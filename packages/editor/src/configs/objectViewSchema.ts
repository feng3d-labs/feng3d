// 类型从 `feng3d` 取而不是 `@feng3d/objectview`：后者不是编辑器的直接依赖（经 feng3d 传递），
// 直接 import 会变成幽灵依赖（feng3d 的 index 已 `export * from '@feng3d/objectview'`）
import type { ObjectViewConfigMap } from 'feng3d';

/**
 * 属性面板的**人工配置**：`__type__` → 对象级视图 / 分组 / 字段。
 *
 * ## 为什么要有这一层
 *
 * 字段清单与控件种类能从 TypeScript 类型推出来（见 `generated/dataTypeSchema.ts` 与
 * `scripts/gen-objectview-schema.mjs`），但下面这些推不出来，只能由人来定：
 *
 * - **分组**：哪些字段该放在「变换」里、哪些放「材质」里，以及分组的先后；
 * - **显示名**：面板上看到的中文标签（`castShadows` → 投射阴影）；
 * - **取值范围**：视场角 1~179、宽高比不能为 0 这类约束；
 * - **对象级视图**：某个 `__type__` 要不要换一套对象视图控件。
 *
 * 这一层就是原先挂在 class 上的装饰器（`@OVComponent` / `@oav(分组、显示名…)`）的替代品：
 * 数据侧不再需要装饰器，视图侧按 `__type__` 查配置。
 *
 * ## 与描述表的关系
 *
 * 二者在查询时合并，**配置优先**：
 *
 * | | 描述表（生成） | 配置（本文件） |
 * |---|---|---|
 * | 字段清单 | ✅ 来自类型 | 可追加（按书写顺序排在后面） |
 * | 控件种类 | ✅ 从类型推断 | 可覆盖（`type` / `component`） |
 * | 分组、显示名、范围 | ❌ 推不出来 | ✅ |
 * | 对象级视图 | ❌ | ✅（`view`） |
 *
 * 描述表里没有的 `__type__` 也可以**纯靠配置**定义字段（写 `attributes` 即可）。
 *
 * ## 改这个文件要跑什么
 *
 * 没有生成步骤，改完直接生效；`packages/editor/test/objectViewSchema.spec.ts` 会检查
 * 配置里引用的字段名确实存在于该类型的描述表中（写错一个字段名，面板上会多出一个
 * 永远不会显示的配置项，测试直接指出）。
 */
export const OBJECT_VIEW_CONFIG: ObjectViewConfigMap = {
    // -----------------------------------------------------------------------
    // 对象节点：基本信息 / 变换 / 资源 / 组件
    // -----------------------------------------------------------------------
    Object3D: {
        blocks: [
            // 「基本信息」排在最前，且用**紧凑块视图**：名称 / 标签 / 启用 / 可拾取 都是短字段，
            // 一眼扫过即可，没必要各占一整行——`OBVInline` 按最小宽度自动排布
            //（面板宽就一行四个，窄一点两行各两个，再窄就一行一个）
            { name: '基本信息', component: 'OBVInline' },
            { name: '变换' },
            { name: '资源' },
            { name: '组件' },
        ],
        attributes: {
            position: { label: '位置', block: '变换', priority: 0 },
            rotation: { label: '旋转', block: '变换', priority: 1 },
            scale: { label: '缩放', block: '变换', priority: 2 },
            name: { label: '名称', block: '基本信息', priority: 0 },
            tag: { label: '标签', block: '基本信息', priority: 1 },
            activeSelf: { label: '启用', block: '基本信息', priority: 2 },
            mouseEnabled: { label: '可拾取', block: '基本信息', priority: 3 },
            components: { label: '组件', block: '组件' },
            assetType: { label: '资源类型', block: '资源', priority: 0 },
            assetId: { label: '资源编号', block: '资源', priority: 1 },
            prefabId: { label: '预制体编号', block: '资源', priority: 2 },
            overrides: { label: '预制体覆盖', block: '资源', priority: 3 },
        },
    },

    // -----------------------------------------------------------------------
    // 渲染器：几何 / 材质 / 渲染开关
    // -----------------------------------------------------------------------
    MeshRenderer: {
        blocks: [
            { name: '几何' },
            { name: '材质' },
            { name: '渲染' },
            { name: '行为' },
        ],
        attributes: {
            geometry: { label: '几何', block: '几何', priority: 0 },
            material: { label: '材质', block: '材质', priority: 0 },
            castShadows: { label: '投射阴影', block: '渲染', priority: 0 },
            receiveShadows: { label: '接收阴影', block: '渲染', priority: 1 },
            renderWhenLoaded: { label: '就绪后渲染', block: '渲染', priority: 2 },
            enabled: { label: '启用', block: '行为', priority: 0 },
            runEnvironment: { label: '运行环境', block: '行为', priority: 1 },
        },
    },

    // -----------------------------------------------------------------------
    // 相机
    // -----------------------------------------------------------------------
    PerspectiveCamera: {
        blocks: [
            { name: '视锥' },
            { name: '裁剪面' },
            { name: '其它' },
        ],
        attributes: {
            fov: { label: '视场角', block: '视锥', priority: 0, componentParam: { minValue: 1, maxValue: 179, step: 1, stepDownup: 1 } },
            aspect: { label: '宽高比', block: '视锥', priority: 1, componentParam: { minValue: 0.01, step: 0.1, stepDownup: 0.1 } },
            near: { label: '近裁剪面', block: '裁剪面', priority: 0, componentParam: { minValue: 0.001, step: 0.1, stepDownup: 0.1 } },
            far: { label: '远裁剪面', block: '裁剪面', priority: 1, componentParam: { minValue: 0.01, step: 100, stepDownup: 100 } },
            frustumCulling: { label: '视锥剔除', block: '其它', priority: 0 },
        },
    },
    OrthographicCamera: {
        blocks: [
            { name: '视口' },
            { name: '裁剪面' },
            { name: '其它' },
        ],
        attributes: {
            left: { label: '左', block: '视口', priority: 0 },
            right: { label: '右', block: '视口', priority: 1 },
            top: { label: '上', block: '视口', priority: 2 },
            bottom: { label: '下', block: '视口', priority: 3 },
            near: { label: '近裁剪面', block: '裁剪面', priority: 0 },
            far: { label: '远裁剪面', block: '裁剪面', priority: 1 },
            frustumCulling: { label: '视锥剔除', block: '其它', priority: 0 },
        },
    },

    // -----------------------------------------------------------------------
    // 场景：环境色与背景
    // -----------------------------------------------------------------------
    Scene: {
        blocks: [{ name: '环境' }],
        attributes: {
            background: { label: '背景色', block: '环境', priority: 0 },
            ambientColor: { label: '环境光', block: '环境', priority: 1 },
        },
    },

    // -----------------------------------------------------------------------
    // 光照：颜色强度 + 阴影
    // -----------------------------------------------------------------------
    DirectionalLight: {
        blocks: [{ name: '光照' }, { name: '阴影' }, { name: '行为' }],
        attributes: {
            color: { label: '颜色', block: '光照', priority: 0 },
            intensity: { label: '强度', block: '光照', priority: 1, componentParam: { minValue: 0, step: 0.1, stepDownup: 0.1 } },
            shadowType: { label: '阴影类型', block: '阴影', priority: 0 },
            shadowBias: { label: '阴影偏移', block: '阴影', priority: 1, componentParam: { step: 0.0001, stepDownup: 0.001 } },
            shadowRadius: { label: '阴影半径', block: '阴影', priority: 2, componentParam: { minValue: 0, step: 0.1, stepDownup: 0.1 } },
            scutoff: { label: '阴影裁剪阈值', block: '阴影', priority: 3, componentParam: { minValue: 0, step: 0.1, stepDownup: 0.1 } },
            debugShadowMap: { label: '调试阴影图', block: '阴影', priority: 4 },
            enabled: { label: '启用', block: '行为', priority: 0 },
            runEnvironment: { label: '运行环境', block: '行为', priority: 1 },
            lightType: { exclude: true },
        },
    },
    PointLight: {
        blocks: [{ name: '光照' }, { name: '阴影' }, { name: '行为' }],
        attributes: {
            color: { label: '颜色', block: '光照', priority: 0 },
            intensity: { label: '强度', block: '光照', priority: 1, componentParam: { minValue: 0, step: 0.1, stepDownup: 0.1 } },
            range: { label: '影响范围', block: '光照', priority: 2, componentParam: { minValue: 0, step: 1, stepDownup: 1 } },
            shadowType: { label: '阴影类型', block: '阴影', priority: 0 },
            shadowBias: { label: '阴影偏移', block: '阴影', priority: 1, componentParam: { step: 0.0001, stepDownup: 0.001 } },
            shadowRadius: { label: '阴影半径', block: '阴影', priority: 2, componentParam: { minValue: 0, step: 0.1, stepDownup: 0.1 } },
            debugShadowMap: { label: '调试阴影图', block: '阴影', priority: 3 },
            enabled: { label: '启用', block: '行为', priority: 0 },
            runEnvironment: { label: '运行环境', block: '行为', priority: 1 },
            lightType: { exclude: true },
        },
    },
    SpotLight: {
        blocks: [{ name: '光照' }, { name: '阴影' }, { name: '行为' }],
        attributes: {
            color: { label: '颜色', block: '光照', priority: 0 },
            intensity: { label: '强度', block: '光照', priority: 1, componentParam: { minValue: 0, step: 0.1, stepDownup: 0.1 } },
            range: { label: '影响范围', block: '光照', priority: 2, componentParam: { minValue: 0, step: 1, stepDownup: 1 } },
            angle: { label: '张角', block: '光照', priority: 3, componentParam: { minValue: 1, maxValue: 179, step: 1, stepDownup: 1 } },
            penumbra: { label: '半影', block: '光照', priority: 4, componentParam: { minValue: 0, maxValue: 1, step: 0.01, stepDownup: 0.05 } },
            shadowType: { label: '阴影类型', block: '阴影', priority: 0 },
            shadowBias: { label: '阴影偏移', block: '阴影', priority: 1, componentParam: { step: 0.0001, stepDownup: 0.001 } },
            shadowRadius: { label: '阴影半径', block: '阴影', priority: 2, componentParam: { minValue: 0, step: 0.1, stepDownup: 0.1 } },
            debugShadowMap: { label: '调试阴影图', block: '阴影', priority: 3 },
            enabled: { label: '启用', block: '行为', priority: 0 },
            runEnvironment: { label: '运行环境', block: '行为', priority: 1 },
            lightType: { exclude: true },
        },
    },

    // -----------------------------------------------------------------------
    // 材质
    // -----------------------------------------------------------------------
    StandardMaterial: {
        blocks: [{ name: '贴图' }, { name: '渲染状态' }, { name: '其它' }],
        attributes: {
            s_diffuse: { label: '漫反射贴图', block: '贴图', priority: 0 },
            s_normal: { label: '法线贴图', block: '贴图', priority: 1 },
            s_specular: { label: '高光贴图', block: '贴图', priority: 2 },
            s_ambient: { label: '环境贴图', block: '贴图', priority: 3 },
            s_envMap: { label: '环境反射贴图', block: '贴图', priority: 4 },
            cullFace: { label: '面剔除', block: '渲染状态', priority: 0 },
            depthWrite: { label: '写入深度', block: '渲染状态', priority: 1 },
            name: { label: '名称', block: '其它', priority: 0 },
            uniforms: { label: '着色器参数', block: '其它', priority: 1 },
        },
    },
    TextureMaterial: {
        blocks: [{ name: '贴图' }, { name: '渲染状态' }, { name: '其它' }],
        attributes: {
            s_texture: { label: '贴图', block: '贴图', priority: 0, component: 'OAVTexture2D' },
            sampler: { label: '采样器', block: '贴图', priority: 1 },
            depthWrite: { label: '写入深度', block: '渲染状态', priority: 0 },
            blend: { label: '混合状态', block: '渲染状态', priority: 1 },
            name: { label: '名称', block: '其它', priority: 0 },
            uniforms: { label: '着色器参数', block: '其它', priority: 1 },
        },
    },
    ColorMaterial: {
        blocks: [{ name: '渲染状态' }, { name: '其它' }],
        attributes: {
            depthWrite: { label: '写入深度', block: '渲染状态', priority: 0 },
            name: { label: '名称', block: '其它', priority: 0 },
            uniforms: { label: '着色器参数', block: '其它', priority: 1 },
        },
    },
};
