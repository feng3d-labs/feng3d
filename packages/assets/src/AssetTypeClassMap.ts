import { GeometryAsset } from "./assets/GeometryAsset";
import { JSAsset } from "./assets/JSAsset";
import { JsonAsset } from "./assets/JsonAsset";
import { MaterialAsset } from "./assets/MaterialAsset";
import { ScriptAsset } from "./assets/ScriptAsset";
import { ShaderAsset } from "./assets/ShaderAsset";
import { TextAsset } from "./assets/TextAsset";
import { TextureCubeAsset } from "./assets/TextureCubeAsset";

export { };
declare global
{
    namespace GlobalMixins
    {
        interface AssetTypeClassMap
        {
            "geometry": new () => GeometryAsset;
            "js": new () => JSAsset;
            "texturecube": new () => TextureCubeAsset;
            "txt": new () => TextAsset;
            "shader": new () => ShaderAsset;
            "script": new () => ScriptAsset;
            "material": new () => MaterialAsset;
            "json": new () => JsonAsset;
        }
    }
}