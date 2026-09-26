import { objectview } from 'feng3d';
import { DATA_TYPE_SCHEMA } from '../vue-app/objectview/generated/dataTypeSchema';
import { registerDataTypeSchema } from '../vue-app/objectview/dataTypeSchema';
import { OBJECT_VIEW_CONFIG } from './objectViewSchema';

//
objectview.defaultBaseObjectViewClass = 'OVBaseDefault';
objectview.defaultObjectViewClass = 'OVDefault';
objectview.defaultObjectAttributeViewClass = 'OAVDefault';
objectview.defaultObjectAttributeBlockView = 'OBVDefault';
//
objectview.setDefaultTypeAttributeView('Boolean', { component: 'OAVBoolean' });
objectview.setDefaultTypeAttributeView('String', { component: 'OAVString' });
objectview.setDefaultTypeAttributeView('number', { component: 'OAVNumber' });
objectview.setDefaultTypeAttributeView('Vector2', { component: 'OAVVector2' });
objectview.setDefaultTypeAttributeView('Vector3', { component: 'OAVVector3' });
objectview.setDefaultTypeAttributeView('Vector4', { component: 'OAVVector4' });
objectview.setDefaultTypeAttributeView('Array', { component: 'OAVArray' });
// `Object3D.components` 用的控件：它不是"一串普通数组"，而是"这个对象挂了哪些组件"，
// 要按组件逐个渲染各自的属性视图（OAVComponentList → ComponentView）。
// 这个控件一直存在却**从未注册到任何类型上**，所以组件的字段视图从来没被渲染出来——
// 描述表把 `components` 标成 `Components` 之后才接上（issue #147）
objectview.setDefaultTypeAttributeView('Components', { component: 'OAVComponentList' });
objectview.setDefaultTypeAttributeView('Function', { component: 'OAVFunction' });
objectview.setDefaultTypeAttributeView('Color3', { component: 'OAVColorPicker' });
objectview.setDefaultTypeAttributeView('Color4', { component: 'OAVColorPicker' });
objectview.setDefaultTypeAttributeView('Texture2D', { component: 'OAVTexture2D' });
objectview.setDefaultTypeAttributeView('MinMaxGradient', { component: 'OAVMinMaxGradient' });
objectview.setDefaultTypeAttributeView('MinMaxCurve', { component: 'OAVMinMaxCurve' });
objectview.setDefaultTypeAttributeView('MinMaxCurveVector3', { component: 'OAVMinMaxCurveVector3' });
//

// 字段发现的主来源（issue #147 方案 B）：纯数据类型的字段清单来自 TypeScript 类型，
// 由 scripts/gen-objectview-schema.mjs 生成。注册在这里而不是 objectview 包内，
// 是为了让依赖只向下——objectview 不依赖 feng3d 的类型（根规范 §15 R1）。
// 未命中描述表的 `__type__` 会自动退回「对象上实际存在的字段」（方案 C 兜底）。
registerDataTypeSchema(objectview, DATA_TYPE_SCHEMA);

// 人工配置（分组 / 显示名 / 取值范围 / 对象级视图），key 同样是 `__type__`。
// 这是原先挂在 class 上的装饰器（`@OVComponent` / `@oav(分组、显示名…)`）的替代品：
// 数据侧不再需要装饰器，视图侧按 `__type__` 查配置。合并时**配置优先于描述表**。
objectview.setObjectViewConfig(OBJECT_VIEW_CONFIG);
