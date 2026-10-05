import { describe, expect, it } from 'vitest';
import { Float, abs, array, compute, return_, uint, uniform, while_, saturate, arrayLength, assign, builtin, compute, continue_, depthSampler, discard, float, floor, forRange_, forU32_, fragment, if_, ivec2, int, let_, max, return_, sampler2D, samplerComparison, storageBuffer, struct, texelFetch, textureSampleCompare, uint, uniform, uvec2, uvec3, var_, vec2, vec3, vec4 } from '../src/index';

/**
 * 本批为 TSL 补齐的三项能力（#710 / #711）：for 循环、向量动态索引、f32→i32 转换。
 * 它们原先都缺失，导致蒙皮逻辑无法用 TSL 表达。
 */
describe('TSL 的 for 循环（forRange_）', () =>
{
    it('生成 WGSL 的 for (var i = 0; i < n; i = i + 1)', () =>
    {
        const f = fragment('main', () =>
        {
            const acc = var_('acc', vec4(0.0, 0.0, 0.0, 0.0));
            forRange_('i', 0, 4, (i) =>
            {
                acc.assign(acc.add(vec4(i.toWGSL() === 'i' ? 1.0 : 0.0)));
            });
            return_(acc);
        });
        const wgsl = f.toWGSL();

        expect(wgsl).toContain('for (var i = 0; i < 4; i = i + 1) {');
        expect(wgsl).toContain('acc = acc + vec4<f32>(1.0);');
    });

    it('循环体里的语句挂在循环内（缩进一层）', () =>
    {
        const f = fragment('main', () =>
        {
            forRange_('j', 1, 3, () =>
            {
                return_(vec4(0.0));
            });
        });

        expect(f.toWGSL()).toContain('    return vec4<f32>(0.0);');
    });
});

describe('向量动态索引与 f32→i32 转换', () =>
{
    it('vec4 的 index(i) 生成 v[i]（原先只有 swizzle 分量）', () =>
    {
        const f = fragment('main', () =>
        {
            const v = var_('v', vec4(1.0, 2.0, 3.0, 4.0));
            const acc = var_('acc', vec4(0.0, 0.0, 0.0, 0.0));
            forRange_('i', 0, 4, (i) =>
            {
                // 循环变量直接当索引（蒙皮的 skinIndices[i] 就是这个形态）
                acc.assign(vec4(v.index(i), v.index(i), v.index(i), v.index(i)));
            });
            return_(acc);
        });

        const wgsl = f.toWGSL();
        expect(wgsl).toContain('v[i]');
    });

    it('int(f32) 生成 i32(...)', () =>
    {
        const value = new Float(1.0);

        expect(int(value).toWGSL()).toBe('i32(1.0)');
        expect(int(value).toGLSL()).toBe('int(1.0)');
    });
});

describe('discard 与比较采样器（#710，StandardMaterial 片元的前置）', () =>
{
    it('discard 生成 discard;，并挂在当前 if 体内', () =>
    {
        const f = fragment('main', () =>
        {
            const c = var_('c', vec4(1.0, 1.0, 1.0, 1.0));
            if_(c.a.lessThan(0.5), () =>
            {
                discard();
            });
            return_(c);
        });
        const wgsl = f.toWGSL();

        expect(wgsl).toContain('if (c.a < 0.5) {');
        expect(wgsl).toContain('        discard;');
    });

    it('比较采样器声明为 texture_depth_2d + sampler_comparison（TSL 展开格式）', () =>
    {
        const s = samplerComparison(uniform('s_shadowMap', 2, 0));

        expect(s.toWGSL()).toBe('@binding(0) @group(2) var s_shadowMap_texture: texture_depth_2d;\n@binding(1) @group(2) var s_shadowMap: sampler_comparison;');
    });

    it('textureSampleCompare 生成硬件深度比较调用', () =>
    {
        const s = samplerComparison(uniform('s_shadowMap', 2, 0));
        const expr = textureSampleCompare(s, vec2(0.5, 0.5), new Float(0.25));

        expect(expr.toWGSL()).toBe('textureSampleCompare(s_shadowMap_texture, s_shadowMap, vec2<f32>(0.5), 0.25)');
    });
});

describe('结构体数组（#710，standardLightingParsWGSL 的前置）', () =>
{
    it('结构体数组作为 UBO 成员：生成嵌套 struct 定义与 array<Struct, N>', () =>
    {
        const PointLightData = struct('PointLightData', { position: vec3, range: float, color: vec3, intensity: float });
        const LightsUniform = struct('LightsUniform', {
            u_directionalLight: vec3,
            u_pointLightCount: float,
            u_pointLights: array(PointLightData, 8),
        });
        const lights = LightsUniform(uniform('lights', 0, 4));

        const f = fragment('main', () =>
        {
            const v = let_('v', lights.u_pointLights.index(0).position);
            return_(vec4(v, 1.0));
        });
        const wgsl = f.toWGSL();

        // 嵌套结构体定义要一起生成（否则 array<PointLightData, 8> 引用不到）
        expect(wgsl).toContain('struct PointLightData');
        expect(wgsl).toContain('struct LightsUniform');
        expect(wgsl).toContain('u_pointLights: array<PointLightData, 8>');
        expect(wgsl).toContain('@group(0) @binding(4) var<uniform> lights: LightsUniform;');
        // 元素访问要带上下标（成员路径挂在它上面）
        expect(wgsl).toContain('lights.u_pointLights[0].position');
    });
});

describe('运行期上界的 for 循环（forU32_，#710）', () =>
{
    it('生成 for (var i: u32 = 0u; i < count; i = i + 1u) 且循环体缩进', () =>
    {
        const count = let_('count', uint(3.0));
        const f = fragment('main', () =>
        {
            const acc = var_('acc', vec4(0.0, 0.0, 0.0, 0.0));
            forU32_('i', 0, count, (i) =>
            {
                acc.assign(acc.add(vec4(float(i), 0.0, 0.0, 0.0)));
            });
            return_(acc);
        });
        const wgsl = f.toWGSL();

        expect(wgsl).toContain('for (var i: u32 = 0u; i < count; i = i + 1u) {');
        // 循环变量能用在循环体里（索引 / 取值）
        expect(wgsl).toContain('acc = acc + vec4<f32>(f32(i), 0.0, 0.0, 0.0);');
    });
});

describe('storage buffer（#785 的 C1，compute 的前置）', () =>
{
    it('声明与手写一致：@group/@binding var<storage, read|read_write> name: array<T>', () =>
    {
        const size = storageBuffer('size', { elementType: uint, group: 0, binding: 0 });
        const current = storageBuffer('current', { elementType: uint, group: 0, binding: 1 });
        const next = storageBuffer('next', { elementType: uint, access: 'read_write', group: 0, binding: 2 });

        const f = fragment('main', () =>
        {
            const w = let_('w', size.index(0));
            const cur = let_('cur', current.index(w));
            const nx = let_('nx', next.index(cur));
            return_(vec4(float(nx), 0.0, 0.0, 1.0));
        });
        const wgsl = f.toWGSL();

        // 运行期长度数组（storage 的常见形态）
        expect(wgsl).toContain('@binding(0) @group(0) var<storage, read> size: array<u32>;');
        expect(wgsl).toContain('@binding(1) @group(0) var<storage, read> current: array<u32>;');
        expect(wgsl).toContain('@binding(2) @group(0) var<storage, read_write> next: array<u32>;');
        // 索引访问
        expect(wgsl).toContain('let w = size[0];');
        expect(wgsl).toContain('let cur = current[w];');
        expect(wgsl).toContain('let nx = next[cur];');
    });

    it('给了 length 时生成固定长度数组', () =>
    {
        const data = storageBuffer('data', { elementType: float, group: 0, binding: 0, length: 64 });
        const f = fragment('main', () =>
        {
            const v = let_('v', data.index(3));
            return_(vec4(v, 0.0, 0.0, 1.0));
        });
        const wgsl = f.toWGSL();

        expect(wgsl).toContain('@binding(0) @group(0) var<storage, read> data: array<f32, 64>;');
        expect(wgsl).toContain('let v = data[3];');
    });
});

describe('compute 入口与 builtin（#785 的 C2）', () =>
{
    it('生成 @compute @workgroup_size + @builtin(global_invocation_id)，且函数体不嵌套', () =>
    {
        const size = storageBuffer('size', { elementType: uint, group: 0, binding: 0 });
        const current = storageBuffer('current', { elementType: uint, group: 0, binding: 1 });
        const grid = uvec3(builtin('global_invocation_id'));

        const shader = compute('main', [8, 8], () =>
        {
            const w = let_('w', size.index(0));
            const x = let_('x', grid.x);
            const idx = let_('idx', x.multiply(w));
            const c2 = let_('c', current.index(idx));
            return_(c2);
        });
        const wgsl = shader.toWGSL();

        expect(wgsl).toContain('@compute @workgroup_size(8, 8)');
        expect(wgsl).toContain('fn main(@builtin(global_invocation_id) globalInvocationId: vec3<u32>) {');
        expect(wgsl).toContain('let x = globalInvocationId.x;');
        // 回归：函数体不能把 fn main 再套一层（曾经误用 super.toWGSL() 造成）
        expect(wgsl.split('fn main').length - 1).toBe(1);
    });

    it('workgroup_size 支持一维 / 三维', () =>
    {
        const a = compute('main', [64], () => { return_(uint(0)); }).toWGSL();
        expect(a).toContain('@compute @workgroup_size(64)');

        const b = compute('main', [4, 4, 4], () => { return_(uint(0)); }).toWGSL();
        expect(b).toContain('@compute @workgroup_size(4, 4, 4)');
    });
});

describe('compute 写入与 override（#785 的 C4 前置）', () =>
{
    it('storage 写入生成 name[i] = value（access 为 read_write）', () =>
    {
        const next = storageBuffer('next', { elementType: uint, access: 'read_write', group: 0, binding: 2 });
        const grid = uvec3(builtin('global_invocation_id'));

        const shader = compute('main', [8, 8], () =>
        {
            const x = let_('x', grid.x);
            assign(next.index(x), uint(1));
            return_(uint(0));
        });
        const wgsl = shader.toWGSL();

        expect(wgsl).toContain('@binding(2) @group(0) var<storage, read_write> next: array<u32>;');
        expect(wgsl).toContain('next[x] = 1u;');
    });

    it('单值 storage（array: false）与分量访问', () =>
    {
        const size = storageBuffer('size', { elementType: uvec2, group: 0, binding: 0, array: false });

        const shader = compute('main', [8, 8], () =>
        {
            const h = let_('h', size.value().y);
            return_(h);
        });
        const wgsl = shader.toWGSL();

        expect(wgsl).toContain('@binding(0) @group(0) var<storage, read> size: vec2<u32>;');
        expect(wgsl).toContain('let h = size.y;');
        // 单值不能下标
        expect(() => size.index(0)).toThrow(/单值声明/);
    });

    it('override 声明 + workgroup_size 用变量名', () =>
    {
        const shader = compute('main', ['blockSize', 'blockSize'], () =>
        {
            return_(uint(0));
        }, { overrides: { blockSize: 8 } });
        const wgsl = shader.toWGSL();

        expect(wgsl).toContain('override blockSize = 8;');
        expect(wgsl).toContain('@compute @workgroup_size(blockSize, blockSize)');
    });

    it('UInt 算术（add / subtract / multiply / modulo，无符号回绕）', () =>
    {
        const x = uint(5);
        expect(x.add(2).toWGSL()).toBe('(5u + 2u)');
        expect(x.subtract(2).toWGSL()).toBe('(5u - 2u)');
        expect(x.multiply(2).toWGSL()).toBe('(5u * 2u)');
        expect(x.modulo(3).toWGSL()).toBe('(5u % 3u)');
    });
});

describe('compute 循环能力（#785，updateSprites 的前置）', () =>
{
    it('arrayLength(\u0026arr) + continue_ 生成 WGSL 内置', () =>
    {
        const data = storageBuffer('data', { elementType: uint, group: 0, binding: 0 });
        const shader = compute('main', [64], () =>
        {
            const acc = var_('acc', uint(0));
            forU32_('i', 0, arrayLength(data), (i) =>
            {
                if_(i.equals(uint(3)), () =>
                {
                    continue_();
                });
                assign(acc, acc.add(data.index(i)));
            });
            return_(acc);
        });
        const wgsl = shader.toWGSL();

        expect(wgsl).toContain('for (var i: u32 = 0u; i < arrayLength(&data); i = i + 1u) {');
        expect(wgsl).toContain('if ((i == 3u)) {');
        expect(wgsl).toContain('continue;');
    });

    it('向量分量赋值（v.x = 1.0）', () =>
    {
        const shader = compute('main', [64], () =>
        {
            const p2 = var_('p', vec2(0.0, 0.0));
            assign(p2.x as never, float(1.0));
            assign(p2.y as never, float(-1.0));
            return_(p2);
        });
        const wgsl = shader.toWGSL();

        expect(wgsl).toContain('p.x = 1.0;');
        expect(wgsl).toContain('p.y = -1.0;');
    });

    it('storage buffer 的元素类型可以是结构体（声明用结构体名）', () =>
    {
        const Particle = struct('Particle', { pos: vec2, vel: vec2 });
        const particles = storageBuffer('particles', { elementType: Particle, group: 0, binding: 0 });

        // 只验证声明形态：元素访问（particles.index(i).pos）还需要"父 uniform + 路径"的构造，
        // 那是 updateSprites 迁移时要补的一项，本批先不做。
        const shader = compute('main', [64], () =>
        {
            const n = let_('n', arrayLength(particles));
            return_(n);
        });
        const wgsl = shader.toWGSL();

        expect(wgsl).toContain('struct Particle');
        expect(wgsl).toContain('var<storage, read> particles: array<Particle>;');
    });
});

describe('无符号整数与 uvec2 的类型放宽（#785，gameOfLife 渲染的前置）', () =>
{
    it('max 支持 u32（生成 max(..., ...) 且带 u 后缀）', () =>
    {
        const a = uint(3);
        const b = uint(5);
        const result = max(a, b);

        expect(result.toWGSL()).toBe('max(3u, 5u)');
        // 数字入参也用 u 后缀
        expect(max(a, 1).toWGSL()).toBe('max(3u, 1u)');
    });

    it('max 对浮点仍返回 f32', () =>
    {
        expect(max(float(1.5), float(2.5)).toWGSL()).toBe('max(1.5, 2.5)');
    });

    it('uvec2 可以包裹变量宿主（uniform / attribute）', () =>
    {
        const sizeUniform = uvec2(uniform('size', 0, 0));
        const f = fragment('main', () =>
        {
            const w = let_('w', sizeUniform.x);
            return_(vec4(float(w), 0.0, 0.0, 1.0));
        });
        const wgsl = f.toWGSL();

        // TSL 生成的 uniform 声明里变量名后有空格（`size : vec2<u32>`），断言到类型即可
        expect(wgsl).toContain('var<uniform> size');
        expect(wgsl).toContain('vec2<u32>');
        expect(wgsl).toContain('let w = size.x;');
    });
});

describe('深度纹理读取（#712，reversedZ / DebugShadowMap 的前置）', () =>
{
    it('深度纹理声明为 texture_depth_2d', () =>
    {
        const depthTexture = depthSampler(uniform('depthTexture', 0, 0));
        const f = fragment('main', () =>
        {
            const d = let_('d', texelFetch(depthTexture, ivec2(vec2(0.0, 0.0))));
            return_(vec4(d, d, d, float(1.0)));
        });
        const wgsl = f.toWGSL();

        expect(wgsl).toContain('var depthTexture_texture: texture_depth_2d;');
        expect(wgsl).toContain('textureLoad(depthTexture_texture,');
    });

    it('texelFetch 对深度纹理返回 f32（不是 vec4）', () =>
    {
        const depthTexture = depthSampler(uniform('d2', 0, 0));
        const value = texelFetch(depthTexture, ivec2(vec2(1.0, 2.0)));

        expect(value.toWGSL()).toBe('textureLoad(d2_texture, vec2<i32>(vec2<f32>(1.0, 2.0)), 0u)');
    });

    it('floor / abs 生成对应内置', () =>
    {
        expect(floor(vec2(1.5, -2.5)).toWGSL()).toBe('floor(vec2<f32>(1.5, -2.5))');
        expect(abs(float(-3.5)).toWGSL()).toBe('abs(-3.5)');
    });
});

describe('texelFetch 的坐标类型放宽（#712，DebugShadowMapMaterial 的前置）', () =>
{
    it('coord 也接受 uvec2（WGSL 的 textureLoad 两种坐标都合法）', () =>
    {
        const s_texture = sampler2D(uniform('s_texture', 1, 0));
        const texel = uvec2(3, 4);
        const value = texelFetch(s_texture, texel);

        // 手写 DebugShadowMapMaterial 里用的正是 vec2<u32> 坐标
        expect(value.toWGSL()).toBe('textureLoad(s_texture_texture, vec2<u32>(3, 4), 0u)');
    });
});

describe('saturate 与 u32 左移（#712，renderBundles 的前置）', () =>
{
    it('saturate 对标量生成 clamp(x, 0.0, 1.0)', () =>
    {
        expect(saturate(float(1.5)).toWGSL()).toBe('clamp(1.5, 0.0, 1.0)');
    });

    it('saturate 对向量把标量边界展开成同类型（WGSL 的 clamp(vecN, float, float) 不合法）', () =>
    {
        expect(saturate(vec3(0.5, 1.5, -0.5)).toWGSL()).toBe('clamp(vec3<f32>(0.5, 1.5, -0.5), vec3<f32>(0.0), vec3<f32>(1.0))');
    });

    it('UInt.shiftLeft 生成 (a << b)', () =>
    {
        expect(uint(1).shiftLeft(uint(3)).toWGSL()).toBe('(1u << 3u)');
        expect(uint(1).shiftLeft(3).toWGSL()).toBe('(1u << 3u)');
    });
});

describe('裸纹理声明（#712，showTexture 的前置）', () =>
{
    it('sampler2D 的 textureOnly 只声明纹理、不生成 sampler', () =>
    {
        const tex = sampler2D(uniform('tex', 0, 0), { textureOnly: true });
        const f = fragment('main', () =>
        {
            // 只验证声明：这个纹理被 textureLoad 读取，不需要 sampler
            void tex;
            return_(vec4(0.0, 0.0, 0.0, 1.0));
        });
        // 直接看声明文本
        expect(tex.toWGSL()).toBe('@binding(0) @group(0) var tex_texture: texture_2d<f32>;');
        void f;
    });

    it('默认仍生成 texture + sampler 两个绑定', () =>
    {
        const tex = sampler2D(uniform('s', 0, 0));
        expect(tex.toWGSL()).toBe('@binding(0) @group(0) var s_texture: texture_2d<f32>;\n@binding(1) @group(0) var s: sampler;');
    });
});

describe('位运算与逐分量比较（#712）', () =>
{
    it('UInt 的位运算（& | ^ >>）', () =>
    {
        expect(uint(0xf0).bitAnd(uint(0x0f)).toWGSL()).toBe('(240u & 15u)');
        expect(uint(1).bitOr(2).toWGSL()).toBe('(1u | 2u)');
        expect(uint(3).bitXor(uint(1)).toWGSL()).toBe('(3u ^ 1u)');
        expect(uint(16).shiftRight(uint(2)).toWGSL()).toBe('(16u >> 2u)');
    });

    it('向量逐分量比较取 all（对应手写的 all(a < b)）', () =>
    {
        expect(vec3(1.0, 2.0, 3.0).lessThanAll(vec3(4.0, 5.0, 6.0)).toWGSL())
            .toBe('all((vec3<f32>(1.0, 2.0, 3.0) < vec3<f32>(4.0, 5.0, 6.0)))');
        // TSL 会把重复分量折叠（vec2<f32>(0.0) 等价于 vec2<f32>(0.0, 0.0)）
        expect(vec2(1.0, 2.0).greaterThanAll(vec2(0.0, 0.0)).toWGSL())
            .toBe('all((vec2<f32>(1.0, 2.0) > vec2<f32>(0.0)))');
    });

    it('Bool 的 and / or 可组合两个 all', () =>
    {
        const a = vec3(0.5, 0.5, 0.5).lessThanAll(vec3(1.0, 1.0, 1.0));
        const b = vec3(0.5, 0.5, 0.5).greaterThanAll(vec3(0.0, 0.0, 0.0));

        expect(a.and(b).toWGSL()).toBe('(all((vec3<f32>(0.5) < vec3<f32>(1.0)))) && (all((vec3<f32>(0.5) > vec3<f32>(0.0))))');
    });
});

describe('while 循环（#712，a-buffer composite 的前置）', () =>
{
    it('生成 while (cond) { ... }，循环体缩进一层', () =>
    {
        const f = fragment('main', () =>
        {
            const i = var_('i', uint(0));
            while_(() => i.lessThan(uint(5)), () =>
            {
                assign(i, i.add(uint(1)));
            });
            return_(vec4(float(i), 0.0, 0.0, 1.0));
        });
        const wgsl = f.toWGSL();

        expect(wgsl).toContain('var i = 0u;');
        expect(wgsl).toContain('while (i < 5u) {');
        expect(wgsl).toContain('i = (i + 1u);');
    });
});

describe('return_ 的语句挂载 + 无返回值形态（#712）', () =>
{
    it('回归：return_() 写在 if_ 内时必须挂进 if 体，不能被提到外层', () =>
    {
        const c = compute('main', [1, 1, 1], () =>
        {
            const n = uniform('n', 0, 0);
            if_(uint(n).greaterThan(uint(3)), () =>
            {
                return_();
            });
        });

        const w = c.toWGSL();
        // if 体的第一句必须是 return（不能是空体、return 也不能跑到 if 外）
        expect(w).toMatch(/if \([^\n]*\) \{\n\s+return;\n\s+\}/);
    });

    it('无返回值生成裸 return;', () =>
    {
        const c = compute('main', [1, 1, 1], () =>
        {
            return_();
        });

        expect(c.toWGSL()).toContain('return;');
    });
});
