#if NUM_POINTLIGHT > 0
    //点光源位置列表
    uniform vec3 u_pointLightPositions[NUM_POINTLIGHT];
    //点光源漫反射颜色
    uniform vec3 u_pointLightDiffuses[NUM_POINTLIGHT];
    //点光源镜面反射颜色
    uniform vec3 u_pointLightSpeculars[NUM_POINTLIGHT];

    //获取光源的漫反射颜色
    vec4 diffusePerLight(vec3 normal,vec3 lightDir,vec3 lightDiffuse){

        //计算反射强度
        float dot = clamp(dot(normal,lightDir),0.0,1.0);
        vec4 lightColor = vec4((lightDiffuse.xyz * dot).xyz,1.0);
        return lightColor;
    }

    //获取光源的镜面反射颜色
    vec4 specularPerLight(vec3 normal,vec3 lightDir,vec3 lightSpecular){

        vec3 viewDir = normalize(v_globalPosition - u_cameraMatrix[3].xyz);
        //计算反射强度
        float reflectance = clamp(dot(normal,normalize(lightDir + viewDir)),0.0,1.0);
        reflectance = pow(reflectance,5.0);

        vec4 lightColor = vec4((lightSpecular.xyz * reflectance).xyz,1.0);
        return lightColor; 
    }

    //渲染点光源
    vec4 pointLightShading(vec3 normal){

        vec3 pointLightSpecular = vec3(0.0,1.0,0.0);

        vec4 lightColor = vec4(0.0,0.0,0.0,0.0);
        for(int i = 0;i<NUM_POINTLIGHT;i++){
            //光照方向
            vec3 pointLightDir = u_pointLightPositions[i] - v_globalPosition;
            pointLightDir = normalize(pointLightDir);
            //光照漫反射
            lightColor = lightColor + diffusePerLight(normal,pointLightDir,u_pointLightDiffuses[i]);
            //光照镜面反射
            lightColor = lightColor + specularPerLight(normal,pointLightDir,u_pointLightSpeculars[i]);
        }
        
        return lightColor;
    }
#endif