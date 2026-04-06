globalEmitter.on('asset.shaderChanged', () =>
{
    shaderlib.clearCache();
});
