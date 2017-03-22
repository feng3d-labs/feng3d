//点光源位置数组
uniform vec3 u_pointLightPositions[NUM_POINTLIGHT];
//点光源颜色数组
uniform vec3 u_pointLightColors[NUM_POINTLIGHT];
//点光源光照强度数组
uniform float u_pointLightIntensitys[NUM_POINTLIGHT];
//点光源光照范围数组
uniform float u_pointLightRanges[NUM_POINTLIGHT];
//反射率
uniform float u_reflectance;
//粗糙度
uniform float u_roughness;
//金属度
uniform float u_metalic;

vec3 fresnelSchlick(float VdotH,vec3 reflectance){

    return reflectance + (1.0 - reflectance) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
    // return reflectance;
}

float normalDistributionGGX(float NdotH,float alphaG){

    float alphaG2 = alphaG * alphaG;
    float d = NdotH * NdotH * (alphaG2 - 1.0) + 1.0; 
    return alphaG2 / (3.1415926 * d * d);
}

float smithVisibility(float dot,float alphaG){

    float tanSquared = (1.0 - dot * dot) / (dot * dot);
    return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));
}

vec3 calculateLight(vec3 normal,vec3 viewDir,vec3 lightDir,vec3 lightColor,float lightIntensity,vec3 baseColor,vec3 reflectance,float roughness){

    //BRDF = D(h) * F(1, h) * V(l, v, h) / (4 * dot(n, l) * dot(n, v));

    vec3 halfVec = normalize(lightDir + viewDir);
    float NdotL = clamp(dot(normal,lightDir),0.0,1.0);
    float NdotH = clamp(dot(normal,halfVec),0.0,1.0);
    float NdotV = max(abs(dot(normal,viewDir)),0.000001);
    float VdotH = clamp(dot(viewDir, halfVec),0.0,1.0);
    
    float alphaG = max(roughness * roughness,0.0005);

    //F(v,h)
    vec3 F = fresnelSchlick(VdotH, reflectance);

    //D(h)
    float D = normalDistributionGGX(NdotH,alphaG);

    //V(l,h)
    float V = smithVisibility(NdotL,alphaG) * smithVisibility(NdotV,alphaG) / (4.0 * NdotL * NdotV);

    vec3 specular = max(0.0, D * V) * 3.1415926 * F;
    
    return (baseColor + specular) * NdotL * lightColor * lightIntensity;
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
vec3 pointLightShading(vec3 normal,vec3 baseColor){

    float reflectance = u_reflectance;
    float roughness = u_roughness;
    float metalic = u_metalic;

    reflectance = mix(0.0,0.5,reflectance);
    vec3 realBaseColor = (1.0 - metalic) * baseColor;
    vec3 realReflectance = mix(vec3(reflectance),baseColor,metalic);

    vec3 totalLightColor = vec3(0.0,0.0,0.0);
    //视线方向
    vec3 viewDir = normalize(u_cameraMatrix[3].xyz - v_globalPosition);
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
        totalLightColor = totalLightColor + calculateLight(normal,viewDir,lightDir,lightColor,lightIntensity,realBaseColor,realReflectance,roughness);
    }
    
    return totalLightColor;
}