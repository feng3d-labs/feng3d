
precision mediump float;

//根据是否提供(a_particle_position)数据自动定义 #define D_(a_particle_position)

//此处将填充宏定义
#define macros

attribute vec3 a_position;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjection;

attribute float a_particle_birthTime;

#ifdef D_a_particle_position
    attribute vec3 a_particle_position;
#endif

#ifdef D_a_particle_velocity
    attribute vec3 a_particle_velocity;
#endif

#ifdef D_a_particle_color
    attribute vec4 a_particle_color;
    varying vec4 v_particle_color;
#endif

uniform float u_particleTime;

#ifdef D_u_particle_acceleration
    uniform vec3 u_particle_acceleration;
#endif

void main(void) {

    vec3 position = a_position;

    float pTime = u_particleTime - a_particle_birthTime;
    if(pTime > 0.0){

        vec3 pPosition = vec3(0.0,0.0,0.0);
        vec3 pVelocity = vec3(0.0,0.0,0.0);

        #ifdef D_a_particle_position
            pPosition = pPosition + a_particle_position;
        #endif

        #ifdef D_a_particle_velocity
            pVelocity = pVelocity + a_particle_velocity;
        #endif

        #ifdef D_u_particle_acceleration
            pVelocity = pVelocity + u_particle_acceleration * pTime;
        #endif
        
        #ifdef D_a_particle_color
            v_particle_color = a_particle_color;
        #endif

        pPosition = pPosition + pVelocity * pTime;
        position = position + pPosition;
    }
    
    vec4 globalPosition = u_modelMatrix * vec4(position, 1.0);
    gl_Position = u_viewProjection * globalPosition;
    gl_PointSize = 1.0;
}