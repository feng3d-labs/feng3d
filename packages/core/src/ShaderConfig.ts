import { shaderlib } from '@feng3d/renderer';
import { $set } from '@feng3d/serialization';
import particlesAdditiveFragment from './shaders/Particles_Additive.fragment.glsl';
import particlesAdditiveVertex from './shaders/Particles_Additive.vertex.glsl';
import particlesAlphaBlendedPremultiplyFragment from './shaders/Particles_AlphaBlendedPremultiply.fragment.glsl';
import particlesAlphaBlendedPremultiplyVertex from './shaders/Particles_AlphaBlendedPremultiply.vertex.glsl';
import alphatestFrag from './shaders/modules/alphatest_frag.glsl';
import alphatestParsFrag from './shaders/modules/alphatest_pars_frag.glsl';
import ambientFrag from './shaders/modules/ambient_frag.glsl';
import ambientParsFrag from './shaders/modules/ambient_pars_frag.glsl';
import cartoonParsFrag from './shaders/modules/cartoon_pars_frag.glsl';
import colorFrag from './shaders/modules/color_frag.glsl';
import colorParsFrag from './shaders/modules/color_pars_frag.glsl';
import colorParsVert from './shaders/modules/color_pars_vert.glsl';
import colorVert from './shaders/modules/color_vert.glsl';
import diffuseFrag from './shaders/modules/diffuse_frag.glsl';
import diffuseParsFrag from './shaders/modules/diffuse_pars_frag.glsl';
import envmapFrag from './shaders/modules/envmap_frag.glsl';
import envmapParsFrag from './shaders/modules/envmap_pars_frag.glsl';
import fogFrag from './shaders/modules/fog_frag.glsl';
import fogParsFrag from './shaders/modules/fog_pars_frag.glsl';
import lightsFrag from './shaders/modules/lights_frag.glsl';
import lightsParsFrag from './shaders/modules/lights_pars_frag.glsl';
import lightsParsVert from './shaders/modules/lights_pars_vert.glsl';
import lightsVert from './shaders/modules/lights_vert.glsl';
import normalFrag from './shaders/modules/normal_frag.glsl';
import normalParsFrag from './shaders/modules/normal_pars_frag.glsl';
import normalParsVert from './shaders/modules/normal_pars_vert.glsl';
import normalVert from './shaders/modules/normal_vert.glsl';
import normalmapParsVert from './shaders/modules/normalmap_pars_vert.glsl';
import normalmapVert from './shaders/modules/normalmap_vert.glsl';
import particleFrag from './shaders/modules/particle_frag.glsl';
import particleParsFrag from './shaders/modules/particle_pars_frag.glsl';
import particleParsVert from './shaders/modules/particle_pars_vert.glsl';
import particleVert from './shaders/modules/particle_vert.glsl';
import pointsizeParsVert from './shaders/modules/pointsize_pars_vert.glsl';
import pointsizeVert from './shaders/modules/pointsize_vert.glsl';
import positionParsVert from './shaders/modules/position_pars_vert.glsl';
import positionVert from './shaders/modules/position_vert.glsl';
import projectParsVert from './shaders/modules/project_pars_vert.glsl';
import projectVert from './shaders/modules/project_vert.glsl';
import shadowmapParsFrag from './shaders/modules/shadowmap_pars_frag.glsl';
import skeletonParsVert from './shaders/modules/skeleton_pars_vert.glsl';
import skeletonVert from './shaders/modules/skeleton_vert.glsl';
import specularFrag from './shaders/modules/specular_frag.glsl';
import specularParsFrag from './shaders/modules/specular_pars_frag.glsl';
import tangentParsVert from './shaders/modules/tangent_pars_vert.glsl';
import tangentVert from './shaders/modules/tangent_vert.glsl';
import terrainDefaultParsFrag from './shaders/modules/terrainDefault_pars_frag.glsl';
import terrainMergeParsFrag from './shaders/modules/terrainMerge_pars_frag.glsl';
import terrainFrag from './shaders/modules/terrain_frag.glsl';
import terrainParsFrag from './shaders/modules/terrain_pars_frag.glsl';
import uvParsVert from './shaders/modules/uv_pars_vert.glsl';
import uvVert from './shaders/modules/uv_vert.glsl';
import worldpositionParsVert from './shaders/modules/worldposition_pars_vert.glsl';
import worldpositionVert from './shaders/modules/worldposition_vert.glsl';
import mouseFragment from './shaders/mouse.fragment.glsl';
import mouseVertex from './shaders/mouse.vertex.glsl';
import outlineFragment from './shaders/outline.fragment.glsl';
import outlineVertex from './shaders/outline.vertex.glsl';
import shadowFragment from './shaders/shadow.fragment.glsl';
import shadowVertex from './shaders/shadow.vertex.glsl';
import terrainFragment from './shaders/terrain.fragment.glsl';
import terrainVertex from './shaders/terrain.vertex.glsl';
import wireframeFragment from './shaders/wireframe.fragment.glsl';
import wireframeVertex from './shaders/wireframe.vertex.glsl';

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
