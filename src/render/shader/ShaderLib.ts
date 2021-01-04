
globalDispatcher.on("asset.shaderChanged", () =>
{
    shaderlib.clearCache();
});
