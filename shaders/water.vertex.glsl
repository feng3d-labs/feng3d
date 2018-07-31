attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

uniform mat4 u_textureMatrix;

varying vec4 v_mirrorCoord;
varying vec4 v_worldPosition;

void main() 
{
	vec4 position = vec4(a_position,1.0);
	//获取全局坐标
    vec4 worldPosition = u_modelMatrix * position;
    //计算投影坐标
    gl_Position = u_viewProjection * worldPosition;
	
	v_worldPosition = worldPosition;
	v_mirrorCoord = u_textureMatrix * worldPosition;
}