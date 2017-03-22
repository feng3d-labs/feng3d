// Light Computing
struct LightingResult
{
    vec3 diffuse;
    vec3 specular;
};

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

//计算光照漫反射系数
vec3 calculateLightDiffuse(vec3 normal,vec3 lightDir,vec3 lightColor,float lightIntensity){

    vec3 diffuse = lightColor * lightIntensity * clamp(dot(normal,lightDir),0.0,1.0);
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
LightingResult pointLightShading(vec3 normal,vec3 viewDir){

    LightingResult result;

    vec3 totalDiffuseLightColor = vec3(0.0,0.0,0.0);
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
    }
    result.diffuse = totalDiffuseLightColor;
    return result;
}