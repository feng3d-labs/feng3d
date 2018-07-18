precision mediump float;

#include<packing>

varying vec4 v_directionalShadowCoord;

void main() {

    gl_FragColor = packDepthToRGBA( v_directionalShadowCoord.z );
}