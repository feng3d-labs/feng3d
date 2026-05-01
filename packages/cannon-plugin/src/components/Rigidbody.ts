import { Body } from '@feng3d-plugins/cannon';
import { AddComponentMenu, Behaviour, decoratorRegisterClass, oav, RegisterComponent, RunEnvironment, Scene, serialize, Vector3 } from 'feng3d';
import { Collider } from './Collider';

declare global
{
    export interface MixinsComponentMap
    {
        Rigidbody: Rigidbody;
    }
}

/**
 * 刚体
 */
@AddComponentMenu('Physics/Rigidbody')
@RegisterComponent()
@decoratorRegisterClass()
export class Rigidbody extends Behaviour
{
    __class__: 'physics.Rigidbody';

    body = new Body();

    runEnvironment = RunEnvironment.feng3d;

    @oav()
    @serialize
    get mass()
    {
        return this.body.mass;
    }
    set mass(v)
    {
        this.body.mass = v;
    }

    init()
    {
        this.body = new Body({ mass: this.mass });

        this.body.position = new Vector3(this.transform.position.x, this.transform.position.y, this.transform.position.z) as any;

        const colliders = this.gameObject.getComponents(Collider);
        colliders.forEach((element) =>
        {
            this.body.addShape(element.shape);
        });

        this.on('transformChanged', this._onTransformChanged, this);
    }

    private _onTransformChanged()
    {
        this.body.position = new Vector3(this.transform.position.x, this.transform.position.y, this.transform.position.z) as any;
    }

    /**
     * 每帧执行
     */
    update(_interval?: number)
    {
        const scene = this.getComponentsInParent(Scene)[0];
        if (scene)
        {
            this.transform.position = new Vector3(this.body.position.x, this.body.position.y, this.body.position.z);
        }
    }
}
