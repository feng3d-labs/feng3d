import { serialization } from 'feng3d';
import { editorRS } from '../../assets/EditorRS';
import { editorAsset } from '../../ui/assets/EditorAsset';
import { EditorData } from '../../global/EditorData';
import { createDefaultSceneComponent } from '../../utils/createDefaultScene';
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
export function sceneSave(params: Record<string, unknown>): unknown
{
    requireWriteEnabled();

    const path = params.path === undefined ? 'default.scene.json' : String(params.path);
    const root = requireSceneRoot();
    const data = serialization.serialize(root);
    // writeObject 是异步的；与 Editor.ts 的 beforeunload 保存保持一致，不阻塞等待
    void editorRS.fs.writeObject(path, data);

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
export async function editorReloadScene(params: Record<string, unknown>): Promise<unknown>
{
    requireWriteEnabled();

    const path = params.path === undefined ? 'default.scene.json' : String(params.path);
    const scene = await editorAsset.readScene(path);
    // 读不到或反序列化失败时退回默认空场景——与 Editor.ts 启动时的处理一致，
    // 保证 gameScene 一定非空（否则层级面板会显示 No Data）
    const fallback = !scene;
    EditorData.editorData.gameScene = scene ?? createDefaultSceneComponent();

    const undoCleared = params.keepHistory === true ? 0 : resetHistory();
    selectionSet({ objectIds: [] });

    const root = requireSceneRoot();
    const children = root.children ?? [];

    return {
        path,
        reloaded: true,
        fallback,
        // 退回默认空场景比"悄悄给你一个空场景"更需要被说出来
        ...(fallback ? { warning: `读不到或反序列化失败：${path}，已退回默认空场景` } : {}),
        sceneName: root.name ?? null,
        objectCount: countTree(root).objects,
        childCount: children.length,
        children: children.map((child) => child.name ?? '(未命名)'),
        undoCleared,
        hint: '内存里的场景已与存储一致；要保住改动请先 scene.save 再重载',
    };
}
