import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { bool } from '../../../src/types/scalar/bool';
import { vec3 } from '../../../src/types/vector/vec3';
import { if_ } from '../../../src/control/if_';
import { vertex } from '../../../src/shader/vertex';
import { fragment } from '../../../src/shader/fragment';
import { gl_FrontFacing } from '../../../src/glsl/builtin/builtins';

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

describe('Bool', () => {
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

    describe('bool() 函数创建的实例', () => {
        it('应该能够创建 Bool 实例', () => {
            const b = bool(true);
            expect(b.glslType).toBe('bool');
            expect(b.wgslType).toBe('bool');
            expect(b.toGLSL()).toBe('true');
            expect(b.toWGSL()).toBe('true');
        });

        it('应该能够创建 bool builtin 实例', () => {
            const b = gl_FrontFacing;
            expect(b.glslType).toBe('bool');
            expect(b.wgslType).toBe('bool');
            expect(b.dependencies.length).toBeGreaterThan(0);
        });
    });

    describe('toGLSL', () => {
        it('应该生成正确的 gl_FrontFacing GLSL 代码', () => {
            const v = gl_FrontFacing;
            expect(v.toGLSL()).toBe('gl_FrontFacing');
        });

        it('应该生成正确的 bool 字面量 GLSL 代码', () => {
            const b = bool(true);
            expect(b.toGLSL()).toBe('true');

            const b2 = bool(false);
            expect(b2.toGLSL()).toBe('false');
        });
    });

    describe('toWGSL', () => {
        it('应该生成正确的 front_facing WGSL 代码', () => {
            const v = gl_FrontFacing;
            // Bool wrapping builtin returns the variable name
            expect(v.toWGSL()).toContain('frontFacing');
        });

        it('应该生成正确的 bool 字面量 WGSL 代码', () => {
            const b = bool(true);
            expect(b.toWGSL()).toBe('true');

            const b2 = bool(false);
            expect(b2.toWGSL()).toBe('false');
        });
    });

    describe('Bool.equals 方法', () => {
        it('应该生成正确的 bool 比较 GLSL 代码', () => {
            const v = gl_FrontFacing;
            const result = v.equals(false);

            expect(result.toGLSL()).toBe('gl_FrontFacing == false');
        });

        it('应该返回 Bool 类型', () => {
            const v = gl_FrontFacing;
            const result = v.equals(false);

            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });

        it('应该能够比较两个布尔值', () => {
            const b1 = bool(true);
            const b2 = bool(false);
            const result = b1.equals(b2);

            expect(result.toGLSL()).toBe('true == false');
            expect(result.toWGSL()).toBe('true == false');
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });

        it('应该能够比较布尔值和布尔字面量', () => {
            const b = bool(true);
            const result = b.equals(true);

            expect(result.toGLSL()).toBe('true == true');
            expect(result.toWGSL()).toBe('true == true');
            expect(result.glslType).toBe('bool');
            expect(result.wgslType).toBe('bool');
        });
    });

    describe('if_ 函数', () => {
        it('应该能够使用 bool 条件', () => {
            const v = gl_FrontFacing;
            const result = v.equals(false);

            // 执行if_函数
            if_(result, () => {});

            // 检查条件是否被正确添加到dependencies
            expect(currentFunc.dependencies).toContain(result);
        });

        it('应该能够在顶点着色器中使用', () => {
            const v = gl_FrontFacing;

            // 创建顶点着色器
            const vShader = vertex('main', () => {
                const result = v.equals(false);
                if_(result, () => {});
            });

            // 检查着色器是否成功创建
            expect(vShader).toBeDefined();
        });

        it('应该能够在片段着色器中使用', () => {
            const v = gl_FrontFacing;

            // 创建片段着色器
            const fShader = fragment('main', () => {
                const result = v.equals(false);
                if_(result, () => {});
            });

            // 检查着色器是否成功创建
            expect(fShader).toBeDefined();
        });
    });

    describe('gl_FrontFacing builtin', () => {
        it('gl_FrontFacing 应该生成正确的 GLSL 代码', () => {
            const v = gl_FrontFacing;
            expect(v.toGLSL()).toBe('gl_FrontFacing');
        });
    });

    describe('bool 类型与其他类型的交互', () => {
        it('应该能够与 vec3 类型一起使用', () => {
            const v = gl_FrontFacing;
            const n = vec3(1.0, 2.0, 3.0);

            // 创建片段着色器
            const fShader = fragment('main', () => {
                const result = v.equals(false);
                if_(result, () => {
                    // 模拟对n的操作
                    // assign(n, n.multiply(float(-1.0)));
                });
            });

            // 检查着色器是否成功创建
            expect(fShader).toBeDefined();
        });
    });
});
