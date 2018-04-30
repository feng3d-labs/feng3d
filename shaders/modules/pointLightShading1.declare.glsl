//参考资料
//http://blog.csdn.net/leonwei/article/details/44539217
//https://github.com/mcleary/pbr/blob/master/shaders/phong_pbr_frag.glsl

#if NUM_POINTLIGHT > 0
    //点光源位置列表
    uniform vec3 u_pointLightPositions[NUM_POINTLIGHT];
    //点光源漫反射颜色
    uniform vec3 u_pointLightColors[NUM_POINTLIGHT];
    //点光源镜面反射颜色
    uniform float u_pointLightIntensitys[NUM_POINTLIGHT];
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

    //渲染点光源
    vec3 pointLightShading(vec3 normal,vec3 baseColor){

        float reflectance = u_reflectance;
        float roughness = u_roughness;
        float metalic = u_metalic;

        reflectance = mix(0.0,0.5,reflectance);
        vec3 realBaseColor = (1.0 - metalic) * baseColor;
        vec3 realReflectance = mix(vec3(reflectance),baseColor,metalic);

        vec3 totalLightColor = vec3(0.0,0.0,0.0);
        for(int i = 0;i<NUM_POINTLIGHT;i++){
            //光照方向
            vec3 lightDir = normalize(u_pointLightPositions[i] - v_globalPosition);
            //视线方向
            vec3 viewDir = normalize(u_cameraMatrix[3].xyz - v_globalPosition);
            //灯光颜色
            vec3 lightColor = u_pointLightColors[i];
            //灯光强度
            float lightIntensity = u_pointLightIntensitys[i];

            totalLightColor = totalLightColor + calculateLight(normal,viewDir,lightDir,lightColor,lightIntensity,realBaseColor,realReflectance,roughness);
        }
        
        return totalLightColor;
    }
#endif