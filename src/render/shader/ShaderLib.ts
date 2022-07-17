namespace feng3d
{
    globalEmitter.on("asset.shaderChanged", () =>
    {
        shaderlib.clearCache();
    });
}