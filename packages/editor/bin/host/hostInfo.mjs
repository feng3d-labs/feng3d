import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Service } from '@deepseek-ai/cordis';

/**
 * 宿主信息（#272 P0）：进程能**报版本**，也是宿主"最上层"身份的自述。
 *
 * 这是宿主侧的第一个 cordis `Service`——它演示了宿主接入 cordis 的形状：
 *
 * - **服务名**（`hostInfo`）是宿主内部的通信名，将来别的插件 `inject: ['hostInfo']` 就能用；
 * - **状态用普通字段而不是 `#field`**：cordis 的服务代理会让 `this` 变成 Proxy，
 *   而 JS 私有字段无法透过 Proxy 访问（#276 阶段 2 实测的同一约束，宿主侧同样成立）；
 * - 它是**只读**的：宿主信息不该被谁改。
 */
export class HostInfo extends Service
{
    /** 包根目录（宿主进程运行的地方） */
    packageRoot;

    /** 读取的 package.json（进程内只读一次） */
    manifest;

    constructor(ctx)
    {
        super(ctx, 'hostInfo');

        this.packageRoot = fileURLToPath(new URL('../../', import.meta.url));
        this.manifest = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
    }

    /** 宿主版本（来自 package.json） */
    get version()
    {
        return String(this.manifest.version ?? '0.0.0');
    }

    /**
     * 宿主包名。
     *
     * **刻意不叫 `name`**：cordis 的 `Service` 基类自己就有 `name`（服务名，构造时写成实例属性），
     * 子类再声明同名 getter 会被实例属性**遮蔽**——实测 `describe()` 输出的是服务名 `hostInfo`
     * 而不是包名。这是宿主侧接 cordis 的第一个坑，门禁（`check-editor-host.mjs`）抓到了它。
     */
    get packageName()
    {
        return String(this.manifest.name ?? 'feng3d-editor');
    }

    /**
     * 一行版本串（`--version` 打印的就是它）。
     *
     * @returns 形如 `feng3d-editor/0.6.0 node/v22.23.2 win32-x64`
     */
    describe()
    {
        return `${this.packageName}/${this.version} node/${process.versions.node} ${process.platform}-${process.arch}`;
    }
}
