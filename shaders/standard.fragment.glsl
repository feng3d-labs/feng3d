#version 300 es
precision mediump float;

//此处将填充宏定义
#define macros

in vec2 v_uv;
in vec3 v_globalPosition;
in vec3 v_normal;

uniform mat4 u_cameraMatrix;
//基本颜色
uniform vec4 u_baseColor;

#include<modules/pointLightShading.declare>

out vec4 o_fragColor;

void main(void) {

    vec4 finalColor = u_baseColor;
    
    //渲染灯光
    #include<modules/pointLightShading.main>

    o_fragColor = finalColor;
}