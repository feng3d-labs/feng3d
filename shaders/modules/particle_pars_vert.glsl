#ifdef HAS_PARTICLE_ANIMATOR
    //
    attribute vec3 a_particle_position;
    attribute vec3 a_particle_scale;
    attribute vec3 a_particle_rotation;
    attribute vec4 a_particle_color;

    uniform mat4 u_particle_billboardMatrix;

    varying vec4 v_particle_color;

    mat3 makeParticleRotationMatrix(vec3 rotation)
    {
        float DEG2RAD = 3.1415926 / 180.0;
        
        float rx = rotation.x * DEG2RAD;
        float ry = rotation.y * DEG2RAD;
        float rz = rotation.z * DEG2RAD;

        float sx = sin(rx);
        float cx = cos(rx);
        float sy = sin(ry);
        float cy = cos(ry);
        float sz = sin(rz);
        float cz = cos(rz);

        mat3 tmp;
        tmp[ 0 ] = vec3(cy * cz, cy * sz, -sy);
        tmp[ 1 ] = vec3(sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy);
        tmp[ 2 ] = vec3(cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy);
        return tmp;
    }

    vec4 particleAnimation(vec4 position) 
    {
        // 计算缩放
        position.xyz = position.xyz * a_particle_scale;

        // 计算旋转
        mat3 rMat = makeParticleRotationMatrix(a_particle_rotation);
        position.xyz = rMat * position.xyz;

        // 位移
        position = u_particle_billboardMatrix * position;

        position.xyz = position.xyz + a_particle_position;

        // 颜色
        v_particle_color = a_particle_color;
        
        return position;
    }
#endif