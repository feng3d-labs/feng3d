attribute vec3 a_position;

uniform mat4 u_modelMatrix;

uniform mat4 textureMatrix;
uniform float time;

varying vec4 mirrorCoord;
varying vec4 worldPosition;

void main() {

	mirrorCoord = u_modelMatrix * vec4( a_position, 1.0 );
	worldPosition = mirrorCoord.xyzw;
	mirrorCoord = textureMatrix * mirrorCoord;
	vec4 mvPosition =  modelViewMatrix * vec4( a_position, 1.0 );
	gl_Position = projectionMatrix * mvPosition;
}