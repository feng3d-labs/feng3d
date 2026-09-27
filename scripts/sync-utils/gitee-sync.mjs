/**
 * Gitee 镜像同步的纯逻辑（issue #107）。
 *
 * 与 `scripts/sync-gitee.mjs`（CLI、真正碰 git）分开，是为了让"同步结论"这部分可单测——
 * 同步失败的原因往往不是代码，而是**Gitee 侧的仓库设置**（保护分支 / 镜像管理），
 * 而这些结论必须能给出可操作的提示，不能只是一句 "push failed"。
 */

/**
 * 由两侧 SHA 得出同步结论。
 *
 * @param {string | null | undefined} sourceSha GitHub（源）侧 master 的 SHA
 * @param {string | null | undefined} mirrorSha Gitee（镜像）侧 master 的 SHA
 * @returns {{ synced: boolean, summary: string, hint?: string }}
 */
export function evaluateSync(sourceSha, mirrorSha)
{
    if (!sourceSha)
    {
        return {
            synced: false,
            summary: '拿不到源仓库（GitHub）master 的 SHA',
            hint: '先 `git fetch origin master`，确认远端有 master 分支',
        };
    }

    if (!mirrorSha)
    {
        return {
            synced: false,
            summary: '拿不到镜像仓库（Gitee）master 的 SHA',
            hint: '先 `git fetch gitee master`；若报认证/网络错误，检查本机 gitee 凭据与 remote 配置',
        };
    }

    if (sourceSha === mirrorSha)
    {
        return {
            synced: true,
            summary: `两侧 master 一致：${short(sourceSha)}`,
        };
    }

    return {
        synced: false,
        summary: `两侧 master 不一致：GitHub ${short(sourceSha)} / Gitee ${short(mirrorSha)}`,
        hint: 'push 被拒时看 Gitee 仓库「管理 → 分支设置」是否保护了 master，或改用「仓库镜像管理」的 Pull 方向',
    };
}

/**
 * 把 git push 的失败信息翻译成可操作提示。
 *
 * 实测最常见的两种：保护分支（`No permission to push this protected branch`）与凭据失效。
 *
 * @param {string} stderr git 命令的 stderr
 */
export function explainPushFailure(stderr)
{
    const text = (stderr || '').toLowerCase();

    if (text.includes('protected branch'))
    {
        return 'Gitee 的 master 是保护分支：到「管理 → 分支设置」放开推送权限（或改用镜像管理的 Pull 方向）';
    }

    if (text.includes('authentication') || text.includes('403') || text.includes('permission denied'))
    {
        return 'Gitee 认证失败：检查 ~/.git-credentials 里的 gitee 条目与 remote gitee 的地址';
    }

    if (text.includes('could not resolve') || text.includes('connection') || text.includes('timed out'))
    {
        return 'Gitee 网络不可达：确认网络/代理后重试（本机 git 直连 GitHub 也可能需要代理）';
    }

    return 'push 失败，原始输出见上';
}

/** SHA 短显示（前 8 位，空值原样返回） */
function short(sha)
{
    return typeof sha === 'string' ? sha.slice(0, 8) : String(sha);
}
