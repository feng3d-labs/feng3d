import mouseFragment from './shaders/mouse_fragment_glsl';
import mouseVertex from './shaders/mouse_vertex_glsl';
import outlineFragment from './shaders/outline_fragment_glsl';
import outlineVertex from './shaders/outline_vertex_glsl';
import Particles_AdditiveFragment from './shaders/Particles_Additive_fragment_glsl';
import Particles_AdditiveVertex from './shaders/Particles_Additive_vertex_glsl';
import Particles_AlphaBlendedPremultiplyFragment from './shaders/Particles_AlphaBlendedPremultiply_fragment_glsl';
import Particles_AlphaBlendedPremultiplyVertex from './shaders/Particles_AlphaBlendedPremultiply_vertex_glsl';
import shadowFragment from './shaders/shadow_fragment_glsl';
import shadowVertex from './shaders/shadow_vertex_glsl';
import terrainFragment from './shaders/terrain_fragment_glsl';
import terrainVertex from './shaders/terrain_vertex_glsl';
import wireframeFragment from './shaders/wireframe_fragment_glsl';
import wireframeVertex from './shaders/wireframe_vertex_glsl';
//
import { shaderlib } from '../renderer/shader/ShaderLib';
import { serialization } from '../serialization/Serialization';
import alphatest_frag from './shaders/modules/alphatest_frag_glsl';
import alphatest_pars_frag from './shaders/modules/alphatest_pars_frag_glsl';
import ambient_frag from './shaders/modules/ambient_frag_glsl';
import ambient_pars_frag from './shaders/modules/ambient_pars_frag_glsl';
import cartoon_pars_frag from './shaders/modules/cartoon_pars_frag_glsl';
import color_frag from './shaders/modules/color_frag_glsl';
import color_pars_frag from './shaders/modules/color_pars_frag_glsl';
import color_pars_vert from './shaders/modules/color_pars_vert_glsl';
import color_vert from './shaders/modules/color_vert_glsl';
import diffuse_frag from './shaders/modules/diffuse_frag_glsl';
import diffuse_pars_frag from './shaders/modules/diffuse_pars_frag_glsl';
import envmap_frag from './shaders/modules/envmap_frag_glsl';
import envmap_pars_frag from './shaders/modules/envmap_pars_frag_glsl';
import fog_frag from './shaders/modules/fog_frag_glsl';
import fog_pars_frag from './shaders/modules/fog_pars_frag_glsl';
import lights_frag from './shaders/modules/lights_frag_glsl';
import lights_pars_frag from './shaders/modules/lights_pars_frag_glsl';
import lights_pars_vert from './shaders/modules/lights_pars_vert_glsl';
import lights_vert from './shaders/modules/lights_vert_glsl';
import normalmap_pars_vert from './shaders/modules/normalmap_pars_vert_glsl';
import normalmap_vert from './shaders/modules/normalmap_vert_glsl';
import normal_frag from './shaders/modules/normal_frag_glsl';
import normal_pars_frag from './shaders/modules/normal_pars_frag_glsl';
import normal_pars_vert from './shaders/modules/normal_pars_vert_glsl';
import normal_vert from './shaders/modules/normal_vert_glsl';
import particle_frag from './shaders/modules/particle_frag_glsl';
import particle_pars_frag from './shaders/modules/particle_pars_frag_glsl';
import particle_pars_vert from './shaders/modules/particle_pars_vert_glsl';
import particle_vert from './shaders/modules/particle_vert_glsl';
import pointsize_pars_vert from './shaders/modules/pointsize_pars_vert_glsl';
import pointsize_vert from './shaders/modules/pointsize_vert_glsl';
import position_pars_vert from './shaders/modules/position_pars_vert_glsl';
import position_vert from './shaders/modules/position_vert_glsl';
import project_pars_vert from './shaders/modules/project_pars_vert_glsl';
import project_vert from './shaders/modules/project_vert_glsl';
import shadowmap_pars_frag from './shaders/modules/shadowmap_pars_frag_glsl';
import skeleton_pars_vert from './shaders/modules/skeleton_pars_vert_glsl';
import skeleton_vert from './shaders/modules/skeleton_vert_glsl';
import specular_frag from './shaders/modules/specular_frag_glsl';
import specular_pars_frag from './shaders/modules/specular_pars_frag_glsl';
import tangent_pars_vert from './shaders/modules/tangent_pars_vert_glsl';
import tangent_vert from './shaders/modules/tangent_vert_glsl';
import terrainDefault_pars_frag from './shaders/modules/terrainDefault_pars_frag_glsl';
import terrainMerge_pars_frag from './shaders/modules/terrainMerge_pars_frag_glsl';
import terrain_frag from './shaders/modules/terrain_frag_glsl';
import terrain_pars_frag from './shaders/modules/terrain_pars_frag_glsl';
import uv_pars_vert from './shaders/modules/uv_pars_vert_glsl';
import uv_vert from './shaders/modules/uv_vert_glsl';
import worldposition_pars_vert from './shaders/modules/worldposition_pars_vert_glsl';
import worldposition_vert from './shaders/modules/worldposition_vert_glsl';

export { };

serialization.setValue(shaderlib.shaderConfig, {
    shaders: {
        mouse: { fragment: mouseFragment, vertex: mouseVertex },
        outline: { fragment: outlineFragment, vertex: outlineVertex },
        Particles_Additive: { fragment: Particles_AdditiveFragment, vertex: Particles_AdditiveVertex },
        Particles_AlphaBlendedPremultiply: { fragment: Particles_AlphaBlendedPremultiplyFragment, vertex: Particles_AlphaBlendedPremultiplyVertex },
        shadow: { fragment: shadowFragment, vertex: shadowVertex },
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
