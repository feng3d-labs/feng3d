import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Service } from '@deepseek-ai/cordis';

/**
 * 模板目录（包内资源）。
 *
 * 从 `bin/host/` 往上两级就是包根：`packages/editor/resource/template/`。
 * 发布时由 `package.json` 的 `files` 覆盖 `resource/`（`check-editor-publish-files.mjs` 守这一条）。
 */
const TEMPLATE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../resource/template');

/**
 * **新建项目服务**（#274 P3：`host.project.new`）。
 *
 * ## 它解决什么
 *
 * 在此之前宿主只能 `--project <**已有**目录>`（"打开"），而 §5.2 的目标形态要能**新建**
 * ——也就是"目录即项目"的前半步：给一个目录，写出一个**标准 npm 工程的骨架**。
 *
 * 骨架的内容就是模板目录（`resource/template/`）：`package.json` + `feng3d.project.json` +
 * `vite.config.js` + `tsconfig.json` + `index.html` + `app.js` + `default.scene.json` + `libs/`。
 * **不在这里手写一份**——手写就会和模板漂移（而模板有门禁守着：`check-editor-project-shape.mjs`）。
 *
 * ## 一条纪律：只写进**空目录**
 *
 * 已有内容的目录一律拒绝，并说清是哪一条。新建是"**从零开始**"的动作，
 * 往用户已有的项目里糊一份模板是不可逆的数据损失——与 `EditorAsset` 那边
 * "升级不覆盖用户所有物"是同一条道理。
 *
 * ## 与"能读通"配套
 *
 * 建完的骨架可以直接交给 `ProjectMeta.read()` 校验——门禁就是这么验的（见
 * `scripts/check-editor-workspace.mjs`）：**新建 → 读通**，闭环。
 */
export class ProjectNew extends Service
{
    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ workspace?: object }} [config] 配置
     */
    constructor(ctx, config = {})
    {
        super(ctx, 'projectNew');

        this.workspace = config.workspace;
    }

    /**
     * 新建一个项目骨架。
     *
     * @param {string} dir 目标目录（不存在会被创建；**必须为空或不存在**）
     * @param {string} [name] 项目名（缺省取目录名）
     * @returns {{ root: string, name: string, files: number }} 建好的项目
     */
    create(dir, name)
    {
        if (typeof dir !== 'string' || dir.trim() === '')
        {
            throw new Error('要一个目录（给 `--project <目录>`，或调 `host.project.new` 时传 `dir`）');
        }

        const full = resolve(dir);

        if (!existsSync(TEMPLATE_DIR))
        {
            throw new Error(`找不到模板目录：${TEMPLATE_DIR}（发布版的 files 可能没覆盖 "resource/"）`);
        }

        // 只写进**空目录**：往已有内容里糊模板是不可逆的（见类注释）
        if (existsSync(full))
        {
            const existing = readdirSync(full);

            if (existing.length > 0)
            {
                throw new Error(`目录里已经有东西（${existing.slice(0, 5).join(' / ')}${existing.length > 5 ? ' …' : ''}）：`
                    + `${full}——新建只写进空目录，避免覆盖你的东西`);
            }
        }
        else
        {
            mkdirSync(full, { recursive: true });
        }

        cpSync(TEMPLATE_DIR, full, { recursive: true });

        // 项目名写进元数据（模板里是占位的 `my-project`）
        const metaPath = join(full, 'feng3d.project.json');
        const meta = JSON.parse(readFileSync(metaPath, 'utf8'));

        meta.name = (typeof name === 'string' && name.trim() !== '') ? name : basename(full);
        writeFileSync(metaPath, `${JSON.stringify(meta, null, 4)}\n`, 'utf8');

        return { root: full, name: meta.name, files: countFiles(full) };
    }
}

/**
 * 数一下骨架里有多少个文件（回给调用方一个"真的写了东西"的凭据）。
 *
 * @param {string} dir 目录
 * @returns {number} 文件数
 */
function countFiles(dir)
{
    let total = 0;

    for (const entry of readdirSync(dir, { withFileTypes: true }))
    {
        if (entry.isDirectory()) total += countFiles(join(dir, entry.name));
        else total += 1;
    }

    return total;
}
