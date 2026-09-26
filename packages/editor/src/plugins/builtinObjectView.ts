import type { EditorPluginManifest } from './types';
import { DATA_TYPE_SCHEMA } from '../vue-app/objectview/generated/dataTypeSchema';
import { OBJECT_VIEW_CONFIG } from '../configs/objectViewSchema';

/**
 * 内置插件清单：**属性面板（objectview）配置**（issue #170）。
 *
 * ## 改造前是什么样
 *
 * 这些内容原先写在 `src/configs/ObjectViewConfig.ts` 的**模块顶层**：20 多条
 * `objectview.setDefaultTypeAttributeView(...)`、四个默认视图类名赋值、描述表与人工配置注册。
 * 也就是说——import 那个文件就会改动全局状态，而"面板上有哪些控件"这件事只能靠读它才发现。
 *
 * 两个具体代价：
 *
 * 1. **没法测试数据本身**：`test/objectViewSchema.spec.ts` 里"用到的控件种类都注册了吗"
 *    这一条只能对着源码文本做正则匹配（`readFileSync` + `matchAll`），因为 import 它要拉整个
 *    feng3d + DOM。变成纯数据后，那个用例可以直接 import 这份清单来核对。
 * 2. **配置顺序即语义**：谁先谁后由 import 顺序决定，没有地方能看到全貌（现在 `editor.plugins` 能）。
 *
 * ## 控件名与注册的两段式
 *
 * 注意 `component` 里写的是**控件类名**（`OAVBoolean` 这类），不是控件本身：
 * 控件由 `vue-app/objectview/registerComponents.ts` 的 `registerObjectViewComponents()`
 * 注册（入口显式调用，因为它们是 Vue 单文件组件，需要 Vite 编译）。
 * 本清单负责"哪个类型用哪个控件名"，两者合起来才让面板显示出来。
 */
export const OBJECT_VIEW_PLUGIN: EditorPluginManifest = {
    id: '@feng3d/editor-plugin-objectview',
    name: '属性面板',
    description: '属性面板的类型 → 控件映射、字段描述表与人工配置（分组 / 显示名 / 取值范围）',
    // 必需：这份配置写进的是 objectview 单例的默认值，**撤不干净**——
    // 撤掉等于把面板变成"没有控件映射"的半死状态。所以它在清单里标 required（不许关），
    // 而不是让卸载路径假装能卸干净（见 install.ts 的 revertPluginContributions）。
    required: true,
    contributes: {
        objectView: {
            defaults: {
                baseObjectView: 'OVBaseDefault',
                objectView: 'OVDefault',
                objectAttributeView: 'OAVDefault',
                objectAttributeBlockView: 'OBVDefault',
            },

            // 枚举字段（字符串字面量联合、成员值连续的 TS enum）用的下拉控件。
            // 这里**漏注册过一次**：描述表把 `cullFace` / `shadowType` 标成 `Enum`，但整张表里没有
            // `Enum` 映射，于是它们静默退化成默认控件——面板上根本没有下拉，而 schema 与配置都"看起来对"。
            // 现在由 test/objectViewSchema.spec.ts 盯着这张表（每个用到的控件种类都必须有注册）
            //
            // `Object3D.components` 用的控件：它不是"一串普通数组"，而是"这个对象挂了哪些组件"，
            // 要按组件逐个渲染各自的属性视图（OAVComponentList → ComponentView）。
            // 这个控件一直存在却**从未注册到任何类型上**，所以组件的字段视图从来没被渲染出来——
            // 描述表把 `components` 标成 `Components` 之后才接上（issue #147）
            typeAttributeViews: [
                { type: 'Boolean', view: { component: 'OAVBoolean' } },
                { type: 'String', view: { component: 'OAVString' } },
                { type: 'number', view: { component: 'OAVNumber' } },
                { type: 'Vector2', view: { component: 'OAVVector2' } },
                { type: 'Vector3', view: { component: 'OAVVector3' } },
                { type: 'Vector4', view: { component: 'OAVVector4' } },
                { type: 'Array', view: { component: 'OAVArray' } },
                { type: 'Enum', view: { component: 'OAVEnum' } },
                { type: 'Components', view: { component: 'OAVComponentList' } },
                { type: 'Function', view: { component: 'OAVFunction' } },
                { type: 'Color3', view: { component: 'OAVColorPicker' } },
                { type: 'Color4', view: { component: 'OAVColorPicker' } },
                { type: 'Texture2D', view: { component: 'OAVTexture2D' } },
                { type: 'MinMaxGradient', view: { component: 'OAVMinMaxGradient' } },
                { type: 'MinMaxCurve', view: { component: 'OAVMinMaxCurve' } },
                { type: 'MinMaxCurveVector3', view: { component: 'OAVMinMaxCurveVector3' } },
            ],

            // 字段发现的主来源（issue #147 方案 B）：纯数据类型的字段清单来自 TypeScript 类型，
            // 由 scripts/gen-objectview-schema.mjs 生成。放在编辑器侧而不是 objectview 包内，
            // 是为了让依赖只向下——objectview 不依赖 feng3d 的类型（根规范 §15 R1）。
            // 未命中描述表的 `__type__` 会自动退回「对象上实际存在的字段」（方案 C 兜底）。
            dataTypeSchema: DATA_TYPE_SCHEMA,

            // 人工配置（分组 / 显示名 / 取值范围 / 对象级视图），key 同样是 `__type__`。
            // 这是原先挂在 class 上的装饰器（`@OVComponent` / `@oav(分组、显示名…)`）的替代品：
            // 数据侧不再需要装饰器，视图侧按 `__type__` 查配置。合并时**配置优先于描述表**。
            objectViewConfig: OBJECT_VIEW_CONFIG,
        },
    },
};
