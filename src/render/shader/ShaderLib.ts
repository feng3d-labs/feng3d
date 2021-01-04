import { shaderlib } from "@feng3d/renderer";
import { globalDispatcher } from "../../event/GlobalDispatcher";

globalDispatcher.on("asset.shaderChanged", () =>
{
    shaderlib.clearCache();
});
