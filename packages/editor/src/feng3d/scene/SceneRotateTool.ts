import { RegisterComponent, Component, Object3D, loader, serialization, ticker, mathUtil, Vector3, Rectangle, windowEventProxy, shortcut, View, IEvent, Matrix4x4, globalEmitter, Quaternion, reactive, logic } from 'feng3d';
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

    private arrowsX: Object3D;
    private arrowsNX: Object3D;
    private arrowsY: Object3D;
    private arrowsNY: Object3D;
    private arrowsZ: Object3D;
    private arrowsNZ: Object3D;

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

        const content = await loader.loadText(EditorData.editorData.getEditorAssetPath('object3Ds/SceneRotateTool.object3D.json'));
        const rotationToolModel: Object3D = serialization.deserialize(JSON.parse(content));
        this.onLoaded(rotationToolModel);
    }

    private onLoaded(rotationToolModel: Object3D)
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
        {
            const rs = reactive(rotationToolModel.transform.scale);
            rs.x = 0.01; rs.y = 0.01; rs.z = 0.01;
            const rp = reactive(rotationToolModel.transform.position);
            rp.z = 0.80;
        }

        const arr = [arrowsX, arrowsY, arrowsZ, arrowsNX, arrowsNY, arrowsNZ, planeX, planeY, planeZ, planeNX, planeNY, planeNZ];
        arr.forEach((element) =>
        {
            element.on('click', this.onclick, this);
        });
        const arrowsArr = [arrowsX, arrowsY, arrowsZ, arrowsNX, arrowsNY, arrowsNZ];

        ticker.onframe(() =>
        {

            const rotation = logic(this.view.camera.transform).local2world.value.clone().invert().toTRS()[1];
            {
                const r = reactive(rotationToolModel.transform.rotation);
                r.x = rotation.x; r.y = rotation.y; r.z = rotation.z;
            }

            // 隐藏角度
            const visibleAngle = Math.cos(15 * mathUtil.DEG2RAD);
            // 隐藏正面箭头
            arrowsArr.forEach((element) =>
            {
                if (Math.abs(logic(element.transform).local2world.value.getAxisY().dot(Vector3.Z_AXIS)) < visibleAngle)
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
        toolView.root.addChild(Object3D.createPrimitive('Point Light'));

        return { toolView, canvas };
    }

    private onclick(e: IEvent<any>)
    {
        this.clickItem(e.currentTarget as any);
    }

    private clickItem(item: Object3D)
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
        const forward = logic(camera.transform).matrix.value.getAxisZ();
        let lookDistance: number;
        if (EditorData.editorData.selectedObject3Ds.length > 0)
        {
            // 计算观察距离
            const selectedObj = EditorData.editorData.selectedObject3Ds[0];
            const lookray = logic(selectedObj.transform).worldPosition.value.subTo(logic(camera.transform).worldPosition.value);
            lookDistance = Math.max(0, forward.dot(lookray));
        }
        else
        {
            lookDistance = sceneControlConfig.lookDistance;
        }
        // 旋转中心
        const rotateCenter = logic(camera.transform).worldPosition.value.addTo(forward.scaleNumber(lookDistance));
        // 计算目标四元素旋转
        const targetQuat = new Quaternion();
        resultRotation.scaleNumber(mathUtil.DEG2RAD);
        targetQuat.fromEuler(resultRotation.x, resultRotation.y, resultRotation.z);
        //
        const sourceQuat = new Quaternion();
        sourceQuat.fromEuler(camera.transform.rotation.x * mathUtil.DEG2RAD, camera.transform.rotation.y * mathUtil.DEG2RAD, camera.transform.rotation.z * mathUtil.DEG2RAD);
        const rate = { rate: 0.0 };
        const tween = new TWEEN.Tween(rate)
            .to({ rate: 1 }, 300)
            .easing(TWEEN.Easing.Sinusoidal.In)
            .onUpdate(() =>
            {
                const cameraQuat = sourceQuat.slerpTo(targetQuat, rate.rate);
                // 注：orientation 为计算属性，通过 setMatrix 写回本地 rotation
                const m = logic(camera.transform).matrix.value.clone();
                m.fromQuaternion(cameraQuat);
                logic(camera.transform).setMatrix(m);
                //
                const translation = logic(camera.transform).matrix.value.getAxisZ();
                translation.normalize(-lookDistance);
                const newPos = rotateCenter.addTo(translation);
                const rp = reactive(camera.transform.position);
                rp.x = newPos.x; rp.y = newPos.y; rp.z = newPos.z;
            });

        // 不传时间参数，让 TWEEN 使用默认时间（当前时间）
        // 全局 TWEEN 更新循环会自动处理更新，无需手动调用
        tween.start();
    }
}
