import mouseFragment from './shaders/mouse_fragment_glsl';
import mouseVertex from './shaders/mouse_vertex_glsl';
import outlineFragment from './shaders/outline_fragment_glsl';
import outlineVertex from './shaders/outline_vertex_glsl';
import particlesAdditiveFragment from './shaders/Particles_Additive_fragment_glsl';
import particlesAdditiveVertex from './shaders/Particles_Additive_vertex_glsl';
import particlesAlphaBlendedPremultiplyFragment from './shaders/Particles_AlphaBlendedPremultiply_fragment_glsl';
import particlesAlphaBlendedPremultiplyVertex from './shaders/Particles_AlphaBlendedPremultiply_vertex_glsl';
import shadowFragment from './shaders/shadow_fragment_glsl';
import shadowVertex from './shaders/shadow_vertex_glsl';
import terrainFragment from './shaders/terrain_fragment_glsl';
import terrainVertex from './shaders/terrain_vertex_glsl';
import wireframeFragment from './shaders/wireframe_fragment_glsl';
import wireframeVertex from './shaders/wireframe_vertex_glsl';
//
import { $set } from '@feng3d/serialization';
import { shaderlib } from './renderer/shader/ShaderLib';
import alphatestFrag from './shaders/modules/alphatest_frag_glsl';
import alphatestParsFrag from './shaders/modules/alphatest_pars_frag_glsl';
import ambientFrag from './shaders/modules/ambient_frag_glsl';
import ambientParsFrag from './shaders/modules/ambient_pars_frag_glsl';
import cartoonParsFrag from './shaders/modules/cartoon_pars_frag_glsl';
import colorFrag from './shaders/modules/color_frag_glsl';
import colorParsFrag from './shaders/modules/color_pars_frag_glsl';
import colorParsVert from './shaders/modules/color_pars_vert_glsl';
import colorVert from './shaders/modules/color_vert_glsl';
import diffuseFrag from './shaders/modules/diffuse_frag_glsl';
import diffuseParsFrag from './shaders/modules/diffuse_pars_frag_glsl';
import envmapFrag from './shaders/modules/envmap_frag_glsl';
import envmapParsFrag from './shaders/modules/envmap_pars_frag_glsl';
import fogFrag from './shaders/modules/fog_frag_glsl';
import fogParsFrag from './shaders/modules/fog_pars_frag_glsl';
import lightsFrag from './shaders/modules/lights_frag_glsl';
import lightsParsFrag from './shaders/modules/lights_pars_frag_glsl';
import lightsParsVert from './shaders/modules/lights_pars_vert_glsl';
import lightsVert from './shaders/modules/lights_vert_glsl';
import normalFrag from './shaders/modules/normal_frag_glsl';
import normalParsFrag from './shaders/modules/normal_pars_frag_glsl';
import normalParsVert from './shaders/modules/normal_pars_vert_glsl';
import normalVert from './shaders/modules/normal_vert_glsl';
import normalmapParsVert from './shaders/modules/normalmap_pars_vert_glsl';
import normalmapVert from './shaders/modules/normalmap_vert_glsl';
import particleFrag from './shaders/modules/particle_frag_glsl';
import particleParsFrag from './shaders/modules/particle_pars_frag_glsl';
import particleParsVert from './shaders/modules/particle_pars_vert_glsl';
import particleVert from './shaders/modules/particle_vert_glsl';
import pointsizeParsVert from './shaders/modules/pointsize_pars_vert_glsl';
import pointsizeVert from './shaders/modules/pointsize_vert_glsl';
import positionParsVert from './shaders/modules/position_pars_vert_glsl';
import positionVert from './shaders/modules/position_vert_glsl';
import projectParsVert from './shaders/modules/project_pars_vert_glsl';
import projectVert from './shaders/modules/project_vert_glsl';
import shadowmapParsFrag from './shaders/modules/shadowmap_pars_frag_glsl';
import skeletonParsVert from './shaders/modules/skeleton_pars_vert_glsl';
import skeletonVert from './shaders/modules/skeleton_vert_glsl';
import specularFrag from './shaders/modules/specular_frag_glsl';
import specularParsFrag from './shaders/modules/specular_pars_frag_glsl';
import tangentParsVert from './shaders/modules/tangent_pars_vert_glsl';
import tangentVert from './shaders/modules/tangent_vert_glsl';
import terrainFrag from './shaders/modules/terrain_frag_glsl';
import terrainParsFrag from './shaders/modules/terrain_pars_frag_glsl';
import terrainDefaultParsFrag from './shaders/modules/terrainDefault_pars_frag_glsl';
import terrainMergeParsFrag from './shaders/modules/terrainMerge_pars_frag_glsl';
import uvParsVert from './shaders/modules/uv_pars_vert_glsl';
import uvVert from './shaders/modules/uv_vert_glsl';
import worldpositionParsVert from './shaders/modules/worldposition_pars_vert_glsl';
import worldpositionVert from './shaders/modules/worldposition_vert_glsl';

export { };

$set(shaderlib.shaderConfig, {
    shaders: {
        mouse: { fragment: mouseFragment, vertex: mouseVertex },
        outline: { fragment: outlineFragment, vertex: outlineVertex },
        Particles_Additive: { fragment: particlesAdditiveFragment, vertex: particlesAdditiveVertex },
        Particles_AlphaBlendedPremultiply: { fragment: particlesAlphaBlendedPremultiplyFragment, vertex: particlesAlphaBlendedPremultiplyVertex },
        shadow: { fragment: shadowFragment, vertex: shadowVertex },
        terrain: { fragment: terrainFragment, vertex: terrainVertex },
        wireframe: { fragment: wireframeFragment, vertex: wireframeVertex },
    },
    modules: {
        alphatest_frag: alphatestFrag,
        alphatest_pars_frag: alphatestParsFrag,
        ambient_frag: ambientFrag,
        ambient_pars_frag: ambientParsFrag,
        cartoon_pars_frag: cartoonParsFrag,
        color_frag: colorFrag,
        color_pars_frag: colorParsFrag,
        color_pars_vert: colorParsVert,
        color_vert: colorVert,
        diffuse_frag: diffuseFrag,
        diffuse_pars_frag: diffuseParsFrag,
        envmap_frag: envmapFrag,
        envmap_pars_frag: envmapParsFrag,
        fog_frag: fogFrag,
        fog_pars_frag: fogParsFrag,
        lights_frag: lightsFrag,
        lights_pars_frag: lightsParsFrag,
        lights_pars_vert: lightsParsVert,
        lights_vert: lightsVert,
        normalmap_pars_vert: normalmapParsVert,
        normalmap_vert: normalmapVert,
        normal_frag: normalFrag,
        normal_pars_frag: normalParsFrag,
        normal_pars_vert: normalParsVert,
        normal_vert: normalVert,
        particle_frag: particleFrag,
        particle_pars_frag: particleParsFrag,
        particle_pars_vert: particleParsVert,
        particle_vert: particleVert,
        pointsize_pars_vert: pointsizeParsVert,
        pointsize_vert: pointsizeVert,
        position_pars_vert: positionParsVert,
        position_vert: positionVert,
        project_pars_vert: projectParsVert,
        project_vert: projectVert,
        shadowmap_pars_frag: shadowmapParsFrag,
        skeleton_pars_vert: skeletonParsVert,
        skeleton_vert: skeletonVert,
        specular_frag: specularFrag,
        specular_pars_frag: specularParsFrag,
        tangent_pars_vert: tangentParsVert,
        tangent_vert: tangentVert,
        terrainDefault_pars_frag: terrainDefaultParsFrag,
        terrainMerge_pars_frag: terrainMergeParsFrag,
        terrain_frag: terrainFrag,
        terrain_pars_frag: terrainParsFrag,
        uv_pars_vert: uvParsVert,
        uv_vert: uvVert,
        worldposition_pars_vert: worldpositionParsVert,
        worldposition_vert: worldpositionVert,
    }
});
