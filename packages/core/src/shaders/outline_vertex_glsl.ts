export default `precision mediump float;  

//坐标属性
attribute vec3 a_position;
attribute vec3 a_normal;

#include<uv_pars_vert>

uniform mat4 u_modelMatrix;
uniform mat4 u_ITModelMatrix;
uniform vec3 u_cameraPos;
uniform mat4 u_viewProjection;
uniform float u_scaleByDepth;
uniform float u_outlineMorphFactor;

#include<skeleton_pars_vert>
#include<particle_pars_vert>

uniform float u_outlineSize;

void main() 
{
    vec4 position = vec4(a_position, 1.0);

    #include<uv_vert>

    #include<skeleton_vert>
    #include<particle_vert>
    
    vec3 normal = a_normal;

    //全局坐标
    vec4 worldPosition = u_modelMatrix * position;
    //全局法线
    vec3 globalNormal = normalize((u_ITModelMatrix * vec4(normal, 0.0)).xyz);

    float depth = distance(worldPosition.xyz , u_cameraPos.xyz);
    
    vec3 offsetDir = mix(globalNormal, normalize(worldPosition.xyz), u_outlineMorphFactor);
    //摄像机远近保持粗细一致
    offsetDir = offsetDir * depth * u_scaleByDepth;
    //描边宽度
    offsetDir = offsetDir * u_outlineSize;

    worldPosition.xyz = worldPosition.xyz + offsetDir;//

    //计算投影坐标
    gl_Position = u_viewProjection * worldPosition;
}`;
