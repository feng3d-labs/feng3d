#version 300 es
#define POSITION_LOCATION 0
#define NORMAL_LOCATION 1
#define TEXCOORD_LOCATION 4

precision highp float;
precision highp int;

uniform mat4 mvMatrix;
uniform mat4 pMatrix;
uniform sampler2D displacementMap;

layout(location = POSITION_LOCATION) in vec3 position;
layout(location = NORMAL_LOCATION) in vec3 normal;
layout(location = TEXCOORD_LOCATION) in vec2 texcoord;

out vec2 v_st;
out vec3 v_position;

void main()
{
    v_st = texcoord;
    float height = texture(displacementMap, texcoord).b;
    vec4 displacedPosition = vec4(position, 1.0) + vec4(normal * height, 0.0);
    v_position = vec3(mvMatrix * displacedPosition);
    gl_Position = pMatrix * mvMatrix * displacedPosition;
}
