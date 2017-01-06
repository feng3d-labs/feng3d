precision mediump float;

uniform vec4 u_diffuseInput;
varying vec2 v_uv;
varying vec3 v_globalPosition;
varying vec3 v_normal;
uniform mat4 u_cameraMatrix;

#include<modules/pointLightShading.declare>

void main(void) {

    vec4 finalColor = u_diffuseInput;

    #include<modules/pointLightShading.main>

    gl_FragColor = finalColor;
}