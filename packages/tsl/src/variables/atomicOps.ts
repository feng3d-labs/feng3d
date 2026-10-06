import { getCurrentForStatement } from '../core/forStack';
import { getCurrentFunc } from '../core/currentFunc';
import { getCurrentIfStatement } from '../core/ifStack';
import { IStatement } from '../core/Statement';
import { UInt } from '../types/scalar/uint';
import { StorageBuffer } from './storageBuffer';

/**
 * 把一条原子操作挂到当前最近的语句容器（与 discard / textureStore 同类）。
 *
 * @param target 原子变量（`storageBuffer(name, { atomic: true })`）
 * @param render 生成代码文本的函数
 * @param deps 额外依赖
 */
function atomicStatement(target: StorageBuffer<UInt>, render: (toCode: (v: { toWGSL: () => string; toGLSL: () => string }) => string) => string, deps: unknown[] = []): void
{
    // WGSL 的原子操作要**取地址**（`&counter`），这是它与普通读写最大的区别
    const statement: IStatement = {
        toGLSL: () => render((v) => v.toGLSL()),
        toWGSL: () => render((v) => v.toWGSL()),
    };

    const currentFor = getCurrentForStatement();
    const currentIf = getCurrentIfStatement();
    const currentFunc = getCurrentFunc();

    if (currentFor) currentFor.addStatement(statement);
    else if (currentIf) currentIf.addStatement(statement);
    else if (currentFunc) currentFunc.statements.push(statement);

    if (currentFunc) currentFunc.dependencies.push(target, ...(deps as never[]));
}

/** 把值渲染成文本（数字直接写、ShaderValue 走 toCode） */
function renderValue(value: UInt | number, toCode: (v: { toWGSL: () => string; toGLSL: () => string }) => string): string
{
    return typeof value === 'number' ? `${value}u` : toCode(value);
}

/**
 * 原子加：`atomicAdd(&x, value)`
 *
 * @param target 原子变量
 * @param value 加数（数字或 u32 值）
 */
export function atomicAdd(target: StorageBuffer<UInt>, value: UInt | number): void
{
    atomicStatement(target, (toCode) => `atomicAdd(&${target.name}, ${renderValue(value, toCode)});`, [value]);
}

/**
 * 原子减：`atomicSub(&x, value)`
 */
export function atomicSub(target: StorageBuffer<UInt>, value: UInt | number): void
{
    atomicStatement(target, (toCode) => `atomicSub(&${target.name}, ${renderValue(value, toCode)});`, [value]);
}

/**
 * 原子取大：`atomicMax(&x, value)`
 */
export function atomicMax(target: StorageBuffer<UInt>, value: UInt | number): void
{
    atomicStatement(target, (toCode) => `atomicMax(&${target.name}, ${renderValue(value, toCode)});`, [value]);
}

/**
 * 原子取小：`atomicMin(&x, value)`
 */
export function atomicMin(target: StorageBuffer<UInt>, value: UInt | number): void
{
    atomicStatement(target, (toCode) => `atomicMin(&${target.name}, ${renderValue(value, toCode)});`, [value]);
}

/**
 * 原子写：`atomicStore(&x, value)`
 */
export function atomicStore(target: StorageBuffer<UInt>, value: UInt | number): void
{
    atomicStatement(target, (toCode) => `atomicStore(&${target.name}, ${renderValue(value, toCode)});`, [value]);
}

/**
 * 原子读：`atomicLoad(&x)`
 *
 * 这是**表达式**（返回 u32），可直接参与运算。
 *
 * @param target 原子变量
 * @returns 读到的值
 */
export function atomicLoad(target: StorageBuffer<UInt>): UInt
{
    const result = new UInt();

    result.toGLSL = () => `atomicAdd(&${target.name}, 0u)`;
    result.toWGSL = () => `atomicLoad(&${target.name})`;
    result.dependencies = [target];

    return result;
}
