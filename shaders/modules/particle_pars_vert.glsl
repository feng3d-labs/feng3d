#ifdef HAS_PARTICLE_ANIMATOR
    //
    attribute vec3 a_particle_position;
    attribute vec3 a_particle_scale;
    attribute vec3 a_particle_rotation;
    attribute vec4 a_particle_color;

    #ifdef ENABLED_PARTICLE_SYSTEM_textureSheetAnimation
        attribute vec4 a_particle_tilingOffset;
        attribute vec2 a_particle_flipUV;
    #endif

    uniform mat3 u_particle_billboardMatrix;

    varying vec4 v_particle_color;

    mat3 makeParticleRotationMatrix(vec3 rotation)
    {
        float DEG2RAD = 3.1415926 / 180.0;
        
        float rx = rotation.x * DEG2RAD;
        float ry = rotation.y * DEG2RAD;
        float rz = rotation.z * DEG2RAD;

        float sinX = sin(rx);
        float cosX = cos(rx);
        float sinY = sin(ry);
        float cosY = cos(ry);
        float sinZ = sin(rz);
        float cosZ = cos(rz);

        mat3 tmp;
        // XYZ
        // float ae = cosX * cosZ;
        // float af = cosX * sinZ;
        // float be = sinX * cosZ;
        // float bf = sinX * sinZ;

        // tmp[0] = vec3(cosY * cosZ, - cosY * sinZ, sinY);
        // tmp[1] = vec3(af + be * sinY, ae - bf * sinY, - sinX * cosY);
        // tmp[2] = vec3(bf - ae * sinY, be + af * sinY, cosX * cosY);

        // YXZ
        float ce = cosY * cosZ;
        float cf = cosY * sinZ;
        float de = sinY * cosZ;
        float df = sinY * sinZ;

        tmp[0] = vec3(ce + df * sinX, cosX * sinZ, cf * sinX - de);
        tmp[1] = vec3(de * sinX - cf, cosX * cosZ, df + ce * sinX);
        tmp[2] = vec3(cosX * sinY, - sinX, cosX * cosY);
        
        return tmp;
    }

    vec4 particleAnimation(vec4 position) 
    {
        // 计算缩放
        position.xyz = position.xyz * a_particle_scale;

        // 计算旋转
        mat3 rMat = makeParticleRotationMatrix(a_particle_rotation);
        position.xyz = rMat * position.xyz;
        position.xyz = u_particle_billboardMatrix * position.xyz;

        // 位移
        position.xyz = position.xyz + a_particle_position;

        // 颜色
        v_particle_color = a_particle_color;

        #ifdef ENABLED_PARTICLE_SYSTEM_textureSheetAnimation
            if(a_particle_flipUV.x > 0.5) v_uv.x = 1.0 - v_uv.x;
            if(a_particle_flipUV.y > 0.5) v_uv.y = 1.0 - v_uv.y;
            v_uv = v_uv * a_particle_tilingOffset.xy + a_particle_tilingOffset.zw;
        #endif
        
        return position;
    }
#endif