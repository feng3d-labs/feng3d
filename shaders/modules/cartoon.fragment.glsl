#ifdef cartoon_Anti_aliasing
    #extension GL_OES_standard_derivatives : enable
#endif

uniform vec4 u_diffuseSegment;
uniform vec4 u_diffuseSegmentValue;
uniform float u_specularSegment;

//漫反射
float cartoonLightDiffuse(vec3 normal,vec3 lightDir){

    float diff = dot(normal, lightDir);
    diff = diff * 0.5 + 0.5;

    #ifdef cartoon_Anti_aliasing
        float w = fwidth(diff) * 2.0;
        if (diff < u_diffuseSegment.x + w) {
            diff = mix(u_diffuseSegment.x, u_diffuseSegment.y, smoothstep(u_diffuseSegment.x - w, u_diffuseSegment.x + w, diff));
        //  diff = mix(u_diffuseSegment.x, u_diffuseSegment.y, clamp(0.5 * (diff - u_diffuseSegment.x) / w, 0, 1));
        } else if (diff < u_diffuseSegment.y + w) {
            diff = mix(u_diffuseSegment.y, u_diffuseSegment.z, smoothstep(u_diffuseSegment.y - w, u_diffuseSegment.y + w, diff));
        //  diff = mix(u_diffuseSegment.y, u_diffuseSegment.z, clamp(0.5 * (diff - u_diffuseSegment.y) / w, 0, 1));
        } else if (diff < u_diffuseSegment.z + w) {
            diff = mix(u_diffuseSegment.z, u_diffuseSegment.w, smoothstep(u_diffuseSegment.z - w, u_diffuseSegment.z + w, diff));
        //  diff = mix(u_diffuseSegment.z, u_diffuseSegment.w, clamp(0.5 * (diff - u_diffuseSegment.z) / w, 0, 1));
        } else {
            diff = u_diffuseSegment.w;
        }
    #else
        if (diff < u_diffuseSegment.x) {
            diff = u_diffuseSegmentValue.x;
        } else if (diff < u_diffuseSegment.y) {
            diff = u_diffuseSegmentValue.y;
        } else if (diff < u_diffuseSegment.z) {
            diff = u_diffuseSegmentValue.z;
        } else {
            diff = u_diffuseSegmentValue.w;
        }
    #endif

    return diff;
}

//镜面反射漫反射
float cartoonLightSpecular(vec3 normal,vec3 lightDir,vec3 viewDir,float glossiness){

    vec3 halfVec = normalize(lightDir + viewDir);
    float specComp = max(dot(normal,halfVec),0.0);
    specComp = pow(specComp, glossiness);

    #ifdef cartoon_Anti_aliasing
        float w = fwidth(specComp);
        if (specComp < u_specularSegment + w) {
            specComp = mix(0.0, 1.0, smoothstep(u_specularSegment - w, u_specularSegment + w, specComp));
            // specComp = smoothstep(u_specularSegment - w, u_specularSegment + w, specComp);
        } else {
            specComp = 1.0;
        }
    #else
        if(specComp < u_specularSegment)
        {
            specComp = 0.0;
        }else
        {
            specComp = 1.0;
        }
    #endif

    return specComp;
}