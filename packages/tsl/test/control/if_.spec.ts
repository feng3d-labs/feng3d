import { describe, expect, it, vi } from 'vitest';
import { if_ } from '../../src/control/if_';
import { vec3 } from '../../src/types/vector/vec3';
import { vec4 } from '../../src/types/vector/vec4';
import { vec2 } from '../../src/types/vector/vec2';
import { float } from '../../src/types/scalar/float';
import { vertex } from '../../src/shader/vertex';
import { fragment } from '../../src/shader/fragment';
import { gl_FrontFacing } from '../../src/glsl/builtin/builtins';
import { fragColor } from '../../src/glsl/fragColor';
import { precision } from '../../src/glsl/precision';
import { varying } from '../../src/variables/varying';
import { uniform } from '../../src/variables/uniform';
import { sampler2D } from '../../src/glsl/sampler/sampler2D';
import { texture } from '../../src/glsl/texture/texture';

describe('if_', () =>
{
    describe('if_ 基本功能', () =>
    {
        it('应该能够在顶点着色器中使用', () =>
        {
            const v = gl_FrontFacing;

            const vShader = vertex('main', () =>
            {
                const result = v.equals(false);
                if_(result, () => {});
            });

            expect(vShader).toBeDefined();
        });

        it('应该能够在片段着色器中使用', () =>
        {
            const v = gl_FrontFacing;

            const fShader = fragment('main', () =>
            {
                const result = v.equals(false);
                if_(result, () => {});
            });

            expect(fShader).toBeDefined();
        });

        it('应该能够与 vec3 类型一起使用', () =>
        {
            const v = gl_FrontFacing;
            const n = vec3(1.0, 2.0, 3.0);

            const fShader = fragment('main', () =>
            {
                const result = v.equals(false);
                if_(result, () =>
                {
                    // 模拟对n的操作
                });
            });

            expect(fShader).toBeDefined();
        });
    });

    describe('if_.else() 链式调用', () =>
    {
        it('应该生成正确的 GLSL if-else 代码', () =>
        {
            const color = vec4(fragColor(0, 'color'));
            const v_st = varying('v_st', vec2());

            const fShader = fragment('main', () =>
            {
                precision('highp', 'float');

                if_(v_st.y.divide(v_st.x).lessThan(float(1.0)), () =>
                {
                    color.assign(vec4(1.0, 0.0, 0.0, 1.0));
                }).else(() =>
                {
                    color.assign(vec4(0.0, 0.0, 1.0, 1.0));
                });
            });

            const glsl = fShader.toGLSL(2);

            // 验证 if-else 结构
            expect(glsl).toContain('if (');
            expect(glsl).toContain('} else {');
            expect(glsl).toContain('color = vec4(1.0, 0.0, 0.0, 1.0);');
            expect(glsl).toContain('color = vec4(0.0, 0.0, 1.0, 1.0);');
        });

        it('应该生成正确的 WGSL if-else 代码', () =>
        {
            const color = vec4(fragColor(0, 'color'));
            const v_st = varying('v_st', vec2());

            const fShader = fragment('main', () =>
            {
                precision('highp', 'float');

                if_(v_st.y.divide(v_st.x).lessThan(float(1.0)), () =>
                {
                    color.assign(vec4(1.0, 0.0, 0.0, 1.0));
                }).else(() =>
                {
                    color.assign(vec4(0.0, 0.0, 1.0, 1.0));
                });
            });

            const wgsl = fShader.toWGSL();

            // 验证 if-else 结构
            expect(wgsl).toContain('if (');
            expect(wgsl).toContain('} else {');
            expect(wgsl).toContain('output.color = vec4<f32>(1.0, 0.0, 0.0, 1.0);');
            expect(wgsl).toContain('output.color = vec4<f32>(0.0, 0.0, 1.0, 1.0);');
        });
    });

    describe('if 语句内纹理采样 (WGSL textureSample 自动提升)', () =>
    {
        it('应该在 WGSL 中将 textureSample 调用移至 if 语句前', () =>
        {
            const color = vec4(fragColor(0, 'color'));
            const v_st = varying('v_st', vec2());
            const materialDiffuse0 = sampler2D(uniform('materialDiffuse0'));
            const materialDiffuse1 = sampler2D(uniform('materialDiffuse1'));

            // 模拟控制台警告
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const fShader = fragment('main', () =>
            {
                precision('highp', 'float');

                if_(v_st.y.divide(v_st.x).lessThan(float(1.0)), () =>
                {
                    color.assign(texture(materialDiffuse0, v_st));
                }).else(() =>
                {
                    color.assign(texture(materialDiffuse1, v_st).multiply(0.77));
                });
            });

            const wgsl = fShader.toWGSL();

            // 验证 textureSample 被提升到 if 语句前
            expect(wgsl).toContain('let _ts0 = textureSample(');
            expect(wgsl).toContain('let _ts1 = textureSample(');

            // 验证 if 语句内使用的是临时变量而不是 textureSample 调用
            const ifIndex = wgsl.indexOf('if (');
            const letIndex = wgsl.indexOf('let _ts0');
            expect(letIndex).toBeLessThan(ifIndex);

            // 验证 if 块内使用的是临时变量
            expect(wgsl).toContain('output.color = _ts0;');
            expect(wgsl).toContain('output.color = _ts1 * 0.77;');

            // 验证发出了警告
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining('[TSL] WGSL 限制'),
            );

            warnSpy.mockRestore();
        });

        it('GLSL 中 texture 调用应该保留在 if 语句内', () =>
        {
            const color = vec4(fragColor(0, 'color'));
            const v_st = varying('v_st', vec2());
            const materialDiffuse0 = sampler2D(uniform('materialDiffuse0'));
            const materialDiffuse1 = sampler2D(uniform('materialDiffuse1'));

            const fShader = fragment('main', () =>
            {
                precision('highp', 'float');

                if_(v_st.y.divide(v_st.x).lessThan(float(1.0)), () =>
                {
                    color.assign(texture(materialDiffuse0, v_st));
                }).else(() =>
                {
                    color.assign(texture(materialDiffuse1, v_st).multiply(0.77));
                });
            });

            const glsl = fShader.toGLSL(2);

            // GLSL 中 texture 调用应该在 if 语句内
            expect(glsl).toContain('color = texture(materialDiffuse0, v_st);');
            expect(glsl).toContain('color = texture(materialDiffuse1, v_st) * 0.77;');

            // 验证 texture 调用在 if 块内
            const ifIndex = glsl.indexOf('if (');
            const texture0Index = glsl.indexOf('texture(materialDiffuse0');
            const texture1Index = glsl.indexOf('texture(materialDiffuse1');

            expect(texture0Index).toBeGreaterThan(ifIndex);
            expect(texture1Index).toBeGreaterThan(ifIndex);
        });

        it('WGSL textureSample 提升应该只警告一次（缓存机制）', () =>
        {
            const color = vec4(fragColor(0, 'color'));
            const v_st = varying('v_st', vec2());
            const materialDiffuse0 = sampler2D(uniform('materialDiffuse0'));

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const fShader = fragment('main', () =>
            {
                precision('highp', 'float');

                if_(v_st.y.divide(v_st.x).lessThan(float(1.0)), () =>
                {
                    color.assign(texture(materialDiffuse0, v_st));
                });
            });

            // 多次调用 toWGSL
            fShader.toWGSL();
            fShader.toWGSL();
            fShader.toWGSL();

            // 由于缓存机制，警告应该只出现一次
            const warnCalls = warnSpy.mock.calls.filter(
                call => call[0]?.includes?.('[TSL] WGSL 限制'),
            );
            expect(warnCalls.length).toBe(1);

            warnSpy.mockRestore();
        });
    });

    describe('if 语句代码缩进', () =>
    {
        it('GLSL if-else 代码应该正确缩进', () =>
        {
            const color = vec4(fragColor(0, 'color'));
            const v_st = varying('v_st', vec2());

            const fShader = fragment('main', () =>
            {
                precision('highp', 'float');

                if_(v_st.y.lessThan(float(0.5)), () =>
                {
                    color.assign(vec4(1.0, 0.0, 0.0, 1.0));
                }).else(() =>
                {
                    color.assign(vec4(0.0, 0.0, 1.0, 1.0));
                });
            });

            const glsl = fShader.toGLSL(2);

            // 验证函数体内的代码有正确缩进
            expect(glsl).toContain('    if (');
            expect(glsl).toContain('    } else {');
            expect(glsl).toContain('    }');
        });

        it('WGSL if-else 代码应该正确缩进', () =>
        {
            const color = vec4(fragColor(0, 'color'));
            const v_st = varying('v_st', vec2());

            const fShader = fragment('main', () =>
            {
                precision('highp', 'float');

                if_(v_st.y.lessThan(float(0.5)), () =>
                {
                    color.assign(vec4(1.0, 0.0, 0.0, 1.0));
                }).else(() =>
                {
                    color.assign(vec4(0.0, 0.0, 1.0, 1.0));
                });
            });

            const wgsl = fShader.toWGSL();

            // 验证函数体内的代码有正确缩进
            expect(wgsl).toContain('    if (');
            expect(wgsl).toContain('    } else {');
            expect(wgsl).toContain('    }');
        });
    });
});
