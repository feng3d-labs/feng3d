import { World } from '@feng3d-plugins/cannon';
import { AddComponentMenu, Behaviour, Component, decoratorRegisterClass, GameObject, IEvent, oav, RegisterComponent, RunEnvironment, serialize, Vector3 } from 'feng3d';
import { Rigidbody } from './Rigidbody';

declare global
{
    export interface MixinsComponentMap
    {
        PhysicsWorld: PhysicsWorld;
    }
}

/**
 * 物理世界组件
 */
@AddComponentMenu('Physics/PhysicsWorld')
@RegisterComponent()
@decoratorRegisterClass()
export class PhysicsWorld extends Behaviour
{
    runEnvironment = RunEnvironment.feng3d;

    /**
     * 物理世界
     */
    world = new World();

    /**
     * 重力加速度
     */
    @oav()
    @serialize
    gravity = new Vector3(0, -9.82, 0);

    init()
    {
        super.init();
    }

    private _isInit = false;
    private initWorld()
    {
        if (this._isInit) return true;
        this._isInit = true;

        const bodys = this.getComponentsInChildren(Rigidbody).map((c) => c.body);
        bodys.forEach((v) =>
        {
            this.world.addBody(v);
        });

        //
        this.on('addChild', this.onAddChild, this);
        this.on('removeChild', this.onRemoveChild, this);
        this.on('addComponent', this.onAddComponent, this);
        this.on('removeComponent', this.onRemovedComponent, this);
    }

    private onAddComponent(e: IEvent<{ gameobject: GameObject; component: Component; }>)
    {
        if (e.data.component instanceof Rigidbody)
        {
            this.world.addBody(e.data.component.body);
        }
    }

    private onRemovedComponent(e: IEvent<{ gameobject: GameObject; component: Component; }>)
    {
        if (e.data.component instanceof Rigidbody)
        {
            this.world.removeBody(e.data.component.body);
        }
    }

    private onAddChild(e: IEvent<{ parent: GameObject; child: GameObject; }>)
    {
        const bodyComponent = e.data.child.getComponent(Rigidbody);
        if (bodyComponent)
        {
            this.world.addBody(bodyComponent.body);
        }
    }

    private onRemoveChild(e: IEvent<{ parent: GameObject; child: GameObject; }>)
    {
        const bodyComponent = e.data.child.getComponent(Rigidbody);
        if (bodyComponent)
        {
            this.world.removeBody(bodyComponent.body);
        }
    }

    update(interval?: number)
    {
        this.initWorld();
        this.world.gravity = new Vector3(this.gravity.x, this.gravity.y, this.gravity.z) as any;
        this.world.step(1.0 / 60.0, interval / 1000, 3);
    }
}
