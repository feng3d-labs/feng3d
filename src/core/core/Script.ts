import { Node3D } from './Node3D';
import { ScriptComponent } from './ScriptComponent';

/**
 * 3d对象脚本
 */
export class Script
{
    /**
     * The game object this component is attached to. A component is always attached to a game object.
     */
    get object3D(): Node3D
    {
        return this.component.entity;
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
