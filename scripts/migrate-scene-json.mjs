// 场景资源文件迁移：旧格式（__class__ + GameObject/Transform）→ 纯数据格式（__type__）
//
// 用法：node scripts/migrate-scene-json.mjs [旧文件路径]
//
// 行为：
// - 首次运行时把源文件备份为 `default.scene.legacy.json`，之后从备份读取（可重复运行，输出稳定）；
// - 逐项转换：`GameObject` → `Object3D`、`__class__` → `__type__`、旧 Transform 内联字段
//   （x/y/z/rx/ry/rz，**角度**）→ `position` / `rotation`（**弧度**）、几何体 assetId → 内联几何体、
//   Color3 → Color4、`components` 中的 null 占位清除；
// - 主仓已不存在的组件（AudioListener / *Collider / Rigidbody / PhysicsWorld）被丢弃并打印清单。
//
// 设计依据见 docs/SERIALIZATION_MIGRATION.md 的 S3。
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SRC = process.argv[2] ?? 'packages/editor/resource/template/default.scene.json';
const LEGACY = join(dirname(SRC), 'default.scene.legacy.json');

const DEG2RAD = Math.PI / 180;

/** 旧 Transform 内联在对象上的字段（Transform 组件已删除） */
const TRANSFORM_KEYS = ['x', 'y', 'z', 'rx', 'ry', 'rz'];

/** 主仓已不存在的组件：直接丢弃 */
const DROPPED_COMPONENTS = new Set([
    'AudioListener', 'Transform',
    'PlaneCollider', 'SphereCollider', 'BoxCollider', 'Rigidbody', 'PhysicsWorld',
]);

/**
 * 新建默认材质。
 *
 * 必须**每个 MeshRenderer 一份**：旧资源不描述材质（由资源库默认材质提供），而新范式下
 * 多个 MeshRenderer 共用一个材质对象会在渲染提交时出错；同时省略 `material` 也不可行
 * （RenderableLogic 的默认材质兜底路径会抛 `Cannot set properties of undefined`）。
 */
function createDefaultMaterial()
{
    return {
        __type__: 'StandardMaterial',
        uniforms: { u_diffuse: { __type__: 'Color4', r: 0.6, g: 0.6, b: 0.6, a: 1 } },
    };
}

/** Color3 → Color4（alpha 补 1） */
function color3ToColor4(value)
{
    if (!value) return undefined;

    return { __type__: 'Color4', r: value.r ?? 1, g: value.g ?? 1, b: value.b ?? 1, a: 1 };
}

/**
 * 旧几何体 → 内联几何体。
 *
 * 旧格式用 `{ assetId: 'Plane', width, height }` 引用资源库里的几何体；
 * 新范式要求几何体数据内联，assetId 直接对应 `<assetId>Geometry` 类型。
 */
function convertGeometry(geometry)
{
    if (!geometry) return undefined;
    const { assetId, hideFlags, __class__, ...params } = geometry;
    const type = __class__ && __class__.endsWith('Geometry') ? __class__ : `${assetId}Geometry`;

    return { __type__: type, ...params };
}

/** 旧组件 → 新组件（返回 null 表示丢弃） */
function convertComponent(component, dropped)
{
    if (!component) return null;
    const className = component.__class__ ?? component.__type__;

    if (DROPPED_COMPONENTS.has(className))
    {
        dropped.add(className);

        return null;
    }

    const { __class__, hideFlags, ...rest } = component;

    switch (className)
    {
        case 'Camera':
            // 旧 `Camera + PerspectiveLens` 已合并为 PerspectiveCamera
            return { __type__: 'PerspectiveCamera', fov: 60, aspect: 1, near: 0.3, far: 5000, ...rest };
        case 'DirectionalLight':
            return {
                __type__: 'DirectionalLight',
                lightType: 0,
                color: { __type__: 'Color3', r: 1, g: 1, b: 1 },
                intensity: 1,
                shadowType: 1,
                shadowBias: 0.003,
                shadowRadius: 0,
                debugShadowMap: false,
                ...rest,
            };
        case 'MeshRenderer':
            return { __type__: 'MeshRenderer', geometry: convertGeometry(component.geometry), material: createDefaultMaterial() };
        case 'Scene':
            return {
                __type__: 'Scene',
                background: color3ToColor4(component.background),
                ambientColor: color3ToColor4(component.ambientColor),
            };
        default:
            return { __type__: className, ...rest };
    }
}

/**
 * 分离旧 Transform 数据。
 *
 * 旧格式中 Transform 是**组件**（`components` 里第一个不带 `__class__` 的普通对象，
 * 字段平铺为 x/y/z/rx/ry/rz）；也有部分文件把同样的字段直接内联在对象上。
 * 两种形态都要提取，否则对象位置会整片丢失。
 */
function pickLegacyTransform(components)
{
    const transform = {};
    const remaining = [];

    for (const component of components ?? [])
    {
        const isPlain = component && typeof component === 'object'
            && !component.__class__ && !component.__type__;
        if (isPlain) Object.assign(transform, component);
        else remaining.push(component);
    }

    return { transform, remaining };
}

/** 旧对象 → Object3D（含递归） */
function convertObject(object, dropped)
{
    const { __class__, hideFlags, components, children, ...rest } = object;

    const { transform, remaining } = pickLegacyTransform(components);

    const position = {
        x: rest.x ?? transform.x ?? 0,
        y: rest.y ?? transform.y ?? 0,
        z: rest.z ?? transform.z ?? 0,
    };
    const rotation = {
        x: (rest.rx ?? transform.rx ?? 0) * DEG2RAD,
        y: (rest.ry ?? transform.ry ?? 0) * DEG2RAD,
        z: (rest.rz ?? transform.rz ?? 0) * DEG2RAD,
    };
    for (const key of TRANSFORM_KEYS) delete rest[key];

    const result = {
        __type__: 'Object3D',
        ...rest,
        position,
        rotation,
    };

    const convertedComponents = remaining
        .map((component) => convertComponent(component, dropped))
        .filter(Boolean);
    if (convertedComponents.length > 0) result.components = convertedComponents;

    const convertedChildren = (children ?? []).map((child) => convertObject(child, dropped));
    if (convertedChildren.length > 0) result.children = convertedChildren;

    return result;
}

if (!existsSync(LEGACY))
{
    renameSync(SRC, LEGACY);
    console.log(`已备份旧格式场景文件 → ${LEGACY}`);
}

const legacy = JSON.parse(readFileSync(LEGACY, 'utf8'));
const dropped = new Set();
const converted = convertObject(legacy, dropped);

writeFileSync(SRC, `${JSON.stringify(converted, null, '\t')}\n`, 'utf8');

console.log(`已写出纯数据场景文件 → ${SRC}`);
if (dropped.size > 0)
{
    console.log(`丢弃主仓已不存在的组件（${dropped.size} 类）：${Array.from(dropped).join(', ')}`);
}
