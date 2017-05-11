#ifdef USE_TERRAIN_MERGE
    uniform sampler2D s_splatMergeTexture;
#else
    uniform sampler2D s_splatTexture1;
    uniform sampler2D s_splatTexture2;
    uniform sampler2D s_splatTexture3;
#endif

uniform sampler2D s_blendTexture;
uniform vec4 u_splatRepeats;

#ifdef USE_TERRAIN_MERGE
vec4 terrainBlendMerge(vec4 diffuseColor,vec2 v_uv) {
    
    vec4 blend = texture2D(s_blendTexture,v_uv);

    // float offset = 1.0/512.0;
    // float offset = 0.000000001;
    // float offset = 1.0 / 1024.0;
    // float width = 0.5 - offset * 2.0;

    float offset = 0.0;
    float width = 0.5;
     

    vec2 t_uv = v_uv.xy * u_splatRepeats.y;
    t_uv.x = fract(t_uv.x);
    t_uv.y = fract(t_uv.y);
    t_uv.x = t_uv.x * width + offset;
    t_uv.y = t_uv.y * width + offset;
    vec4 tColor = texture2D(s_splatMergeTexture,t_uv);
    diffuseColor = (tColor - diffuseColor) * blend.x + diffuseColor;

    t_uv = v_uv.xy * u_splatRepeats.z;
    t_uv.x = fract(t_uv.x);
    t_uv.y = fract(t_uv.y);
    t_uv.x = t_uv.x * width + offset + 0.5;
    t_uv.y = t_uv.y * width + offset;
    tColor = texture2D(s_splatMergeTexture,t_uv);
    diffuseColor = (tColor - diffuseColor) * blend.y + diffuseColor;

    t_uv = v_uv.xy * u_splatRepeats.w;
    t_uv.x = fract(t_uv.x);
    t_uv.y = fract(t_uv.y);
    t_uv.x = t_uv.x * width + offset;
    t_uv.y = t_uv.y * width + offset + 0.5;
    tColor = texture2D(s_splatMergeTexture,t_uv);
    diffuseColor = (tColor - diffuseColor) * blend.z + diffuseColor;

    return diffuseColor;
}
#else
vec4 terrainBlend(vec4 diffuseColor,vec2 v_uv) {

    vec4 blend = texture2D(s_blendTexture,v_uv);

    vec2 t_uv = v_uv.xy * u_splatRepeats.y;
    vec4 tColor = texture2D(s_splatTexture1,t_uv);
    diffuseColor = (tColor - diffuseColor) * blend.x + diffuseColor;

    t_uv = v_uv.xy * u_splatRepeats.z;
    tColor = texture2D(s_splatTexture2,t_uv);
    diffuseColor = (tColor - diffuseColor) * blend.y + diffuseColor;

    t_uv = v_uv.xy * u_splatRepeats.w;
    tColor = texture2D(s_splatTexture3,t_uv);
    diffuseColor = (tColor - diffuseColor) * blend.z + diffuseColor;
    return diffuseColor;
}
#endif

vec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) {
    #ifdef USE_TERRAIN_MERGE
        diffuseColor = terrainBlendMerge(diffuseColor,v_uv);
    #else
        diffuseColor = terrainBlend(diffuseColor,v_uv);
    #endif

    return diffuseColor;
}