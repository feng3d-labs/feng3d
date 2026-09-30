import { serialization } from 'feng3d';
import type { gPartial, Object3D } from 'feng3d';

/**
 * 对象资源文件后缀（issue #40 的后缀约定：保留 `.json` 并在前面加类型标记）。
 *
 * 判据与仓库资源守卫 `test/resourceFormatGuard.spec.ts` 一致：内容是一棵**不含 `Scene`
 * 组件**的 `Object3D` 树时，后缀必须是 `.gameobject.json`。
 *
 * 已知不一致（不在本包范围内）：`packages/assets/src/assets/Object3DAsset.ts` 的
 * `extenson` 目前是 `.json`，即资源系统新建的对象资源还不会带上该标记。
 */
export const GAMEOBJECT_ASSET_FILE_EXT = '.gameobject.json';

/**
 * 判断文件路径是否为对象资源文件（按后缀约定，见 {@link GAMEOBJECT_ASSET_FILE_EXT}）。
 *
 * @param filePath 资源路径
 */
export function isGameObjectAssetFilePath(filePath: string): boolean
{
    return filePath.endsWith(GAMEOBJECT_ASSET_FILE_EXT);
}

/**
 * 判断已读出的资源数据是否为**纯数据格式**。
 *
 * 纯数据格式带 `__type__` 字面量、不带 `__class__`，只能走 {@link serialization.deserialize}；
 * 走资源系统的反射构造链路（`ReadRS.deserializeWithAssets` → `classUtils.getInstanceByName`）
 * 会因取不到类名而失败（实测报 `无法获取名称为 undefined 的实例!`）。
 *
 * @param fileData 文件读出的原始数据
 */
export function isPureDataAssetFile(fileData: unknown): boolean
{
    return isRecord(fileData) && typeof fileData.__type__ === 'string';
}

/**
 * 判断已读出的资源数据是否为**旧格式**（带 `__class__` 类名）。
 *
 * 旧格式需要资源系统的反射构造链路（`ReadRS.deserializeWithAssets`）才能还原实例。
 *
 * @param fileData 文件读出的原始数据
 */
export function isLegacyAssetFile(fileData: unknown): boolean
{
    return isRecord(fileData) && typeof fileData.__class__ === 'string';
}

/**
 * 把一棵 `Object3D` 子树转换为对象资源文件的纯数据载荷（**深拷贝**）。
 *
 * 与场景文件（`serialization.serialize(root)`）同为纯数据格式，即"对象存为资源"与
 * "场景存盘"共用一套序列化；区别只在根对象是否带 `Scene` 组件与文件后缀。
 *
 * 拷贝而非引用：资源一旦与场景里的对象共用同一份数据，之后在场景中编辑该对象
 * 会连带改写资源内容（`ObjectAsset` 监听 `data` 的属性变化并回写资源文件）。
 *
 * `assetId` / `prefabId` 是**资源实例**的身份字段（`Object3DAsset._getAssetData` 取用时
 * 也是先剥离再按当前资源重设），写进资源文件会让资源自引用，故一并剥离。
 *
 * @param object3D 待保存的对象子树
 * @returns 可 JSON 化并写入 `.gameobject.json` 的纯数据
 */
export function object3DToAssetFileData(object3D: Object3D): Record<string, unknown>
{
    const data = serialization.serialize(object3D) as unknown as Record<string, unknown>;

    delete data['assetId'];
    delete data['prefabId'];

    return data;
}

/**
 * 从对象资源文件的纯数据读回 `Object3D` 子树。
 *
 * 只受理纯数据格式（{@link isPureDataAssetFile}）：这是当前"对象存为资源"的写出形态。
 * 旧格式（`__class__`）需要资源系统参与（异步加载引用到的资源数据），本函数**不假装能读**，
 * 返回 `null` 交由调用方走 `editorRS.deserializeWithAssets`——与
 * `EditorAsset.readScene` 处理场景文件时的分流规则一致。
 *
 * @param fileData 文件读出的原始数据
 * @returns 读回的对象子树；非纯数据格式时返回 `null`
 */
export function object3DDataFromAssetFile(fileData: unknown): Object3D | null
{
    if (!isPureDataAssetFile(fileData)) return null;

    return serialization.deserialize<Object3D>(fileData as gPartial<Object3D>);
}

/**
 * 是否为可承载字段的普通对象（排除 `null` 与数组）。
 *
 * @param value 待判定的值
 */
function isRecord(value: unknown): value is Record<string, unknown>
{
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
