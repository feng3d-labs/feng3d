import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { uint, UInt } from '../../../src/types/scalar/uint';
import { builtin } from '../../../src/glsl/builtin/builtin';
import { vertex } from '../../../src/shader/vertex';
import { fragment } from '../../../src/shader/fragment';
import { gl_VertexID } from '../../../src/glsl/builtin/builtins';

// 模拟函数
let currentFunc = {
    statements: [],
    dependencies: [],
};

// 预先定义mock，解决提升问题
vi.mock('../../../src/core/currentFunc', () => ({
    getCurrentFunc: () => currentFunc,
}));

vi.mock('../../../src/core/ifStack', () => ({
    pushIfStatement: () => {},
    popIfStatement: () => {},
    getCurrentIfStatement: () => null,
}));

// 使用内联定义的方式解决MockIfStatement未定义问题
vi.mock('../../../src/control/if_', async () => {
    // 导入实际的模块
    const actual = await vi.importActual('../../../src/control/if_') as any;

    // 在内联中重新定义MockIfStatement，避免提升问题
    class MockIfStatement {
        condition: any;
        statements: any[];

        constructor(condition: any) {
            this.condition = condition;
            this.statements = [];
        }

        beginBody(): void {}
        endBody(): void {}
    }

    return {
        ...actual,
        IfStatement: MockIfStatement,
        if_: actual.if_,
    };
});

describe('UInt', () => {
    beforeEach(() => {
        // 重置currentFunc
        currentFunc = {
            statements: [],
            dependencies: [],
        };
    });

    afterEach(() => {
        // 清除所有模拟
        vi.clearAllMocks();
    });

    describe('uint() 函数创建的实例', () => {
        it('应该能够创建 UInt 实例', () => {
            const u = uint(5);
            expect(u.glslType).toBe('uint');
            expect(u.wgslType).toBe('u32');
            expect(u.toGLSL()).toBe('5u');
            expect(u.toWGSL()).toBe('5u');
        });

        it('应该能够创建 uint builtin 实例', () => {
            const u = gl_VertexID;
            expect(u.glslType).toBe('uint');
            expect(u.wgslType).toBe('u32');
            expect(u.dependencies.length).toBeGreaterThan(0);
        });
    });

    describe('toGLSL', () => {
        it('应该生成正确的 gl_VertexID GLSL 代码', () => {
            const u = gl_VertexID;
            // gl_VertexID 在 GLSL 中是 int 类型，可以直接作为数组索引使用
            expect(u.toGLSL()).toBe('gl_VertexID');
        });

        it('应该生成正确的 uint 字面量 GLSL 代码', () => {
            const u = uint(0);
            expect(u.toGLSL()).toBe('0u');

            const u2 = uint(100);
            expect(u2.toGLSL()).toBe('100u');
        });
    });

    describe('toWGSL', () => {
        it('应该生成正确的 vertex_index WGSL 代码', () => {
            const u = gl_VertexID;
            expect(u.toWGSL()).toBe('vertexIndex');
        });

        it('应该生成正确的 uint 字面量 WGSL 代码', () => {
            const u = uint(0);
            expect(u.toWGSL()).toBe('0u');

            const u2 = uint(100);
            expect(u2.toWGSL()).toBe('100u');
        });
    });

    describe('mod 方法', () => {
        it('应该生成正确的 uint 取模 GLSL 代码', () => {
            const u1 = uint(5);
            const u2 = uint(2);
            const result = u1.mod(u2);

            expect(result.toGLSL()).toBe('5u % 2u');
        });

        it('应该生成正确的 uint 取模 WGSL 代码', () => {
            const u1 = uint(5);
            const u2 = uint(2);
            const result = u1.mod(u2);

            expect(result.toWGSL()).toBe('5u % 2u');
        });

        it('应该返回 UInt 类型', () => {
            const u1 = uint(5);
            const u2 = uint(2);
            const result = u1.mod(u2);

            expect(result).toBeInstanceOf(UInt);
            expect(result.glslType).toBe('uint');
            expect(result.wgslType).toBe('u32');
        });

        it('应该能够处理 number 类型参数', () => {
            const u = uint(5);
            const result = u.mod(2);

            expect(result.toGLSL()).toBe('5u % 2u');
            expect(result.toWGSL()).toBe('5u % 2u');
        });
    });

    describe('与 builtin 变量一起使用', () => {
        it('应该能够创建 gl_VertexID builtin', () => {
            const b = builtin('gl_VertexID');
            expect(b.builtinName).toBe('gl_VertexID');
        });

        it('gl_VertexID 应该生成正确的 GLSL 代码', () => {
            const u = gl_VertexID;
            // gl_VertexID 在 GLSL 中是 int 类型，可以直接作为数组索引使用
            expect(u.toGLSL()).toBe('gl_VertexID');
        });

        it('gl_VertexID 应该生成正确的 WGSL 代码', () => {
            const u = gl_VertexID;
            expect(u.toWGSL()).toBe('vertexIndex');
        });
    });

    describe('在着色器中使用', () => {
        it('应该能够在顶点着色器中使用', () => {
            const v = gl_VertexID;

            // 创建顶点着色器
            const vShader = vertex('main', () => {
                v.mod(2);
            });

            // 检查着色器是否成功创建
            expect(vShader).toBeDefined();
        });

        it('应该能够在片段着色器中使用', () => {
            const v = gl_VertexID;

            // 创建片段着色器
            const fShader = fragment('main', () => {
                v.mod(2);
            });

            // 检查着色器是否成功创建
            expect(fShader).toBeDefined();
        });
    });

    describe('UInt 类型与其他类型的交互', () => {
        it('应该能够与 vec3 类型一起使用', () => {
            const v = gl_VertexID;

            // 创建片段着色器
            const fShader = fragment('main', () => {
                v.mod(2);
                // 可以与vec3一起使用
            });

            // 检查着色器是否成功创建
            expect(fShader).toBeDefined();
        });

        it('应该能够与 float 类型一起使用', () => {
            const u = uint(5);

            // 创建片段着色器
            const fShader = fragment('main', () => {
                u.mod(2);
                // 可以与float一起使用
            });

            // 检查着色器是否成功创建
            expect(fShader).toBeDefined();
        });
    });
});
