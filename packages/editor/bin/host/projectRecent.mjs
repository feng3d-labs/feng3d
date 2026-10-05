import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { Service } from '@deepseek-ai/cordis';

/** 最近项目最多记几个（再多就没人看了） */
export const MAX_RECENT = 10;

/** 状态文件名 */
export const RECENT_FILE = 'recent.json';

/**
 * 状态目录。
 *
 * 可用环境变量 `FENG3D_EDITOR_HOME` 覆盖——门禁要能在**临时目录**里跑，
 * 不污染跑测试的人真实的 `~/.feng3d-editor/`。
 *
 * @returns {string} 目录路径
 */
export function stateDir()
{
    return process.env.FENG3D_EDITOR_HOME ?? join(homedir(), '.feng3d-editor');
}

/**
 * 读出最近项目清单（**纯函数**：接一个目录，便于门禁直接喂临时目录）。
 *
 * 读不到 / 坏掉一律当空清单：一份坏掉的偏好设置不该让编辑器起不来
 * （与 `plugins/state.ts` 读 localStorage 是同一条纪律）。
 *
 * @param {string} dir 状态目录
 * @returns {string[]} 最近项目（**新的在前**）
 */
export function readRecent(dir)
{
    const file = join(dir, RECENT_FILE);

    if (!existsSync(file)) return [];

    try
    {
        const parsed = JSON.parse(readFileSync(file, 'utf8'));

        if (!Array.isArray(parsed)) return [];

        return parsed.filter((item) => typeof item === 'string' && item.trim() !== '');
    }
    catch
    {
        return [];
    }
}

/**
 * 记一次"打开过"（**纯函数**）：去重、新的在前、截到上限。
 *
 * 去重是必须的——同一个项目开十次不该占满十个位置；
 * 而"再打开一次要挪到最前"也是必须的，否则这个列表会退化成"第一次打开的顺序"。
 *
 * @param {string} dir 状态目录
 * @param {string} root 项目根（绝对路径）
 * @returns {string[]} 记完之后的清单
 */
export function recordRecent(dir, root)
{
    const full = resolve(root);
    const kept = readRecent(dir).filter((item) => item !== full);
    const next = [full, ...kept].slice(0, MAX_RECENT);

    try
    {
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, RECENT_FILE), `${JSON.stringify(next, null, 4)}\n`, 'utf8');
    }
    catch (error)
    {
        // 记不住"最近打开"是**遗憾**，不是错误——不能因此让宿主起不来
        console.error(`[feng3d-editor] 记不住最近项目（${error.message}）；这不影响使用`);
    }

    return next;
}

/**
 * **最近项目服务**（#274 P3：`host.project.recent`）。
 *
 * ## 它解决什么
 *
 * §5.2 点名的三个命令是 `new` / `open` / `recent`：前两个已经把"从零开始"与"打开已有的"覆盖了，
 * `recent` 补的是"**我上次在改哪个**"——没有它，用户每次都要从文件系统里重新找回那个目录。
 *
 * ## 为什么落在宿主
 *
 * "最近打开"是**这台机器上的用户偏好**，与项目本身无关（不该写进项目、也不该提交）。
 * 页面侧做不到（浏览器跨站点拿不到本机目录），所以只能在宿主。
 *
 * ## 记不住不算错
 *
 * 写失败只**提示**、不抛（见 `recordRecent`）——"最近项目"是便利功能，
 * 不该因为它写不进去就让编辑器起不来。
 */
export class ProjectRecent extends Service
{
    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ dir?: string }} [config] 配置（`dir` 可覆盖状态目录，测试用）
     */
    constructor(ctx, config = {})
    {
        super(ctx, 'projectRecent');

        this.dir = config.dir ?? stateDir();
    }

    /** 最近项目（新的在前） */
    list()
    {
        return readRecent(this.dir);
    }

    /**
     * 记一次"打开过"。
     *
     * @param {string} root 项目根
     * @returns {string[]} 记完之后的清单
     */
    record(root)
    {
        return recordRecent(this.dir, root);
    }
}
