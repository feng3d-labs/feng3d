import { HideFlags } from '../../core/HideFlags';
import { Color3 } from '../../math/Color3';
import { Matrix4x4 } from '../../math/geom/Matrix4x4';
import { Vector3 } from '../../math/geom/Vector3';
import { oav } from '../../objectview/ObjectView';
import { FrameBuffer } from '../../renderer/FrameBuffer';
import { $set } from '../../serialization/Serialization';
import { SerializeProperty } from '../../serialization/SerializeProperty';
import { Camera3D } from '../cameras/Camera3D';
import { Component3D } from '../core/Component3D';
import { Node3D } from '../core/Node3D';
import { Scene3D } from '../core/Scene3D';
import { PlaneGeometry } from '../geometrys/PlaneGeometry';
import { TextureMaterial } from '../materials/texture/TextureMaterial';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';

/**
 * 光源
 */
export class Light3D extends Component3D
{
    /**
     * 获取计算光源阴影贴图时使用的帧缓冲。
     *
     * @param light3D 光源。
     * @returns 计算光源阴影贴图时使用的帧缓冲。
     */
    static getFrameBuffer(light3D: Light3D)
    {
        const cache = this._frameBufferCache;
        let frameBuffer = cache.get(light3D);
        if (!frameBuffer)
        {
            frameBuffer = new FrameBuffer();
            cache.set(light3D, frameBuffer);
        }

        return frameBuffer;
    }
    private static _frameBufferCache = new Map<Light3D, FrameBuffer>();

    /**
     * 获取光源阴影贴图。
     *
     * @param light3D 光源。
     * @returns 光源阴影贴图。
     */
    static getShadowMap(light3D: Light3D)
    {
        const frameBuffer = this.getFrameBuffer(light3D);

        return frameBuffer.texture;
    }

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
     * 阴影偏差，用来解决判断是否为阴影时精度问题
     */
    shadowBias = -0.005;

    /**
     * 阴影半径，边缘宽度
     */
    shadowRadius = 1;

    /**
     * 由生成阴影贴图时计算的摄像机全局位置。
     *
     * @private
     */
    shadowCameraPosition: Vector3;

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

            const shadermap = Light3D.getShadowMap(this);

            const textureMaterial = model.material = new TextureMaterial().init({ uniforms: { s_texture: shadermap as any } });
            //
            // textureMaterial.uniforms.s_texture.url = 'Assets/pz.jpg';
            // textureMaterial.uniforms.u_color.setTo(1.0, 0.0, 0.0, 1.0);
            textureMaterial.renderParams.enableBlend = true;
            textureMaterial.renderParams.sfactor = 'ONE';
            textureMaterial.renderParams.dfactor = 'ZERO';
        }

        const depth = viewCamera.near * 2;
        node3d.position = viewCamera.entity.globalPosition.addTo(viewCamera.entity.globalMatrix.getAxisZ().scaleNumberTo(depth));
        const billboardComponent = node3d.getComponent('Billboard3D');
        billboardComponent.camera = viewCamera;

        if (this.debugShadowMap)
        {
            scene.entity.addChild(node3d);
        }
        else
        {
            node3d.remove();
        }
    }
}
