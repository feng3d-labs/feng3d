import { RegisterComponent } from '../../ecs/Component';
import { gPartial } from '../../polyfill/Types';
import { RenderAtomic } from '../../renderer/data/RenderAtomic';
import { serialization } from '../../serialization/Serialization';
import { RayCastable } from './RayCastable';

declare global
{
    export interface MixinsComponentMap { Renderable: Renderer; }
}

/**
 * 可渲染组件
 *
 * General functionality for all renderers.
 *
 * A renderer is what makes an object appear on the screen. Use this class to access the renderer of any object, mesh or Particle System. Renderers can be disabled to make objects invisible (see enabled), and the materials can be accessed and modified through them (see material).
 *
 * See Also: Renderer components for meshes, particles, lines and trails.
 * 
 * @see https://docs.unity3d.com/cn/current/ScriptReference/Renderer.html
 */
@RegisterComponent()
export class Renderer extends RayCastable
{
    get single() { return true; }

    readonly renderAtomic = new RenderAtomic();

    constructor(param?: gPartial<Renderer>)
    {
        super();
        serialization.setValue(this, param);
    }
}
