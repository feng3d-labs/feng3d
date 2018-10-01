#if (NUM_POINTLIGHT_CASTSHADOW > 0) ||  (NUM_DIRECTIONALLIGHT_CASTSHADOW > 0) ||  (NUM_SPOT_LIGHTS_CASTSHADOW > 0)
    #if NUM_POINTLIGHT_CASTSHADOW > 0
        // 投影的点光源
        struct CastShadowPointLight
        {
            // 位置
            vec3 position;
            // 颜色
            vec3 color;
            // 强度
            float intensity;
            // 范围
            float range;
            // 阴影类型
            int shadowType;
            // 阴影偏差，用来解决判断是否为阴影时精度问题
            float shadowBias;
            // 阴影半径，边缘宽度
            float shadowRadius;
            // 阴影图尺寸
            vec2 shadowMapSize;
            float shadowCameraNear;
            float shadowCameraFar;
        };
        // 投影的点光源列表
        uniform CastShadowPointLight u_castShadowPointLights[NUM_POINTLIGHT_CASTSHADOW];
        // 点光源阴影图
        uniform sampler2D u_pointShadowMaps[NUM_POINTLIGHT_CASTSHADOW];
    #endif

    #if NUM_SPOT_LIGHTS_CASTSHADOW > 0
        // 投影的聚光灯
        struct CastShadowSpotLight
        {
            // 位置
            vec3 position;
            // 颜色
            vec3 color;
            // 强度
            float intensity;
            // 范围
            float range;
            // 方向
            vec3 direction;
            // 椎体cos值
            float coneCos;
            // 半影cos
            float penumbraCos;

            // 阴影类型
            int shadowType;
            // 阴影偏差，用来解决判断是否为阴影时精度问题
            float shadowBias;
            // 阴影半径，边缘宽度
            float shadowRadius;
            // 阴影图尺寸
            vec2 shadowMapSize;
            float shadowCameraNear;
            float shadowCameraFar;
        };
        // 投影的投影的聚光灯列表
        uniform CastShadowSpotLight u_castShadowSpotLights[NUM_SPOT_LIGHTS_CASTSHADOW];
        // 投影的聚光灯阴影图
        uniform sampler2D u_spotShadowMaps[NUM_SPOT_LIGHTS_CASTSHADOW];
        // 方向光源投影uv列表
        varying vec4 v_spotShadowCoord[ NUM_SPOT_LIGHTS_CASTSHADOW ];
    #endif

    #if NUM_DIRECTIONALLIGHT_CASTSHADOW > 0
        // 投影的方向光源
        struct CastShadowDirectionalLight
        {
            // 方向
            vec3 direction;
            // 颜色
            vec3 color;
            // 强度
            float intensity;
            // 阴影类型
            int shadowType;
            // 阴影偏差，用来解决判断是否为阴影时精度问题
            float shadowBias;
            // 阴影半径，边缘宽度
            float shadowRadius;
            // 阴影图尺寸
            vec2 shadowMapSize;
            // 位置
            vec3 position;
            float shadowCameraNear;
            float shadowCameraFar;
        };
        // 投影的方向光源列表
        uniform CastShadowDirectionalLight u_castShadowDirectionalLights[NUM_DIRECTIONALLIGHT_CASTSHADOW];
        // 方向光源阴影图
        uniform sampler2D u_directionalShadowMaps[NUM_DIRECTIONALLIGHT_CASTSHADOW];
        // 方向光源投影uv列表
        varying vec4 v_directionalShadowCoord[ NUM_DIRECTIONALLIGHT_CASTSHADOW ];
    #endif

    // @see https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/packing.glsl
    const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)
    const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );
    const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
    float unpackRGBAToDepth( const in vec4 v ) 
    {
        return dot( v, UnpackFactors );
    }

    float texture2DCompare( sampler2D depths, vec2 uv, float compare ) 
    {
        return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
    }

    float texture2DShadowLerp( sampler2D depths, vec2 size, vec2 uv, float compare ) {

        const vec2 offset = vec2( 0.0, 1.0 );

        vec2 texelSize = vec2( 1.0 ) / size;
        vec2 centroidUV = floor( uv * size + 0.5 ) / size;

        float lb = texture2DCompare( depths, centroidUV + texelSize * offset.xx, compare );
        float lt = texture2DCompare( depths, centroidUV + texelSize * offset.xy, compare );
        float rb = texture2DCompare( depths, centroidUV + texelSize * offset.yx, compare );
        float rt = texture2DCompare( depths, centroidUV + texelSize * offset.yy, compare );

        vec2 f = fract( uv * size + 0.5 );

        float a = mix( lb, lt, f.y );
        float b = mix( rb, rt, f.y );
        float c = mix( a, b, f.x );

        return c;
    }

    // 计算阴影值 @see https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/shadowmap_pars_fragment.glsl
    float getShadow( sampler2D shadowMap, int shadowType, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, vec3 lightToPosition, float shadowCameraNear, float shadowCameraFar) 
    {
        float shadow = 1.0;

        shadowCoord.xy /= shadowCoord.w;
        shadowCoord.xy = (shadowCoord.xy + 1.0) / 2.0;

        // dp = normalized distance from light to fragment position
        float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear ); // need to clamp?
        dp += shadowBias;
        shadowCoord.z = dp;

        // if ( something && something ) breaks ATI OpenGL shader compiler
        // if ( all( something, something ) ) using this instead

        bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
        bool inFrustum = all( inFrustumVec );

        bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );

        bool frustumTest = all( frustumTestVec );

        if ( frustumTest ) {

            if (shadowType == 2)
            {
                // PCF
                vec2 texelSize = vec2( 1.0 ) / shadowMapSize;

                float dx0 = - texelSize.x * shadowRadius;
                float dy0 = - texelSize.y * shadowRadius;
                float dx1 = + texelSize.x * shadowRadius;
                float dy1 = + texelSize.y * shadowRadius;

                shadow = (
                    texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
                    texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
                    texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
                    texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
                    texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
                    texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
                    texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
                    texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
                    texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
                ) * ( 1.0 / 9.0 );
            }
            else if(shadowType == 3)
            {
                // PCF soft
                vec2 texelSize = vec2( 1.0 ) / shadowMapSize;

                float dx0 = - texelSize.x * shadowRadius;
                float dy0 = - texelSize.y * shadowRadius;
                float dx1 = + texelSize.x * shadowRadius;
                float dy1 = + texelSize.y * shadowRadius;

                shadow = (
                    texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
                    texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
                    texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
                    texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
                    texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy, shadowCoord.z ) +
                    texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
                    texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
                    texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
                    texture2DShadowLerp( shadowMap, shadowMapSize, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
                ) * ( 1.0 / 9.0 );
            }
            else
            {
                shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
            }
        }

        return shadow;
    }

    // cubeToUV() maps a 3D direction vector suitable for cube texture mapping to a 2D
    // vector suitable for 2D texture mapping. This code uses the following layout for the
    // 2D texture:
    //
    // xzXZ
    //  y Y
    //
    // Y - Positive y direction
    // y - Negative y direction
    // X - Positive x direction
    // x - Negative x direction
    // Z - Positive z direction
    // z - Negative z direction
    //
    // Source and test bed:
    // https://gist.github.com/tschw/da10c43c467ce8afd0c4

    vec2 cubeToUV( vec3 v, float texelSizeY ) {

        // Number of texels to avoid at the edge of each square

        vec3 absV = abs( v );

        // Intersect unit cube

        float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
        absV *= scaleToCube;

        // Apply scale to avoid seams

        // two texels less per square (one texel will do for NEAREST)
        v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );

        // Unwrap

        // space: -1 ... 1 range for each square
        //
        // #X##		dim    := ( 1/4 , 1/2 )
        //  # #		center := ( 1/2 , 1/2 )

        vec2 planar;

        float almostOne = 1.0 - 1.5 * texelSizeY;

        if ( absV.z >= almostOne ) {

            if ( v.z > 0.0 )
            {
                planar.x = (0.5 + v.x * 0.5) * 0.25 + 0.75;
                planar.y = (0.5 + v.y * 0.5) * 0.5 + 0.5;
            }else
            {
                planar.x = (0.5 - v.x * 0.5) * 0.25 + 0.25;
                planar.y = (0.5 + v.y * 0.5) * 0.5 + 0.5;
            }
        } else if ( absV.x >= almostOne ) {

            if( v.x > 0.0)
            {
                planar.x = (0.5 - v.z * 0.5) * 0.25 + 0.5;
                planar.y = (0.5 + v.y * 0.5) * 0.5 + 0.5;
            }else
            {
                planar.x = (0.5 + v.z * 0.5) * 0.25 + 0.0;
                planar.y = (0.5 + v.y * 0.5) * 0.5 + 0.5;
            }
        } else if ( absV.y >= almostOne ) {

            if( v.y > 0.0)
            {
                planar.x = (0.5 - v.x * 0.5) * 0.25 + 0.75;
                planar.y = (0.5 + v.z * 0.5) * 0.5 + 0.0;
            }else
            {
                planar.x = (0.5 - v.x * 0.5) * 0.25 + 0.25;
                planar.y = (0.5 - v.z * 0.5) * 0.5 + 0.0;
            }
        }
        return planar;
    }

    float getPointShadow( sampler2D shadowMap, int shadowType, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec3 lightToPosition, float shadowCameraNear, float shadowCameraFar ) {

        vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );

        // for point lights, the uniform @vShadowCoord is re-purposed to hold
        // the vector from the light to the world-space position of the fragment.
        // vec3 lightToPosition = shadowCoord.xyz;

        // dp = normalized distance from light to fragment position
        float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear ); // need to clamp?
        dp += shadowBias;

        // bd3D = base direction 3D
        vec3 bd3D = normalize( lightToPosition );

        if(shadowType == 2 || shadowType == 3)
        {
            vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;

            return (
                texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
                texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
                texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
                texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
                texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
                texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
                texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
                texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
                texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
            ) * ( 1.0 / 9.0 );
        }else
        {
            return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
        }
    }
#endif