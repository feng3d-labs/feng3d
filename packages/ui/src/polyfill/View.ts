import { functionwrap, View } from 'feng3d';
import { CanvasRenderer } from '../core/CanvasRenderer';

export { };

functionwrap.extendFunction(View.prototype, 'render', function (_r, _interval)
{
    CanvasRenderer.draw(this);
});
