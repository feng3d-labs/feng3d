import { logic } from '@feng3d/reactivity';
import { ScriptComponent } from './ScriptComponent';
/**
 * 3d对象脚本
 *
 * 用户脚本基类，由 ScriptComponent 持有。通过 component 间接访问 object3D。
 */
export class Script
{
    /**
     * The game object this component is attached to. A component is always attached to a game object.
     */
    get object3D()
    {
        return this.component ? logic(this.component).entity : null;
    }

    /**
     * The Transform attached to this Object3D (null if there is none attached).
     */
    get transform()
    {
        return this.object3D;
    }

    /**
     * 宿主组件
     */
    component: ScriptComponent;

    constructor()
    {
    }

    /**
     * Use this for initialization
     */
    init()
    {

    }

    /**
     * Update is called once per frame
     * 每帧执行一次
     */
    update()
    {

    }

    /**
     * 销毁
     */
    dispose()
    {

    }
}
