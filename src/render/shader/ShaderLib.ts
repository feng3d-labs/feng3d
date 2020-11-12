namespace feng3d
{
    globalDispatcher.on("asset.shaderChanged", () =>
    {
        shaderlib.clearCache();
    });
}