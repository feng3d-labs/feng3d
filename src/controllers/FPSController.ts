import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { Behaviour } from '../component/Behaviour';
;
import { RunEnvironment } from '../core/RunEnvironment';
import { AddComponentMenu } from '../Menu';

// 触发 fpsControllerLogic 注册到 componentLogic 分发表
import './fpsControllerLogic';

/**
 * FPS模式控制器（纯数据）。
 *
 * 控制逻辑（鼠标/键盘事件订阅、旋转与位移计算）由 {@link fpsControllerLogic} 提供。
 */
@AddComponentMenu('Controller/FPSController')
@decoratorRegisterClass()
export class FPSController extends Behaviour
{
    readonly __type__: string = 'FPSController';

    /**
     * 加速度
     */
    @oav()
    public acceleration = 0.001;

    runEnvironment = RunEnvironment.feng3d;
}
