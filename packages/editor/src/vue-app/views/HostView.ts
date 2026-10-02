import { computed, onUnmounted, ref } from 'vue';
import { callHost } from '../../bridge/hostCall';
import { subscribeBridgeEvent } from '../../bridge/bridgeSocket';

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
    const note = ref('');

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
            const result = await callHost<{ code: number; ok: boolean; output: string[] }>('host.build.run', { script: 'build' });

            output.value = result.output ?? [];
            // **失败如实**：非 0 退出码直接说清楚（不是"构建完成"了事）
            note.value = result.ok ? '构建成功' : `构建失败（退出码 ${result.code}）`;
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

    return {
        root, isOpen, entries, currentDir, breadcrumbs, output, loading, building, note,
        refresh, openDir, runBuild,
    };
}
