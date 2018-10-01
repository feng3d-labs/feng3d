precision mediump float;

varying vec2 v_uv;
varying vec3 v_worldPosition;

#include<normal_pars_frag>
#include<diffuse_pars_frag>
#include<alphatest_pars_frag>


uniform mat4 u_cameraMatrix;

//镜面反射
uniform vec3 u_specular;
uniform float u_glossiness;
uniform sampler2D s_specular;

uniform vec4 u_sceneAmbientColor;

//环境
uniform vec4 u_ambient;
uniform sampler2D s_ambient;

#include<packing_pars>
#include<lights_pars_frag>
#include<fog_pars_frag>
#include<envmap_pars_frag>
#include<particle_pars_frag>

void main()
{
    vec4 finalColor = vec4(1.0,1.0,1.0,1.0);

    #include<normal_frag>
    #include<diffuse_frag>
    #include<alphatest_frag>

    //环境光
    vec3 ambientColor = u_ambient.w * u_ambient.xyz * u_sceneAmbientColor.xyz * u_sceneAmbientColor.w;
    ambientColor = ambientColor * texture2D(s_ambient, v_uv).xyz;

    finalColor = diffuseColor;

    //渲染灯光
    #if NUM_LIGHT > 0
        //获取高光值
        float glossiness = u_glossiness;
        //获取镜面反射基本颜色
        vec3 specularColor = u_specular;
        vec4 specularMapColor = texture2D(s_specular, v_uv);
        specularColor.xyz = specularMapColor.xyz;
        glossiness = glossiness * specularMapColor.w;
        
        finalColor.xyz = lightShading(normal, diffuseColor.xyz, specularColor, ambientColor, glossiness);
    #endif


    #include<envmap_frag>
    #include<particle_frag>
    #include<fog_frag>

    gl_FragColor = finalColor;
}