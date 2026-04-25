import { saveAs } from '@feng3d/filesaver';
import { FS, indexedDBFS, loader, ReadRS, ReadWriteFS, ReadWriteRS } from 'feng3d';
import JSZip from 'jszip';
import { editorcache } from '../caches/Editorcache';
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
        const has = await this.fs.hasProject(editorcache.projectname);

        const projectname = await this.fs.initproject(editorcache.projectname);
        if (projectname)
        {
            editorcache.projectname = projectname;
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
        for (let i = 0; i < templateurls.length; i++)
        {
            const content = await loader.loadText(templateurls[i][0]);
            await this.fs.writeString(templateurls[i][1], content);
        }
    }

    async upgradeProject()
    {
        for (let i = 0; i < templateurls.length; i++)
        {
            const content = await loader.loadText(templateurls[i][0]);
            await this.fs.writeString(templateurls[i][1], content);
        }
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
        await Promise.all(filepaths.map((p) => async () =>
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

        await Promise.all(filepaths.map((p) => async () =>
        {
            if (value.files[p].dir)
            {
                await this.fs.mkdir(p);
            }
            else
            {
                const data = await zip.file(p).async('arraybuffer');
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

//
let isSelectFile = false;
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.multiple = true;
fileInput.style.display = 'none';
fileInput.addEventListener('change', function (_event)
{
    selectFileCallback && selectFileCallback(fileInput.files);
    selectFileCallback = null;
    fileInput.value = null;
});
// document.body.appendChild(fileInput);
window.addEventListener('click', () =>
{
    if (isSelectFile)
    { fileInput.click(); }
    isSelectFile = false;
});

let selectFileCallback: (file: FileList) => void;
