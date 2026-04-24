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

    private readonly _transform = computed(() =>
    {
        return this.getComponent(Transform);
    });

    getComponent<T extends Component>(type: Constructor<T>): T
    {
        const r_this = reactive(this);
        const length = r_this.components.length; // 监听

        for (let i = 0; i < length; i++)
        {
            r_this.components[i]; // 监听

            if (this.components[i] instanceof type)
            {
                return this.components[i] as T;
            }
        }

        return null;
    }
}