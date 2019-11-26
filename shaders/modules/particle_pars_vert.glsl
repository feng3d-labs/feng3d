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

    #define RotationOrder_XYZ 0
    #define RotationOrder_ZXY 1
    #define RotationOrder_ZYX 2
    #define RotationOrder_YXZ 3
    #define RotationOrder_YZX 4
    #define RotationOrder_XZY 5

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
        #ifdef RotationOrder
            #if RotationOrder == RotationOrder_XYZ
                float ae = cosX * cosZ;
                float af = cosX * sinZ;
                float be = sinX * cosZ;
                float bf = sinX * sinZ;

                float te0 = cosY * cosZ;
                float te4 = - cosY * sinZ;
                float te8 = sinY;

                float te1 = af + be * sinY;
                float te5 = ae - bf * sinY;
                float te9 = - sinX * cosY;

                float te2 = bf - ae * sinY;
                float te6 = be + af * sinY;
                float te10 = cosX * cosY;
            #endif
            #if RotationOrder == RotationOrder_YXZ
                float ce = cosY * cosZ;
                float cf = cosY * sinZ;
                float de = sinY * cosZ;
                float df = sinY * sinZ;

                float te0 = ce + df * sinX;
                float te4 = de * sinX - cf;
                float te8 = cosX * sinY;

                float te1 = cosX * sinZ;
                float te5 = cosX * cosZ;
                float te9 = - sinX;

                float te2 = cf * sinX - de;
                float te6 = df + ce * sinX;
                float te10 = cosX * cosY;
            #endif
            #if RotationOrder == RotationOrder_ZXY
                float ce = cosY * cosZ;
                float cf = cosY * sinZ;
                float de = sinY * cosZ;
                float df = sinY * sinZ;

                float te0 = ce - df * sinX;
                float te4 = - cosX * sinZ;
                float te8 = de + cf * sinX;

                float te1 = cf + de * sinX;
                float te5 = cosX * cosZ;
                float te9 = df - ce * sinX;

                float te2 = - cosX * sinY;
                float te6 = sinX;
                float te10 = cosX * cosY;
            #endif
            #if RotationOrder == RotationOrder.ZYX
                float ae = cosX * cosZ;
                float af = cosX * sinZ;
                float be = sinX * cosZ;
                float bf = sinX * sinZ;

                float te0 = cosY * cosZ;
                float te4 = be * sinY - af;
                float te8 = ae * sinY + bf;

                float te1 = cosY * sinZ;
                float te5 = bf * sinY + ae;
                float te9 = af * sinY - be;

                float te2 = - sinY;
                float te6 = sinX * cosY;
                float te10 = cosX * cosY;
            #endif
            #if RotationOrder == RotationOrder.YZX
                float ac = cosX * cosY;
                float ad = cosX * sinY;
                float bc = sinX * cosY;
                float bd = sinX * sinY;

                float te0 = cosY * cosZ;
                float te4 = bd - ac * sinZ;
                float te8 = bc * sinZ + ad;

                float te1 = sinZ;
                float te5 = cosX * cosZ;
                float te9 = - sinX * cosZ;

                float te2 = - sinY * cosZ;
                float te6 = ad * sinZ + bc;
                float te10 = ac - bd * sinZ;
            #endif
            #if RotationOrder == RotationOrder.XZY
                float ac = cosX * cosY;
                float ad = cosX * sinY;
                float bc = sinX * cosY;
                float bd = sinX * sinY;

                float te0 = cosY * cosZ;
                float te4 = - sinZ;
                float te8 = sinY * cosZ;

                float te1 = ac * sinZ + bd;
                float te5 = cosX * cosZ;
                float te9 = ad * sinZ - bc;

                float te2 = bc * sinZ - ad;
                float te6 = sinX * cosZ;
                float te10 = bd * sinZ + ac;
            #endif
        #else
            // YXZ
            float ce = cosY * cosZ;
            float cf = cosY * sinZ;
            float de = sinY * cosZ;
            float df = sinY * sinZ;

            float te0 = ce + df * sinX;
            float te4 = de * sinX - cf;
            float te8 = cosX * sinY;

            float te1 = cosX * sinZ;
            float te5 = cosX * cosZ;
            float te9 = - sinX;

            float te2 = cf * sinX - de;
            float te6 = df + ce * sinX;
            float te10 = cosX * cosY;
        #endif
        
        tmp[0] = vec3(te0, te1, te2);
        tmp[1] = vec3(te4, te5, te6);
        tmp[2] = vec3(te8, te9, te10);
        
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