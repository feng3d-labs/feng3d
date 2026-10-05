import { vi } from 'vitest';

/**
 * 捕获并静音 `console.assert`，把"失败的断言消息"收集起来供用例正向断言。
 *
 * **为什么需要它**：本包有几条**有意**让"响应式代理充当原型"的负例用例
 * （`should observe properties on the prototype chain`、
 * `should observe has operations on the prototype chain`、`should observe inherited property accessors`、
 * `should not be triggered by inherited raw setters`、
 * `mutation on objects using reactive as prototype should not trigger`）。
 * 这些路径必然命中 `baseHandlers.set` 里**有意保留**的开发期防御
 * `console.assert(target === toRaw(receiver))`——防御本身是对的（它提示"此时不该触发通知"），
 * 但它会以一行 `Assertion failed` 的形式混进 stderr，于是"测试全绿却带报错字样"的噪音长期存在。
 *
 * 做法与 `packages/assets/test/objectAssetReadFile.spec.ts` 的既有先例一致：
 * 把这句 assert 收进数组（噪音消除），并在用例里断言"它确实报了"（负例信号不丢）。
 * 恢复用返回的 `restore`，文件级 `afterEach(() => vi.restoreAllMocks())` 只作失败兜底。
 *
 * @returns `messages`：每次失败断言的第二参（字符串化）；`restore`：恢复原生 `console.assert`
 */
export function captureConsoleAssert(): { messages: string[], restore: () => void }
{
    const messages: string[] = [];
    const spy = vi.spyOn(console, 'assert').mockImplementation((...args: unknown[]) =>
    {
        // 只收失败的断言：`console.assert(cond)` 通过时不该进这个数组（也本就不会打印）
        if (!args[0]) messages.push(String(args[1]));
    });

    return {
        messages,
        restore: () =>
        {
            spy.mockRestore();
        },
    };
}
