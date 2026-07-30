import { RenderObject } from '@feng3d/webgpu';
import { Renderable } from '../../core/Renderable';

export class LightPicker
{
    private _model: Renderable;

    constructor(model: Renderable)
    {
        this._model = model;
    }

    beforeRender(_renderObject: RenderObject)
    {
        // 光照数据由 ForwardRenderer 通过 bindingResources 注入，此处无需处理。
    }
}
