import { saveAs } from 'file-saver';
import { FS, loader, ReadRS, ReadWriteFS, ReadWriteRS } from 'feng3d';
import JSZip from 'jszip';
import type { EditorCache } from '../caches/Editorcache';
import { callHost } from '../bridge/hostCall';
import { HostFS } from './HostFS';

// 使用相对路径，与 index.html 处于同一层级
const templateurls: [string, string, boolean?][] = [
    ['./resource/template/.vscode/settings.json', '.vscode/settings.json'],
    ['./resource/template/app.js', 'app.js'],
    ['./resource/template/index.html', 'index.html'],
    ['./resource/template/tsconfig.json', 'tsconfig.json'],
    ['./resource/template/scenes/default.scene.json', 'scenes/default.scene.json'],
    ['./resource/template/libs/feng3d.js', 'libs/feng3d.js'],
    ['./resource/template/libs/feng3d.d.ts', 'libs/feng3d.d.ts'],
    ['./resource/template/libs/cannon.js', 'libs/cannon.js'],
    ['./resource/template/libs/cannon.d.ts', 'libs/cannon.d.ts'],
    ['./resource/template/libs/cannon-plugin.js', 'libs/cannon-plugin.js'],
    ['./resource/template/libs/cannon-plugin.d.ts', 'libs/cannon-plugin.d.ts'],
    // 【#274 新增·用户所有物】第三个元素 `true` = **只在新项目里写一次**：
    // 升级项目时**不覆盖**（用户会自己改依赖 / 入口场景 / 构建配置，理由见 `writeTemplateFiles`）。
    //
    // 这三个文件是 §5.2「标准 npm 工程」的标志（D12）：`package.json` 让项目能自己
    // `npm install && npm run build`（D10「脱离 editor 也能跑」），`feng3d.project.json`
    // 是**编辑器元数据**（决策 16：与 `package.json` 不合并），`vite.config.js` 是可替换的构建配置。
    ['./resource/template/package.json', 'package.json', true],
    ['./resource/template/feng3d.project.json', 'feng3d.project.json', true],
    ['./resource/template/vite.config.js', 'vite.config.js', true],
];

/**
 * 编辑器资源系统
 */
export class EditorRS extends ReadWriteRS
{
    /**
     * 初始化项目
     *
     * @param cache 编辑器缓存（**调用方传入**，#278 路线 B 第七批：原先内部调 `getEditorCache()`）
     */
    async initproject(cache: EditorCache)
    {
        const has = await this.fs.hasProject(cache.projectname);

        const projectname = await this.fs.initproject(cache.projectname);
        if (projectname)
        {
            cache.projectname = projectname;
        }
        if (!has)
        {
            await this.createproject();
        }
    }

    /**
     * 创建项目
     */
    private async createproject()
    {
        await this.writeTemplateFiles();
    }

    /**
     * 升级项目（把模板文件按当前版本重写一遍）
     */
    async upgradeProject()
    {
        await this.writeTemplateFiles();
    }

    /**
     * 把模板文件逐个读进来、写进当前文件系统（"创建"与"升级"走的是同一条链）。
     *
     * **并发**发（#274）：模板有 14 个文件，而宿主 FS 每一次写就是两趟 HTTP——
     * 串行在这里是最贵的写法。这些文件彼此独立（各写各的路径），并发不改变结果，只把等待叠起来。
     *
     * 并发建目录是安全的：`HostFS` 走 `mkdirSync(recursive)`，同目录被建两次不会失败。
     */
    private async writeTemplateFiles()
    {
        await Promise.all(templateurls.map(async ([url, target, createOnly]) =>
        {
            // `createOnly` 的是**用户所有物**（#274）：`package.json` / `feng3d.project.json` /
            // `vite.config.js` —— 用户会自己改（依赖、入口场景、构建配置），而"升级项目"
            // 会重写全部模板文件；把这三份也覆盖回去等于**抹掉用户的改动**。
            if (createOnly && await this.fs.exists(target)) return;

            const content = await loader.loadText(url);

            await this.fs.writeString(target, content);
        }));
    }

    /**
     * 选择文件
     *
     * @param callback 完成回调
     */
    selectFile(callback: (file: FileList) => void)
    {
        selectFileCallback = callback;
        isSelectFile = true;
    }

    /**
     * 清理项目
     */
    async clearProject()
    {
        this._idMap = {};
        this._pathMap = {};

        await this.fs.delete('');
    }

    /**
     * 导出项目为zip压缩包
     *
     * @param filename 导出后压缩包名称
     */
    async exportProjectToJSZip(filename: string)
    {
        const filepaths = await this.fs.getAllPathsInFolder('');
        await this.exportFilesToJSZip(filename, filepaths);
    }

    /**
     * 导出指定文件夹为zip压缩包
     *
     * @param filename 导出后压缩包名称
     * @param folderpath 需要导出的文件夹路径
     */
    async exportFolderToJSZip(filename: string, folderpath: string)
    {
        const filepaths = await this.fs.getAllPathsInFolder(folderpath);
        await this.exportFilesToJSZip(filename, filepaths);
    }

    /**
     * 导出文件列表为zip压缩包
     *
     * @param filename 导出后压缩包名称
     * @param filepaths 需要导出的文件列表
     */
    async exportFilesToJSZip(filename: string, filepaths: string[])
    {
        const zip = new JSZip();
        await Promise.all(filepaths.map(async (p) =>
        {
            const result = await this.fs.isDirectory(p);
            if (result)
            {
                zip.folder(p);
            }
            else
            {
                const data = await this.fs.readArrayBuffer(p);
                // 处理文件夹
                data && zip.file(p, data);
            }
        }));

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, filename);
    }

    /**
     * 导入项目
     */
    async importProject(file: File)
    {
        const zip = new JSZip();
        const value = await zip.loadAsync(file);

        const filepaths = Object.keys(value.files);
        filepaths.sort();

        await Promise.all(filepaths.map(async (p) =>
        {
            if (value.files[p].dir)
            {
                await this.fs.mkdir(p);
            }
            else
            {
                // p 来自上面遍历的 zip 文件列表，必然能查到；取不到时原实现同样会崩在 .async 上
                const data = await zip.file(p)!.async('arraybuffer');
                await this.fs.writeFile(p, data);
            }
        }));
    }
}

// native 直连已删除（2026-10-05，决策见 `ARCHITECTURE.md` §11-9）：那条路既走不通（`nativeFS1 = null`
// 一旦 `supportNative = true` 必空指针）也不该走——**页面直接碰 Node fs 已被 HostFS（经宿主）取代**。
// 那行 `FS.basefs = …` 也移进 `installEditorResourceSystem()` 了（#278）：
// 模块顶层写**引擎全局槽位**与 `FS.fs` / `ReadRS.rs` 是同一类——"import 即改装配"。

/**
 * 编辑器资源系统。
 *
 * 实例仍在模块顶层构造（那只是"造一个对象"，冻结在 `toplevel-new` 基线里）；
 * 但**写引擎槽位**的那两行已经移进 `installEditorResourceSystem()`——见下。
 */
export const editorRS = new EditorRS();

/** 是否已经装过（让装配**幂等**：重复调用不会把 `FS.fs` 换掉） */
let installed = false;

/**
 * **显式装配**编辑器资源系统（#278 阶段 4a）。
 *
 * ## 为什么不放在模块顶层
 *
 * 这两件事都是**写全局**：`FS.fs = new ReadWriteFS()` 与 `ReadRS.rs = editorRS`。
 * 放在模块顶层时，只要有人 `import` 这个模块，引擎的资源系统槽位就被改写——
 * 这正是 R2（零模块级副作用）要消掉的东西，也让"谁装了什么、什么时候装的"无从查起。
 * `editor-singleton-survey.mjs` 里那条"`editorRS` 不许在模块顶层被使用"就是它的执行者。
 *
 * ## 调用时机与幂等
 *
 * 由入口显式调用（`vue-app/main.ts`），且必须在 `pickBaseFS()` **之前**——
 * 后者会按宿主能力替换 `FS.basefs`，而读写包装得先就位。
 *
 * **重复调用是安全的**：`FS.fs` 只装一次（重复调用**不会**换掉包装实例，
 * 免得把运行期挂在它上面的状态丢掉），`ReadRS.rs` 则每次重设（它本来就指向同一个单例）。
 *
 * @returns 装配好的资源系统（调用方直接用，不必再 import 单例——#278 阶段 4b 的装配点就靠它）
 */
export function installEditorResourceSystem(): EditorRS
{
    if (!installed)
    {
        // **初值就是宿主**（决策 ①，2026-10-05：不再支持 IndexedDB —— 每个项目对应一个
        // 本地目录、由 Node 操作、网页经 WS 交互）。
        //
        // 原先这里给的是"浏览器侧副本"（`indexedDBFS`），等 `pickBaseFS()` 在宿主开着项目时
        // 再覆盖。现在**没有副本可退**：没有项目时 `HostFS` 的调用会**如实失败** ——
        // 那是有意的，比"保存看着成功、其实写进一份空副本"好（见 `docs/ARCHITECTURE.md`
        // §11 问题 24 记下的语义）。
        FS.basefs = new HostFS();
        FS.fs = new ReadWriteFS();
        installed = true;
    }

    ReadRS.rs = editorRS;

    return editorRS;
}

/** 探测宿主的超时（毫秒）。静态部署下这个请求会被投给页面、**没人应答**，不能让它拖住启动 */
const HOST_PROBE_TIMEOUT = 1500;

/**
 * **如果宿主开着项目，就把文件系统切到它上面**（#274；设计稿见 `docs/MIGRATE_TO_HOST_FS.md`）。
 *
 * ## 为什么要有这一步
 *
 * 上面那两行 `FS.basefs = …` 是**显式装配**里的同步赋值（决策 ① 之后是 `HostFS`），
 * 而"宿主有没有开着项目"只能**异步**问。所以"选哪个 FS"这件事必须从模块顶层挪进启动流程——
 * 也就是这个函数：启动时 `await` 它，它再决定要不要覆盖 `FS.basefs`。
 *
 * ## "没有宿主"的语义变了（决策 ①）
 *
 * - **没有宿主**（静态部署 / dev server 没接 relay）：静默返回 `false`。
 *   它**不再是"保持原样用页面副本"**那样一个正常态 —— 决策 ① 之后**没有副本可退**，
 *   `FS.basefs` 就是 `HostFS`，于是**任何碰项目的操作会如实失败**。
 *   编辑器页面本身照样起得来（设置页这类不碰项目的部分不受影响）。
 * - **宿主挂了**（探测成功之后的调用失败）：同样当场报错，由 `HostFS` / `callHost` 抛出去。
 *
 * 两条都**不再"悄悄退回另一份项目"** —— 那会让"保存"看着成功、实际写进了别处，
 * 比直接失败危险得多。这条纪律在决策 ① 之前就有，决策 ① 只是把"退回"这条退路整个删掉了。
 *
 * @returns 是否切到了宿主（便于日志与验收）
 */
export async function pickBaseFS(): Promise<boolean>
{
    try
    {
        const info = await Promise.race([
            callHost<{ open: boolean }>('host.workspace.info'),
            new Promise<never>((_, reject) =>
            {
                setTimeout(() => reject(new Error('探测宿主超时')), HOST_PROBE_TIMEOUT);
            }),
        ]);

        if (!info.open) return false;

        FS.basefs = new HostFS();

        return true;
    }
    catch
    {
        return false;
    }
}

//
let isSelectFile = false;
let selectFileCallback: ((file: FileList) => void) | null = null;
let fileInput: HTMLInputElement | null = null;

/**
 * 取隐藏的 file input（**延迟创建**）。
 *
 * 原先它在模块顶层 `document.createElement('input')`——于是本模块在非浏览器环境
 * （Node 里跑单元测试）**import 就崩**：`ReferenceError: document is not defined`。
 * issue #170 把插件清单接到编辑器主干后，这条链被单元测试走到，问题才暴露出来。
 * 延迟到真正要选文件时创建，浏览器里行为完全一致。
 *
 * @returns 可直接 `click()` 的 input；非浏览器环境返回 `null`
 */
function getFileInput(): HTMLInputElement | null
{
    if (typeof document === 'undefined') return null;
    if (fileInput) return fileInput;

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.display = 'none';
    input.addEventListener('change', function (_event)
    {
        // change 事件触发时 files 必然存在（用户刚选完文件）；原实现会把 null 传下去并在回调里崩
        selectFileCallback && selectFileCallback(input.files!);
        selectFileCallback = null;
        // 清空 input 的值：原来写 null，DOM 会把它转成字符串 "null"（真实行为就是如此），这里改为空串
        input.value = '';
    });
    // document.body.appendChild(input);
    fileInput = input;

    return fileInput;
}

if (typeof window !== 'undefined')
{
    window.addEventListener('click', () =>
    {
        if (isSelectFile)
        { getFileInput()?.click(); }
        isSelectFile = false;
    });
}
