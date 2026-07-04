import { Color3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { batchRun, reactive } from '@feng3d/reactivity';
import { serialize, serialization } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { Behaviour } from '../component/Behaviour';
import { BillboardComponent } from '../component/BillboardComponent';
import { Object3D } from '../core/Object3D';
import { HideFlags } from '../core/HideFlags';
import { Renderable } from '../core/Renderable';
import { transformLogic } from '../core/transformLogic';
import { Material } from '../materials/Material';
import { PlaneGeometry } from '../primitives/PlaneGeometry';
import { FrameBufferObject } from '../render/FrameBufferObject';
import { Scene } from '../scene/Scene';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';

/**
 * 灯光
 */
export class Light extends Behaviour
{
    /**
     * 灯光类型
     */
    @serialize
    lightType: LightType;

    /**
     * 颜色
     */
    @oav()
    @serialize
    color = new Color3();

    /**
     * 光照强度
     */
    @oav()
    @serialize
    intensity = 1;

    /**
     * 阴影类型
     */
    @oav({ component: 'OAVEnum', componentParam: { enumClass: ShadowType } })
    @serialize
    shadowType = ShadowType.No_Shadows;

    /**
     * 光源位置
     */
    get position()
    {
        return transformLogic(this.transform).worldPosition.value;
    }

    /**
     * 光照方向
     */
    get direction()
    {
        return transformLogic(this.transform).local2world.value.getAxisZ();
    }

    /**
     * 阴影偏差，用来解决判断是否为阴影时精度问题
     */
    shadowBias = -0.005;

    /**
     * 阴影半径，边缘宽度
     */
    shadowRadius = 1;

    /**
     * 阴影近平面距离
     */
    get shadowCameraNear()
    {
        return this.shadowCamera.lens.near;
    }

    /**
     * 阴影近平面距离
     */
    get shadowCameraFar()
    {
        return this.shadowCamera.lens.far;
    }

    /**
     * 投影摄像机
     */
    shadowCamera: Camera;

    /**
     * 阴影图尺寸
     */
    get shadowMapSize()
    {
        return this.shadowMap.getSize();
    }

    get shadowMap()
    {
        return this.frameBufferObject.texture;
    }

    /**
     * 帧缓冲对象，用于处理光照阴影贴图渲染
     */
    frameBufferObject = new FrameBufferObject();

    @oav({ tooltip: '是否调试阴影图' })
    debugShadowMap = false;

    private debugShadowMapObject: Object3D;

    constructor()
    {
        super();
        this.shadowCamera = serialization.setValue(new Object3D(), { name: 'LightShadowCamera' }).addComponent(Camera);
    }

    updateDebugShadowMap(scene: Scene, viewCamera: Camera)
    {
        let object3D = this.debugShadowMapObject;
        if (!object3D)
        {
            object3D = this.debugShadowMapObject = Object3D.createPrimitive('Plane', { name: 'debugShadowMapObject' });
            object3D.hideFlags = HideFlags.Hide | HideFlags.DontSave;
            object3D.mouseEnabled = false;
            object3D.addComponent(BillboardComponent);

            // 材质
            const model = object3D.getComponent(Renderable);
            model.geometry = serialization.setValue(new PlaneGeometry(), { width: this.lightType === LightType.Point ? 1 : 0.5, height: 0.5, segmentsW: 1, segmentsH: 1, yUp: false });
            const textureMaterial = model.material = serialization.setValue(new Material(), { shaderName: 'texture', uniforms: { s_texture: this.frameBufferObject.texture as any } } as any);
            //
            // textureMaterial.uniforms.s_texture.url = 'Assets/pz.jpg';
            // textureMaterial.uniforms.u_color.setTo(1.0, 0.0, 0.0, 1.0);
            // 开启混合：src=ONE, dst=ZERO
            reactive(textureMaterial.renderPipeline.fragment).targets = [{
                blend: {
                    color: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
                    alpha: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
                },
            }];
        }

        const depth = viewCamera.lens.near * 2;
        const _pos = transformLogic(viewCamera.transform).worldPosition.value.addTo(transformLogic(viewCamera.transform).local2world.value.getAxisZ().scaleNumberTo(depth));
        const _r_pos = reactive(object3D.transform.position);
        batchRun(() =>
        {
            _r_pos.x = _pos.x;
            _r_pos.y = _pos.y;
            _r_pos.z = _pos.z;
        });
        const billboardComponent = object3D.getComponent(BillboardComponent);
        billboardComponent.camera = viewCamera;

        if (this.debugShadowMap)
        {
            scene.object3D.addChild(object3D);
        }
        else
        {
            object3D.remove();
        }
    }
}
