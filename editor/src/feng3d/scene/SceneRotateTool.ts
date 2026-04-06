import { RegisterComponent, Component, GameObject, loader, serialization, ticker, mathUtil, Vector3, Rectangle, windowEventProxy, shortcut, View, IEvent, Matrix4x4, globalEmitter, Quaternion } from 'feng3d';
import * as TWEEN from '@tweenjs/tween.js';
import { EditorData } from '../../global/EditorData';
import { sceneControlConfig } from '../../shortcut/Editorshortcut';
import { menu } from '../../ui/components/Menu';
import { EditorView } from '../EditorView';

declare global
{
    export interface MixinsComponentMap
    {
        SceneRotateTool: SceneRotateTool
    }
}

@RegisterComponent()
export class SceneRotateTool extends Component
{
    get view() { return this._view; }
    set view(v) { this._view = v; this.load(); }
    private _view: EditorView;
    
    /**
     * 图层容器（可选，如果不提供则使用全局的 SceneRotateToolLayer）
     */
    layerContainer?: HTMLElement;

    private arrowsX: GameObject;
    private arrowsNX: GameObject;
    private arrowsY: GameObject;
    private arrowsNY: GameObject;
    private arrowsZ: GameObject;
    private arrowsNZ: GameObject;

    init()
    {
        super.init();

        this.load();
    }

    private isload = false;

    private async load()
    {
        if (!this.view) return;
        if (this.isload) return;
        this.isload = true;

        const content = await loader.loadText(EditorData.editorData.getEditorAssetPath('gameobjects/SceneRotateTool.gameobject.json'));
        const rotationToolModel: GameObject = serialization.deserialize(JSON.parse(content));
        this.onLoaded(rotationToolModel);
    }

    private onLoaded(rotationToolModel: GameObject)
    {
        const arrowsX = this.arrowsX = rotationToolModel.find('arrowsX');
        const arrowsY = this.arrowsY = rotationToolModel.find('arrowsY');
        const arrowsZ = this.arrowsZ = rotationToolModel.find('arrowsZ');
        const arrowsNX = this.arrowsNX = rotationToolModel.find('arrowsNX');
        const arrowsNY = this.arrowsNY = rotationToolModel.find('arrowsNY');
        const arrowsNZ = this.arrowsNZ = rotationToolModel.find('arrowsNZ');
        const planeX = rotationToolModel.find('planeX');
        const planeY = rotationToolModel.find('planeY');
        const planeZ = rotationToolModel.find('planeZ');
        const planeNX = rotationToolModel.find('planeNX');
        const planeNY = rotationToolModel.find('planeNY');
        const planeNZ = rotationToolModel.find('planeNZ');

        const { toolView, canvas } = this.newView();

        toolView.root.addChild(rotationToolModel);
        rotationToolModel.transform.sx = 0.01;
        rotationToolModel.transform.sy = 0.01;
        rotationToolModel.transform.sz = 0.01;
        rotationToolModel.transform.z = 0.80;

        const arr = [arrowsX, arrowsY, arrowsZ, arrowsNX, arrowsNY, arrowsNZ, planeX, planeY, planeZ, planeNX, planeNY, planeNZ];
        arr.forEach((element) =>
        {
            element.on('click', this.onclick, this);
        });
        const arrowsArr = [arrowsX, arrowsY, arrowsZ, arrowsNX, arrowsNY, arrowsNZ];

        ticker.onframe(() =>
        {

            const rotation = this.view.camera.transform.localToWorldMatrix.clone().invert().toTRS()[1];
            rotationToolModel.transform.rotation = rotation;

            // 隐藏角度
            const visibleAngle = Math.cos(15 * mathUtil.DEG2RAD);
            // 隐藏正面箭头
            arrowsArr.forEach((element) =>
            {
                if (Math.abs(element.transform.localToWorldMatrix.getAxisY().dot(Vector3.Z_AXIS)) < visibleAngle)
                { element.activeSelf = true; }
                else
                { element.activeSelf = false; }
            });

            //
            const canvasRect = canvas.getBoundingClientRect();
            const bound = new Rectangle(canvasRect.left, canvasRect.top, canvasRect.width, canvasRect.height);
            if (bound.contains(windowEventProxy.clientX, windowEventProxy.clientY))
            {
                shortcut.activityState('mouseInSceneRotateTool');
            }
            else
            {
                shortcut.deactivityState('mouseInSceneRotateTool');
            }
        });

        windowEventProxy.on('mouseup', (event) =>
        {
            const e = event.data;
            const canvasRect = canvas.getBoundingClientRect();
            const bound = new Rectangle(canvasRect.left, canvasRect.top, canvasRect.width, canvasRect.height);
            if (!bound.contains(windowEventProxy.clientX, windowEventProxy.clientY))
            { return; }

            // 右键点击菜单
            if (e.button === 2)
            {
                menu.popup(
                    [
                        {
                            label: '右视图', click: () =>
                            {
                                this.clickItem(arrowsX);
                            }
                        },
                        {
                            label: '顶视图', click: () =>
                            {
                                this.clickItem(arrowsY);
                            }
                        },
                        {
                            label: '前视图', click: () =>
                            {
                                this.clickItem(arrowsZ);
                            }
                        },
                        {
                            label: '左视图', click: () =>
                            {
                                this.clickItem(arrowsNX);
                            }
                        },
                        {
                            label: '底视图', click: () =>
                            {
                                this.clickItem(arrowsNY);
                            }
                        },
                        {
                            label: '后视图', click: () =>
                            {
                                this.clickItem(arrowsNZ);
                            }
                        },
                    ]);
            }
        });
    }

    private newView()
    {
        const canvas = document.createElement('canvas');
        // 使用传入的容器，如果没有则回退到全局元素
        const container = this.layerContainer || document.getElementById('SceneRotateToolLayer');
        if (!container) {
            console.error('SceneRotateTool: No container found');
            throw new Error('SceneRotateTool: No container found');
        }
        container.appendChild(canvas);
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '10';
        canvas.style.pointerEvents = 'auto';
        canvas.width = 80;
        canvas.height = 80;
        //
        const toolView = new View(canvas);
        toolView.scene.background.a = 0.0;
        toolView.scene.ambientColor.setTo(0.2, 0.2, 0.2);
        toolView.root.addChild(GameObject.createPrimitive('Point Light'));

        return { toolView, canvas };
    }

    private onclick(e: IEvent<any>)
    {
        this.clickItem(e.currentTarget as any);
    }

    private clickItem(item: GameObject)
    {
        const frontView = new Vector3(0, 0, 0);// 前视图
        const backView = new Vector3(0, 180, 0);// 后视图
        const rightView = new Vector3(0, 90, 0);// 右视图
        const leftView = new Vector3(0, -90, 0);// 左视图
        const topView = new Vector3(-90, 0, 0);// 顶视图
        const bottomView = new Vector3(90, 0, 0);// 底视图

        let rotation: Vector3;
        switch (item)
        {
            case this.arrowsX:
                rotation = rightView;
                break;
            case this.arrowsNX:
                rotation = leftView;
                break;
            case this.arrowsY:
                rotation = topView;
                break;
            case this.arrowsNY:
                rotation = bottomView;
                break;
            case this.arrowsZ:
                rotation = backView;
                break;
            case this.arrowsNZ:
                rotation = frontView;
                break;
        }
        if (rotation)
        {
            const cameraTargetMatrix = Matrix4x4.fromRotation(rotation.x, rotation.y, rotation.z);
            cameraTargetMatrix.invert();
            const result = cameraTargetMatrix.toTRS()[1];

            globalEmitter.emit('editorCameraRotate', result);

            this.onEditorCameraRotate(result);
        }
    }

    private onEditorCameraRotate(resultRotation: Vector3)
    {
        const camera = this.view.camera;
        const forward = camera.transform.matrix.getAxisZ();
        let lookDistance: number;
        if (EditorData.editorData.selectedGameObjects.length > 0)
        {
            // 计算观察距离
            const selectedObj = EditorData.editorData.selectedGameObjects[0];
            const lookray = selectedObj.transform.worldPosition.subTo(camera.transform.worldPosition);
            lookDistance = Math.max(0, forward.dot(lookray));
        }
        else
        {
            lookDistance = sceneControlConfig.lookDistance;
        }
        // 旋转中心
        const rotateCenter = camera.transform.worldPosition.addTo(forward.scaleNumber(lookDistance));
        // 计算目标四元素旋转
        const targetQuat = new Quaternion();
        resultRotation.scaleNumber(mathUtil.DEG2RAD);
        targetQuat.fromEuler(resultRotation.x, resultRotation.y, resultRotation.z);
        //
        const sourceQuat = new Quaternion();
        sourceQuat.fromEuler(camera.transform.rx * mathUtil.DEG2RAD, camera.transform.ry * mathUtil.DEG2RAD, camera.transform.rz * mathUtil.DEG2RAD);
        const rate = { rate: 0.0 };
        const tween = new TWEEN.Tween(rate)
            .to({ rate: 1 }, 300)
            .easing(TWEEN.Easing.Sinusoidal.In)
            .onUpdate(() =>
            {
                const cameraQuat = sourceQuat.slerpTo(targetQuat, rate.rate);
                camera.transform.orientation = cameraQuat;
                //
                const translation = camera.transform.matrix.getAxisZ();
                translation.normalize(-lookDistance);
                camera.transform.position = rotateCenter.addTo(translation);
            });

        // 不传时间参数，让 TWEEN 使用默认时间（当前时间）
        // 全局 TWEEN 更新循环会自动处理更新，无需手动调用
        tween.start();
    }
}
