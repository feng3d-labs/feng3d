import { globalEmitter } from '@feng3d/event';
import { shaderlib } from '../data/ShaderLib';

globalEmitter.on('asset.shaderChanged', () =>
{
    shaderlib.clearCache();
});
