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
        "webgl_buffergeometry_points",
        "webgl_materials_texture_filters",
        "webgl_geometry_terrain",
        "webgl_lights_spotlight",
        "webgl_interactive_voxelpainter",
        "webgl_geometry_convex",
        "webgl_camera",
        "webgl_buffergeometry_indexed",
        "webgl_lines_colors",
        "webgl_shadowmesh",
        "webgl_buffergeometry_points_interleaved",
    ],
} as const;
