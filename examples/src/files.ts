export default {
    "base": [
        "Container3DTest",
        "FPSControllerTest",
        "BillboardTest",
        "MousePickTest",
        "SkyBoxTest",
        "FogTest",
        "ScriptTest",
        "ThreejsCubeTest",
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
    ],
    "away3d": [
        "Basic_View",
        "Basic_SkyBox",
        "Basic_Shading",
        "DebugShadowMap",
    ],
    "font": [
        "GeometryFontTest"
    ],
} as const;
