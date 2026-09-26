import { serialization } from 'feng3d';
import { editorRS } from '../../assets/EditorRS';
import { clearEditorLogs } from '../../utils/editorLog';
import { requireSceneRoot } from '../EditorBridge';
import { requireWriteEnabled } from './writeCore';

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
