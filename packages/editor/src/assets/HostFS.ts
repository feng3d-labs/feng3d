import { FSType, type IReadWriteFS } from 'feng3d';
import { callHost } from '../bridge/hostCall';

/**
 * **宿主文件系统**（#274）：让编辑器页面把**宿主打开的项目目录**当成文件系统用。
 *
 * ## 为什么需要它
 *
 * 编辑器现在打开的项目在**页面里**（`indexedDB` / zip 导入的副本）——而"项目"的真实位置应该是
 * **磁盘上的一个目录**：VS Code 打开的是它、`npm run build` 跑的是它、Git 管的是它。
 * 页面里的副本做到"和磁盘一致"是件永远追不上的事（用户在 VS Code 里改了文件，页面不知道）。
 *
 * `HostFS` 就是把这个方向反过来：**页面不再持有项目，只通过宿主方法访问它**。
 *
 * ## `getAbsolutePath` 的特殊约定
 *
 * `IReadWriteFS` 的"绝对路径"是给**同进程**的调用方用的（Node 下是真的绝对路径）。
 * 这里返回的是**项目内相对路径**——因为对页面而言，"这个文件在哪"的答案就是"项目里的哪一条"。
 * 宿主侧所有方法也**只接受**相对路径（绝对路径会被 `resolveInside` 拒绝），两边约定一致。
 *
 * ## 哪些方法是有话要说的
 *
 * - `hasProject` / `initproject`：项目是由宿主用 `--project` 打开的，页面**没有"选项目"这个动作**。
 *   所以这两个方法在这里是**如实返回**（打开着就是有）而不是假装做点什么——注释里写明了。
 * - `readImage` / `writeImage`：走 base64 + `data:` URL（浏览器里没有别的路）。
 * - `copyFile`：读出来再写回去（宿主侧没有 copy；加一个只是为了少一次往返？
 *   不——**不加**，因为"复制"在项目里没什么出现频率，而每加一个宿主方法都要连带守边界）。
 */
export class HostFS implements IReadWriteFS
{
    /** 项目名（`IReadWriteFS` 要求）；页面这边项目的名字由宿主决定，这里只如实存着 */
    projectname = '';

    /** 文件系统类型标记（诊断与"当前用的是哪个 FS"这类展示用） */
    type = FSType.host;

    /**
     * 读二进制（宿主给 base64，这里还原成 ArrayBuffer）。
     *
     * @param path 项目内相对路径
     * @returns 内容
     */
    async readArrayBuffer(path: string): Promise<ArrayBuffer>
    {
        const base64 = await callHost<string>('host.workspace.readBinary', { path });
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        return bytes.buffer;
    }

    /**
     * 读文本。
     *
     * @param path 项目内相对路径
     * @returns 内容
     */
    async readString(path: string): Promise<string>
    {
        return await callHost<string>('host.workspace.readText', { path });
    }

    /**
     * 读 JSON。
     *
     * @param path 项目内相对路径
     * @returns 解析后的对象
     */
    async readObject(path: string): Promise<object>
    {
        return JSON.parse(await this.readString(path)) as object;
    }

    /**
     * 读图片（base64 → `data:` URL → `Image`）。
     *
     * @param path 项目内相对路径
     * @returns 图片；不存在时 `undefined`（与接口约定一致）
     */
    async readImage(path: string): Promise<HTMLImageElement | undefined>
    {
        if (!await this.exists(path)) return undefined;

        const base64 = await callHost<string>('host.workspace.readBinary', { path });
        const url = `data:${guessMimeType(path)};base64,${base64}`;

        return await new Promise<HTMLImageElement | undefined>((resolve_) =>
        {
            const image = new Image();

            image.onload = () => resolve_(image);
            image.onerror = () => resolve_(undefined);
            image.src = url;
        });
    }

    /**
     * "这个文件在哪"——见类注释：这里返回的是**项目内相对路径**。
     *
     * @param path 项目内相对路径
     * @returns 同一个路径（去掉开头的 `./`）
     */
    getAbsolutePath(path: string): string
    {
        return path.replace(/^\.\//, '');
    }

    /**
     * 是否存在。
     *
     * @param path 项目内相对路径
     * @returns 是否存在
     */
    async exists(path: string): Promise<boolean>
    {
        return await callHost<boolean>('host.workspace.exists', { path });
    }

    /**
     * 是否目录。
     *
     * @param path 项目内相对路径
     * @returns 是否目录
     */
    async isDirectory(path: string): Promise<boolean>
    {
        return await callHost<boolean>('host.workspace.isDirectory', { path });
    }

    /**
     * 列目录（只回**名字**，与接口约定一致）。
     *
     * @param path 项目内相对路径
     * @returns 条目名
     */
    async readdir(path: string): Promise<string[]>
    {
        const entries = await callHost<{ name: string }[]>('host.workspace.list', { dir: path });

        return entries.map((entry) => entry.name);
    }

    /**
     * 建目录（递归）。
     *
     * @param path 项目内相对路径
     */
    async mkdir(path: string): Promise<void>
    {
        await callHost('host.workspace.mkdir', { path });
    }

    /**
     * 删文件或目录（宿主侧是**递归**删）。
     *
     * @param path 项目内相对路径
     */
    async deleteFile(path: string): Promise<void>
    {
        await callHost('host.workspace.remove', { path });
    }

    /**
     * 写二进制（ArrayBuffer → base64）。
     *
     * @param path 项目内相对路径
     * @param arraybuffer 内容
     */
    async writeArrayBuffer(path: string, arraybuffer: ArrayBuffer): Promise<void>
    {
        const bytes = new Uint8Array(arraybuffer);
        let binary = '';

        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);

        await callHost('host.workspace.writeBinary', { path, base64: btoa(binary) });
    }

    /**
     * 写文本。
     *
     * @param path 项目内相对路径
     * @param str 内容
     */
    async writeString(path: string, str: string): Promise<void>
    {
        await callHost('host.workspace.writeText', { path, text: str });
    }

    /**
     * 写 JSON。
     *
     * @param path 项目内相对路径
     * @param object 要写的对象
     */
    async writeObject(path: string, object: object): Promise<void>
    {
        await this.writeString(path, JSON.stringify(object, null, 4));
    }

    /**
     * 写图片（canvas 转 base64）。
     *
     * @param path 项目内相对路径
     * @param image 图片
     */
    async writeImage(path: string, image: HTMLImageElement): Promise<void>
    {
        const canvas = document.createElement('canvas');

        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext('2d')?.drawImage(image, 0, 0);

        const dataUrl = canvas.toDataURL(guessMimeType(path));

        await callHost('host.workspace.writeBinary', { path, base64: dataUrl.split(',')[1] ?? '' });
    }

    /**
     * 复制文件（读出来再写回去）。
     *
     * @param src 源（项目内相对路径）
     * @param dest 目标（项目内相对路径）
     */
    async copyFile(src: string, dest: string): Promise<void>
    {
        await this.writeArrayBuffer(dest, await this.readArrayBuffer(src));
    }

    /**
     * "有没有这个项目"——项目是宿主用 `--project` 打开的，页面**没有"选项目"这个动作**。
     *
     * @returns 宿主开着项目就是 `true`
     */
    async hasProject(): Promise<boolean>
    {
        const info = await callHost<{ open: boolean }>('host.workspace.info');

        return info.open;
    }

    /**
     * "初始化项目"——同上：项目的建立不归页面管（页面只往里写文件）。
     *
     * 接口约定返回**项目名**：这里如实把传进来的名字回出去（没有"重命名"这回事），
     * 而不是假装做了点什么。
     *
     * @param projectname 项目名
     * @returns 同一个项目名
     */
    async initproject(projectname: string): Promise<string>
    {
        return projectname;
    }
}

/**
 * 按后缀猜 MIME 类型（`readImage` / `writeImage` 需要它）。
 *
 * @param path 路径
 * @returns MIME 类型
 */
function guessMimeType(path: string): string
{
    const lower = path.toLowerCase();

    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.svg')) return 'image/svg+xml';

    return 'image/png';
}
