import { Color4, defaultTexture, Material, TextureField } from 'feng3d';
import { Vector4 } from '@feng3d/math';

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
 */
export function createUIUniforms(): UIUniforms
{
    return {
        u_rect: { __type__: 'Vector4', x: 0, y: 0, z: 100, w: 100 },
        u_color: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        s_texture: defaultTexture,
        u_uvRect: { __type__: 'Vector4', x: 0, y: 0, z: 1, w: 1 },
    };
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
