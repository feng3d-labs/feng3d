import { Component3D } from '../../3d/Component3D';
import { Node3D } from '../../3d/Node3D';
import { Scene3D } from '../../3d/Scene3D';
import { Camera } from '../../core/cameras/Camera';
import { HideFlags } from '../../core/core/HideFlags';
import { TextureMaterial } from '../../core/materials/texture/TextureMaterial';
import { PlaneGeometry } from '../../core/primitives/PlaneGeometry';
import { FrameBufferObject } from '../../core/render/FrameBufferObject';
import { RenderTargetTexture2D } from '../../core/textures/RenderTargetTexture2D';
import { Color3 } from '../../math/Color3';
import { oav } from '../../objectview/ObjectView';
import { $set } from '../../serialization/Serialization';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';

/**
 * 灯光
 */
export class Light3D extends Component3D
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
        return this.node3d.worldPosition;
    }

    /**
     * 光照方向
     */
    get direction()
    {
        return this.node3d.globalMatrix.getAxisZ();
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

    init(): void
    {
        this.shadowCamera = $set(new Node3D(), { name: 'LightShadowCamera' }).addComponent('Camera');
    }

    updateDebugShadowMap(scene: Scene3D, viewCamera: Camera)
    {
        let node3d = this.debugShadowMapObject;
        if (!node3d)
        {
            node3d = this.debugShadowMapObject = Node3D.createPrimitive('Plane', { name: 'debugShadowMapObject' });
            node3d.hideFlags = HideFlags.Hide | HideFlags.DontSave;
            node3d.mouseEnabled = false;
            node3d.addComponent('BillboardComponent');

            // 材质
            const model = node3d.getComponent('Mesh3D');
            model.geometry = $set(new PlaneGeometry(), { width: this.lightType === LightType.Point ? 1 : 0.5, height: 0.5, segmentsW: 1, segmentsH: 1, yUp: false });
            const textureMaterial = model.material = new TextureMaterial().init({ uniforms: { s_texture: this.frameBufferObject.texture as any } });
            //
            // textureMaterial.uniforms.s_texture.url = 'Assets/pz.jpg';
            // textureMaterial.uniforms.u_color.setTo(1.0, 0.0, 0.0, 1.0);
            textureMaterial.renderParams.enableBlend = true;
            textureMaterial.renderParams.sfactor = 'ONE';
            textureMaterial.renderParams.dfactor = 'ZERO';
        }

        const depth = viewCamera.lens.near * 2;
        node3d.position = viewCamera.node3d.worldPosition.addTo(viewCamera.node3d.globalMatrix.getAxisZ().scaleNumberTo(depth));
        const billboardComponent = node3d.getComponent('BillboardComponent');
        billboardComponent.camera = viewCamera;

        if (this.debugShadowMap)
        {
            scene.node3d.addChild(node3d);
        }
        else
        {
            node3d.remove();
        }
    }
}
