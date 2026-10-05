import { IElement } from '../core/IElement';
import { UInt } from '../types/scalar/uint';
import { StorageBuffer } from './storageBuffer';
import type { ShaderValue } from '../core/IElement';

/**
 * `arrayLength`：取运行期数组的长度（WGSL 内置）。
 *
 * 用于 storage buffer 的 `array<T>` 形态——它的长度只有运行时才知道，
 * 所以循环上界要写 `arrayLength(&name)`。
 *
 * @param storageBuffer storage buffer 实例
 * @returns 长度（u32）
 */
export function arrayLength<T extends ShaderValue>(storageBuffer: StorageBuffer<T>): UInt
{
    const result = new UInt();
    result.toGLSL = () => `${storageBuffer.name}.length()`;
    result.toWGSL = () => `arrayLength(&${storageBuffer.name})`;
    result.dependencies = [storageBuffer];

    return result;
}

/** 供类型系统使用的 IElement 引用（避免未使用告警） */
export type { IElement };
