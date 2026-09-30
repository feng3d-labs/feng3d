import { effect, Effect, logic as getLogic, toRaw } from '@feng3d/reactivity';
import type { Object3D, Object3DLogic } from '../core/Object3D';
import { getTextureLoadStatus, isTextureResource, requestTextureLoad, TextureField, TextureResource } from '../textures/TextureResource';
import { AssetType } from './AssetType';

/**
 * 资源加载状态（与声明式纹理的状态语义一致，供自定义读取器实现对齐）。
 *
 * - `none`：从未请求过加载
 * - `loading`：加载中
 * - `loaded`：已就绪
 * - `error`：读取失败
 */
export type AssetLoadStatus = 'none' | 'loading' | 'loaded' | 'error';

/**
 * 对象树中使用到的一处资源（纯数据）。
 *
 * 目前只有声明式纹理一种形态（`{ __type__: 'Texture', url }`）；将来新增资源类型时，
 * 按 `assetType` 扩展联合即可，调用方的遍历结构不变。
 */
export interface AssetReference
{
    /** 资源类型 */
    readonly assetType: AssetType.texture;

    /** 资源地址（同一地址在一次收集中只出现一次） */
    readonly url: string;

    /** 引用该资源的原始声明对象（如 `{ __type__: 'Texture', url }`） */
    readonly asset: TextureResource;
}

/**
 * 资源读取器：把"谁来加载资源、现在加载到哪一步"从等待逻辑里抽出来。
 *
 * 默认实现读声明式纹理缓存（生产路径）；测试可注入完全受控的实现，
 * 不必依赖真实网络与 `Image` 就能确定性地驱动完成与失败。
 *
 * **实现约定（重要）**：`statusOf` 必须可在响应式上下文（effect）内被读取并建立依赖，
 * 状态推进时要能触发依赖失效——{@link whenAssetsLoaded} 靠这条依赖决定何时兑现 Promise。
 * 默认实现读的是响应式纹理缓存，天然满足。
 */
export interface AssetReader
{
    /**
     * 发起加载（幂等：同一 url 只请求一次；已完成的条目不应被重置）。
     */
    readonly load: (url: string) => void;

    /**
     * 查询当前状态（`'none'` 表示尚未发起过加载）。
     */
    readonly statusOf: (url: string) => AssetLoadStatus;
}

let _defaultAssetReader: AssetReader | null = null;

/**
 * 取默认资源读取器（声明式纹理缓存；首次使用时创建——R2 零模块级副作用）。
 */
function getDefaultAssetReader(): AssetReader
{
    if (!_defaultAssetReader)
    {
        _defaultAssetReader = {
            load: requestTextureLoad,
            statusOf: getTextureLoadStatus,
        };
    }

    return _defaultAssetReader;
}

/**
 * 收集某个 Object3D（含其子树与组件）中使用到的所有资源。
 *
 * 遍历范围：自身 → 全部组件（沿组件数据深度优先，不深入具体字段名，因此新材质类型
 * 无需改动本函数）→ 递归 children。声明式纹理引用一旦命中即记为一项，不再深入其内部。
 *
 * 结果按**首次出现顺序**去重：同一 url 被多个材质引用时只算一项
 *（与纹理缓存的 "url 即 key、只加载一次" 语义一致）。
 *
 * 不存在的资源（凭空构造的对象、没有 url 的运行时 Texture）不会被计入——
 * 只有真正需要读取的资源才会进入结果。
 *
 * @param object3D 根对象
 * @returns 资源引用列表（无资源时为空数组）
 */
export function collectAssets(object3D: Object3D): AssetReference[]
{
    const found = new Map<string, AssetReference>();

    collectFromObject3D(object3D, found, new Set<object>());

    return [...found.values()];
}

/**
 * 等待某个 Object3D（含其子树与组件）使用到的所有资源加载完成。
 *
 * - 全部就绪（含"根本不引用任何资源"）时 resolve；
 * - 任一资源读取失败时 **reject**（如实上报，不静默等待一个不会到来的完成）；
 * - 尚未被渲染触达过的资源会被主动发起加载（{@link AssetReader.load}，幂等）。
 *
 * 等待期间库内部持有一个响应式 effect 订阅资源状态；完成 / 失败后自动停止订阅。
 * **不做超时**：调用方若需要超时自行 `Promise.race`——库无法替调用方决定多久算失败。
 *
 * @param object3D 根对象
 * @param reader 资源读取器（默认走声明式纹理缓存；测试可注入受控实现）
 * @returns 全部资源就绪时 resolve 的 Promise
 */
export function whenAssetsLoaded(object3D: Object3D, reader: AssetReader = getDefaultAssetReader()): Promise<void>
{
    return new Promise<void>((resolve, reject) =>
    {
        let settled = false;
        let subscription: Effect | null = null;

        const settle = (finish: () => void): void =>
        {
            if (settled) return;
            settled = true;

            // 不能在 effect 自身执行中同步 stop（依赖收集尚未结束），推迟到微任务
            queueMicrotask(() => subscription?.stop());
            finish();
        };

        // @边界 effect：订阅资源状态 → 兑现 Promise（Promise 回调是外部副作用，无法 pull 化）
        subscription = effect(() =>
        {
            if (settled) return;

            const assets = collectAssets(object3D);

            // 幂等发起加载：从未被渲染触达过的资源也要开始读取
            for (let i = 0; i < assets.length; i++)
            {
                reader.load(assets[i].url);
            }

            // 失败优先于完成：混合场景下如实上报失败，而不是等其余资源慢慢加载完
            for (let i = 0; i < assets.length; i++)
            {
                if (reader.statusOf(assets[i].url) === 'error')
                {
                    const url = assets[i].url;
                    settle(() => reject(new Error(`资源加载失败：${url}`)));

                    return;
                }
            }

            // 全部就绪：无资源时天然成立 → Promise 立即 resolve
            let allLoaded = true;
            for (let i = 0; i < assets.length; i++)
            {
                if (reader.statusOf(assets[i].url) !== 'loaded')
                {
                    allLoaded = false;
                    break;
                }
            }

            if (allLoaded)
            {
                settle(() => resolve());
            }
        });
    });
}

/**
 * 遍历单个对象：先组件、再子树。
 *
 * 组件与子对象都经 `logic()` 读取（拿到 pre-fill 过的列表，并建立结构上的响应式依赖），
 * `logic()` 取不到时退回读原始数据字段，不因一个节点未注册就放弃整棵树。
 *
 * @param object3D 当前对象
 * @param found 收集结果（key 为 url，保持首次出现顺序）
 * @param visited 已访问对象（防重复遍历与循环引用）
 */
function collectFromObject3D(object3D: Object3D, found: Map<string, AssetReference>, visited: Set<object>): void
{
    const raw = toRaw(object3D);
    if (visited.has(raw)) return;
    visited.add(raw);

    const objectLogic = getLogic(raw) as Object3DLogic | null;
    const components = objectLogic ? objectLogic.components : raw.components;

    if (components)
    {
        for (let i = 0; i < components.length; i++)
        {
            collectFromValue(toRaw(components[i]), found, visited);
        }
    }

    const children = objectLogic ? objectLogic.children : raw.children;

    if (children)
    {
        for (let i = 0; i < children.length; i++)
        {
            if (children[i]) collectFromObject3D(children[i], found, visited);
        }
    }
}

/**
 * 沿任意数据（组件 → 材质 → 纹理声明）深度优先查找资源引用。
 *
 * 剪枝：命中声明式纹理即止；TypedArray（顶点数据等）与函数不进入；
 * 已访问对象不重复进入（同一材质被多处引用时只扫一次）。
 *
 * @param value 待扫描的值
 * @param found 收集结果
 * @param visited 已访问对象
 */
function collectFromValue(value: unknown, found: Map<string, AssetReference>, visited: Set<object>): void
{
    if (value === null || typeof value !== 'object') return;

    const obj = value as object;
    if (visited.has(obj)) return;
    visited.add(obj);

    if (isTextureResource(obj as TextureField))
    {
        const texture = obj as TextureResource;
        if (typeof texture.url === 'string' && !found.has(texture.url))
        {
            found.set(texture.url, {
                assetType: AssetType.texture,
                url: texture.url,
                asset: texture,
            });
        }

        return;
    }

    // 顶点 / 索引等 TypedArray 不是资源容器，逐元素遍历纯属浪费
    if (ArrayBuffer.isView(obj)) return;

    if (Array.isArray(obj))
    {
        for (let i = 0; i < obj.length; i++)
        {
            collectFromValue(obj[i], found, visited);
        }

        return;
    }

    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++)
    {
        collectFromValue((obj as Record<string, unknown>)[keys[i]], found, visited);
    }
}
