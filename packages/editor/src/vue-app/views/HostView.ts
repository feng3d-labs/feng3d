import { computed, onUnmounted, ref } from 'vue';
import { callHost } from '../../bridge/hostCall';
import { subscribeBridgeEvent } from '../../bridge/bridgeSocket';
import { getEnabledPlugins } from '../../plugins/registry';

/** 项目里的一条文件/目录（宿主给的是**项目内相对路径**） */
interface HostFileEntry
{
    readonly name: string;
    readonly path: string;
    readonly directory: boolean;
}

/** 面包屑上的一段 */
interface HostCrumb
{
    readonly label: string;
    readonly path: string;
}

/**
 * 宿主面板的逻辑（视图在 `HostView.vue`）。
 *
 * ## 它是什么
 *
 * 编辑器界面里**第一次**出现"宿主侧能力"的入口：项目文件与构建。它调的是宿主方法
 * （`host.workspace.*` / `host.build.*`）——与 CLI / MCP **同一条协议**，
 * 所以"界面上能做的"和"AI 能做的"是同一件事，不会各长一套。
 *
 * ## 构建输出为什么能实时出现
 *
 * 宿主把构建的每一行 `broadcastEvent('build/output', …)` 推给页面（WebSocket），
 * 这里订阅它——所以构建过程**看得见**，而不是"点了按钮、界面卡住、两分钟后突然出结果"。
 *
 * ## 纪律
 *
 * - 错误**如实显示**（`note` 里就是宿主返回的原因，不吞掉——#271 的教训）；
 * - 目录只走**项目内相对路径**（`..` 一类的越界由宿主挡，界面不自己拼路径）；
 * - 订阅在**组件卸载时退订**（面板会被反复挂载/卸载，不退订就会累积订阅者）；
 * - 没打开项目时不假装成功：按钮禁用 + 说明怎么开。
 */
export function useHostPanel()
{
    const root = ref<string | null>(null);
    const isOpen = ref(false);
    const entries = ref<HostFileEntry[]>([]);
    /** 当前所在目录（**项目内相对路径**，`.` 是项目根） */
    const currentDir = ref('.');
    const output = ref<string[]>([]);
    const loading = ref(false);
    const building = ref(false);
    const publishing = ref(false);
    const note = ref('');
    /** 「新建文件」输入框里的名字 */
    const newFileName = ref('');

    /** 面包屑：把当前目录拆成可点的段（第一段永远是项目根，所以总能走回去） */
    const breadcrumbs = computed<HostCrumb[]>(() =>
    {
        const segments = currentDir.value === '.' ? [] : currentDir.value.split('/');
        const crumbs: HostCrumb[] = [{ label: '项目根', path: '.' }];

        segments.forEach((name, index) =>
        {
            crumbs.push({ label: name, path: segments.slice(0, index + 1).join('/') });
        });

        return crumbs;
    });

    /**
     * 读当前目录的文件列表（`refresh` 与"进目录"都走它）。
     */
    async function refreshEntries(): Promise<void>
    {
        if (!isOpen.value) { entries.value = []; return; }

        entries.value = await callHost<HostFileEntry[]>('host.workspace.list', { dir: currentDir.value });
    }

    /**
     * 读一次宿主的项目信息与文件列表。
     */
    async function refresh(): Promise<void>
    {
        loading.value = true;
        note.value = '';

        try
        {
            const info = await callHost<{ open: boolean; root: string | null }>('host.workspace.info');

            isOpen.value = info.open;
            root.value = info.root;
            currentDir.value = '.';

            await refreshEntries();
        }
        catch (error)
        {
            note.value = `读取失败：${(error as Error).message}`;
        }
        finally
        {
            loading.value = false;
        }
    }

    /**
     * 进一个目录（或跳回面包屑上的某一级）。
     *
     * @param path **项目内相对路径**
     */
    async function openDir(path: string): Promise<void>
    {
        note.value = '';
        currentDir.value = path;

        try
        {
            await refreshEntries();
        }
        catch (error)
        {
            note.value = `打开 ${path} 失败：${(error as Error).message}`;
        }
    }

    /**
     * 让宿主在项目里跑一次构建，并把输出尾巴显示出来。
     */
    async function runBuild(): Promise<void>
    {
        building.value = true;
        note.value = '';
        output.value = [];

        try
        {
            const result = await callHost<{ code: number; ok: boolean; output: string[]; cancelled?: boolean }>('host.build.run', { script: 'build' });

            output.value = result.output ?? [];
            // **失败如实**：非 0 退出码直接说清楚（不是"构建完成"了事）
            // 但"被用户取消"不是失败（#273 长任务）：宿主会把它标成 `cancelled`——
            // 少了这一支，取消看起来就只是又一个失败。
            note.value = result.cancelled ? '构建已取消'
                : (result.ok ? '构建成功' : `构建失败（退出码 ${result.code}）`);
        }
        catch (error)
        {
            note.value = `构建没能跑起来：${(error as Error).message}`;
        }
        finally
        {
            building.value = false;
        }
    }

    /**
     * 取消正在跑的构建（#273 长任务）。
     *
     * `runBuild` 原来只能等它跑完、或等满宿主侧超时（5 分钟）——这条给用户一个"停手"的按钮。
     * 它只负责**发出请求**：真正的"停没停"由 `runBuild` 那次 `await` 确认（宿主会把被取消的
     * 结果标成 `cancelled`，于是上面那条 note 会变成"构建已取消"）。
     */
    async function cancelBuild(): Promise<void>
    {
        try
        {
            const result = await callHost<{ cancelled: boolean; script?: string }>('host.build.cancel');

            note.value = result.cancelled ? '已请求取消构建' : '当前没有在跑的构建';
        }
        catch (error)
        {
            note.value = `取消失败：${(error as Error).message}`;
        }
    }

    /**
     * 让宿主**发布**：先跑项目构建，再按启用状态把插件 runtime 端打进 `dist/runtime.js`。
     *
     * 与 `runBuild` 的分工：构建管"项目自己的脚本"，发布管"插件第三端进不进产物"。
     * 发布**会先跑一遍构建**（#277 决策：publish = 项目构建 + 插件打包），所以输出区里也会出现构建日志。
     */
    async function runPublish(): Promise<void>
    {
        publishing.value = true;
        note.value = '';
        output.value = [];

        try
        {
            const result = await callHost<{
                ok: boolean; stage?: string; file: string | null; plugins: string[]; skipped: string[];
                bytes: number; build: { code: number; ok: boolean; output: string[] } | null;
            }>('host.publish.run', {
                // **把编辑器里的开关传下去**（#277「开关参与构建」）：发布读的是项目/静态根的
                // 配置，而用户真实的开关在浏览器这边——不传下去，"关掉插件"对产物没有影响。
                enabledPlugins: getEnabledPlugins().map((manifest) => manifest.id),
            });

            // 构建阶段的输出先铺上——构建失败时，它就是"为什么没发布"的答案
            if (result.build?.output?.length) output.value = result.build.output;

            if (!result.ok)
            {
                // **失败如实**：说清是哪一步失败、退出码多少
                note.value = result.stage === 'build'
                    ? `发布中止：项目构建失败（退出码 ${result.build?.code}）`
                    : '发布失败';
                return;
            }

            output.value = [
                ...output.value,
                `产物：${result.file}（${result.bytes} 字节）`,
                `已打入插件：${result.plugins.join(', ') || '（无）'}`,
                `未启用（未进产物）：${result.skipped.join(', ') || '（无）'}`,
            ];
            note.value = '发布成功';
        }
        catch (error)
        {
            note.value = `发布没能跑起来：${(error as Error).message}`;
        }
        finally
        {
            publishing.value = false;
        }
    }

    // 构建输出是**逐行推来**的（WebSocket 事件）：不订阅就只能等最后一次返回
    const unsubscribeBuild = subscribeBridgeEvent('build/output', (payload) =>
    {
        const line = (payload as { line?: string } | null)?.line;

        if (typeof line === 'string') output.value = [...output.value, line];
    });

    // 项目文件变化也是**宿主推来**的（`workspace/changed`）：当前目录受影响就自动刷新。
    //
    // 这就是"事件通道的**真实消费方**"——不订阅，通道再通也没人用它。
    // 而这个面板正是最自然的消费方：它显示的就是项目目录，别人改了文件它没反应才奇怪。
    const unsubscribeChanged = subscribeBridgeEvent('workspace/changed', (payload) =>
    {
        const path = (payload as { path?: string } | null)?.path;

        if (typeof path !== 'string' || !isOpen.value) return;

        const dir = currentDir.value === '.' ? '' : `${currentDir.value}/`;

        // 当前目录自己变了、或变的正是它里面的东西 → 重读列表
        if (dir === '' || path === currentDir.value || path.startsWith(dir)) void refreshEntries();
    });

    onUnmounted(() =>
    {
        unsubscribeBuild();
        unsubscribeChanged();
    });

    /**
     * 在当前目录新建一个空文件。
     *
     * 这是**界面第一次往项目里写东西**：路径按"相对当前目录"拼（不自己造 `..`，
     * 越界由宿主挡），写完直接重读列表——顺带也会收到 `workspace/changed`（同一件事两条路都通，
     * 所以这里"主动重读"不是多余的：它让**点完按钮就有反应**，不必等推送绕一圈）。
     */
    async function createFile(): Promise<void>
    {
        const name = newFileName.value.trim();

        if (name.length === 0) { note.value = '文件名不能为空'; return; }

        const path = currentDir.value === '.' ? name : `${currentDir.value}/${name}`;

        try
        {
            await callHost('host.workspace.writeText', { path, text: '' });
            newFileName.value = '';
            note.value = `已新建 ${path}`;
            await refreshEntries();
        }
        catch (error)
        {
            note.value = `新建失败：${(error as Error).message}`;
        }
    }

    return {
        root, isOpen, entries, currentDir, breadcrumbs, output, loading, building, publishing, note, newFileName,
        refresh, openDir, runBuild, cancelBuild, runPublish, createFile,
    };
}
