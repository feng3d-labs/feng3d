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

#if NUM_SPOT_LIGHTS > 0
    // 聚光灯
    struct SpotLight
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
    };
    // 方向光源列表
    uniform SpotLight u_spotLights[ NUM_SPOT_LIGHTS ];
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



//卡通
#ifdef IS_CARTOON
    #include<cartoon.fragment>
#endif

#include<shadowmap_declare.fragment>

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

//渲染点光源
vec3 lightShading(vec3 normal, vec3 diffuseColor, vec3 specularColor, vec3 ambientColor, float glossiness)
{
    //视线方向
    vec3 viewDir = normalize(u_cameraMatrix[3].xyz - v_worldPosition);

    vec3 resultColor = vec3(0.0,0.0,0.0);
    
    #if NUM_POINTLIGHT > 0
        PointLight pointLight;
        for(int i = 0;i<NUM_POINTLIGHT;i++)
        {
            pointLight = u_pointLights[i];
            //
            vec3 lightOffset = pointLight.position - v_worldPosition;
            //光照方向
            vec3 lightDir = normalize(lightOffset);
            //灯光颜色
            vec3 lightColor = pointLight.color;
            //灯光强度
            float lightIntensity = pointLight.intensity;
            float falloff = computeDistanceLightFalloff(length(lightOffset), pointLight.range);
            float diffuse = calculateLightDiffuse(normal, lightDir);
            float specular = calculateLightSpecular(normal, lightDir, viewDir, glossiness);
            float shadow = 1.0;
            
            resultColor += (diffuse * diffuseColor + specular * specularColor) * lightColor * lightIntensity * falloff * shadow;
        }
    #endif

    #if NUM_POINTLIGHT_CASTSHADOW > 0
        CastShadowPointLight castShadowPointLight;
        for(int i = 0;i<NUM_POINTLIGHT_CASTSHADOW;i++)
        {
            castShadowPointLight = u_castShadowPointLights[i];
            //
            vec3 lightOffset = castShadowPointLight.position - v_worldPosition;
            //光照方向
            vec3 lightDir = normalize(lightOffset);
            //灯光颜色
            vec3 lightColor = castShadowPointLight.color;
            //灯光强度
            float lightIntensity = castShadowPointLight.intensity;
            float falloff = computeDistanceLightFalloff(length(lightOffset), castShadowPointLight.range);
            // 计算阴影
            float shadow = getPointShadow( u_pointShadowMaps[ i ], castShadowPointLight.shadowType, castShadowPointLight.shadowMapSize, castShadowPointLight.shadowBias, castShadowPointLight.shadowRadius, -lightOffset, castShadowPointLight.shadowCameraNear, castShadowPointLight.shadowCameraFar );
            float diffuse = calculateLightDiffuse(normal, lightDir);
            float specular = calculateLightSpecular(normal, lightDir, viewDir, glossiness);
            //
            resultColor += (diffuse * diffuseColor + specular * specularColor) * lightColor * lightIntensity * falloff * shadow;
        }
    #endif

    #if NUM_SPOT_LIGHTS > 0
        SpotLight spotLight;
        for(int i = 0; i < NUM_SPOT_LIGHTS; i++)
        {
            spotLight = u_spotLights[i];
            //
            vec3 lightOffset = spotLight.position - v_worldPosition;
            //光照方向
            vec3 lightDir = normalize(lightOffset);
            float angleCos = dot(lightDir, -spotLight.direction);
            if(angleCos > spotLight.coneCos)
            {
                float spotEffect = smoothstep( spotLight.coneCos, spotLight.penumbraCos, angleCos );
                
                //灯光颜色
                vec3 lightColor = spotLight.color;
                //灯光强度
                float lightIntensity = spotLight.intensity;
                float falloff = computeDistanceLightFalloff(length(lightOffset) * angleCos, spotLight.range);
                float diffuse = calculateLightDiffuse(normal, lightDir);
                float specular = calculateLightSpecular(normal, lightDir, viewDir, glossiness);
                float shadow = 1.0;
                
                resultColor += (diffuse * diffuseColor + specular * specularColor) * lightColor * lightIntensity * falloff * shadow * spotEffect;
            }            
        }
    #endif
    
    #if NUM_SPOT_LIGHTS_CASTSHADOW > 0
        CastShadowSpotLight castShadowSpotLight;
        for(int i = 0; i < NUM_SPOT_LIGHTS_CASTSHADOW; i++)
        {
            castShadowSpotLight = u_castShadowSpotLights[i];
            //
            vec3 lightOffset = castShadowSpotLight.position - v_worldPosition;
            //光照方向
            vec3 lightDir = normalize(lightOffset);
            float angleCos = dot(lightDir, -castShadowSpotLight.direction);
            if(angleCos > castShadowSpotLight.coneCos)
            {
                float spotEffect = smoothstep( castShadowSpotLight.coneCos, castShadowSpotLight.penumbraCos, angleCos );
                
                //灯光颜色
                vec3 lightColor = castShadowSpotLight.color;
                //灯光强度
                float lightIntensity = castShadowSpotLight.intensity;
                float falloff = computeDistanceLightFalloff(length(lightOffset) * angleCos, castShadowSpotLight.range);
                float diffuse = calculateLightDiffuse(normal, lightDir);
                float specular = calculateLightSpecular(normal, lightDir, viewDir, glossiness);
                // 计算阴影
                float shadow = getShadow( u_spotShadowMaps[i], castShadowSpotLight.shadowType, castShadowSpotLight.shadowMapSize, castShadowSpotLight.shadowBias, castShadowSpotLight.shadowRadius, v_spotShadowCoord[ i ], -lightOffset, castShadowSpotLight.shadowCameraNear, castShadowSpotLight.shadowCameraFar);
                
                resultColor += (diffuse * diffuseColor + specular * specularColor) * lightColor * lightIntensity * falloff * shadow * spotEffect;
            }            
        }
    #endif

    #if NUM_DIRECTIONALLIGHT > 0
        DirectionalLight directionalLight;
        for(int i = 0;i<NUM_DIRECTIONALLIGHT;i++)
        {
            directionalLight = u_directionalLights[i];
            //光照方向
            vec3 lightDir = normalize(-directionalLight.direction);
            //灯光颜色
            vec3 lightColor = directionalLight.color;
            //灯光强度
            float lightIntensity = directionalLight.intensity;

            float falloff = 1.0;
            float diffuse = calculateLightDiffuse(normal, lightDir);
            float specular = calculateLightSpecular(normal, lightDir, viewDir, glossiness);
            float shadow = 1.0;
            //
            resultColor += (diffuse * diffuseColor + specular * specularColor) * lightColor * lightIntensity * falloff * shadow;
        }
    #endif

    #if NUM_DIRECTIONALLIGHT_CASTSHADOW > 0
        CastShadowDirectionalLight castShadowDirectionalLight;
        for(int i = 0;i<NUM_DIRECTIONALLIGHT_CASTSHADOW;i++)
        {
            castShadowDirectionalLight = u_castShadowDirectionalLights[i];
            //
            vec3 lightOffset = castShadowDirectionalLight.position - v_worldPosition;
            //光照方向
            vec3 lightDir = normalize(-castShadowDirectionalLight.direction);
            //灯光颜色
            vec3 lightColor = castShadowDirectionalLight.color;
            //灯光强度
            float lightIntensity = castShadowDirectionalLight.intensity;
            // 计算阴影
            float shadow = getShadow( u_directionalShadowMaps[i], castShadowDirectionalLight.shadowType, castShadowDirectionalLight.shadowMapSize, castShadowDirectionalLight.shadowBias, castShadowDirectionalLight.shadowRadius, v_directionalShadowCoord[ i ], -lightOffset, castShadowDirectionalLight.shadowCameraNear, castShadowDirectionalLight.shadowCameraFar);
            
            float falloff = 1.0;
            float diffuse = calculateLightDiffuse(normal, lightDir);
            float specular = calculateLightSpecular(normal, lightDir, viewDir, glossiness);
            //
            resultColor += (diffuse * diffuseColor + specular * specularColor) * lightColor * lightIntensity * falloff * shadow;
        }
    #endif

    resultColor += ambientColor * diffuseColor;
    return resultColor;
}