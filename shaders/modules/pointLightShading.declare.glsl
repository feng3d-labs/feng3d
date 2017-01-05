#if NUM_POINTLIGHT > 0
    //点光源位置列表
    uniform vec3 u_pointLightPositions[NUM_POINTLIGHT];
    //点光源漫反射颜色
    uniform vec3 u_pointLightDiffuses[NUM_POINTLIGHT];
    //点光源镜面反射颜色
    uniform vec3 u_pointLightSpeculars[NUM_POINTLIGHT];

    //渲染点光源
    vec4 pointLightShading(vec4 diffuseColor,vec3 normal){

        vec3 pointLightPosition = vec3(0.0,0.0,0.0);
        vec3 pointLightDiffuses = vec3(1.0,0.0,0.0);
        vec3 pointLightSpecular = vec3(0.0,1.0,0.0);

        //光照方向
        vec3 pointLightDir = pointLightPosition - v_globalPosition;
        pointLightDir = normalize(pointLightDir);
        //
        float dot = clamp(dot(normal,pointLightDir),0.0,1.0);
        vec4 lightColor = vec4((diffuseColor.xyz * dot).xyz,1.0);
        
        return lightColor;
    }
#endif