import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loader } from '../src/base/Loader';

/**
 * `Loader` 的 XHR 失败路径（issue #390）。
 *
 * 背景：非 2xx 时它构造的错误原本只有"`<url> 加载失败！`"，**不带 HTTP 状态码** ——
 * 于是 404（没有这个文件）与 500（服务器出错）分不清，而调用方通常要据此决定"回落"还是"报错"。
 *
 * ⚠️ 这条路走的是 `XMLHttpRequest` 而不是 `fetch`，所以 #384 那次"扫 `await fetch` 是否检查
 * `.ok`"的扫描天然扫不到它 —— **同类问题会沿两条不同的 IO 路径出现**。
 *
 * 本文件 stub 一个最小的假 XHR：`send()` 里同步把 `readyState` 置 4 并调用回调。
 */

const initialXHR = (globalThis as Record<string, unknown>).XMLHttpRequest;

/** 由每个用例设置的响应（stub XHR 会读它） */
let nextResponse: { status: number; statusText: string; responseText: string; statusAvailable: boolean } = {
    status: 200,
    statusText: 'OK',
    responseText: 'hello',
    statusAvailable: true,
};

/** 一个最小可用的 XMLHttpRequest 替身 */
class FakeXMLHttpRequest
{
    readyState = 0;
    status = 0;
    statusText = '';
    responseType = '';
    response: unknown = null;
    responseText = '';
    onreadystatechange: (() => void) | null = null;
    onprogress: ((e: unknown) => void) | null = null;

    open(): void { /* 无需处理 */ }

    setRequestHeader(): void { /* 无需处理 */ }

    send(): void
    {
        // 模拟"请求失败时 status 可能不可读"的情形：整个 status 访问都抛
        if (!nextResponse.statusAvailable)
        {
            Object.defineProperty(this, 'status', {
                get() { throw new Error('status is not available'); },
                configurable: true,
            });
        }
        else
        {
            this.status = nextResponse.status;
            this.statusText = nextResponse.statusText;
        }

        this.responseText = nextResponse.responseText;
        this.response = nextResponse.responseText;
        this.readyState = 4;
        this.onreadystatechange?.();
    }
}

beforeEach(() =>
{
    (globalThis as Record<string, unknown>).XMLHttpRequest = FakeXMLHttpRequest;
    nextResponse = { status: 200, statusText: 'OK', responseText: 'hello', statusAvailable: true };
});

afterEach(() =>
{
    (globalThis as Record<string, unknown>).XMLHttpRequest = initialXHR;
});

describe('Loader 的 XHR 失败路径（issue #390）', () =>
{
    it('loadText：成功的响应仍能 resolve（成功路径没被破坏）', async () =>
    {
        await expect(loader.loadText('https://host/ok.txt')).resolves.toBe('hello');
    });

    it('loadText：404 时 reject，信息里带 URL 与 HTTP 状态码', async () =>
    {
        nextResponse = { status: 404, statusText: 'Not Found', responseText: '', statusAvailable: true };

        const error = await loader.loadText('https://host/missing.txt').then(
            () => null,
            (e: Error) => e,
        );

        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toContain('https://host/missing.txt');
        expect(error?.message).toContain('HTTP 404');
        expect(error?.message).toContain('Not Found');
    });

    it('loadText：500 与 404 的报错能区分开（这正是本 issue 的价值）', async () =>
    {
        nextResponse = { status: 500, statusText: 'Server Error', responseText: '', statusAvailable: true };
        const serverError = await loader.loadText('https://host/boom.txt').then(() => null, (e: Error) => e);

        nextResponse = { status: 404, statusText: 'Not Found', responseText: '', statusAvailable: true };
        const notFound = await loader.loadText('https://host/boom.txt').then(() => null, (e: Error) => e);

        expect(serverError?.message).toContain('HTTP 500');
        expect(notFound?.message).toContain('HTTP 404');
        expect(serverError?.message).not.toBe(notFound?.message);
    });

    it('loadBinary：同样带上状态码（走的是同一个 xmlHttpRequestLoad）', async () =>
    {
        nextResponse = { status: 403, statusText: 'Forbidden', responseText: '', statusAvailable: true };

        const error = await loader.loadBinary('https://host/secret.bin').then(
            () => null,
            (e: Error) => e,
        );

        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toContain('https://host/secret.bin');
        expect(error?.message).toContain('HTTP 403');
    });
});