import { saveAs } from 'file-saver';
import { FS, indexedDBFS, loader, ReadRS, ReadWriteFS, ReadWriteRS } from 'feng3d';
import JSZip from 'jszip';
import { getEditorCache } from '../caches/Editorcache';
import { callHost } from '../bridge/hostCall';
import { HostFS } from './HostFS';
import { nativeFS } from './NativeFS';
import { supportNative } from './NativeRequire';

// 使用相对路径，与 index.html 处于同一层级
const templateurls = [
    ['./resource/template/.vscode/settings.json', '.vscode/settings.json'],
    ['./resource/template/app.js', 'app.js'],
    ['./resource/template/index.html', 'index.html'],
    ['./resource/template/project.js', 'project.js'],
    ['./resource/template/tsconfig.json', 'tsconfig.json'],
    ['./resource/template/default.scene.json', 'default.scene.json'],
    ['./resource/template/libs/feng3d.js', 'libs/feng3d.js'],
    ['./resource/template/libs/feng3d.d.ts', 'libs/feng3d.d.ts'],
    ['./resource/template/libs/cannon.js', 'libs/cannon.js'],
    ['./resource/template/libs/cannon.d.ts', 'libs/cannon.d.ts'],
    ['./resource/template/libs/cannon-plugin.js', 'libs/cannon-plugin.js'],
    ['./resource/template/libs/cannon-plugin.d.ts', 'libs/cannon-plugin.d.ts'],
];

/**
 * 编辑器资源系统
 */
export class EditorRS extends ReadWriteRS
{
    /**
     * 初始化项目
     */
    async initproject()
    {
        const cache = getEditorCache();
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
     * **并发**发（#274）：模板有 12 个文件，而宿主 FS 每一次写就是两趟 HTTP——
     * 串行在这里是最贵的写法。这些文件彼此独立（各写各的路径），并发不改变结果，只把等待叠起来。
     *
     * 并发建目录是安全的：`HostFS` 是 `mkdirSync(recursive)`，`IndexedDBFS` 内部先问 `exists`
     * 再 `put`（put 是覆盖写）——两边都不会因为"同目录被建两次"而失败。
     */
    private async writeTemplateFiles()
    {
        await Promise.all(templateurls.map(async ([url, target]) =>
        {
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

if (supportNative)
{
    FS.basefs = nativeFS;
}
else
{
    FS.basefs = indexedDBFS;
}

/**
 * 编辑器资源系统
 */
export const editorRS = new EditorRS();
FS.fs = new ReadWriteFS();
ReadRS.rs = editorRS;

/** 探测宿主的超时（毫秒）。静态部署下这个请求会被投给页面、**没人应答**，不能让它拖住启动 */
const HOST_PROBE_TIMEOUT = 1500;

/**
 * **如果宿主开着项目，就把文件系统切到它上面**（#274；设计稿见 `docs/MIGRATE_TO_HOST_FS.md`）。
 *
 * ## 为什么要有这一步
 *
 * 上面那两行 `FS.basefs = …` 是**模块顶层**的同步赋值（浏览器端 → `indexedDBFS`），
 * 而"宿主有没有开着项目"只能**异步**问。所以"选哪个 FS"这件事必须从模块顶层挪进启动流程——
 * 也就是这个函数：启动时 `await` 它，它再决定要不要覆盖 `FS.basefs`。
 *
 * ## 两个"失败"要分开
 *
 * - **没有宿主**（静态部署 / dev server 没接 relay）是**正常态** → **静默保持原样**，返回 `false`；
 * - **宿主挂了**（探测成功之后的调用失败）是**错误态** → 那时必须如实报错，
 *   **不能**退回 indexedDB：那会让"保存"看着成功、实际写进了另一份项目，比直接失败危险得多。
 *
 * 这个函数只负责前者；后者发生在后续每一次读写里（由 `HostFS` / `callHost` 抛出去）。
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
