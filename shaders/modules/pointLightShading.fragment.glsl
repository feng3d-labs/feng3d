#if NUM_POINTLIGHT > 0
    //点光源位置数组
    uniform vec3 u_pointLightPositions[NUM_POINTLIGHT];
    //点光源颜色数组
    uniform vec3 u_pointLightColors[NUM_POINTLIGHT];
    //点光源光照强度数组
    uniform float u_pointLightIntensitys[NUM_POINTLIGHT];
    //点光源光照范围数组
    uniform float u_pointLightRanges[NUM_POINTLIGHT];
#endif
#if NUM_DIRECTIONALLIGHT > 0
    //方向光源方向数组
    uniform vec3 u_directionalLightDirections[NUM_DIRECTIONALLIGHT];
    //方向光源颜色数组
    uniform vec3 u_directionalLightColors[NUM_DIRECTIONALLIGHT];
    //方向光源光照强度数组
    uniform float u_directionalLightIntensitys[NUM_DIRECTIONALLIGHT];
#endif

//计算光照漫反射系数
vec3 calculateLightDiffuse(vec3 normal,vec3 lightDir,vec3 lightColor,float lightIntensity){

    vec3 diffuse = lightColor * lightIntensity * clamp(dot(normal,lightDir),0.0,1.0);
    return diffuse;
}

//计算光照镜面反射系数
vec3 calculateLightSpecular(vec3 normal,vec3 lightDir,vec3 lightColor,float lightIntensity,vec3 viewDir,float glossiness){

    vec3 halfVec = normalize(lightDir + viewDir);
    float specComp = clamp(dot(normal,halfVec),0.0,1.0);
    specComp = pow(specComp, max(1., glossiness));

    vec3 diffuse = lightColor * lightIntensity * specComp;
    return diffuse;
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
vec3 pointLightShading(vec3 normal,vec3 diffuseColor,vec3 specularColor,vec3 ambientColor,float glossiness){

    //视线方向
    vec3 viewDir = normalize(u_cameraMatrix[3].xyz - v_globalPosition);

    vec3 totalDiffuseLightColor = vec3(0.0,0.0,0.0);
    vec3 totalSpecularLightColor = vec3(0.0,0.0,0.0);
    #if NUM_POINTLIGHT > 0
        for(int i = 0;i<NUM_POINTLIGHT;i++){
            //
            vec3 lightOffset = u_pointLightPositions[i] - v_globalPosition;
            float lightDistance = length(lightOffset);
            //光照方向
            vec3 lightDir = normalize(lightOffset);
            //灯光颜色
            vec3 lightColor = u_pointLightColors[i];
            //灯光强度
            float lightIntensity = u_pointLightIntensitys[i];
            //光照范围
            float range = u_pointLightRanges[i];
            float attenuation = computeDistanceLightFalloff(lightDistance,range);
            lightIntensity = lightIntensity * attenuation;
            //
            totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir,lightColor,lightIntensity);
            totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,lightColor,lightIntensity,viewDir,glossiness);
        }
    #endif
    #if NUM_DIRECTIONALLIGHT > 0
        for(int i = 0;i<NUM_DIRECTIONALLIGHT;i++){
            //光照方向
            vec3 lightDir = normalize(-u_directionalLightDirections[i]);
            //灯光颜色
            vec3 lightColor = u_directionalLightColors[i];
            //灯光强度
            float lightIntensity = u_directionalLightIntensitys[i];
            //
            totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir,lightColor,lightIntensity);
            totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,lightColor,lightIntensity,viewDir,glossiness);
        }
    #endif

    vec3 resultColor = vec3(0.0,0.0,0.0);
    resultColor = resultColor + totalDiffuseLightColor * diffuseColor;
    resultColor = resultColor + totalSpecularLightColor * specularColor;
    resultColor = resultColor + ambientColor * diffuseColor;
    return resultColor;
}