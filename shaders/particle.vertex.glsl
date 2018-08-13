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
attribute vec3 a_particle_acceleration;
attribute float a_particle_lifetime;
attribute vec4 a_particle_color;

varying vec4 v_particle_color;

uniform float u_particleTime;
uniform vec3 u_particle_position;
uniform vec3 u_particle_velocity;
uniform vec3 u_particle_acceleration;
uniform vec4 u_particle_color;
uniform mat4 u_particle_billboardMatrix;

vec3 particleAnimation(vec3 position) {

    float pTime = u_particleTime - a_particle_birthTime;
    if(pTime > 0.0){
        // 当前时间
        pTime = mod(pTime,a_particle_lifetime);

        // 加速度
        vec3 acceleration = a_particle_acceleration + u_particle_acceleration;

        // 速度
        vec3 pVelocity = a_particle_velocity + u_particle_velocity;
        pVelocity = pVelocity + acceleration * pTime;

        // 位移
        position = (u_particle_billboardMatrix * vec4(position,1.0)).xyz;
        position.xyz = position.xyz + a_particle_position + u_particle_position;
        position.xyz = position.xyz + pVelocity * pTime;

        // 颜色
        v_particle_color = a_particle_color * u_particle_color;
    }
    
    return position;
}

void main() {

    vec4 position = vec4(a_position,1.0);
    
    position.xyz = particleAnimation(position.xyz);

    vec3 normal = a_normal;

    //获取全局坐标
    vec4 worldPosition = u_modelMatrix * position;
    //计算投影坐标
    gl_Position = u_viewProjection * worldPosition;
    //输出uv
    v_uv = a_uv;

    gl_PointSize = u_PointSize;
}