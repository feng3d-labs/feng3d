import { IElement, ShaderValue } from '../../core/IElement';
import { Assign } from '../../variables/assign';
import { formatOperand } from '../../core/expressionUtils';
import { formatNumber } from '../../core/formatNumber';
import { Bool } from './bool';
import { Int } from './int';
import { UInt } from './uint';
import { Vec2 } from '../vector/vec2';
import { Vec3 } from '../vector/vec3';
import { Vec4 } from '../vector/vec4';

/**
 * Float 类，用于表示浮点数类型（float/f32）
 * @internal 库外部不应直接使用 `new Float()`，应使用 `float()` 函数
 */
export class Float implements ShaderValue
{
    readonly glslType = 'float';
    readonly wgslType = 'f32';

    toGLSL: () => string;
    toWGSL: () => string;
    dependencies: IElement[];

    constructor();
    constructor(value: number);
    constructor(value: Int);
    constructor(value: UInt);
    constructor(...args: (number | Int | UInt)[])
    {
        if (args.length === 0)
        {
            // 无参数构造函数，用于 var_ 函数创建新实例
            return;
        }
        if (args.length === 1 && args[0] instanceof Int)
        {
            const value = args[0] as Int;
            this.toGLSL = () => `float(${value.toGLSL()})`;
            this.toWGSL = () => `f32(${value.toWGSL()})`;
            this.dependencies = [value];
        }
        else if (args.length === 1 && args[0] instanceof UInt)
        {
            const value = args[0] as UInt;
            this.toGLSL = () => `float(${value.toGLSL()})`;
            this.toWGSL = () => `f32(${value.toWGSL()})`;
            this.dependencies = [value];
        }
        else if (args.length === 1 && typeof args[0] === 'number')
        {
            const value = args[0] as number;
            this.toGLSL = () => formatNumber(value);
            this.toWGSL = () => formatNumber(value);
            this.dependencies = [];
        }
        else
        {
            throw new Error('Invalid arguments for Float');
        }
    }

    /**
     * 小于比较运算
     */
    lessThan(other: Float | number): Bool
    {
        const result = new Bool();

        if (typeof other === 'number')
        {
            result.toGLSL = () =>
            {
                const thisStr = this.toGLSL();

                return `${thisStr} < ${formatNumber(other)}`;
            };

            result.toWGSL = () =>
            {
                const thisStr = this.toWGSL();

                return `${thisStr} < ${formatNumber(other)}`;
            };

            result.dependencies = [this];
        }
        else
        {
            result.toGLSL = () =>
            {
                const thisStr = this.toGLSL();
                const otherStr = other.toGLSL();

                return `${thisStr} < ${otherStr}`;
            };

            result.toWGSL = () =>
            {
                const thisStr = this.toWGSL();
                const otherStr = other.toWGSL();

                return `${thisStr} < ${otherStr}`;
            };

            result.dependencies = [this, other];
        }

        return result;
    }

    /**
     * 小于等于比较运算
     */
    lessThanOrEqual(other: Float | number): Bool
    {
        const result = new Bool();

        if (typeof other === 'number')
        {
            result.toGLSL = () => `${this.toGLSL()} <= ${formatNumber(other)}`;
            result.toWGSL = () => `${this.toWGSL()} <= ${formatNumber(other)}`;
            result.dependencies = [this];
        }
        else
        {
            result.toGLSL = () => `${this.toGLSL()} <= ${other.toGLSL()}`;
            result.toWGSL = () => `${this.toWGSL()} <= ${other.toWGSL()}`;
            result.dependencies = [this, other];
        }

        return result;
    }

    /**
     * 大于比较运算
     */
    greaterThan(other: Float | number): Bool
    {
        const result = new Bool();

        if (typeof other === 'number')
        {
            result.toGLSL = () => `${this.toGLSL()} > ${formatNumber(other)}`;
            result.toWGSL = () => `${this.toWGSL()} > ${formatNumber(other)}`;
            result.dependencies = [this];
        }
        else
        {
            result.toGLSL = () => `${this.toGLSL()} > ${other.toGLSL()}`;
            result.toWGSL = () => `${this.toWGSL()} > ${other.toWGSL()}`;
            result.dependencies = [this, other];
        }

        return result;
    }

    /**
     * 大于等于比较运算
     */
    greaterThanOrEqual(other: Float | number): Bool
    {
        const result = new Bool();

        if (typeof other === 'number')
        {
            result.toGLSL = () => `${this.toGLSL()} >= ${formatNumber(other)}`;
            result.toWGSL = () => `${this.toWGSL()} >= ${formatNumber(other)}`;
            result.dependencies = [this];
        }
        else
        {
            result.toGLSL = () => `${this.toGLSL()} >= ${other.toGLSL()}`;
            result.toWGSL = () => `${this.toWGSL()} >= ${other.toWGSL()}`;
            result.dependencies = [this, other];
        }

        return result;
    }

    /**
     * 比较两个值是否相等
     */
    equals(other: Float | number): Bool
    {
        const result = new Bool();
        const otherIsFloat = other instanceof Float;

        if (typeof other === 'number')
        {
            // 与数字字面量比较
            result.toGLSL = () =>
            {
                const thisStr = this.toGLSL();

                return `${thisStr} == ${formatNumber(other)}`;
            };

            result.toWGSL = () =>
            {
                const thisStr = this.toWGSL();

                return `${thisStr} == ${formatNumber(other)}`;
            };

            result.dependencies = [this];
        }
        else if (otherIsFloat)
        {
            // 与 Float 对象比较
            result.toGLSL = () =>
            {
                const thisStr = this.toGLSL();
                const otherStr = other.toGLSL();

                return `${thisStr} == ${otherStr}`;
            };

            result.toWGSL = () =>
            {
                const thisStr = this.toWGSL();
                const otherStr = other.toWGSL();

                return `${thisStr} == ${otherStr}`;
            };

            result.dependencies = [this, other];
        }
        else
        {
            throw new Error('Invalid argument for equals: ' + typeof other);
        }

        return result;
    }

    /**
     * 乘法运算
     */
    multiply(other: Float | number): Float;
    multiply(other: Vec3): Vec3;
    multiply(other: Vec4): Vec4;
    multiply(other: Vec2): Vec2;
    multiply(other: Float | number | Vec2 | Vec3 | Vec4): Float | Vec2 | Vec3 | Vec4
    {
        if (other instanceof Vec3)
        {
            const result = new Vec3();

            // 检查 this 是否是字面量 -1.0
            const thisValue = this.toGLSL();
            const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

            result.toGLSL = () =>
            {
                const rightStr = other.toGLSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec3 优化为 -Vec3
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const rightStr = other.toWGSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec3 优化为 -Vec3
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec4)
        {
            const result = new Vec4();

            // 检查 this 是否是字面量 -1.0
            const thisValue = this.toGLSL();
            const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

            result.toGLSL = () =>
            {
                const rightStr = other.toGLSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec4 优化为 -Vec4
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const rightStr = other.toWGSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec4 优化为 -Vec4
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec2)
        {
            const result = new Vec2(0, 0);

            // 检查 this 是否是字面量 -1.0
            const thisValue = this.toGLSL();
            const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

            result.toGLSL = () =>
            {
                const rightStr = other.toGLSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec2 优化为 -Vec2
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toGLSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.toWGSL = () =>
            {
                const rightStr = other.toWGSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);

                if (isNegativeOne)
                {
                    // -1.0 * Vec2 优化为 -Vec2
                    if (hasOp && !isScientificNotation && !isNumber)
                    {
                        // 复杂表达式需要括号
                        return `-(${rightStr})`;
                    }

                    return `-${rightStr}`;
                }

                const left = formatOperand(this, '*', true, () => this.toWGSL());
                const right = formatOperand(other, '*', false, () => rightStr);

                return `${left} * ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        const result = new Float();

        // 检查 this 是否是字面量 -1.0
        const thisValue = this.toGLSL();
        const isNegativeOne = thisValue === '-1.0' || thisValue === '-1';

        result.toGLSL = () =>
        {
            if (isNegativeOne)
            {
                // -1.0 * x 优化为 -x
                // 如果 x 是复杂表达式，需要添加括号
                const rightStr = typeof other === 'number' ? formatNumber(other) : other.toGLSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);
                if (hasOp && !isScientificNotation && !isNumber)
                {
                    // 复杂表达式需要括号
                    return `-(${rightStr})`;
                }

                return `-${rightStr}`;
            }

            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '*', false, () => other.toGLSL());
            const left = formatOperand(this, '*', true, () => this.toGLSL());

            return `${left} * ${right}`;
        };
        result.toWGSL = () =>
        {
            if (isNegativeOne)
            {
                // -1.0 * x 优化为 -x
                // 如果 x 是复杂表达式，需要添加括号
                const rightStr = typeof other === 'number' ? formatNumber(other) : other.toWGSL();
                const hasOp = /[+\-*/]/.test(rightStr);
                // 排除科学计数法
                const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(rightStr);
                const isNumber = /^-?\d+(\.\d+)?$/.test(rightStr);
                if (hasOp && !isScientificNotation && !isNumber)
                {
                    // 复杂表达式需要括号
                    return `-(${rightStr})`;
                }

                return `-${rightStr}`;
            }

            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '*', false, () => other.toWGSL());
            const left = formatOperand(this, '*', true, () => this.toWGSL());

            return `${left} * ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];

        return result;
    }

    /**
     * 加法运算
     */
    add(other: Float): Float
    {
        const result = new Float();

        result.toGLSL = () =>
        {
            const left = formatOperand(this, '+', true, () => this.toGLSL());
            const right = formatOperand(other, '+', false, () => other.toGLSL());

            return `${left} + ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '+', true, () => this.toWGSL());
            const right = formatOperand(other, '+', false, () => other.toWGSL());

            return `${left} + ${right}`;
        };
        result.dependencies = [this, other];

        return result;
    }

    /**
     * 减法运算
     */
    subtract(other: Float): Float;
    subtract(other: number): Float;
    subtract(other: Vec3): Vec3;
    subtract(other: Vec4): Vec4;
    subtract(other: Vec2): Vec2;
    subtract(other: Float | Vec2 | Vec3 | Vec4 | number): Float | Vec2 | Vec3 | Vec4
    {
        if (other instanceof Vec3)
        {
            const result = new Vec3();

            result.toGLSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toGLSL());
                const right = formatOperand(other, '-', false, () => other.toGLSL());

                return `${left} - ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toWGSL());
                const right = formatOperand(other, '-', false, () => other.toWGSL());

                return `${left} - ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec4)
        {
            const result = new Vec4();

            result.toGLSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toGLSL());
                const right = formatOperand(other, '-', false, () => other.toGLSL());

                return `${left} - ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toWGSL());
                const right = formatOperand(other, '-', false, () => other.toWGSL());

                return `${left} - ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }
        if (other instanceof Vec2)
        {
            const result = new Vec2(0, 0);

            result.toGLSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toGLSL());
                const right = formatOperand(other, '-', false, () => other.toGLSL());

                return `${left} - ${right}`;
            };
            result.toWGSL = () =>
            {
                const left = formatOperand(this, '-', true, () => this.toWGSL());
                const right = formatOperand(other, '-', false, () => other.toWGSL());

                return `${left} - ${right}`;
            };
            result.dependencies = [this, other];

            return result;
        }

        const result = new Float();

        result.toGLSL = () =>
        {
            const left = formatOperand(this, '-', true, () => this.toGLSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '-', false, () => other.toGLSL());

            return `${left} - ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '-', true, () => this.toWGSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '-', false, () => other.toWGSL());

            return `${left} - ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];

        return result;
    }

    /**
     * 除法运算
     */
    divide(other: Float | number): Float
    {
        const result = new Float();

        result.toGLSL = () =>
        {
            const left = formatOperand(this, '/', true, () => this.toGLSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '/', false, () => other.toGLSL());

            return `${left} / ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '/', true, () => this.toWGSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '/', false, () => other.toWGSL());

            return `${left} / ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];

        return result;
    }

    /**
     * 取模运算
     */
    mod(other: Float | number): Float
    {
        const result = new Float();

        result.toGLSL = () =>
        {
            const left = formatOperand(this, '%', true, () => this.toGLSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '%', false, () => other.toGLSL());

            return `${left} % ${right}`;
        };
        result.toWGSL = () =>
        {
            const left = formatOperand(this, '%', true, () => this.toWGSL());
            const right = typeof other === 'number' ? formatNumber(other) : formatOperand(other, '%', false, () => other.toWGSL());

            return `${left} % ${right}`;
        };
        result.dependencies = typeof other === 'number' ? [this] : [this, other];

        return result;
    }

    /**
     * 赋值操作（用于对内置变量进行赋值）
     * @param value 要赋值的表达式
     */
    assign(value: Float): void
    {
        new Assign(this, value);
    }

    /**
     * 取负运算
     * @returns 返回当前值的负数
     */
    negate(): Float
    {
        const result = new Float();
        result.toGLSL = () =>
        {
            const thisStr = this.toGLSL();
            // 如果是复杂表达式，需要添加括号
            const hasOp = /[+\-*/]/.test(thisStr);
            // 排除科学计数法和数字字面量
            const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(thisStr);
            const isNumber = /^-?\d+(\.\d+)?$/.test(thisStr);
            if (hasOp && !isScientificNotation && !isNumber)
            {
                return `-(${thisStr})`;
            }

            return `-${thisStr}`;
        };
        result.toWGSL = () =>
        {
            const thisStr = this.toWGSL();
            // 如果是复杂表达式，需要添加括号
            const hasOp = /[+\-*/]/.test(thisStr);
            // 排除科学计数法和数字字面量
            const isScientificNotation = /^-?\d+(\.\d+)?[eE][+-]?\d+$/.test(thisStr);
            const isNumber = /^-?\d+(\.\d+)?$/.test(thisStr);
            if (hasOp && !isScientificNotation && !isNumber)
            {
                return `-(${thisStr})`;
            }

            return `-${thisStr}`;
        };
        result.dependencies = [this];

        return result;
    }

}

/**
 * float 构造函数
 */
export function float(): Float;
export function float(value: number): Float;
export function float(value: Int): Float;
export function float(value: UInt): Float;
export function float(...args: any[]): Float
{
    return new (Float as any)(...args);
}