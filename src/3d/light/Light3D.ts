import { HideFlags } from '../../core/HideFlags';
import { Color3 } from '../../math/Color3';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { oav } from '../../objectview/ObjectView';
import { FrameBufferObject } from '../../renderer/FrameBufferObject';
import { $set } from '../../serialization/Serialization';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { RenderTargetTexture2D } from '../../textures/RenderTargetTexture2D';
import { Camera3D } from '../cameras/Camera3D';
import { Component3D } from '../core/Component3D';
import { Node3D } from '../core/Node3D';
import { Scene3D } from '../core/Scene3D';
import { PlaneGeometry } from '../geometrys/PlaneGeometry';
import { TextureMaterial } from '../materials/texture/TextureMaterial';
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
     *
     * 由生成阴影贴图时计算的摄像机远平面距离。
     *
     * @private
     */
    shadowCameraNear: number;

    /**
     * 阴影近平面距离
     *
     * 由生成阴影贴图时计算的摄像机远平面距离。
     *
     * @private
     */
    shadowCameraFar: number;

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

    /**
     * 生成阴影贴图时使用的VP矩阵
     *
     * @private
     */
    _shadowCameraViewProjection: Matrix4x4;

    init(): void
    {
    }

    updateDebugShadowMap(scene: Scene3D, viewCamera: Camera3D)
    {
        let node3d = this.debugShadowMapObject;
        if (!node3d)
        {
            node3d = this.debugShadowMapObject = Node3D.createPrimitive('Plane', { name: 'debugShadowMapObject' });
            node3d.hideFlags = HideFlags.Hide | HideFlags.DontSave;
            node3d.mouseEnabled = false;
            node3d.addComponent('Billboard3D');

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

        const depth = viewCamera.near * 2;
        node3d.position = viewCamera.node3d.worldPosition.addTo(viewCamera.node3d.globalMatrix.getAxisZ().scaleNumberTo(depth));
        const billboardComponent = node3d.getComponent('Billboard3D');
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
