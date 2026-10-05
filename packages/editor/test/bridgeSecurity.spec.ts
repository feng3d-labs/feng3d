import { describe, expect, it } from 'vitest';
import { checkBridgeRequest, hostnameOfHost, isLoopbackHostname } from '../bridge/security.mjs';

/**
 * 桥接来源校验（#273 P2 / D9 通信安全）。
 *
 * ## 为什么以负例为主
 *
 * "正常请求能过"这条判据单独存在时，**把整个校验删掉也照样绿**。
 * 而安全的回归恰恰长这样：某天有人觉得"这个校验太麻烦"，顺手放宽——没有任何东西会因此变红。
 *
 * 三条攻击面各有用例：跨源网页（`Origin`）、DNS rebinding（`Host`）、
 * 以及"别把同源请求误伤"（浏览器对同源 GET **不发** `Origin`）。
 */
describe('桥接来源校验', () =>
{
    const localPort = 3000;

    /** 跑一次校验 */
    const check = (headers: Record<string, unknown>) => checkBridgeRequest({ headers, localPort });

    it('本机 Host + 无 Origin（同源 GET）→ 放行', () =>
    {
        // 浏览器对**同源 GET** 不发 Origin——而页面自己就是用 `GET /pending` 拉任务的。
        // 这条要是拒了，编辑器自己的通道就断了
        expect(check({ host: '127.0.0.1:3000' })).toEqual({ ok: true });
        expect(check({ host: 'localhost:3000' })).toEqual({ ok: true });
        expect(check({ host: '[::1]:3000' })).toEqual({ ok: true });
    });

    it('本机 Origin → 放行（三种本机写法都认）', () =>
    {
        expect(check({ host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' })).toEqual({ ok: true });
        expect(check({ host: 'localhost:3000', origin: 'http://localhost:3000' })).toEqual({ ok: true });
        expect(check({ host: '[::1]:3000', origin: 'http://[::1]:3000' })).toEqual({ ok: true });
    });

    it('**跨源 Origin 被拒**（恶意网页这一路）', () =>
    {
        const verdict = check({ host: '127.0.0.1:3000', origin: 'http://evil.example' });

        expect(verdict.ok).toBe(false);
        expect(verdict.reason).toContain('Origin 非本机');
    });

    it('`Origin: null` 被拒（sandbox iframe / file:// 伪装）', () =>
    {
        // `Origin: null` 是真实存在的取值（sandbox iframe、被重定向的跨源请求）——
        // 它必须与"没有 Origin"区分开，否则就是给攻击者留了一个免费入口
        expect(check({ host: '127.0.0.1:3000', origin: 'null' }).ok).toBe(false);
        expect(check({ host: '127.0.0.1:3000', origin: 'file://' }).ok).toBe(false);
    });

    it('**Host 非本机被拒**（DNS rebinding：攻击者域名解析到 127.0.0.1）', () =>
    {
        const verdict = check({ host: 'evil.example:3000' });

        expect(verdict.ok).toBe(false);
        expect(verdict.reason).toContain('DNS rebinding');
    });

    it('端口不符被拒（Host 与 Origin 都查）', () =>
    {
        expect(check({ host: '127.0.0.1:9999' }).ok).toBe(false);
        expect(check({ host: '127.0.0.1:3000', origin: 'http://127.0.0.1:9999' }).ok).toBe(false);
    });

    it('缺 Host 被拒；`0.0.0.0` **不**当作本机', () =>
    {
        expect(check({}).ok).toBe(false);
        // `0.0.0.0` 是"监听全部网卡"的写法，不是访问用的主机名——放进白名单等于白送
        expect(check({ host: '0.0.0.0:3000' }).ok).toBe(false);
        expect(isLoopbackHostname('0.0.0.0')).toBe(false);
    });

    it('主机名解析兼容三种写法（含 IPv6）', () =>
    {
        expect(hostnameOfHost('127.0.0.1:3000')).toEqual({ name: '127.0.0.1', port: 3000 });
        expect(hostnameOfHost('localhost')).toEqual({ name: 'localhost', port: null });
        expect(hostnameOfHost('[::1]:3000')).toEqual({ name: '::1', port: 3000 });
        // `127.0.0.0/8` 整段都是回环，不只是 .1
        expect(isLoopbackHostname('127.0.0.5')).toBe(true);
    });
});
