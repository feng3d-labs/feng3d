import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Service } from '@deepseek-ai/cordis';

/**
 * **项目元数据服务**（#274 P3：`host.project.meta`）。
 *
 * ## 它解决什么
 *
 * `feng3d.project.json` 是 §5.2 目标布局里的**编辑器元数据**（名称 / 入口场景 / 启用插件 /
 * 构建覆盖），与 `package.json` **职责不重叠**（决策 16：不合并）——前者给编辑器读，后者给 npm 读。
 *
 * 但在此之前它只是"模板里一个**没人读**的文件"：`new` 出来的新项目会写它，
 * 而编辑器从没打开来看过。这个服务就是"读 + 校验"的那一端。
 *
 * ## 一条硬纪律：坏清单必须**指名报错**
 *
 * 不能静默当空项目——"打不开却看着像打开了"是最难查的一类问题（`#271` 的"假成功编译"
 * 是同一个病）。所以这里每一条失败都**说清是哪一条、坏在哪**：
 * 文件不在 / 不是合法 JSON / 缺哪一项 / 哪一项类型不对。
 *
 * ## 校验与读取分开
 *
 * `validateProjectMeta()` 是**纯函数**（导出，门禁与单测直接复用），`read()` 只负责
 * 取文件与把校验结果变成错误信息。
 */
export class ProjectMeta extends Service
{
    /** 元数据文件名（项目根下；§5.2） */
    static FILE = 'feng3d.project.json';

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ workspace: object }} config 配置（要一个已打开的 workspace）
     */
    constructor(ctx, config = {})
    {
        super(ctx, 'projectMeta');

        this.workspace = config.workspace;
    }

    /** 元数据文件的项目内相对路径 */
    get path()
    {
        return ProjectMeta.FILE;
    }

    /**
     * 读 + 校验项目元数据。
     *
     * @returns {{ path: string, name: string, entryScene: string, plugins: readonly string[], build: object|null }} 规范化后的元数据
     */
    read()
    {
        if (!this.workspace?.isOpen) throw new Error('项目未打开（用 --project <目录> 启动宿主）');

        const full = join(this.workspace.root, ProjectMeta.FILE);

        if (!existsSync(full))
        {
            throw new Error(`项目里没有 ${ProjectMeta.FILE}——它不是编辑器项目，或还没初始化`
                + '（目标布局见 packages/editor/docs/ARCHITECTURE.md §5.2）');
        }

        let raw;

        try
        {
            raw = readFileSync(full, 'utf8');
        }
        catch (error)
        {
            throw new Error(`读不到 ${ProjectMeta.FILE}：${error.message}`);
        }

        let parsed;

        try
        {
            parsed = JSON.parse(raw);
        }
        catch (error)
        {
            throw new Error(`${ProjectMeta.FILE} 不是合法 JSON：${error.message}`);
        }

        const problems = validateProjectMeta(parsed);

        if (problems.length > 0)
        {
            throw new Error(`${ProjectMeta.FILE} 不合法：${problems.join('；')}`);
        }

        return {
            path: ProjectMeta.FILE,
            name: parsed.name,
            entryScene: parsed.entryScene,
            plugins: parsed.plugins ?? [],
            build: parsed.build ?? null,
        };
    }
}

/**
 * 校验一份项目元数据（**纯函数**：门禁与单测直接喂样例）。
 *
 * 返回**问题清单**（空 = 通过）。每条都要说清"是哪一项、坏在哪"——
 * 调用方会把它们拼成一句**指名**的报错，而不是"格式不对"。
 *
 * @param {unknown} parsed 解析后的 JSON
 * @returns {string[]} 问题清单
 */
export function validateProjectMeta(parsed)
{
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    {
        return ['顶层要是一个对象'];
    }

    const problems = [];

    if (typeof parsed.name !== 'string' || parsed.name.trim() === '')
    {
        problems.push('`name` 要是一个非空字符串（项目名，编辑器标题栏与最近项目列表都用它）');
    }

    if (typeof parsed.entryScene !== 'string' || parsed.entryScene.trim() === '')
    {
        problems.push('`entryScene` 要是一个非空字符串（入口场景的项目内相对路径）');
    }

    if (parsed.plugins !== undefined)
    {
        if (!Array.isArray(parsed.plugins) || parsed.plugins.some((id) => typeof id !== 'string' || id.trim() === ''))
        {
            problems.push('`plugins` 若给了，要是**字符串数组**（插件 id；顺序不重要）');
        }
    }

    if (parsed.build !== undefined)
    {
        if (!parsed.build || typeof parsed.build !== 'object' || Array.isArray(parsed.build))
        {
            problems.push('`build` 若给了，要是一个对象（如 `{ "script": "build" }`）');
        }
        else if (parsed.build.script !== undefined && (typeof parsed.build.script !== 'string' || parsed.build.script.trim() === ''))
        {
            problems.push('`build.script` 若给了，要是非空字符串（项目 `package.json` 里的脚本名）');
        }
    }

    return problems;
}
