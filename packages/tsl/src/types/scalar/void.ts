import { IElement, ShaderValue } from '../../core/IElement';

/**
 * `void` 类型——用于**无返回值**的辅助函数。
 *
 * WGSL / GLSL 都没有把 `void` 当作可声明的类型，所以：
 * - {@link ShaderFunc} 生成签名时看到 `void` 会**省略返回类型**（`fn f(a: u32) {`）；
 * - 自身渲染成**空串**，因此不会被误当成表达式写进代码。
 *
 * 用法：`func('f', [['a', UInt]], void_, (a) => { ... })`（函数体内部用 return_() 结束）
 *
 * @internal 库外部不应直接使用 `new Void()`，应使用 `void_`（或直接传 `void_` 工厂）
 */
export class Void implements ShaderValue
{
    readonly glslType = 'void';
    readonly wgslType = 'void';

    dependencies: IElement[] = [];

    /** 空串：void 不产生值 */
    toGLSL = () => '';

    /** 空串：void 不产生值 */
    toWGSL = () => '';
}

/**
 * void 类型构造函数（作为 `func` 的 `returnType` 传入）。
 *
 * @returns Void 实例
 */
export function void_(): Void
{
    return new Void();
}
