import { View3D } from '../../core/core/View3D';
import { functionwrap } from '../../core/utils/FunctionWarp';
import { CanvasRenderer } from '../core/CanvasRenderer';

export { };

functionwrap.extendFunction(View3D.prototype, 'render', function (_r, _interval)
{
    CanvasRenderer.draw(this);
});
