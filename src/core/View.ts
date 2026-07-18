import { batchRun, Computed, computed, logic, reactive } from '@feng3d/reactivity';
import { CanvasContext, CanvasTexture, Color, PassEncoder, RenderPass, RenderPassDescriptor, Submit, Texture, TextureSize, TextureView } from '@feng3d/webgpu';
import { createAudioListener } from "../audio/AudioListener";
import { Camera, createCamera } from "../cameras/Camera";
import { getComponentsInChildren } from '../component/componentQuery';
import { createDirectionalLight } from "../light/DirectionalLight";
import { ShadowType } from '../light/shadow/ShadowType';
import { forwardRenderer } from '../render/renderer/ForwardRenderer';
import { outlineRenderer } from '../render/renderer/OutlineRenderer';
import { shadowRenderer } from '../render/renderer/ShadowRenderer';
import { wireframeRenderer } from '../render/renderer/WireframeRenderer';
import { createScene, Scene } from "../scene/Scene";
import { skyboxRenderObject } from '../skybox/SkyBox';
import { createObject3D } from './createObject3D';
import { createPrimitive, Object3D } from './Object3D';

/**
 * 视图
 */
export class View
{
    //
    readonly canvas: HTMLCanvasElement;

    /**
     * 摄像机
     */
    get camera()
    {
        if (!this._camera)
        {
            const cameras = getComponentsInChildren(logic(this.scene).entity, 'Camera');
            if (cameras.length === 0)
            {
                const defaultCamObj = Object.assign(createObject3D(), { name: 'defaultCamera' });
                logic(defaultCamObj);
                const cam = createCamera();
                reactive(defaultCamObj).components.push(cam);
                this._camera = cam;
                reactive(logic(this.scene).entity).children.push(logic(cam).entity);
            }
            else
            {
                this._camera = cameras[0] as any;
            }
        }

        return this._camera;
    }
    set camera(v)
    {
        this._camera = v;
    }
    private _camera: Camera;

    /**
     * 3d场景
     */
    scene: Scene;
    /**
     * 根结点
     */
    get root()
    {
        return logic(this.scene).entity;
    }

    /**
     * 构建3D视图
     * @param canvas       画布
     * @param sceneObject3D  场景根 Object3D（自动触发 logic 初始化，自动查找 Scene 与 Camera 组件）
     */
    constructor(canvas: HTMLCanvasElement, sceneObject3D?: Object3D)
    {
        reactive(this as { canvas: HTMLCanvasElement }).canvas = canvas;

        if (!sceneObject3D)
        {
            sceneObject3D = Object.assign(createObject3D(), { name: 'scene' });
            const sceneComp = createScene();
            reactive(sceneObject3D).components.push(sceneComp);
        }

        // 触发 logic：注册 entityLogic（组件自动初始化）与 containerLogic（子级自动同步 parent）
        logic(sceneObject3D);

        // 从 sceneObject3D 中自动获取 Scene 与 Camera 组件
        const scene = sceneObject3D.components.find(c => c.__type__ === 'Scene') as Scene;
        const camera = getComponentsInChildren<Camera>(sceneObject3D, 'Camera')[0];

        this.scene = scene;
        this.camera = camera;

        //

        /**
         * 把 _frameVersion.v 包装成 Computed<number>，方便传给 ForwardRenderer.draw。
         *
         * draw 的 computed 内部读 `.value` 建立依赖，本字段 `++` 时失效级联。
         */
        const _frameVersionComputed = computed(() => reactive(this._frameVersion).v);
        //

        const renderPass: RenderPass = { descriptor: null, renderPassObjects: [] }
        const r_this = reactive(this);

        const _skyboxObjects = skyboxRenderObject(this);

        let descriptor: RenderPassDescriptor;
        let view: TextureView;
        let depthStencilView: TextureView;

        const clearValue = computed(() =>
        {
            const bg = r_this.scene.background;
            return [bg.r, bg.g, bg.b, bg.a] as Color;
        });

        const _canvasRenderPassDescriptorComputed = computed(() =>
        {
            if (!descriptor)
            {
                descriptor = {
                    colorAttachments: [
                        {
                            view: view = { texture: null },
                            clearValue: [0, 0, 0, 1],
                        },
                    ],
                    depthStencilAttachment: {
                        view: depthStencilView = { texture: null },
                        depthClearValue: 1,
                        depthLoadOp: 'clear',
                        depthStoreOp: 'store',
                    },
                }
            }

            //
            reactive(depthStencilView).texture = _depthTextureComputed.value;
            reactive(view).texture = _canvasTexture.value;
            reactive(descriptor.colorAttachments[0]).clearValue = clearValue.value;

            return descriptor;
        });

        //
        const _canvasRenderPassComputed = computed(() =>
        {
            r_this.camera;
            r_this.scene;

            //
            reactive(renderPass).descriptor = _canvasRenderPassDescriptorComputed.value;

            // 接入各 renderer 响应式链：
            // 每帧 _frameVersion++ → 各 draw computed 失效 → 返回新 RenderObject[]
            // → 合并后整体替换 renderPassObjects 引用 → 触发 WGPURenderPass._computedCommands 失效重算
            //
            // 顺序：skybox（背景）→ forward（主场景）→ outline → wireframe。
            // skybox 在最前作为背景画，forward 物体覆盖其上；
            // outline / wireframe 当前为空实现（TODO），未来接入后画在最上层。
            const skyboxObject = _skyboxObjects.renderObject;
            const forwardObjects = forwardRenderer.draw(this.scene, this.camera, _frameVersionComputed).value;
            const outlineObjects = outlineRenderer.draw(this.scene, this.camera, _frameVersionComputed).value;
            const wireframeObjects = wireframeRenderer.draw(this.scene, this.camera, _frameVersionComputed).value;
            reactive(renderPass).renderPassObjects = [
                ...(skyboxObject ? [skyboxObject] : []),
                ...forwardObjects,
                ...outlineObjects,
                ...wireframeObjects,
            ];

            return renderPass;
        });

        let passEncoders: PassEncoder[];
        const submit: Submit = { commandEncoders: [{ passEncoders: passEncoders = [] }] }

        this._submitComputed = computed(() =>
        {
            // 接入 ShadowRenderer 响应式链：
            // 每帧 _frameVersion++ → shadowRenderer.draw computed 失效 → 返回新 RenderPass[]
            //
            // 顺序：阴影 Pass 在前（写 shadowMap / shadowDepthTexture），主 Pass 在后（采样）。
            // 阴影 Pass 必须先执行，否则主 Pass 采样到上一帧的阴影图（滞后一帧）。
            const shadowPasses = shadowRenderer.draw(this.scene, this.camera, _frameVersionComputed).value;
            for (let i = 0; i < shadowPasses.length; i++)
            {
                passEncoders[i] = shadowPasses[i];
            }
            // 主 Pass 固定排在阴影 Pass 之后
            passEncoders[shadowPasses.length] = _canvasRenderPassComputed.value;
            // 截断多余元素（光源减少时旧 Pass 不再执行）
            passEncoders.length = shadowPasses.length + 1;

            return submit;
        });

        // 
        let size: TextureSize;
        let depthTexture: Texture = { descriptor: { size: size = [1, 1], format: 'depth24plus' } };

        const _depthTextureComputed = computed(() =>
        {
            if (!depthTexture)
            {
                depthTexture = { descriptor: { size: size = [1, 1], format: 'depth24plus' } };
            }

            //
            reactive(size)[0] = r_this._canvaSize.width;
            reactive(size)[1] = r_this._canvaSize.height;

            //
            return depthTexture;
        });

        let context: CanvasContext;
        let canvasTexture: CanvasTexture = { context: context = { canvasId: null } };

        const _canvasTexture = computed(() =>
        {
            //
            r_this.canvas;

            reactive(context).canvasId = this.canvas;

            return canvasTexture;
        });
    }

    update(interval?: number)
    {
        this.render(interval);
    }

    /**
     * 绘制场景
     */
    render(interval?: number)
    {
        if (!this.scene) return;

        logic(this.scene).update(interval);

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        reactive(this._canvaSize).width = this.canvas.width || this.canvas.clientWidth || 1;
        reactive(this._canvaSize).height = this.canvas.height || this.canvas.clientHeight || 1;

        // 每帧 ++ 版本号，驱动 ForwardRenderer.draw 的 computed 重算（_Time 等非响应式量靠它接入链路）
        reactive(this._frameVersion).v++;

        if (this.canvas.width * this.canvas.height === 0) return;

        logic(this.camera).lens.aspect = this.canvas.clientWidth / this.canvas.clientHeight;

        reactive(this.scene).camera = this.camera;

        // 所有 renderer（shadow / skybox / forward / outline / wireframe）均由
        // _submitComputed / _canvasRenderPassComputed 内部通过响应式链求值，
        // 不再在 render() 主动调用——每帧 _frameVersion++ 自动级联。

        const submit: Submit = this._submitComputed.value;

        return submit;
    }

    private _submitComputed: Computed<Submit>;

    readonly _canvaSize: { readonly width: number, readonly height: number } = { width: 1, height: 1 };

    /**
     * 帧版本号。
     *
     * 每帧 render() 中 `++v`，作为渲染对象列表 computed 的响应式驱动源：
     * `_Time`（Date.now）等非响应式量通过此版本号接入响应式链。
     * 与 `_canvaSize` 同范式（readonly 字段，内部属性可变，通过 reactive 代理写入）。
     */
    readonly _frameVersion: { readonly v: number } = { v: 0 };

    static createNewScene()
    {
        const sceneObj = Object.assign(createObject3D(), { name: 'Untitled' });
        logic(sceneObj);
        const scene = createScene();
        reactive(sceneObj).components.push(scene);
        reactive(scene).background = { __type__: 'Color4', r: 0.2784, g: 0.2784, b: 0.2784, a: 1 };
        reactive(scene).ambientColor = { __type__: 'Color4', r: 0.4, g: 0.4, b: 0.4, a: 1 };

        const camera = createPrimitive('Camera', { name: 'Main Camera' });
        const audioListener = createAudioListener();
        reactive(camera).components.push(audioListener);
        {
            const _r_pos = reactive(camera.position);
            batchRun(() => { _r_pos.x = 0; _r_pos.y = 1; _r_pos.z = -10; });
        }
        reactive(logic(scene).entity).children.push(camera);

        const directionalLight = Object.assign(createObject3D(), { name: 'DirectionalLight' });
        logic(directionalLight);
        const dl = createDirectionalLight();
        reactive(directionalLight).components.push(dl);
        reactive(dl).shadowType = ShadowType.Hard_Shadows;
        {
            const _r_rot = reactive(directionalLight.rotation);
            batchRun(() => { _r_rot.x = 50; _r_rot.y = -30; });
        }
        reactive(directionalLight.position).y = 3;
        reactive(logic(scene).entity).children.push(directionalLight);

        return scene;
    }
}

