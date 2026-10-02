#!/usr/bin/env node
/**
 * 宿主的**启动参数与配置的优先级**验收（#272 P2 收尾）。
 *
 * `HostConfig` 本身（层叠加、深合并）由 `check-editor-host-config.mjs` 守；
 * 这里守的是**接进来之后**的那件事，也是这类改动最容易踩的坑：
 *
 * > **只有"命令行显式给了"的键才能进覆盖层。**
 *
 * 把缺省值当成用户意图，就会出现"我在配置文件里写了端口 3100，宿主管都不管、照样起在 3000"——
 * 而且**看不出来**（日志上一切都正常）。所以这个脚本起**真宿主**、只看它的启动日志：
 *
 * | 场景 | 期望 |
 * |---|---|
 * | 配置文件写 `port: 3100`，命令行不给 | 生效 **3100**（配置赢过缺省） |
 * | 同上，命令行还给了 `--port 0` | 生效 **0**（命令行赢过配置） |
 *
 * 用法：
 *   node scripts/check-editor-host-options.mjs
 *
 * 退出码：0 全部通过；1 有失败。
 */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SERVE = resolve(process.cwd(), 'packages', 'editor', 'bin', 'serve.mjs');

let total = 0;
let failed = 0;

/**
 * 记一条判据。
 *
 * @param {string} title 判据
 * @param {boolean} condition 是否通过
 * @param {string} detail 附加说明
 */
function check(title, condition, detail = '')
{
    total++;
    if (condition) console.log(`  PASS  ${title}${detail ? ` — ${detail}` : ''}`);
    else { failed++; console.log(`  FAIL  ${title}${detail ? ` — ${detail}` : ''}`); }
}

/**
 * 起一次宿主，等它报出"生效 port=…"再停掉。
 *
 * @param {string} root 静态根
 * @param {string[]} args 额外命令行参数
 * @returns {Promise<string>} 宿主的日志
 */
async function probeHost(root, args)
{
    const child = spawn(process.execPath, [SERVE, '--root', root, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';

    child.stdout.on('data', (chunk) => { log += chunk; });
    child.stderr.on('data', (chunk) => { log += chunk; });

    await new Promise((resolve_) =>
    {
        const deadline = Date.now() + 20000;
        const tick = setInterval(() =>
        {
            if (/生效 port=/.test(log) || Date.now() > deadline)
            {
                clearInterval(tick);
                resolve_();
            }
        }, 100);
    });

    child.kill();

    return log;
}

console.log('[启动参数] #272 P2：命令行显式 > 配置文件 > 缺省');

// ---------- 造一个"项目配置里写了端口"的静态根 ----------
const dir = mkdtempSync(join(tmpdir(), 'feng3d-options-'));
const root = join(dir, 'static');

mkdirSync(root, { recursive: true });
writeFileSync(join(root, 'index.html'), '<html><head></head><body></body></html>', 'utf8');
writeFileSync(join(root, 'editor.config.jsonc'), '{ "port": 3100 }', 'utf8');

// ---------- 场景 1：命令行不给，配置文件应当赢过缺省（3000） ----------
const byConfig = await probeHost(root, []);

check('配置文件里的 port 生效（命令行没给）', /生效 port=3100/.test(byConfig),
    byConfig.split('\n').find((line) => line.includes('生效 port='))?.trim() ?? '（没有日志）');
check('层序里既有缺省也有项目层', /配置层：内置默认 → .*editor\.config\.jsonc/.test(byConfig),
    byConfig.split('\n').find((line) => line.includes('配置层'))?.trim() ?? '');
check('命令行没给时**不出现**"命令行覆盖"层（层序不该凭空多一层）', !/命令行覆盖/.test(byConfig),
    byConfig.split('\n').find((line) => line.includes('配置层'))?.trim() ?? '');

// ---------- 场景 2：命令行显式给了，它必须赢 ----------
const byCli = await probeHost(root, ['--port', '0']);

check('**命令行显式给的赢过配置文件**', /生效 port=0/.test(byCli),
    byCli.split('\n').find((line) => line.includes('生效 port='))?.trim() ?? '（没有日志）');
check('层序里也能看到"命令行覆盖"这一层', /配置层：内置默认 → .* → 命令行覆盖/.test(byCli),
    byCli.split('\n').find((line) => line.includes('配置层'))?.trim() ?? '');

// ---------- 收尾 ----------
rmSync(dir, { recursive: true, force: true });

console.log(`\n共 ${total} 项：通过 ${total - failed}，失败 ${failed}`);

if (failed > 0)
{
    console.error('\n❌ 启动参数优先级未通过——把缺省值当成用户意图，配置文件的设置会被悄悄忽略。');
    process.exit(1);
}

console.log('✅ 启动参数优先级通过：命令行显式 > 配置文件 > 缺省');
