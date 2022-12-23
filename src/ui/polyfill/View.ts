import { functionwrap, View } from '@feng3d/core';
import { CanvasRenderer } from '../core/CanvasRenderer';

export { };

functionwrap.extendFunction(View.prototype, 'render', function (_r, _interval)
{
    CanvasRenderer.draw(this);
});
