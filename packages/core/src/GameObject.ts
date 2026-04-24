import { computed, reactive } from "@feng3d/reactivity";
import { Component } from "./Component";
import { Transform } from "./Transform";

export type Constructor<T> = (new (...args) => T);

export class GameObject
{
    readonly components: readonly Component[] = [new Transform()];

    get transform()
    {
        return this._transform.value;
    }

    private readonly _this = reactive(this);
    private readonly _transform = computed(() =>
    {
        const transform = this._this.getComponent(Transform);
        return transform;
    });

    getComponent<T extends Component>(type: Constructor<T>): T
    {
        for (let i = 0; i < this.components.length; i++)
        {
            if (this.components[i] instanceof type)
            {
                return this.components[i] as T;
            }
        }

        return null;
    }
}