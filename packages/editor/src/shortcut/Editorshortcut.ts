import { shortcut, serialization } from 'feng3d';
import type { Object3D } from 'feng3d';
import { nativeAPI } from '../assets/NativeRequire';
import { shortcutConfig } from '../configs/ShortcutConfig';
import { EditorData, MRSToolType } from '../global/EditorData';
import { AssetNode } from '../ui/assets/AssetNode';

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
            if (element instanceof Object3D)
            {
                element.remove();
            }
            else if (element instanceof AssetNode)
            {
                element.delete();
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
        const objects = EditorData.editorData.selectedObjects.filter((v) => v instanceof Object3D);
        EditorData.editorData.copyObjects = objects;
    }

    private onPaste()
    {
        const undoSelectedObjects = EditorData.editorData.selectedObjects;
        //
        const objects: Object3D[] = EditorData.editorData.copyObjects.filter((v) => v instanceof Object3D);
        if (objects.length === 0) return;
        const parent = objects[0].parent;
        const newObject3Ds = objects.map((v) => serialization.clone(v));
        newObject3Ds.forEach((v) =>
        {
            parent.addChild(v);
        });
        EditorData.editorData.selectMultiObject(newObject3Ds, false);

        // undo
        EditorData.editorData.undoList.push(() =>
        {
            newObject3Ds.forEach((v) =>
            {
                v.remove();
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
