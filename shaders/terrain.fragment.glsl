precision mediump float;

varying vec2 v_uv;
varying vec3 v_worldPosition;
varying vec3 v_normal;

varying vec3 v_tangent;
varying vec3 v_bitangent;

uniform mat4 u_cameraMatrix;

uniform float u_alphaThreshold;
//漫反射
uniform vec4 u_diffuse;
uniform sampler2D s_diffuse;

//法线贴图
uniform sampler2D s_normal;

//镜面反射
uniform vec3 u_specular;
uniform float u_glossiness;
uniform sampler2D s_specular;

uniform vec4 u_sceneAmbientColor;

//环境
uniform vec4 u_ambient;
uniform sampler2D s_ambient;

#include<packing>
#include<terrain.fragment>

#include<lightShading.fragment>

#include<fog.fragment>

#include<envmap.fragment>

void main(void)
{
    vec4 finalColor = vec4(1.0,1.0,1.0,1.0);

    //获取法线
    vec3 normal = texture2D(s_normal,v_uv).xyz * 2.0 - 1.0;
    normal = normalize(normal.x * v_tangent + normal.y * v_bitangent + normal.z * v_normal);

    // vec3 normal = v_normal;

    //获取漫反射基本颜色
    vec4 diffuseColor = u_diffuse;
    diffuseColor = diffuseColor * texture2D(s_diffuse, v_uv);

    if(diffuseColor.w < u_alphaThreshold)
    {
        discard;
    }

    diffuseColor = terrainMethod(diffuseColor, v_uv);

    //环境光
    vec3 ambientColor = u_ambient.w * u_ambient.xyz * u_sceneAmbientColor.xyz * u_sceneAmbientColor.w;
    ambientColor = ambientColor * texture2D(s_ambient, v_uv).xyz;

    finalColor = diffuseColor;

    //渲染灯光
    //获取高光值
    float glossiness = u_glossiness;
    //获取镜面反射基本颜色
    vec3 specularColor = u_specular;
    #ifdef HAS_SPECULAR_SAMPLER
        vec4 specularMapColor = texture2D(s_specular, v_uv);
        specularColor.xyz = specularMapColor.xyz;
        glossiness = glossiness * specularMapColor.w;
    #endif
    
    finalColor.xyz = lightShading(normal, diffuseColor.xyz, specularColor, ambientColor, glossiness);

    finalColor = envmapMethod(finalColor);

    finalColor = fogMethod(finalColor);

    gl_FragColor = finalColor;
}