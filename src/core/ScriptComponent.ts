import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Behaviour } from '../component/Behaviour';
;
import { AddComponentMenu } from '../Menu';
import { RunEnvironment } from './RunEnvironment';
import { Script } from './Script';

// 触发 scriptComponentLogic 注册到 componentLogic 分发表
import './scriptComponentLogic';

/**
 * 3d对象脚本（纯数据）。
 *
 * 脚本实例管理与生命周期由 {@link scriptComponentLogic} 提供。
 */
@AddComponentMenu('Script/Script')
@decoratorRegisterClass()
export class ScriptComponent extends Behaviour
{
    readonly __type__: string = 'ScriptComponent';

    runEnvironment = RunEnvironment.feng3d;

    @serialize
    @oav({ component: 'OAVPick', componentParam: { accepttype: 'file_script' } })
    scriptName: string;

    /**
     * 脚本对象（由 scriptComponentLogic 管理，此处保留字段供序列化/编辑器）
     */
    @serialize
    scriptInstance: Script;
}
