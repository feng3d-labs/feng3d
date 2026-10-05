import { Color4, defaultTexture, Material, TextureField } from 'feng3d';
import { Vector4 } from '@feng3d/math';
import type { RenderObject } from '@feng3d/webgpu';

declare global
{
    export interface MixinsUniforms extends UIUniforms
    {
    }
}

/**
 * UI 材质的 uniform 数据（纯数据接口）。
 *
 * 迁移前的 `UIUniforms` 是带 `@serialize` / `@oav` 装饰器的 class：新范式下数据一律是
 * 纯数据接口（装饰器只在 class 上可用，字段描述改由 `__type__` + 类型驱动的属性面板生成），
 * 故改为 interface + {@link createUIUniforms} 默认值工厂（对应原 class 的字段初始值）。
 */
export interface UIUniforms
{
    /**
     * UI几何体尺寸，在shader中进行对几何体缩放。
     */
    readonly u_rect?: Vector4;

    /**
     * 颜色
     */
    readonly u_color?: Color4;

    /**
     * 纹理数据
     */
    readonly s_texture?: TextureField;

    /**
     * 控制图片的显示区域。
     */
    readonly u_uvRect?: Vector4;
}

/**
 * 创建 UI uniform 默认值（等价于迁移前的 `new UIUniforms()`）。
 *
 * 各 Color4 / Vector4 字面量每次新建，避免调用方之间共享同一个可变对象。
 *
 * ⚠️ `u_color` 是**白色**：原 `UIUniforms.u_color = new Color4()`，而旧 math `Color4` class 的
 * 无参默认值是 `r = g = b = a = 1`（不是黑色，见 `packages/math/src/color/color4.ts` 文件头
 * 关于 `a` 的说明）。第 1 批迁移时误写成黑色，第 3 批核对旧 class 默认值后修正。
 */
export function createUIUniforms(): UIUniforms
{
    return {
        u_rect: { __type__: 'Vector4', x: 0, y: 0, z: 100, w: 100 },
        u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        s_texture: defaultTexture,
        u_uvRect: { __type__: 'Vector4', x: 0, y: 0, z: 1, w: 1 },
    };
}

/**
 * 取渲染对象上的 UI uniform 容器（缺失时就地创建）。
 *
 * `RenderObject` 本身没有 `uniforms` 字段（它的绑定数据在 `bindingResources` 上）；
 * UI 组件在 WebGPU 迁移过渡期仍按旧 WebGL 路径，把 uniform 写在渲染对象的这个动态字段上。
 *
 * 为什么每个 UI 组件都要经本函数取容器：渲染链按宿主的 `components` 顺序分发 `beforeRender`，
 * 若只在 `CanvasRenderer` 里创建容器，排在它前面的 `Transform2D` 就会往 `undefined` 上写
 * （`Cannot set properties of undefined`）；谁先写谁创建，后写的拿到同一个容器。
 *
 * @param renderObject 渲染对象
 * @returns 该渲染对象的 UI uniform 容器（同一渲染对象上始终是同一个对象）
 */
export function uiUniforms(renderObject: RenderObject): Record<string, unknown>
{
    const ro = renderObject as RenderObject & { uniforms?: Record<string, unknown> };

    return ro.uniforms ||= {};
}

/**
 * 创建 UI 默认材质。
 *
 * 迁移前这里是 `Material.setDefault('Default-UIMaterial', new StandardMaterial())`：
 * 把材质登记进默认材质注册表，供 `Material.getDefault('Default-UIMaterial')` 取用。
 * 主仓已移除该注册表（`Material.setDefault` / `getDefaultMaterial` 都不存在，
 * 渲染侧改为「字段缺失时回退到 `{ __type__: 'StandardMaterial' }`」，见 `RenderableLogic`），
 * 因此这里保留等价工厂：**UI 材质尚未重构为 Material 子类，仍以 StandardMaterial 占位**
 * （与原实现的 TODO 一致；UI 着色器 WGSL 尚未落地，本批不发明）。
 *
 * @returns 默认 UI 材质数据
 */
export function createUIMaterial(): Material
{
    return { __type__: 'StandardMaterial' };
}
