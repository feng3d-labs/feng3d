#!/usr/bin/env node
/**
 * Gitee 镜像同步（issue #107）：把 GitHub 的 master 推到 Gitee 镜像，并比对两侧 SHA。
 *
 * ## 前置条件（需在 Gitee 网页上做一次，二选一）
 *
 * - **方案 ①（推荐）**：Gitee 仓库「管理 → 分支设置」放开 `master` 的推送权限。当前是保护分支，
 *   直接推送会被拒：`No permission to push this protected branch`。
 * - **方案 ②**：Gitee 仓库「管理 → 仓库镜像管理」新建 **Pull** 方向的镜像（自动从 GitHub 同步）。
 *   官方文档提示「同步超 30 分钟视为超时，大型仓库不建议」，且 Pull 方向会**覆盖**目标分支。
 *
 * ## 用法
 *
 * ```
 * node scripts/sync-gitee.mjs             # fetch → 比对 → 需要时 push → 再比对
 * node scripts/sync-gitee.mjs --dry-run   # 只 fetch + 比对，不推送
 * ```
 *
 * 退出码：0 = 两侧一致；1 = 不一致或出错（可操作的提示会打印出来）。
 *
 * 结论判定与失败信息翻译在 `sync-utils/gitee-sync.mjs`（纯函数，有单测）。
 */
import { execFileSync } from 'node:child_process';
import { evaluateSync, explainPushFailure } from './sync-utils/gitee-sync.mjs';

const dryRun = process.argv.includes('--dry-run');
const SOURCE = 'origin/master';
const MIRROR = 'gitee/master';

/**
 * 跑一条 git 命令。
 *
 * @param {string[]} args git 参数
 * @param {{allowFail?: boolean}} [options] allowFail 时不抛异常，返回 `{ ok, stdout, stderr }`
 */
function git(args, options = {})
{
    const { allowFail = false } = options;

    try
    {
        return { ok: true, stdout: execFileSync('git', args, { encoding: 'utf8' }).trim(), stderr: '' };
    }
    catch (error)
    {
        if (!allowFail) throw error;

        return {
            ok: false,
            stdout: String(error.stdout ?? '').trim(),
            stderr: String(error.stderr ?? error.message ?? '').trim(),
        };
    }
}

/** 取某个 ref 的 SHA；不存在时返回 null */
function shaOf(ref)
{
    const result = git(['rev-parse', ref], { allowFail: true });

    return result.ok ? result.stdout : null;
}

/** fetch 指定 remote 的 master（失败只警告，交给结论判定去解释） */
function fetchMaster(remote)
{
    const result = git(['fetch', remote, 'master'], { allowFail: true });

    if (!result.ok)
    {
        console.warn(`⚠ git fetch ${remote} master 失败：${result.stderr.split('\n')[0] ?? result.stderr}`);
    }

    return result.ok;
}

console.log('== Gitee 镜像同步（issue #107）==');

fetchMaster('origin');
fetchMaster('gitee');

const sourceSha = shaOf(SOURCE);
let mirrorSha = shaOf(MIRROR);

let result = evaluateSync(sourceSha, mirrorSha);

console.log(result.summary);
if (result.hint) console.log(`   ↳ ${result.hint}`);

if (result.synced) process.exit(0);

if (dryRun)
{
    console.log('（--dry-run：只比对，不推送）');
    process.exit(1);
}

if (!sourceSha)
{
    process.exit(1);
}

console.log(`\n→ git push gitee ${sourceSha.slice(0, 8)}:master`);

const push = git(['push', 'gitee', `${sourceSha}:master`], { allowFail: true });

if (!push.ok)
{
    console.error(`❌ push 失败：${push.stderr.split('\n').slice(0, 3).join(' | ')}`);
    console.error(`   ↳ ${explainPushFailure(push.stderr)}`);
    process.exit(1);
}

// 推送后重新取一次镜像侧 SHA（fetch 让 gitee/master 反映最新）
fetchMaster('gitee');
mirrorSha = shaOf(MIRROR);

result = evaluateSync(sourceSha, mirrorSha);
console.log(result.summary);
if (result.hint) console.log(`   ↳ ${result.hint}`);

process.exit(result.synced ? 0 : 1);
