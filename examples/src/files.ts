export default {
    "base": [
        "Container3DTest",
        "FPSControllerTest",
        "BillboardTest",
        "MousePickTest",
        "SkyBoxTest",
        "FogTest",
        "ScriptTest",
    ],
    "material": [
        "PointMaterialTest",
        "SegmentMaterialTest",
        "StandardMaterialTest",
        "TextureMaterialTest",
    ],
    "geometry": [
        "PrimitiveTest",
    ],
    "lights": [
        "PointLightTest",
    ],
    "advanced": [
        "TerrainTest",
        "TerrainMergeTest",
    ],
    "away3d": [
        "Basic_View",
        "Basic_SkyBox",
        "Basic_Shading",
    ],
    "font": [
        "GeometryFontTest"
    ],
    "renderer": [
        "Basic",
        "DashedLine",
    ],
} as const;
