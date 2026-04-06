import { View } from '../../core/core/View';
import { functionwrap } from '../../core/utils/FunctionWarp';
import { CanvasRenderer } from '../core/CanvasRenderer';

export { };

functionwrap.extendFunction(View.prototype, 'render', function (_r, _interval)
{
    CanvasRenderer.draw(this);
});
