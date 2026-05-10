import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { float } from '../../../src/types/scalar/float';
import { uint, UInt } from '../../../src/types/scalar/uint';
import { vertex } from '../../../src/shader/vertex';
import { fragment } from '../../../src/shader/fragment';
import { vec2 } from '../../../src/types/vector/vec2';
import { uniform } from '../../../src/variables/uniform';

// 模拟函数
let currentFunc = {
    statements: [],
    dependencies: [],
};

// 预先定义mock，解决提升问题
vi.mock('../../src/core/currentFunc', () => ({
    getCurrentFunc: () => currentFunc,
}));

vi.mock('../../src/core/ifStack', () => ({
    pushIfStatement: () => { },
    popIfStatement: () => { },
    getCurrentIfStatement: () => null,
}));

// 使用内联定义的方式解决MockIfStatement未定义问题
vi.mock('../../src/control/if_', async () =>
{
    // 导入实际的模块
    const actual = await vi.importActual('../../src/control/if_') as any;

    // 在内联中重新定义MockIfStatement，避免提升问题
    class MockIfStatement
    {
        condition: any;
        statements: any[];

        constructor(condition: any)
        {
            this.condition = condition;
            this.statements = [];
        }

        beginBody(): void { }
        endBody(): void { }
    }

    return {
        ...actual,
        IfStatement: MockIfStatement,
        if_: actual.if_,
    };
});

describe('mod', () =>
{
    beforeEach(() =>
    {
        // 重置currentFunc
        currentFunc = {
            statements: [],
            dependencies: [],
        };
    });

    afterEach(() =>
    {
        // 清除所有模拟
        vi.clearAllMocks();
    });

    describe('mod 函数', () =>
    {
        it('应该能够创建 mod 表达式', () =>
        {
            const x = float(10.5);
            const y = float(3.0);
            const result = x.mod(y);

            expect(result).toBeDefined();
            expect(result.glslType).toBe('float');
            expect(result.wgslType).toBe('f32');
        });

        it('应该生成正确的 GLSL 代码', () =>
        {
            const x = float(10.5);
            const y = float(3.0);
            const result = x.mod(y);

            expect(result.toGLSL()).toBe('10.5 % 3.0');
        });

        it('应该生成正确的 WGSL 代码', () =>
        {
            const x = float(10.5);
            const y = float(3.0);
            const result = x.mod(y);

            expect(result.toWGSL()).toBe('10.5 % 3.0');
        });

        it('应该能够处理混合参数', () =>
        {
            const x = float(10.5);
            const y = 3.0;
            const result = x.mod(y);

            expect(result.toGLSL()).toBe('10.5 % 3.0');
            expect(result.toWGSL()).toBe('10.5 % 3.0');
        });

        it('应该正确跟踪依赖关系', () =>
        {
            const x = float(10.5);
            const y = float(3.0);
            const result = x.mod(y);

            expect(result.dependencies).toContain(x);
            expect(result.dependencies).toContain(y);
        });

        it('应该能够在顶点着色器中使用', () =>
        {
            const x = float(10.5);
            const y = float(3.0);

            // 创建顶点着色器
            const vShader = vertex('main', () =>
            {
                const result = x.mod(y);
            });

            // 检查着色器是否成功创建
            expect(vShader).toBeDefined();
        });

        it('应该能够在片段着色器中使用', () =>
        {
            const x = float(10.5);
            const y = float(3.0);

            // 创建片段着色器
            const fShader = fragment('main', () =>
            {
                const result = x.mod(y);
            });

            // 检查着色器是否成功创建
            expect(fShader).toBeDefined();
        });

        it('应该能够与float uniform一起使用', () =>
        {
            const x = uniform('x', float());
            const y = uniform('y', float());

            // 创建片段着色器
            const fShader = fragment('main', () =>
            {
                const result = x.mod(y);
            });

            // 检查着色器是否成功创建
            expect(fShader).toBeDefined();
        });

        it('应该能够与vec2组件一起使用', () =>
        {
            const v = uniform('v', vec2());
            const y = float(2.0);

            // 创建片段着色器
            const fShader = fragment('main', () =>
            {
                const result = v.x.mod(y);
            });

            // 检查着色器是否成功创建
            expect(fShader).toBeDefined();
        });

        it('应该能够处理uint类型参数', () =>
        {
            const x = uint(5);
            const y = uint(2);
            const result = x.mod(y);

            expect(result.toGLSL()).toBe('5u % 2u');
            // WGSL 中显式使用 u 后缀指定 u32 类型
            expect(result.toWGSL()).toBe('5u % 2u');
        });

        it('应该能够处理uint和number混合参数', () =>
        {
            const x = uint(5);
            const y = 2;
            const result = x.mod(y);

            expect(result.toGLSL()).toBe('5u % 2u');
            // WGSL 中显式使用 u 后缀指定 u32 类型
            expect(result.toWGSL()).toBe('5u % 2u');
        });

        it('应该能够在顶点着色器中使用uint类型', () =>
        {
            const x = uint(5);
            const y = uint(2);

            // 创建顶点着色器
            const vShader = vertex('main', () =>
            {
                const result = x.mod(y);
            });

            // 检查着色器是否成功创建
            expect(vShader).toBeDefined();
        });

        it('UInt.mod 应该返回 UInt 类型', () =>
        {
            const x = uint(5);
            const y = uint(2);
            const result = x.mod(y);

            // 验证返回类型是 UInt
            expect(result).toBeInstanceOf(UInt);
            // 验证 glslType 是 uint
            expect(result.glslType).toBe('uint');
            // 验证 wgslType 是 u32
            expect(result.wgslType).toBe('u32');
        });
    });
});
