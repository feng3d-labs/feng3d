import { shortcut, serialization } from 'feng3d';
import type { Object3D } from 'feng3d';
import { logic, reactive, toRaw } from '@feng3d/reactivity';
import { nativeAPI } from '../assets/NativeRequire';
import { shortcutConfig } from '../configs/ShortcutConfig';
import { EditorData, MRSToolType } from '../global/EditorData';
import { AssetNode } from '../ui/assets/AssetNode';

/**
 * 从父节点的 children 中移除指定 Object3D。
 *
 * 新范式中 `Object3D` 是纯数据接口，旧的 `object3D.remove()` 方法已不存在：
 * 父子关系由 `ContainerLogic` 的 children effect 维护，因此「移除」等价于在父节点上
 * 把该对象从 `children` 数组里剔除。编辑器自身的 class（如 `AssetNode`）仍保留
 * 各自的 `delete()` / `remove()` 方法。
 */
function removeObject3D(object3D: Object3D): void
{
    const parent = logic(object3D).parent;
    if (!parent) return;

    const children = parent.children;
    if (!children || children.length === 0) return;

    const raw = toRaw(object3D);
    const rest = children.filter((child) => toRaw(child) !== raw);
    if (rest.length === children.length) return;

    reactive(parent).children = rest;
}

/**
 * 编辑器快捷键与命令处理。
 *
 * 迁移说明：`EditorData.selectedObjects` 是 `Array<Object3D | AssetNode>` 的联合类型。
 * `Object3D` 已是**纯数据接口**（运行时没有构造器），`element instanceof Object3D`
 * 会抛 `TypeError: Right-hand side of 'instanceof' is not callable`——而删除/复制/粘贴
 * 恰恰是用户高频操作，所以此处改为**反向判别**：是 `AssetNode`（编辑器 class，
 * `instanceof` 合法）走资源逻辑，其余一律按 Object3D 数据处理。
 */
export class Editorshortcut
{
    constructor()
    {
        // 初始化快捷键
        shortcut.addShortCuts(shortcutConfig);

        // 监听命令
        shortcut.on('deleteSeletedObject3D', this.onDeleteSeletedObject3D, this);
        //
        shortcut.on('object3DMoveTool', this.onGameobjectMoveTool, this);
        shortcut.on('object3DRotationTool', this.onGameobjectRotationTool, this);
        shortcut.on('object3DScaleTool', this.onGameobjectScaleTool, this);
        //
        shortcut.on('openDevTools', this.onOpenDevTools, this);
        shortcut.on('refreshWindow', this.onRefreshWindow, this);
        //
        shortcut.on('copy', this.onCopy, this);
        shortcut.on('paste', this.onPaste, this);
        shortcut.on('undo', this.onUndo, this);
    }

    private onGameobjectMoveTool()
    {
        EditorData.editorData.toolType = MRSToolType.MOVE;
    }

    private onGameobjectRotationTool()
    {
        EditorData.editorData.toolType = MRSToolType.ROTATION;
    }

    private onGameobjectScaleTool()
    {
        EditorData.editorData.toolType = MRSToolType.SCALE;
    }

    private onDeleteSeletedObject3D()
    {
        const selectedObject = EditorData.editorData.selectedObjects;

        if (!selectedObject)
        { return; }

        // 删除文件引用计数
        selectedObject.forEach((element) =>
        {
            if (element instanceof AssetNode)
            {
                element.delete();
            }
            else
            {
                removeObject3D(element);
            }
        });
        EditorData.editorData.clearSelectedObjects();
    }

    private onOpenDevTools()
    {
        if (nativeAPI) nativeAPI.openDevTools();
    }

    private onRefreshWindow()
    {
        window.location.reload();
    }

    private onCopy()
    {
        const objects = EditorData.editorData.selectedObjects.filter((v) => !(v instanceof AssetNode)) as Object3D[];
        EditorData.editorData.copyObjects = objects;
    }

    private onPaste()
    {
        const undoSelectedObjects = EditorData.editorData.selectedObjects;
        //
        const objects = EditorData.editorData.copyObjects.filter((v) => v && !(v instanceof AssetNode)) as Object3D[];
        if (objects.length === 0) return;
        const parent = logic(objects[0]).parent;
        if (!parent) return;
        const newObject3Ds = objects.map((v) => serialization.clone(v));
        // 旧 `parent.addChild(v)` → 新范式下等价于向父节点 children 追加，父子关系由 effect 维护
        reactive(parent).children = [...(parent.children ?? []), ...newObject3Ds];
        EditorData.editorData.selectMultiObject(newObject3Ds, false);

        // undo
        EditorData.editorData.undoList.push(() =>
        {
            newObject3Ds.forEach((v) =>
            {
                removeObject3D(v);
            });
            EditorData.editorData.selectMultiObject(undoSelectedObjects, false);
        });
    }

    private onUndo()
    {
        const item = EditorData.editorData.undoList.pop();
        if (item) item();
    }
}

export class SceneControlConfig
{
    mouseWheelMoveStep = 0.004;

    // dynamic
    lookDistance = 3;

    sceneCameraForwardBackwardStep = 0.01;
}
export const sceneControlConfig = new SceneControlConfig();
