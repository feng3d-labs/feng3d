/**
 * 发布版本决策（纯函数，无 I/O）。
 *
 * 从 `scripts/release-packages.mjs` 抽出来的原因：这里是「发哪个版本号」的全部判断，
 * 出错后果最重（发错版本号要发新版本来补救，发布的版本不可撤回），
 * 而它本身不依赖文件系统与网络，值得单独用单元测试钉住。
 *
 * 测试见 `test/release-version.spec.ts`。
 */

/**
 * `--bump-all` 递进补丁版本时的最大步数。
 *
 * 正常情况一两次就够；这个上限只用于防止「registry 上版本密集占用」时
 * 陷入长时间循环，超过即报错让人来确认。
 */
const MAX_PATCH_STEPS = 1000;

/**
 * 解析 tag / 显式版本号得到目标版本。
 *
 * @param {string} raw 原始字符串（如 `v0.6.1`、`0.6.1`、`refs/tags/v0.6.1`）
 * @returns {string} 语义化版本，解析不出则返回空串
 */
export function normalizeVersion(raw)
{
    if (!raw) return '';
    const match = String(raw).match(/(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/);

    return match ? match[1] : '';
}

/**
 * 语义化版本比大小。
 *
 * 只覆盖本仓库会用到的形式：`major.minor.patch` 加可选 prerelease。
 * 规则与 semver 一致的一点关键约定：**有 prerelease 的版本小于同号正式版**
 *（1.0.0-beta.1 < 1.0.0）。
 *
 * @param {string} a 版本 a
 * @param {string} b 版本 b
 * @returns {number} a>b 返回正数，a<b 返回负数，相等返回 0
 */
export function compareVersions(a, b)
{
    const split = (v) => String(v).split('-');
    const [aCore, aPre] = split(a);
    const [bCore, bPre] = split(b);
    const aParts = aCore.split('.').map(Number);
    const bParts = bCore.split('.').map(Number);

    for (let i = 0; i < 3; i++)
    {
        const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
        if (diff !== 0) return diff;
    }

    // 无 prerelease 的版本大于有 prerelease 的版本
    if (!aPre && !bPre) return 0;
    if (!aPre) return 1;
    if (!bPre) return -1;

    return aPre < bPre ? -1 : aPre > bPre ? 1 : 0;
}

/**
 * 取某个版本的下一个补丁版本（丢弃 prerelease 后缀）。
 *
 * @param {string} version 起始版本，如 `0.6.4`
 * @returns {string} 下一个补丁版本，如 `0.6.5`
 */
export function nextPatchVersion(version)
{
    const [core] = String(version).split('-');
    const parts = core.split('.').map((n) => Number.parseInt(n, 10));

    while (parts.length < 3) parts.push(0);
    parts[2] = (Number.isFinite(parts[2]) ? parts[2] : 0) + 1;

    return parts.join('.');
}

/**
 * 取版本数组中的最高版本。
 *
 * @param {string[]} versions 版本数组
 * @returns {string} 最高版本；数组为空时返回 `0.0.0`
 */
export function highestVersion(versions)
{
    return versions.reduce((max, v) => (compareVersions(v, max) > 0 ? v : max), '0.0.0');
}

/**
 * 计算 `--bump-all` 模式下某包实际要发布的版本。
 *
 * 语义：**保证该包这一次能发出去**，且不破坏 npm 上 `latest` 标签的指向——
 * `latest` 是用户 `npm i <包名>` 真正会装到的版本，发一个比它低的版本
 * 会让依赖方拿到的版本倒退。
 *
 * 算法：取 `base = max(本地版本, latest 标签, 目标版本)`，`base` 未被占用就直接用它，
 * 否则沿该包版本序列递进 patch 直到找到空位。
 *
 * 为什么基准是 `latest` 标签而**不是**已发布版本的最高值：
 * 本仓库历史上发过格式混乱的版本号（`feng3d` 有 91 个版本，包括 `201810.3.0`
 * 这类日期式版本号，它在语义化比较里高于 `0.9.0`，而 npm 上的 `latest` 是 `0.9.0`）。
 * 若按最高版本取基准，会算出 `201810.3.1` 并让 `latest` 从 0.9.0 跳到它，
 * 版本号体系直接失控。`latest` 标签代表「当前公认的最新版」，是更可靠的锚点。
 *
 * 目标版本纳入 max 是为了让 `--bump-all` 与 tag 的意图一致：
 * `@feng3d/webgpu` 本地 0.1.0、latest 0.1.4，而 tag 是 v0.6.1 —— 期望发 0.6.1。
 *
 * @param {{ name: string, version: string }} pkg 包（只需 name 与 version）
 * @param {{ published: string[], latest: string }} registry 该包的 registry 现状
 * @param {string} targetVersion 目标版本
 * @returns {{ version: string, reason: string }} 实际发布版本与该版本来源说明
 * @throws {Error} 递进次数超过上限仍找不到空位时抛出（防御无限循环）
 */
export function resolveBumpAllVersion(pkg, registry, targetVersion)
{
    const { published, latest } = registry;
    const base = [pkg.version, latest, targetVersion].reduce(
        (max, v) => (v && compareVersions(v, max) > 0 ? v : max),
        '0.0.0',
    );

    let candidate = base;
    let steps = 0;
    while (published.includes(candidate))
    {
        candidate = nextPatchVersion(candidate);
        steps++;
        if (steps > MAX_PATCH_STEPS)
        {
            throw new Error(
                `${pkg.name} 从 ${base} 起连续递进 ${MAX_PATCH_STEPS} 个补丁版本仍未找到未被占用的版本，请手动确认版本策略`,
            );
        }
    }

    let reason;
    if (published.length === 0)
    {
        reason = `${pkg.name} 尚未发布过，按 ${candidate} 首次发布`;
    }
    else if (candidate !== base)
    {
        reason = `${base} 已被占用，递进到 ${candidate}`;
    }
    else if (latest && candidate === latest)
    {
        reason = `跟随 npm latest（${latest}），本地版本 ${pkg.version} 与之相同`;
    }
    else if (candidate === pkg.version)
    {
        reason = `采用本地版本 ${candidate}`;
    }
    else if (candidate === targetVersion)
    {
        reason = `本地版本 ${pkg.version} 落后，抬到目标版本 ${candidate}`;
    }
    else
    {
        reason = `从 ${base} 起选定 ${candidate}`;
    }

    return { version: candidate, reason };
}

/**
 * 默认策略（不加 `--bump-all`）下某包要发布的版本。
 *
 * 「只升不降」：本地版本低于目标版本时抬到目标版本，否则保持本地版本。
 *
 * 注意这里**不**为 registry 状态做任何修正——默认策略的定位就是「只发新版本，
 * 冲突就跳过」，版本不合适由调用方判断并跳过；需要「无论如何都发出去」
 * 请用 `resolveBumpAllVersion`。
 *
 * @param {{ version: string }} pkg 包
 * @param {string} targetVersion 目标版本
 * @returns {{ version: string, reason: string }} 版本与来源说明（无需改动时 reason 为空串）
 */
export function resolveDefaultVersion(pkg, targetVersion)
{
    if (compareVersions(pkg.version, targetVersion) < 0)
    {
        return { version: targetVersion, reason: `本地版本 ${pkg.version} 落后，抬到目标版本` };
    }

    return { version: pkg.version, reason: '' };
}
