import { globalEmitter } from '../../../event/GlobalEmitter';
import { shaderlib } from '../../../renderer/shader/ShaderLib';

globalEmitter.on('asset.shaderChanged', () =>
{
    shaderlib.clearCache();
});
