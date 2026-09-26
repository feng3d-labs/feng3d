#!/usr/bin/env node
/**
 * 发布仓库内所有公共子包到 npm。
 *
 * 设计目标（对应 CI 的 release 工作流）：
 * 1. **按包独立版本**：`packages/` 下 19 个子包历史上各发各的版本
 *    （feng3d 0.9.0 / @feng3d/reactivity 1.0.13 …），因此不强制统一版本号。
 * 2. **只发有变化的包**：tag 版本作为「本次目标版本」，包的当前版本低于它才抬到目标版本；
 *    已高于目标版本的包保持不动（避免把 @feng3d/reactivity 从 1.0.13 降级）。
 *    抬版后逐个比对 npm registry 上已存在的版本，完全一致则跳过，绝不重复发布。
 * 3. **依赖先行**：按包间依赖做拓扑排序，保证 `@feng3d/math` 先于 `feng3d` 发布。
 * 4. **可预演**：`--dry-run` 下照常跑构建与 `npm pack`（产物清单是真实验证过的），
 *    但不调用 `npm publish`，因此可以安全地在本地和 PR 上跑。
 *
 * 用法：
 *   node scripts/release-packages.mjs --dry-run
 *   node scripts/release-packages.mjs --tag v0.6.1
 *   node scripts/release-packages.mjs --tag v0.6.1 --include feng3d --include @feng3d/math
 *   node scripts/release-packages.mjs --tag v0.6.1 --exclude feng3d-editor --no-build
 *
 * 退出码：0 成功；1 有包发布失败或参数/环境错误。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { snapshotRegeneratedFiles } from './release-utils/regenerated-files.mjs';
import {
    compareVersions,
    normalizeVersion,
    resolveBumpAllVersion,
    resolveDefaultVersion,
} from './release-utils/release-version.mjs';

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

/** 依赖 `*` 版本范围的包（发布时不需要在 registry 上校验版本）。 */
const WILDCARD = '*';

// ---------------------------------------------------------------------------
// 小工具
// ---------------------------------------------------------------------------

const log = (message) => console.log(`[release] ${message}`);
const warn = (message) => console.warn(`[release][警告] ${message}`);
const fail = (message) =>
{
    console.error(`[release][错误] ${message}`);
    process.exit(1);
};

const color = (code, text) => `\u001b[${code}m${text}\u001b[0m`;
const cGreen = (t) => color(32, t);
const cYellow = (t) => color(33, t);
const cRed = (t) => color(31, t);
const cDim = (t) => color(2, t);

/**
 * 解析命令行参数。
 *
 * @returns {Record<string, unknown>}
 */
function parseArgs()
{
    const argv = process.argv.slice(2);
    const options = {
        dryRun: false,
        tag: '',
        since: '',
        include: [],
        exclude: [],
        build: true,
        force: false,
        bumpAll: false,
        jsonOutput: '',
    };

    for (let i = 0; i < argv.length; i++)
    {
        const arg = argv[i];
        switch (arg)
        {
            case '--dry-run': options.dryRun = true; break;
            case '--no-build': options.build = false; break;
            case '--force': options.force = true; break;
            case '--bump-all': options.bumpAll = true; break;
            case '--tag': options.tag = argv[++i] ?? ''; break;
            case '--since': options.since = argv[++i] ?? ''; break;
            case '--include': options.include.push(argv[++i] ?? ''); break;
            case '--exclude': options.exclude.push(argv[++i] ?? ''); break;
            case '--json': options.jsonOutput = argv[++i] ?? ''; break;
            case '--help':
                printHelp();
                process.exit(0);
                break;
            default:
                fail(`未知参数：${arg}（用 --help 查看用法）`);
        }
    }

    return options;
}

/** 打印用法。 */
function printHelp()
{
    console.log(`发布仓库内所有公共子包到 npm

用法：
  node scripts/release-packages.mjs [选项]

选项：
  --dry-run            只构建 + npm pack 预演，不真正发布
  --tag <tag>          发布目标版本来源，如 v0.6.1（默认取 package.json 的 version）
  --since <ref>        只发布自该 git ref 以来有改动的包
  --include <包名>     只发布指定包（可重复，支持目录名或 npm 包名）
  --exclude <包名>     排除指定包（可重复）
  --no-build           跳过各包的 build 脚本
  --force              即使 registry 上已存在同版本也执行重新发布（npm 会拒绝覆盖，仅用于预演/排查）
  --bump-all           保证每个候选包都发出版本（默认策略下「版本已存在」的包会被跳过）：
                       本地版本低于目标版本时抬到目标版本；否则沿该包自身的版本序列
                       递进 patch 直到找到一个 registry 上未被占用的版本。
                       不会降级已发布的更高版本（那会让 npm latest 往回指）。
  --json <文件>        把结果报告写到该文件
  --help               显示本帮助
`);
}

/**
 * 执行命令（继承 stdio，实时回显）。
 *
 * @param {string} command 可执行文件
 * @param {string[]} args 参数
 * @param {object} [options] 附加选项
 * @returns {{ ok: boolean, output: string }} 执行结果
 */
function run(command, args, options = {})
{
    const { capture = false, cwd = REPO_ROOT, env = process.env } = options;
    try
    {
        const output = execFileSync(command, args, {
            cwd,
            env,
            stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
            encoding: 'utf8',
            maxBuffer: 64 * 1024 * 1024,
            shell: process.platform === 'win32',
        });

        return { ok: true, output: output ?? '' };
    }
    catch (error)
    {
        const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
        return { ok: false, output };
    }
}

// ---------------------------------------------------------------------------
// 包发现
// ---------------------------------------------------------------------------

/**
 * 扫描 `packages/<目录>/package.json`，得到可发布包清单。
 *
 * @returns {Array<object>} 包记录数组
 */
function discoverPackages()
{
    const records = [];

    for (const entry of readdirSync(PACKAGES_DIR, { withFileTypes: true }))
    {
        if (!entry.isDirectory()) continue;

        const dir = entry.name;
        const manifestPath = join(PACKAGES_DIR, dir, 'package.json');
        if (!existsSync(manifestPath)) continue;

        let manifest;
        try
        {
            manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
        }
        catch (error)
        {
            fail(`解析 ${manifestPath} 失败：${error.message}`);
        }

        records.push({
            dir,
            name: manifest.name ?? dir,
            version: manifest.version ?? '0.0.0',
            private: manifest.private === true,
            manifestPath,
            packageRoot: join(PACKAGES_DIR, dir),
            dependencies: {
                ...(manifest.dependencies ?? {}),
                ...(manifest.optionalDependencies ?? {}),
            },
            scripts: manifest.scripts ?? {},
            manifest,
        });
    }

    // 稳定排序，保证输出可复现
    records.sort((a, b) => (a.dir < b.dir ? -1 : a.dir > b.dir ? 1 : 0));

    return records;
}

/**
 * 取 git 某 ref 以来有改动的文件列表。
 *
 * @param {string} since git ref
 * @returns {Set<string>} 相对仓库根的路径集合（正斜杠）
 */
function changedFilesSince(since)
{
    const result = run('git', ['diff', '--name-only', `${since}..HEAD`], { capture: true });
    if (!result.ok)
    {
        fail(`无法获取 ${since}..HEAD 的改动文件（--since 参数是否正确？）`);
    }

    return new Set(
        result.output.split('\n').map((line) => line.trim()).filter(Boolean),
    );
}

// ---------------------------------------------------------------------------
// registry 查询
// ---------------------------------------------------------------------------

/**
 * 查询 registry 上某包已发布的版本（带进程内缓存）。
 *
 * `npm view <pkg> versions --json` 对**从未发布过**的包会以 E404 失败——
 * 这是正常情况（首次发布），返回空数组即可，不应当当作错误刷屏。
 * 其他失败（网络问题、registry 配置错误）才警示，避免把「查不到」
 * 静默当成「没发过」而误发一次。
 *
 * @param {string} name 包名
 * @param {Map<string, string[]>} cache 缓存
 * @returns {string[]} 已发布版本数组
 */
function fetchPublishedVersions(name, cache)
{
    if (cache.has(name)) return cache.get(name);

    const result = run('npm', ['view', name, 'versions', '--json'], { capture: true });
    let versions = [];
    if (result.ok)
    {
        try
        {
            const parsed = JSON.parse(result.output.trim());
            versions = Array.isArray(parsed) ? parsed : [parsed];
        }
        catch
        {
            versions = [];
        }
    }
    else if (!/E404|Not found|is not in this registry/i.test(result.output))
    {
        warn(`查询 ${name} 已发布版本失败，将按「未发布过」处理：${result.output.trim().split('\n')[0] ?? ''}`);
    }

    cache.set(name, versions);

    return versions;
}

/**
 * 查询 registry 上某包的 `latest` 标签指向哪个版本。
 *
 * 这是 `npm i <包名>` 实际会装到的版本，比「版本号最大值」更可靠：
 * 本仓库发过格式混乱的历史版本号（`feng3d` 的 `201810.3.0` 在语义化比较里
 * 高于 `0.9.0`，而 npm 上的 `latest` 是 `0.9.0`）。按最大值当基准会让 `latest` 乱跳。
 *
 * @param {string} name 包名
 * @param {Map<string, string>} cache 缓存
 * @returns {string} 版本号；未发布过或查询失败时返回空串
 */
function fetchLatestTag(name, cache)
{
    if (cache.has(name)) return cache.get(name);

    const result = run('npm', ['view', name, 'dist-tags.latest'], { capture: true });
    const match = result.ok ? result.output.match(/(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/) : null;
    const latest = match ? match[1] : '';

    cache.set(name, latest);

    return latest;
}

/**
 * 按包间依赖做拓扑排序；遇到环时按目录名打破并给出警告
 * （registry 按名称解析依赖，环不阻塞发布顺序，只是无法满足全部先后关系）。
 *
 * @param {Array<object>} packages 待排序包
 * @returns {Array<object>} 排序后的包
 */
function topoSort(packages)
{
    const byName = new Map(packages.map((p) => [p.name, p]));
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (pkg) =>
    {
        if (visited.has(pkg.name)) return;
        if (visiting.has(pkg.name))
        {
            warn(`检测到循环依赖，跳过排序约束：${[...visiting].join(' → ')} → ${pkg.name}`);

            return;
        }

        visiting.add(pkg.name);
        for (const depName of Object.keys(pkg.dependencies))
        {
            const dep = byName.get(depName);
            if (dep) visit(dep);
        }
        visiting.delete(pkg.name);
        visited.add(pkg.name);
        sorted.push(pkg);
    };

    for (const pkg of packages) visit(pkg);

    return sorted;
}

// ---------------------------------------------------------------------------
// 构建产物与 package.json 改写
// ---------------------------------------------------------------------------

/**
 * 计算包的入口字段改写方案。
 *
 * 各包采用「源码发布策略」（package.json 的 main/types 指向 ./src/*.ts），
 * 但发布出去的包必须指向构建产物才可用。这里按实际存在的产物决定新入口，
 * 而不是无条件按固定路径替换——旧脚本用字符串替换，字段不存在时会静默失败
 * （feng3d 的 package.json 没有 module 字段，替换不生效），留下指向 src 的坏包。
 *
 * @param {object} pkg 包记录
 * @returns {{ patches: Record<string, string>, entry: string }} 需要的改写与主入口
 */
function computeEntryPatches(pkg)
{
    const has = (relative) => existsSync(join(pkg.packageRoot, relative));
    const patches = {};
    let entry = '';

    // ESM 入口：vite 库构建产物优先，其次 tsc 的 lib 产物
    if (has('dist/index.js'))
    {
        patches.module = './dist/index.js';
        entry = 'dist/index.js';
    }
    else if (has('lib/index.js'))
    {
        patches.module = './lib/index.js';
        entry = 'lib/index.js';
    }

    // CJS 入口
    if (has('dist/index.umd.cjs')) patches.main = './dist/index.umd.cjs';
    else if (has('lib/index.cjs')) patches.main = './lib/index.cjs';
    else if (has('lib/index.js')) patches.main = './lib/index.js';

    // 类型声明
    if (has('lib/index.d.ts')) patches.types = './lib/index.d.ts';
    else if (has('dist/index.d.ts')) patches.types = './dist/index.d.ts';

    return { patches, entry };
}

/**
 * 发布前写入版本号与入口改写（返回恢复函数，务必在 finally 里调用）。
 *
 * 版本号必须真正落到 package.json：`npm publish` 打包时读的是文件里的 version，
 * 只在内存里改计划版本会导致「日志说发 0.6.1、实际发 0.6.0」。
 *
 * @param {object} pkg 包记录（含要发布的 version）
 * @returns {() => void} 恢复原始 package.json 的函数
 */
function prepareManifest(pkg)
{
    const original = readFileSync(pkg.manifestPath, 'utf8');
    const manifest = JSON.parse(original);
    const { patches } = computeEntryPatches(pkg);

    manifest.version = pkg.version;
    for (const [key, value] of Object.entries(patches))
    {
        manifest[key] = value;
    }

    // exports 指向也要同步，否则 exports 优先的解析器仍会拿到 src
    const importTarget = patches.module ?? patches.main;
    if (manifest.exports && typeof manifest.exports === 'object')
    {
        for (const [subpath, target] of Object.entries(manifest.exports))
        {
            if (!target || typeof target !== 'object') continue;
            const next = { ...target };
            if (patches.types) next.types = patches.types;
            if (importTarget) next.import = importTarget;
            if (patches.main) next.require = patches.main;
            manifest.exports[subpath] = next;
        }
    }

    writeFileSync(pkg.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    return () => writeFileSync(pkg.manifestPath, original, 'utf8');
}

/**
 * `npm pack` 到临时目录并返回打进去的文件清单。
 *
 * 注意：`npm pack` 与 `npm publish` 走同一套打包逻辑，因此这一步能真实反映
 * 发布出去的 tarball 内容——比「publish 返回 0」更能说明包是可用的。
 *
 * @param {object} pkg 包记录
 * @returns {{ ok: boolean, files: string[] }} 打包结果
 */
function packAndListFiles(pkg)
{
    const packDir = join(REPO_ROOT, '.temp', 'release-pack', pkg.dir);
    mkdirSync(packDir, { recursive: true });
    const result = run(
        'npm',
        ['pack', '--json', '--pack-destination', packDir],
        { cwd: pkg.packageRoot, capture: true },
    );

    if (!result.ok) return { ok: false, files: [] };

    try
    {
        const parsed = JSON.parse(result.output.trim());
        const first = Array.isArray(parsed) ? parsed[0] : parsed;
        const files = (first?.files ?? []).map((f) => f.path);

        return { ok: true, files };
    }
    catch
    {
        return { ok: false, files: [] };
    }
}

/**
 * 校验打包内容对使用者确实可用。
 *
 * 这里检查的是「安装这个包之后能不能按 package.json 找到入口」——
 * 即 tarball 里是否真的含有入口文件，而不是笼统地看文件数量。
 * 曾经的实况：eslint-plugin-feng3d 的 main 指向 ./dist/index.js，
 * 但 files 字段是 ["src","lib"]，发布出去的包里根本没有 dist/，
 * 安装方一 import 就报模块不存在——这种包能发布成功却完全不可用。
 *
 * @param {object} pkg 包记录
 * @param {string[]} files tarball 内文件清单
 * @returns {{ ok: boolean, reasons: string[] }} 校验结果
 */
function validatePackedFiles(pkg, files)
{
    const reasons = [];
    const normalized = files.map((f) => f.replace(/^package\//, ''));

    if (normalized.length === 0)
    {
        reasons.push('tarball 为空');
        return { ok: false, reasons };
    }

    if (!normalized.includes('package.json'))
    {
        reasons.push('tarball 缺少 package.json');
    }

    // 发布时 package.json 的入口会被指向构建产物，该文件必须真的在包里
    const { patches } = computeEntryPatches(pkg);
    for (const [key, target] of Object.entries(patches))
    {
        const relative = target.replace(/^\.\//, '');
        if (!normalized.includes(relative))
        {
            reasons.push(`${key} 指向 ${relative}，但该文件未打进 tarball`);
        }
    }

    // 入口落在哪个产物目录，该目录就必须被 files 覆盖
    const entryDirs = new Set();
    for (const target of Object.values(patches))
    {
        const relative = target.replace(/^\.\//, '');
        const index = relative.lastIndexOf('/');
        if (index > 0) entryDirs.add(relative.slice(0, index));
    }
    const declaredFiles = (pkg.manifest.files ?? []).map((f) => f.replace(/\/$/, ''));
    for (const dir of entryDirs)
    {
        if (!declaredFiles.includes(dir))
        {
            reasons.push(`入口位于 ${dir}/，但 package.json 的 files 字段未包含 "${dir}"（发布后入口文件会缺失）`);
        }
    }

    // 源码发布策略：src/ 必须在（下游按源码引用）
    if (!normalized.some((f) => f.startsWith('src/')))
    {
        reasons.push('tarball 缺少 src/ 目录');
    }

    return { ok: reasons.length === 0, reasons };
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

/**
 * 构建期会被工具重写的、且**纳入版本控制**的生成文件。
 *
 * 由 scripts/release-utils/regenerated-files.mjs 提供，与 run-in-packages.mjs 共用同一套
 * 文件清单与还原逻辑，避免两处漂移。
 */

/**
 * 发布单个包。
 *
 * @param {object} pkg 包记录
 * @param {object} options 命令行选项
 * @param {boolean} publish 是否真正发布
 * @returns {{ status: string, reasons?: string[] }} 结果状态
 */
function releasePackage(pkg, options, publish)
{
    const restoreRegenerated = snapshotRegeneratedFiles(pkg.packageRoot);
    try
    {
        if (options.build)
        {
            // 先清理再构建：像 editor 这种 outDir 与 publicDir 都是 public/ 的包，
            // 不清理会让上一轮带哈希的历史产物一直堆在目录里并被打进 tarball。
            if (typeof pkg.scripts.clean === 'string')
            {
                log(`清理 ${pkg.name}：npm run clean`);
                run('npm', ['run', 'clean'], { cwd: pkg.packageRoot });
            }

            if (typeof pkg.scripts.build === 'string' && pkg.scripts.build.length > 0)
            {
                log(`构建 ${pkg.name}：npm run build`);
                const built = run('npm', ['run', 'build'], { cwd: pkg.packageRoot });
                if (!built.ok) return { status: 'failed', reasons: ['build 失败'] };
            }
        }

        const restore = prepareManifest(pkg);
        try
        {
            const packed = packAndListFiles(pkg);
            if (!packed.ok) return { status: 'failed', reasons: ['npm pack 失败'] };

            const validation = validatePackedFiles(pkg, packed.files);
            if (!validation.ok)
            {
                warn(`${pkg.name} 打包内容校验未通过：`);
                for (const reason of validation.reasons) warn(`  - ${reason}`);

                return { status: 'failed', reasons: validation.reasons };
            }

            log(`${pkg.name}@${pkg.version} 打包校验通过（${packed.files.length} 个文件）`);

            if (!publish)
            {
                return { status: 'dry-run' };
            }

            const published = run('npm', ['publish', '--access', 'public', '--provenance=false'], { cwd: pkg.packageRoot });
            if (!published.ok) return { status: 'failed', reasons: ['npm publish 失败'] };

            return { status: 'published' };
        }
        finally
        {
            restore();
        }
    }
    finally
    {
        restoreRegenerated();
    }
}

/** 入口。 */
function main()
{
    const options = parseArgs();

    if (!existsSync(PACKAGES_DIR)) fail(`找不到 packages 目录：${PACKAGES_DIR}`);

    // --force 会绕过「registry 上已存在同版本」的保护。npm 本身不允许覆盖已发布版本，
    // 因此正式发布时带上它只会把错误推后到 npm publish 阶段；这里直接拦住，
    // 让它只服务于 --dry-run 的打包预演。
    if (options.force && !options.dryRun)
    {
        fail('--force 只能与 --dry-run 一起使用：npm 不允许覆盖已发布版本，绕过该保护没有意义');
    }

    const all = discoverPackages();
    const report = [];

    // --- 版本解析 -----------------------------------------------------------
    let targetVersion = normalizeVersion(options.tag);
    if (!targetVersion)
    {
        const rootManifest = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
        targetVersion = normalizeVersion(rootManifest.version);
        log(`未指定 --tag，改用根 package.json 版本：${targetVersion}`);
    }

    // --- 选择器 -------------------------------------------------------------
    const changed = options.since ? changedFilesSince(options.since) : null;
    const matches = (pkg, selector) => pkg.name === selector || pkg.dir === selector;

    const candidates = [];
    for (const pkg of all)
    {
        if (pkg.private)
        {
            report.push({ name: pkg.name, version: pkg.version, status: 'skipped', reason: 'private 包' });
            continue;
        }

        if (options.include.length > 0 && !options.include.some((s) => matches(pkg, s)))
        {
            report.push({ name: pkg.name, version: pkg.version, status: 'skipped', reason: '未在 --include 中' });
            continue;
        }

        if (options.exclude.some((s) => matches(pkg, s)))
        {
            report.push({ name: pkg.name, version: pkg.version, status: 'skipped', reason: '在 --exclude 中' });
            continue;
        }

        if (changed && ![...changed].some((file) => file.startsWith(`packages/${pkg.dir}/`)))
        {
            report.push({ name: pkg.name, version: pkg.version, status: 'skipped', reason: `--since ${options.since} 以来无改动` });
            continue;
        }

        candidates.push(pkg);
    }

    // --- 抬版本 -------------------------------------------------------------
    const versionCache = new Map();
    const latestCache = new Map();
    const planned = [];

    for (const pkg of candidates)
    {
        const published = fetchPublishedVersions(pkg.name, versionCache);
        const latest = fetchLatestTag(pkg.name, latestCache);
        let version = pkg.version;
        let versionReason = '';

        if (options.bumpAll)
        {
            // 保证每个候选包都能发出去（见 scripts/release-utils/release-version.mjs 的语义说明）
            try
            {
                const resolved = resolveBumpAllVersion(pkg, { published, latest }, targetVersion);
                version = resolved.version;
                versionReason = resolved.reason;
            }
            catch (error)
            {
                fail(error.message);
            }
        }
        else
        {
            // 默认策略：只升不降——低于目标版本才抬到目标版本
            const resolved = resolveDefaultVersion(pkg, targetVersion);
            version = resolved.version;
            versionReason = resolved.reason;
            if (!versionReason && compareVersions(version, targetVersion) > 0)
            {
                log(`${pkg.name} 当前版本 ${version} 高于目标 ${targetVersion}，保持原版本（不做降级）`);
            }
        }

        // 默认策略下可能出现「选定版本低于 npm latest」——那样发布不会改变
        // 用户 `npm i` 装到的版本，属于无效发布，提前说清楚
        if (!options.bumpAll && latest && compareVersions(version, latest) < 0)
        {
            warn(`${pkg.name} 选定版本 ${version} 低于 npm latest ${latest}，该包本次不会生效（需要 --bump-all 才能推进）`);
        }

        if (published.includes(version) && !options.force)
        {
            report.push({ name: pkg.name, version, status: 'skipped', reason: `registry 上已存在 ${version}` });
            continue;
        }

        planned.push({
            ...pkg,
            version,
            versionReason,
            isFirstPublish: published.length === 0,
            alreadyPublished: published.includes(version),
        });
    }

    const ordered = topoSort(planned);

    // --- 摘要 ---------------------------------------------------------------
    const mode = options.dryRun ? '预演（不发布）' : '正式发布';
    const strategy = options.bumpAll ? '强制每包发版' : '只升不降';
    console.log('');
    log(`模式：${mode}｜版本策略：${strategy}｜目标版本：${targetVersion}｜待发布 ${ordered.length} 个包`);
    for (const pkg of ordered)
    {
        const marks = [];
        if (pkg.isFirstPublish) marks.push('首次发布');
        if (pkg.alreadyPublished) marks.push('该版本已存在，仅预演');

        const suffix = [];
        if (pkg.versionReason) suffix.push(pkg.versionReason);
        if (marks.length > 0) suffix.push(marks.join('，'));

        const tail = suffix.length > 0 ? ` ${cYellow(`（${suffix.join('；')}）`)}` : '';
        console.log(`  - ${pkg.name}@${pkg.version}${tail}`);
    }
    const skipped = report.filter((r) => r.status === 'skipped');
    if (skipped.length > 0)
    {
        log(`跳过 ${skipped.length} 个包：`);
        for (const item of skipped) console.log(cDim(`  - ${item.name}：${item.reason}`));
        if (!options.bumpAll && skipped.some((item) => item.reason?.startsWith('registry 上已存在')))
        {
            log(cDim('提示：跳过是默认「只升不降」策略的正常结果；想让每个包都发出版本，用 --bump-all'));
        }
    }
    console.log('');

    if (ordered.length === 0)
    {
        log(cGreen('没有需要发布的包，结束。'));
        writeReport(options, report);

        return;
    }

    // --- 发布 ---------------------------------------------------------------
    for (const pkg of ordered)
    {
        console.log('');
        log(`=== ${pkg.name}@${pkg.version} ===`);
        const result = releasePackage(pkg, options, !options.dryRun);
        report.push({ name: pkg.name, version: pkg.version, status: result.status, reason: result.reasons?.join('；') });

        if (result.status === 'failed')
        {
            fail(`${pkg.name}@${pkg.version} 发布失败，已中止后续包（避免发布到一半的半成品状态）`);
        }

        console.log(result.status === 'published' ? cGreen(`已发布 ${pkg.name}@${pkg.version}`) : cGreen(`预演通过 ${pkg.name}@${pkg.version}`));
    }

    writeReport(options, report);
    console.log('');
    log(cGreen(`全部完成：共 ${ordered.length} 个包${options.dryRun ? '（预演）' : ''}`));
}

/**
 * 写出 JSON 报告。
 *
 * @param {object} options 命令行选项
 * @param {Array<object>} report 报告条目
 */
function writeReport(options, report)
{
    if (!options.jsonOutput) return;

    writeFileSync(
        resolve(REPO_ROOT, options.jsonOutput),
        `${JSON.stringify({ generatedAt: new Date().toISOString(), results: report }, null, 2)}\n`,
        'utf8',
    );
    log(`报告已写入 ${options.jsonOutput}`);
}

main();
