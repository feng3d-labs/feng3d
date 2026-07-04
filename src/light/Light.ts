import { Color3 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { Camera } from '../cameras/Camera';
import { Behaviour } from '../component/Behaviour';
import { FrameBufferObject } from '../render/FrameBufferObject';
import { LightType } from './LightType';
import { ShadowType } from './shadow/ShadowType';

// 触发 lightLogic 注册到 componentLogic 分发表
import './lightLogic';
export { lightLogic } from './lightLogic';
export type { LightLogic } from './lightLogic';

/**
 * 灯光（纯数据基类）。
 *
 * 光照逻辑（position/direction、阴影相机创建、updateDebugShadowMap）
 * 由 {@link lightLogic} 提供。
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
     * 阴影偏差，用来解决判断是否为阴影时精度问题
     */
    shadowBias = -0.005;

    /**
     * 阴影半径，边缘宽度
     */
    shadowRadius = 1;

    /**
     * 投影摄像机
     */
    shadowCamera: Camera;

    /**
     * 帧缓冲对象，用于处理光照阴影贴图渲染
     */
    frameBufferObject = new FrameBufferObject();

    @oav({ tooltip: '是否调试阴影图' })
    debugShadowMap = false;
}
