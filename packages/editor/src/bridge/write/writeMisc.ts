import { serialization } from 'feng3d';
import type { EditorRS } from '../../assets/EditorRS';
import type { EditorAsset } from '../../ui/assets/EditorAsset';
import { useEditorStore } from '../../vue-app/stores/editorStore';
import { clearEditorLogs } from '../../utils/editorLog';
import { requireSceneRoot } from '../EditorBridge';
import { countTree } from '../read/readCore';
import { selectionSet } from '../read/editorRead';
import { requireWriteEnabled, resetHistory } from './writeCore';

/**
 * 把当前场景写回场景文件（持久化）。
 *
 * P2 之前所有写操作只改页面内存，刷新即丢。这里补上显式落盘，复用编辑器自身
 * beforeunload 保存的同一条链路（`serialization.serialize` + `editorRS.fs.writeObject`）。
 */
export async function sceneSave(params: Record<string, unknown>, rs: EditorRS): Promise<unknown>
{
    requireWriteEnabled();

    const path = params.path === undefined ? 'scenes/default.scene.json' : String(params.path);
    const root = requireSceneRoot();
    const data = serialization.serialize(root);
    // **必须等待写入完成**（issue #938）：桥接调用**有返回值**，不 await 就等于把失败变成不可见——
    // 实测无宿主环境下 `writeObject` 抛「宿主方法未接入」，而调用方拿到的仍是 `{ saved: ... }`，
    // 于是它据此认为"已落盘、可以安全丢弃内存改动"。beforeunload 那条链路可以不等待（页面都要关了），
    // 这里不行。
    await rs.fs.writeObject(path, data);

    return { saved: path, childCount: (root.children ?? []).length };
}

/**
 * 清空编辑器日志。
 *
 * 用途：AI 复现问题前先清空，再复现一次，这样 `log.tail` 读到的就只有本次产生的日志。
 * 归入写通道：日志是用户正在看的诊断信息，清空属于有副作用的操作。
 */
export function logClear(): unknown
{
    requireWriteEnabled();

    return { cleared: clearEditorLogs() };
}

/**
 * 重新从存储加载场景（**不刷新页面**）。
 *
 * 与浏览器刷新的区别：只换场景，页面本身（视图、面板、脚本、日志缓冲）都保留——
 * "我只想把场景恢复到存储状态"用不着把整个页面重来一遍。
 *
 * 会**清空撤销栈**并清除选中：加载之后，旧命令引用的对象已经不在场景里了，
 * 留着它们只会让撤销作用到幽灵对象上。想保住当前改动的话，先 `scene.save` 再重载。
 *
 * @param params.path 场景文件，默认 `default.scene.json`
 * @param params.keepHistory 传 `true` 保留撤销栈（默认 false）
 */
export async function editorReloadScene(params: Record<string, unknown>, assetManager: EditorAsset): Promise<unknown>
{
    requireWriteEnabled();

    const path = params.path === undefined ? 'scenes/default.scene.json' : String(params.path);

    // 读不到就**保持当前场景不动**并明确报错（issue #938）。
    // 曾经这里退回默认空场景：在"宿主没接、文件根本读不到"的环境里，那等于把用户正在编辑的
    // 东西**静默清空**——比失败本身危险得多。启动时的兜底由 Editor.ts 负责，运行期重载不替用户做这个决定。
    let scene;
    try
    {
        scene = await assetManager.readScene(path);
    }
    catch (error)
    {
        throw new Error(`重载失败：读不到场景文件 ${path}（${error instanceof Error ? error.message : String(error)}）。当前场景未改动。`);
    }
    if (!scene) throw new Error(`重载失败：${path} 不存在或内容无效。当前场景未改动。`);

    useEditorStore().gameScene = scene;

    const undoCleared = params.keepHistory === true ? 0 : resetHistory();
    selectionSet({ objectIds: [] });

    const root = requireSceneRoot();
    const children = root.children ?? [];

    return {
        path,
        reloaded: true,
        sceneName: root.name ?? null,
        objectCount: countTree(root).objects,
        childCount: children.length,
        children: children.map((child) => child.name ?? '(未命名)'),
        undoCleared,
        hint: '内存里的场景已与存储一致；要保住改动请先 scene.save 再重载',
    };
}
