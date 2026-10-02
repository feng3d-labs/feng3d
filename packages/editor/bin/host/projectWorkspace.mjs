import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, watch, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { Service } from '@deepseek-ai/cordis';

/**
 * **项目工作区服务**（#272 的 P2，宿主侧第一个真业务服务）。
 *
 * NODE_HOST 的目标形态是"编辑器分服务端与 Web 端"：**服务端碰文件、Web 端碰画面**。
 * 这个服务就是"服务端碰文件"的那一半：打开一个项目目录、在**边界内**读写它、并把变化报出来。
 *
 * ## 一条不可让步的边界：**只能在项目目录内**
 *
 * 宿主是 Node 进程，`readText('../../../etc/passwd')` 这种路径如果放过去，就等于把
 * "打开的目录"变成了"整台机器"。所以所有路径都过 `resolveInside()`：
 *
 * - 拒绝**绝对路径**（`/etc/passwd`、`C:\Windows\...`）；
 * - 解析后必须**仍在 root 之内**（`..` 组合出来的路径在这里被挡下）；
 * - 未打开项目时一律拒绝。
 *
 * ## 变化事件（"服务端 → 页面推送"的事件源）
 *
 * `fs.watch(recursive)` 把项目内的增删改写报成 `{ path, kind }`，交给订阅者——
 * 上一阶段的 WebSocket 通道正是为这类事件准备的（`bridge.subscribe` + `{type:'task'}` 那套
 * 可以照搬成 `{type:'event'}`）。**事件只报相对路径**，页面拿到的永远是项目内视角。
 *
 * ## 生命周期
 *
 * `ctx.effect` 在构造时注册一次，fiber 卸载即关掉 watcher——宿主"能停"不靠进程信号。
 */
export class ProjectWorkspace extends Service
{
    /** 项目根目录（绝对路径；未打开为 `null`） */
    root = null;

    /** 变化订阅者 */
    listeners = new Set();

    /** 目录监听句柄（未打开或平台不支持时为 `null`） */
    watcher = null;

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ root?: string }} [config] 配置（`root` 给了就立即打开）
     */
    constructor(ctx, config = {})
    {
        super(ctx, 'workspace');

        this.ctx.effect(() => () => this.close());

        if (config.root) this.open(config.root);
    }

    /** 是否已打开项目 */
    get isOpen()
    {
        return this.root !== null;
    }

    /**
     * 打开项目目录（已打开时会先关掉，watcher 不叠加）。
     *
     * @param {string} root 目录路径
     * @returns {string} 打开后的绝对路径
     */
    open(root)
    {
        const full = resolve(root);

        if (!existsSync(full) || !statSync(full).isDirectory())
        {
            throw new Error(`不是目录：${root}`);
        }

        this.close();
        this.root = full;
        this.startWatch();

        return full;
    }

    /**
     * 关闭项目（watcher 一并收走；之后再操作会被拒）。
     */
    close()
    {
        this.watcher?.close();
        this.watcher = null;
        this.root = null;
    }

    /**
     * 订阅项目内变化。
     *
     * @param {(change: { path: string, kind: string }) => void} listener 订阅者
     * @returns {() => void} 退订
     */
    onChanged(listener)
    {
        this.listeners.add(listener);

        return () => this.listeners.delete(listener);
    }

    /**
     * 把项目内的**相对路径**解析成绝对路径，并挡住越界。
     *
     * @param {string} relativePath 项目内相对路径（正斜杠或平台分隔符都行）
     * @returns {string} 绝对路径
     */
    resolveInside(relativePath)
    {
        if (this.root === null) throw new Error('项目未打开');

        if (typeof relativePath !== 'string' || relativePath.length === 0) throw new Error('路径不能为空');

        if (isAbsolute(relativePath))
        {
            throw new Error(`只接受项目内的相对路径，收到绝对路径：${relativePath}`);
        }

        const full = resolve(this.root, relativePath);

        // 相等（就是项目根）或在其下，才算"在里面"
        if (full !== this.root && !full.startsWith(this.root + sep))
        {
            throw new Error(`路径越出项目目录：${relativePath}`);
        }

        return full;
    }

    /**
     * 列目录（相对项目根）。
     *
     * @param {string} [dir] 相对目录（缺省项目根）
     * @returns {Array<{ name: string, path: string, directory: boolean }>} 条目
     */
    list(dir = '.')
    {
        const full = this.resolveInside(dir);

        if (!existsSync(full)) throw new Error(`目录不存在：${dir}`);

        return readdirSync(full, { withFileTypes: true })
            .map((entry) => ({
                name: entry.name,
                path: toProjectPath(join(relative(this.root, join(full, entry.name)))),
                directory: entry.isDirectory(),
            }))
            .sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name));
    }

    /**
     * 读文本文件。
     *
     * @param {string} relativePath 项目内相对路径
     * @returns {string} 内容
     */
    readText(relativePath)
    {
        return readFileSync(this.resolveInside(relativePath), 'utf8');
    }

    /**
     * 写文本文件（父目录不存在时自动建）。
     *
     * @param {string} relativePath 项目内相对路径
     * @param {string} text 内容
     * @returns {string} 写入的绝对路径
     */
    writeText(relativePath, text)
    {
        const full = this.resolveInside(relativePath);

        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, text, 'utf8');

        return full;
    }

    /**
     * 路径是否存在（文件或目录都算）。
     *
     * @param {string} relativePath 项目内相对路径
     * @returns {boolean} 是否存在
     */
    exists(relativePath)
    {
        return existsSync(this.resolveInside(relativePath));
    }

    /**
     * 是不是目录（不存在时是 `false`，不抛——调用方多半在探测）。
     *
     * @param {string} relativePath 项目内相对路径
     * @returns {boolean} 是否目录
     */
    isDirectory(relativePath)
    {
        try
        {
            return statSync(this.resolveInside(relativePath)).isDirectory();
        }
        catch
        {
            return false;
        }
    }

    /**
     * 建目录（递归）。
     *
     * @param {string} relativePath 项目内相对路径
     * @returns {string} 建好的绝对路径
     */
    mkdir(relativePath)
    {
        const full = this.resolveInside(relativePath);

        mkdirSync(full, { recursive: true });

        return full;
    }

    /**
     * 删文件或目录（目录**递归**删——这一点要说清楚：它比"删空目录"危险得多，
     * 所以只在这个 Service 的方法上暴露，且路径边界照旧由 `resolveInside` 把守）。
     *
     * @param {string} relativePath 项目内相对路径
     * @returns {boolean} 是否删掉了东西（不存在时为 `false`）
     */
    remove(relativePath)
    {
        const full = this.resolveInside(relativePath);

        if (!existsSync(full)) return false;

        rmSync(full, { recursive: true, force: true });

        return true;
    }

    /**
     * 读二进制文件。
     *
     * 返回 **base64**：宿主方法与页面之间走的是 JSON，`Buffer` 过不去。
     *
     * @param {string} relativePath 项目内相对路径
     * @returns {string} base64
     */
    readBinary(relativePath)
    {
        return readFileSync(this.resolveInside(relativePath)).toString('base64');
    }

    /**
     * 写二进制文件（父目录不存在时自动建）。
     *
     * @param {string} relativePath 项目内相对路径
     * @param {string} base64 内容（base64）
     * @returns {string} 写入的绝对路径
     */
    writeBinary(relativePath, base64)
    {
        const full = this.resolveInside(relativePath);

        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, Buffer.from(base64, 'base64'));

        return full;
    }

    /**
     * 起目录监听（平台不支持时只警告，不影响读写）。
     */
    startWatch()
    {
        try
        {
            this.watcher = watch(this.root, { recursive: true }, (kind, filename) =>
            {
                if (!filename) return;

                const change = { path: toProjectPath(filename), kind: String(kind) };

                for (const listener of this.listeners)
                {
                    try
                    {
                        listener(change);
                    }
                    catch (error)
                    {
                        console.error(`[workspace] 变化订阅者抛错（已忽略）：${error.message}`);
                    }
                }
            });
        }
        catch (error)
        {
            // 例如某些平台的 recursive 不支持：读写照旧可用，只是没有变化事件
            console.warn(`[workspace] 变化监听未启用：${error.message}`);
        }
    }
}

/**
 * 把平台路径统一成项目内视角（正斜杠）。
 *
 * @param {string} path 平台路径
 * @returns {string} 正斜杠路径
 */
function toProjectPath(path)
{
    return path.split(sep).join('/');
}
