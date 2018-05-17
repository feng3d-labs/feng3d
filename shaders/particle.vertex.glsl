precision mediump float;  

//坐标属性
attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec3 a_normal;

uniform mat4 u_modelMatrix;
uniform mat4 u_ITModelMatrix;
uniform mat4 u_viewProjection;

varying vec2 v_uv;

uniform float u_PointSize;

//
attribute float a_particle_birthTime;
attribute vec3 a_particle_position;
attribute vec3 a_particle_velocity;
attribute float a_particle_lifetime;
attribute vec4 a_particle_color;

varying vec4 v_particle_color;

uniform float u_particleTime;
uniform vec3 u_particle_acceleration;
uniform mat4 u_particle_billboardMatrix;

vec4 particleAnimation(vec4 position) {

    float pTime = u_particleTime - a_particle_birthTime;
    if(pTime > 0.0){

        pTime = mod(pTime,a_particle_lifetime);

        vec3 pVelocity = vec3(0.0,0.0,0.0);

        position = u_particle_billboardMatrix * position;
        position.xyz = position.xyz + a_particle_position;
        pVelocity = pVelocity + a_particle_velocity;
        pVelocity = pVelocity + u_particle_acceleration * pTime;
        v_particle_color = a_particle_color;

        position.xyz = position.xyz + pVelocity * pTime;
    }
    
    return position;
}

void main(void) {

    vec4 position = vec4(a_position,1.0);
    
    position = particleAnimation(position);

    vec3 normal = a_normal;

    //获取全局坐标
    vec4 globalPosition = u_modelMatrix * position;
    //计算投影坐标
    gl_Position = u_viewProjection * globalPosition;
    //输出uv
    v_uv = a_uv;

    gl_PointSize = u_PointSize;
}