precision mediump float;

//此处将填充宏定义
#define macros

varying vec2 v_uv;
varying vec3 v_globalPosition;
varying vec3 v_normal;

uniform mat4 u_cameraMatrix;

#include<modules/diffuse.declare>

void main(void) {

    vec4 finalColor = vec4(1.0,1.0,1.0,1.0);
    
    #include<modules/diffuse.main>

    gl_FragColor = finalColor;
}