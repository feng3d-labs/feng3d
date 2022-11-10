import { globalEmitter } from '@feng3d/event';
import { shaderlib } from '@feng3d/renderer';

globalEmitter.on('asset.shaderChanged', () =>
{
    shaderlib.clearCache();
});
