//点光源位置数组
uniform vec3 u_pointLightPositions[4];
//点光源颜色数组
uniform vec3 u_pointLightColors[4];
//点光源光照强度数组
uniform float u_pointLightIntensitys[4];
//点光源光照范围数组
uniform float u_pointLightRanges[4];

//方向光源方向数组
uniform vec3 u_directionalLightDirections[2];
//方向光源颜色数组
uniform vec3 u_directionalLightColors[2];
//方向光源光照强度数组
uniform float u_directionalLightIntensitys[2];

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
float calculateLightSpecular(vec3 normal,vec3 lightDir,vec3 cameraDir,float glossiness){

    #ifdef IS_CARTOON
        return cartoonLightSpecular(normal,lightDir,cameraDir,glossiness);
    #else
        vec3 halfVec = normalize(lightDir + cameraDir);
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

    //摄像机方向
    vec3 cameraDir = normalize(u_cameraMatrix[3].xyz - v_worldPosition);

    vec3 totalDiffuseLightColor = vec3(0.0,0.0,0.0);
    vec3 totalSpecularLightColor = vec3(0.0,0.0,0.0);

    // 处理点光源
    for(int i = 0;i<4;i++){
        //
        vec3 lightOffset = u_pointLightPositions[i] - v_worldPosition;
        float lightDistance = length(lightOffset);
        //光源方向
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
        totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir) * lightColor * lightIntensity;
        totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,cameraDir,glossiness) * lightColor * lightIntensity;
    }

    // 处理方向光源
    for(int i = 0;i<2;i++){
        //光源方向
        vec3 lightDir = normalize(-u_directionalLightDirections[i]);
        //灯光颜色
        vec3 lightColor = u_directionalLightColors[i];
        //灯光强度
        float lightIntensity = u_directionalLightIntensitys[i];
        //
        totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir) * lightColor * lightIntensity;
        totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,cameraDir,glossiness) * lightColor * lightIntensity;
    }

    vec3 resultColor = vec3(0.0,0.0,0.0);
    resultColor = resultColor + totalDiffuseLightColor * diffuseColor;
    resultColor = resultColor + totalSpecularLightColor * specularColor;
    resultColor = resultColor + ambientColor * diffuseColor;
    return resultColor;
}