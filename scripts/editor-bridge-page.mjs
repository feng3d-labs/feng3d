/**
 * 用 Playwright 打开编辑器页面并等它就绪——供需要"自己开页"的桥接脚本共用。
 *
 * 为什么需要它：桥接是**页面轮询**模型，没有页面在轮询时所有调用都会超时。
 * CI 上没人替你手动开页面，所以脚本得自己开；而"开页 + 等注册 + 报告 pageerror"
 * 这几步在 `editor-e2e-scene.mjs` 与 `editor-plugins.mjs` 里一模一样——
 * 复制两份必然漂移（一处改了 pageerror 处理、另一处忘改），所以抽到这里。
 *
 * 用法：
 * ```js
 * const page = await openBridgePage(base, client);   // 失败会抛错并说明原因
 * // …跑验收…
 * await page.close();                                 // 一定要关，否则进程不退出
 * ```
 */
const PREFIX = '/__editor-bridge';

/** 等页面注册到桥接的超时（编辑器初始化 + 首轮轮询） */
const REGISTER_TIMEOUT_MS = 60000;

/**
 * 打开编辑器页面并等它注册到桥接。
 *
 * @param {string} base dev server 地址（形如 `http://localhost:3000`）
 * @param {string} client 桥接 clientId（URL 上的 `?bridgeClient=`）
 * @returns {Promise<{ page: import('playwright').Page, browser: import('playwright').Browser, close: () => Promise<void>, pageErrors: string[] }>}
 *   `page` 给需要**点界面**的自检用（大多数自检只走桥接，用不到它）
 * @throws playwright 不可用、页面 60s 内没注册到桥接时抛出，信息里说明该怎么做
 */
export async function openBridgePage(base, client)
{
    const { chromium } = await import('playwright').catch(() =>
    {
        throw new Error('--open 需要 playwright：npx playwright install chromium（并确认 playwright 已在依赖里）');
    });

    // 默认 headless（CI 用）：本机的 headless Chromium **拿不到 WebGPU adapter**
    // （`requestAdapter returned null`），于是所有像素判据（`view.probe` / `view.screenshot` /
    // 像素闭环）都会被跳过。有 GPU 的机器上设 `EDITOR_HEADLESS=0` 切成有头模式，
    // 就能把这些判据真的跑起来（实测本机有头时 adapter=vendor nvidia、device 可用）。
    const headless = process.env.EDITOR_HEADLESS !== '0';
    const browser = await chromium.launch({
        headless,
        // 有头模式下若仍拿不到 adapter，这两个开关能打开 Chromium 的 WebGPU 回退路径
        args: headless ? [] : ['--enable-unsafe-webgpu'],
    });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto(`${base}/?bridgeClient=${client}`, { waitUntil: 'load' });

    // 等页面真正注册到桥接（编辑器初始化完成才会开始轮询），而不是死等固定秒数
    const deadline = Date.now() + REGISTER_TIMEOUT_MS;
    let registered = false;
    while (Date.now() < deadline)
    {
        const ping = await fetch(`${base}${PREFIX}/ping`).then((r) => r.json()).catch(() => null);
        if (ping?.clients?.some((c) => c.clientId === client)) { registered = true; break; }
        await new Promise((r) => setTimeout(r, 500));
    }

    if (!registered)
    {
        await browser.close().catch(() => { /* 关不掉也要把错抛出去 */ });
        throw new Error(`页面已在 ${base} 打开，但 ${REGISTER_TIMEOUT_MS / 1000}s 内没有注册到桥接（clientId=${client}）`);
    }

    // 把报错内容打出来：只报个数的话失败时无从下手
    // （踩过：CI 上 `pageerror=1` 却没有消息，只能靠翻 dev server 日志才找到原因）
    console.log(`已打开页面 ${base}/?bridgeClient=${client}（pageerror=${pageErrors.length}）`);
    for (const message of pageErrors.slice(0, 5)) console.log(`   ⚠️ ${message.split('\n')[0]}`);

    return {
        page,
        browser,
        pageErrors,
        close: async () => { await browser.close().catch(() => { /* 关不掉也要能退出 */ }); },
    };
}
