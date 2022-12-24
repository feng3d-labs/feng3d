import { Color3 } from '../../math/Color3';
import { oav } from '../../objectview/ObjectView';
import { serialization } from '../../serialization/Serialization';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Camera } from '../cameras/Camera';
import { Behaviour } from '../component/Behaviour';
import { BillboardComponent } from '../component/BillboardComponent';
import { HideFlags } from '../core/HideFlags';
import { Node3D } from '../core/Node3D';
import { Renderer } from '../core/Renderer';
import { TextureMaterial } from '../materials/texture/TextureMaterial';
import { PlaneGeometry } from '../primitives/PlaneGeometry';
import { FrameBufferObject } from '../render/FrameBufferObject';
import { Scene } from '../scene/Scene';
import { RenderTargetTexture2D } from '../textures/RenderTargetTexture2D';
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
    @SerializeProperty()
    lightType: LightType;

    /**
     * 颜色
     */
    @oav()
    @SerializeProperty()
    color = new Color3();

    /**
     * 光照强度
     */
    @oav()
    @SerializeProperty()
    intensity = 1;

    /**
     * 阴影类型
     */
    @oav({ component: 'OAVEnum', componentParam: { enumClass: ShadowType } })
    @SerializeProperty()
    shadowType = ShadowType.No_Shadows;

    /**
     * 光源位置
     */
    get position()
    {
        return this.entity.worldPosition;
    }

    /**
     * 光照方向
     */
    get direction()
    {
        return this.entity.globalMatrix.getAxisZ();
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

    get shadowMap(): RenderTargetTexture2D
    {
        return this.frameBufferObject.texture;
    }

    /**
     * 帧缓冲对象，用于处理光照阴影贴图渲染
     */
    frameBufferObject = new FrameBufferObject();

    @oav({ tooltip: '是否调试阴影图' })
    debugShadowMap = false;

    private debugShadowMapObject: Node3D;

    constructor()
    {
        super();
        this.shadowCamera = serialization.setValue(new Node3D(), { name: 'LightShadowCamera' }).addComponent(Camera);
    }

    updateDebugShadowMap(scene: Scene, viewCamera: Camera)
    {
        let object3D = this.debugShadowMapObject;
        if (!object3D)
        {
            object3D = this.debugShadowMapObject = Node3D.createPrimitive('Plane', { name: 'debugShadowMapObject' });
            object3D.hideFlags = HideFlags.Hide | HideFlags.DontSave;
            object3D.mouseEnabled = false;
            object3D.addComponent(BillboardComponent);

            // 材质
            const model = object3D.getComponent(Renderer);
            model.geometry = serialization.setValue(new PlaneGeometry(), { width: this.lightType === LightType.Point ? 1 : 0.5, height: 0.5, segmentsW: 1, segmentsH: 1, yUp: false });
            const textureMaterial = model.material = new TextureMaterial().init({ uniforms: { s_texture: this.frameBufferObject.texture as any } });
            //
            // textureMaterial.uniforms.s_texture.url = 'Assets/pz.jpg';
            // textureMaterial.uniforms.u_color.setTo(1.0, 0.0, 0.0, 1.0);
            textureMaterial.renderParams.enableBlend = true;
            textureMaterial.renderParams.sfactor = 'ONE';
            textureMaterial.renderParams.dfactor = 'ZERO';
        }

        const depth = viewCamera.lens.near * 2;
        object3D.position = viewCamera.entity.worldPosition.addTo(viewCamera.entity.globalMatrix.getAxisZ().scaleNumberTo(depth));
        const billboardComponent = object3D.getComponent(BillboardComponent);
        billboardComponent.camera = viewCamera;

        if (this.debugShadowMap)
        {
            scene.entity.addChild(object3D);
        }
        else
        {
            object3D.remove();
        }
    }
}
