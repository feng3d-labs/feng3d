import { globalEmitter } from "@feng3d/event";
import { shaderlib } from "../../renderer/shader/ShaderLib";

globalEmitter.on("asset.shaderChanged", () =>
{
    shaderlib.clearCache();
});
