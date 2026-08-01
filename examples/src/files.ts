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
        "ThreejsGeometriesTest",
        "ThreejsInteractiveCubesTest",
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
    "webgl": [
        "webgl_geometry_colors",
        "webgl_buffergeometry_lines",
    ],
} as const;
