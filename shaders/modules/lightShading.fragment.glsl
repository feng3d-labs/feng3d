#ifdef NUM_POINTLIGHT
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
        uniform PointLight pointLights[NUM_POINTLIGHT];
    #endif
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
    uniform DirectionalLight directionalLights[ NUM_DIRECTIONALLIGHT ];
#endif

#if NUM_DIRECTIONALLIGHT_CASTSHADOW > 0
    // 投影的方向光源
    struct DirectionalLightCastShadow
    {
        // 方向
        vec3 direction;
        // 颜色
        vec3 color;
        // 强度
        float intensity;
        // 阴影图
        sampler2D shadowMap;
    };
    // 投影的方向光源列表
    uniform DirectionalLightCastShadow directionalLightCastShadow[NUM_DIRECTIONALLIGHT_CASTSHADOW];
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

//渲染点光源
vec3 lightShading(vec3 normal,vec3 diffuseColor,vec3 specularColor,vec3 ambientColor,float glossiness){

    //视线方向
    vec3 viewDir = normalize(u_cameraMatrix[3].xyz - v_worldPosition);

    vec3 totalDiffuseLightColor = vec3(0.0,0.0,0.0);
    vec3 totalSpecularLightColor = vec3(0.0,0.0,0.0);
    #ifdef NUM_POINTLIGHT
        #if NUM_POINTLIGHT > 0
            PointLight pointLight;
            for(int i = 0;i<NUM_POINTLIGHT;i++){
                pointLight = pointLights[i];
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
    #endif
    #ifdef NUM_DIRECTIONALLIGHT
        #if NUM_DIRECTIONALLIGHT > 0
            DirectionalLight directionalLight;
            for(int i = 0;i<NUM_DIRECTIONALLIGHT;i++){
                directionalLight = directionalLights[i];
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
    #endif

    vec3 resultColor = vec3(0.0,0.0,0.0);
    resultColor = resultColor + totalDiffuseLightColor * diffuseColor;
    resultColor = resultColor + totalSpecularLightColor * specularColor;
    resultColor = resultColor + ambientColor * diffuseColor;
    return resultColor;
}