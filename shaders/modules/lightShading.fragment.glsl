
#if NUM_POINTLIGHT > 0
    // 点光源
    struct PointLight
    {
        // 位置
        vec3 position;
        // 颜色
        vec3 color;
        // 强度
        float intensity;
        // 范围
        float range;
    };
    // 点光源列表
    uniform PointLight u_pointLights[NUM_POINTLIGHT];
#endif

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
    // 点光源投影uv列表
    varying vec4 v_pointShadowCoord[ NUM_POINTLIGHT_CASTSHADOW ];
#endif

#if NUM_DIRECTIONALLIGHT > 0
    // 方向光源
    struct DirectionalLight
    {
        // 方向
        vec3 direction;
        // 颜色
        vec3 color;
        // 强度
        float intensity;
    };
    // 方向光源列表
    uniform DirectionalLight u_directionalLights[ NUM_DIRECTIONALLIGHT ];
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
    };
    // 投影的方向光源列表
    uniform CastShadowDirectionalLight u_castShadowDirectionalLights[NUM_DIRECTIONALLIGHT_CASTSHADOW];
    // 方向光源阴影图
    uniform sampler2D u_directionalShadowMaps[NUM_DIRECTIONALLIGHT_CASTSHADOW];
    // 方向光源投影uv列表
    varying vec4 v_directionalShadowCoord[ NUM_DIRECTIONALLIGHT_CASTSHADOW ];
#endif

//卡通
#ifdef IS_CARTOON
    #include<cartoon.fragment>
#endif

//计算光照漫反射系数
float calculateLightDiffuse(vec3 normal,vec3 lightDir){
    #ifdef IS_CARTOON
        return cartoonLightDiffuse(normal,lightDir);
    #else
        return clamp(dot(normal,lightDir),0.0,1.0);
    #endif
}

//计算光照镜面反射系数
float calculateLightSpecular(vec3 normal,vec3 lightDir,vec3 viewDir,float glossiness){

    #ifdef IS_CARTOON
        return cartoonLightSpecular(normal,lightDir,viewDir,glossiness);
    #else
        vec3 halfVec = normalize(lightDir + viewDir);
        float specComp = max(dot(normal,halfVec),0.0);
        specComp = pow(specComp, glossiness);

        return specComp;
    #endif
}

//根据距离计算衰减
float computeDistanceLightFalloff(float lightDistance, float range)
{
    #ifdef USEPHYSICALLIGHTFALLOFF
        float lightDistanceFalloff = 1.0 / ((lightDistance * lightDistance + 0.0001));
    #else
        float lightDistanceFalloff = max(0., 1.0 - lightDistance / range);
    #endif
    
    return lightDistanceFalloff;
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
float getShadow( sampler2D shadowMap, int shadowType, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) 
{
    float shadow = 1.0;

    shadowCoord.xyz /= shadowCoord.w;
	shadowCoord = (shadowCoord + 1.0) / 2.0;
    shadowCoord.z += shadowBias;

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
    // #X##		dim    := ( 4 , 2 )
    //  # #		center := ( 1 , 1 )

    vec2 planar = v.xy;

    float almostATexel = 1.5 * texelSizeY;
    float almostOne = 1.0 - almostATexel;

    if ( absV.z >= almostOne ) {

        if ( v.z > 0.0 )
            planar.x = 4.0 - v.x;

    } else if ( absV.x >= almostOne ) {

        float signX = sign( v.x );
        planar.x = v.z * signX + 2.0 * signX;

    } else if ( absV.y >= almostOne ) {

        float signY = sign( v.y );
        planar.x = v.x + 2.0 * signY + 2.0;
        planar.y = v.z * signY - 2.0;

    }

    // Transform to UV space

    // scale := 0.5 / dim
    // translate := ( center + 0.5 ) / dim
    return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );

}

float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {

    vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );

    // for point lights, the uniform @vShadowCoord is re-purposed to hold
    // the vector from the light to the world-space position of the fragment.
    vec3 lightToPosition = shadowCoord.xyz;

    // dp = normalized distance from light to fragment position
    float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear ); // need to clamp?
    dp += shadowBias;

    // bd3D = base direction 3D
    vec3 bd3D = normalize( lightToPosition );

    #if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT )

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

    #else // no percentage-closer filtering

        return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );

    #endif

}

//渲染点光源
vec3 lightShading(vec3 normal,vec3 diffuseColor,vec3 specularColor,vec3 ambientColor,float glossiness){

    //视线方向
    vec3 viewDir = normalize(u_cameraMatrix[3].xyz - v_worldPosition);

    vec3 totalDiffuseLightColor = vec3(0.0,0.0,0.0);
    vec3 totalSpecularLightColor = vec3(0.0,0.0,0.0);
    #if NUM_POINTLIGHT > 0
        PointLight pointLight;
        for(int i = 0;i<NUM_POINTLIGHT;i++){
            pointLight = u_pointLights[i];
            //
            vec3 lightOffset = pointLight.position - v_worldPosition;
            float lightDistance = length(lightOffset);
            //光照方向
            vec3 lightDir = normalize(lightOffset);
            //灯光颜色
            vec3 lightColor = pointLight.color;
            //灯光强度
            float lightIntensity = pointLight.intensity;
            //光照范围
            float range = pointLight.range;
            float attenuation = computeDistanceLightFalloff(lightDistance,range);
            lightIntensity = lightIntensity * attenuation;
            //
            totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir) * lightColor * lightIntensity;
            totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,viewDir,glossiness) * lightColor * lightIntensity;
        }
    #endif

    #if NUM_POINTLIGHT_CASTSHADOW > 0
        CastShadowPointLight castShadowPointLight;
        for(int i = 0;i<NUM_POINTLIGHT_CASTSHADOW;i++){
            castShadowPointLight = u_castShadowPointLights[i];
            //
            vec3 lightOffset = castShadowPointLight.position - v_worldPosition;
            float lightDistance = length(lightOffset);
            //光照方向
            vec3 lightDir = normalize(lightOffset);
            //灯光颜色
            vec3 lightColor = castShadowPointLight.color;
            //灯光强度
            float lightIntensity = castShadowPointLight.intensity;
            //光照范围
            float range = castShadowPointLight.range;
            float attenuation = computeDistanceLightFalloff(lightDistance,range);
            lightIntensity = lightIntensity * attenuation;
            // 计算阴影
            float shadow = getPointShadow( u_pointShadowMaps[ i ], castShadowPointLight.shadowMapSize, castShadowPointLight.shadowBias, castShadowPointLight.shadowRadius, v_pointShadowCoord[ i ], castShadowPointLight.shadowCameraNear, castShadowPointLight.shadowCameraFar );
            //
            totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir) * lightColor * lightIntensity * shadow;
            totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,viewDir,glossiness) * lightColor * lightIntensity * shadow;
        }
    #endif

    #if NUM_DIRECTIONALLIGHT > 0
        DirectionalLight directionalLight;
        for(int i = 0;i<NUM_DIRECTIONALLIGHT;i++){
            directionalLight = u_directionalLights[i];
            //光照方向
            vec3 lightDir = normalize(-directionalLight.direction);
            //灯光颜色
            vec3 lightColor = directionalLight.color;
            //灯光强度
            float lightIntensity = directionalLight.intensity;
            //
            totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir) * lightColor * lightIntensity;
            totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,viewDir,glossiness) * lightColor * lightIntensity;
        }
    #endif

    #if NUM_DIRECTIONALLIGHT_CASTSHADOW > 0
        CastShadowDirectionalLight castShadowDirectionalLight;
        for(int i = 0;i<NUM_DIRECTIONALLIGHT_CASTSHADOW;i++){
            castShadowDirectionalLight = u_castShadowDirectionalLights[i];
            //光照方向
            vec3 lightDir = normalize(-castShadowDirectionalLight.direction);
            //灯光颜色
            vec3 lightColor = castShadowDirectionalLight.color;
            //灯光强度
            float lightIntensity = castShadowDirectionalLight.intensity;
            // 计算阴影
            float shadow = getShadow( u_directionalShadowMaps[i], castShadowDirectionalLight.shadowType, castShadowDirectionalLight.shadowMapSize, castShadowDirectionalLight.shadowBias, castShadowDirectionalLight.shadowRadius, v_directionalShadowCoord[ i ] );
            //
            totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir) * lightColor * lightIntensity * shadow;
            totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,viewDir,glossiness) * lightColor * lightIntensity * shadow;
        }
    #endif

    vec3 resultColor = vec3(0.0,0.0,0.0);
    resultColor = resultColor + totalDiffuseLightColor * diffuseColor;
    resultColor = resultColor + totalSpecularLightColor * specularColor;
    resultColor = resultColor + ambientColor * diffuseColor;
    return resultColor;
}