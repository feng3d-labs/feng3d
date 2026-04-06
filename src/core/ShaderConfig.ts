/* eslint-disable camelcase */
import mouseFragment from './shaders/mouse.fragment.glsl';
import mouseVertex from './shaders/mouse.vertex.glsl';
import outlineFragment from './shaders/outline.fragment.glsl';
import outlineVertex from './shaders/outline.vertex.glsl';
import Particles_AdditiveFragment from './shaders/Particles_Additive.fragment.glsl';
import Particles_AdditiveVertex from './shaders/Particles_Additive.vertex.glsl';
import Particles_AlphaBlendedPremultiplyFragment from './shaders/Particles_AlphaBlendedPremultiply.fragment.glsl';
import Particles_AlphaBlendedPremultiplyVertex from './shaders/Particles_AlphaBlendedPremultiply.vertex.glsl';
import shadowFragment from './shaders/shadow.fragment.glsl';
import shadowVertex from './shaders/shadow.vertex.glsl';
import skyboxFragment from './shaders/skybox.fragment.glsl';
import skyboxVertex from './shaders/skybox.vertex.glsl';
import terrainFragment from './shaders/terrain.fragment.glsl';
import terrainVertex from './shaders/terrain.vertex.glsl';
import wireframeFragment from './shaders/wireframe.fragment.glsl';
import wireframeVertex from './shaders/wireframe.vertex.glsl';
//
import alphatest_frag from './shaders/modules/alphatest_frag.glsl';
import alphatest_pars_frag from './shaders/modules/alphatest_pars_frag.glsl';
import ambient_frag from './shaders/modules/ambient_frag.glsl';
import ambient_pars_frag from './shaders/modules/ambient_pars_frag.glsl';
import cartoon_pars_frag from './shaders/modules/cartoon_pars_frag.glsl';
import color_frag from './shaders/modules/color_frag.glsl';
import color_pars_frag from './shaders/modules/color_pars_frag.glsl';
import color_pars_vert from './shaders/modules/color_pars_vert.glsl';
import color_vert from './shaders/modules/color_vert.glsl';
import diffuse_frag from './shaders/modules/diffuse_frag.glsl';
import diffuse_pars_frag from './shaders/modules/diffuse_pars_frag.glsl';
import envmap_frag from './shaders/modules/envmap_frag.glsl';
import envmap_pars_frag from './shaders/modules/envmap_pars_frag.glsl';
import fog_frag from './shaders/modules/fog_frag.glsl';
import fog_pars_frag from './shaders/modules/fog_pars_frag.glsl';
import lights_frag from './shaders/modules/lights_frag.glsl';
import lights_pars_frag from './shaders/modules/lights_pars_frag.glsl';
import lights_pars_vert from './shaders/modules/lights_pars_vert.glsl';
import lights_vert from './shaders/modules/lights_vert.glsl';
import normalmap_pars_vert from './shaders/modules/normalmap_pars_vert.glsl';
import normalmap_vert from './shaders/modules/normalmap_vert.glsl';
import normal_frag from './shaders/modules/normal_frag.glsl';
import normal_pars_frag from './shaders/modules/normal_pars_frag.glsl';
import normal_pars_vert from './shaders/modules/normal_pars_vert.glsl';
import normal_vert from './shaders/modules/normal_vert.glsl';
import particle_frag from './shaders/modules/particle_frag.glsl';
import particle_pars_frag from './shaders/modules/particle_pars_frag.glsl';
import particle_pars_vert from './shaders/modules/particle_pars_vert.glsl';
import particle_vert from './shaders/modules/particle_vert.glsl';
import pointsize_pars_vert from './shaders/modules/pointsize_pars_vert.glsl';
import pointsize_vert from './shaders/modules/pointsize_vert.glsl';
import position_pars_vert from './shaders/modules/position_pars_vert.glsl';
import position_vert from './shaders/modules/position_vert.glsl';
import project_pars_vert from './shaders/modules/project_pars_vert.glsl';
import project_vert from './shaders/modules/project_vert.glsl';
import shadowmap_pars_frag from './shaders/modules/shadowmap_pars_frag.glsl';
import skeleton_pars_vert from './shaders/modules/skeleton_pars_vert.glsl';
import skeleton_vert from './shaders/modules/skeleton_vert.glsl';
import specular_frag from './shaders/modules/specular_frag.glsl';
import specular_pars_frag from './shaders/modules/specular_pars_frag.glsl';
import tangent_pars_vert from './shaders/modules/tangent_pars_vert.glsl';
import tangent_vert from './shaders/modules/tangent_vert.glsl';
import terrainDefault_pars_frag from './shaders/modules/terrainDefault_pars_frag.glsl';
import terrainMerge_pars_frag from './shaders/modules/terrainMerge_pars_frag.glsl';
import terrain_frag from './shaders/modules/terrain_frag.glsl';
import terrain_pars_frag from './shaders/modules/terrain_pars_frag.glsl';
import uv_pars_vert from './shaders/modules/uv_pars_vert.glsl';
import uv_vert from './shaders/modules/uv_vert.glsl';
import worldposition_pars_vert from './shaders/modules/worldposition_pars_vert.glsl';
import worldposition_vert from './shaders/modules/worldposition_vert.glsl';

import { shaderlib } from '@feng3d/renderer';
import { serialization } from '@feng3d/serialization';

export { };

serialization.setValue(shaderlib.shaderConfig, {
    shaders: {
        mouse: { fragment: mouseFragment, vertex: mouseVertex },
        outline: { fragment: outlineFragment, vertex: outlineVertex },
        Particles_Additive: { fragment: Particles_AdditiveFragment, vertex: Particles_AdditiveVertex },
        Particles_AlphaBlendedPremultiply: { fragment: Particles_AlphaBlendedPremultiplyFragment, vertex: Particles_AlphaBlendedPremultiplyVertex },
        shadow: { fragment: shadowFragment, vertex: shadowVertex },
        skybox: { fragment: skyboxFragment, vertex: skyboxVertex },
        terrain: { fragment: terrainFragment, vertex: terrainVertex },
        wireframe: { fragment: wireframeFragment, vertex: wireframeVertex },
    },
    modules: {
        alphatest_frag,
        alphatest_pars_frag,
        ambient_frag,
        ambient_pars_frag,
        cartoon_pars_frag,
        color_frag,
        color_pars_frag,
        color_pars_vert,
        color_vert,
        diffuse_frag,
        diffuse_pars_frag,
        envmap_frag,
        envmap_pars_frag,
        fog_frag,
        fog_pars_frag,
        lights_frag,
        lights_pars_frag,
        lights_pars_vert,
        lights_vert,
        normalmap_pars_vert,
        normalmap_vert,
        normal_frag,
        normal_pars_frag,
        normal_pars_vert,
        normal_vert,
        particle_frag,
        particle_pars_frag,
        particle_pars_vert,
        particle_vert,
        pointsize_pars_vert,
        pointsize_vert,
        position_pars_vert,
        position_vert,
        project_pars_vert,
        project_vert,
        shadowmap_pars_frag,
        skeleton_pars_vert,
        skeleton_vert,
        specular_frag,
        specular_pars_frag,
        tangent_pars_vert,
        tangent_vert,
        terrainDefault_pars_frag,
        terrainMerge_pars_frag,
        terrain_frag,
        terrain_pars_frag,
        uv_pars_vert,
        uv_vert,
        worldposition_pars_vert,
        worldposition_vert,
    }
});
