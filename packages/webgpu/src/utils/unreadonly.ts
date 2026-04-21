import { UnReadonly } from '@feng3d/reactivity';

/**
 * 取消只读
 * @param value
 * @returns
 */
export function unreadonly<T>(value: T): UnReadonly<T>
{
    return value;
}
