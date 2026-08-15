import { reactive, toRaw } from '@feng3d/reactivity';
import type { Texture } from '@feng3d/webgpu';
import { createTextureFromUrl, defaultTexture } from './createTexture';

/**
 * 纹理声明（纯数据，框架设计文档 3.2 异步资源声明化）。
 *
 * JSON 中以 `{ __type__: 'Texture', url }` 引用外部纹理，由
 * {@link resolveTexture} 在消费点惰性解析：命中响应式缓存返回纹理，
 * 未命中返回占位符并触发幂等加载；加载完成写入缓存，依赖链自动失效换装。
 */
export interface TextureResource
{
    readonly __type__: 'Texture';
    readonly url: string;
}

/**
 * 材质纹理字段类型：运行时 Texture 对象或声明式引用。
 */
export type TextureField = Texture | TextureResource | undefined;

/**
 * 判断字段是否为声明式纹理引用。
 */
export function isTextureResource(field: TextureField): field is TextureResource
{
    return !!field && (field as { __type__?: string }).__type__ === 'Texture';
}

/**
 * 缓存条目：url → 加载状态与纹理。
 *
 * 条目为不可变对象——状态迁移通过 Map.set 整体替换（同 key 写入触发
 * 依赖该 key 的消费者失效）。
 */
interface TextureLoadEntry
{
    readonly status: 'loading' | 'loaded' | 'error';
    readonly texture?: Texture;
}

/**
 * 纹理缓存（响应式 Map，reactivity 支持集合响应化）。
 *
 * key 为 url：多个材质引用同一 url 只加载一次；url 即变更语义——
 * 换 url 走新 key 重新加载，失败条目也由换 url（数据变更）触发重试。
 */
const _textureCache = new Map<string, TextureLoadEntry>();

/**
 * 幂等加载：同一 url 只发起一次请求（框架设计文档 4.3 白名单例外——
 * computed 内允许触发幂等且记忆化的加载请求）。
 */
function requestLoad(url: string): void
{
    const r_cache = reactive(_textureCache);
    if (r_cache.has(url)) return;

    r_cache.set(url, { status: 'loading' });
    createTextureFromUrl(url).then(
        (texture) =>
        {
            r_cache.set(url, { status: 'loaded', texture });
        },
        () =>
        {
            // 失败保持占位符并记录错误状态；重试由数据变更（换 url）触发
            console.error(`[TextureResource] ${url} 加载失败，使用占位纹理`);
            r_cache.set(url, { status: 'error' });
        },
    );
}

/**
 * 解析纹理字段（消费点调用，需处于 computed/effect 等响应式上下文）。
 *
 * - undefined / 运行时 Texture：直接返回（缺省用 placeholder）
 * - 声明式引用：查缓存，命中且已加载返回纹理；未命中或加载中触发加载
 *   并返回 placeholder（1×1 白纹理渐进换装，加载完成自动失效依赖链）
 */
export function resolveTexture(field: TextureField, placeholder: Texture = defaultTexture): Texture
{
    if (!field) return placeholder;
    if (!isTextureResource(field)) return field;

    const entry = reactive(_textureCache).get(field.url);
    if (entry)
    {
        // 经 reactive Map 取出的对象可能是代理，toRaw 还原为原始纹理
        return entry.status === 'loaded' && entry.texture ? toRaw(entry.texture) : placeholder;
    }

    requestLoad(field.url);

    return placeholder;
}

/**
 * 判断纹理字段是否加载完成（undefined / 运行时 Texture 视为已加载，
 * 与"sources 在创建时已就绪"的现状语义一致）。
 */
export function isTextureFieldLoaded(field: TextureField): boolean
{
    if (!field || !isTextureResource(field)) return true;

    const entry = reactive(_textureCache).get(field.url);

    return !!entry && entry.status === 'loaded';
}

/**
 * 测试钩子：直接注入已加载纹理（Node 环境无 Image，无法走真实加载）。
 *
 * @internal
 */
export function setTextureForTest(url: string, texture: Texture): void
{
    reactive(_textureCache).set(url, { status: 'loaded', texture });
}
