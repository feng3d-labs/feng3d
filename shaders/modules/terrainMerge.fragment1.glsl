#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

#define LOD_LINEAR

uniform sampler2D s_splatMergeTexture;
uniform sampler2D s_blendTexture;
uniform vec4 u_splatRepeats;

vec2 imageSize =    vec2(2048.0,1024.0);
vec4 offset[3];
vec2 tileSize = vec2(512.0,512.0);
float maxLod = 7.0;

vec4 terrainTexture2DLod(sampler2D s_splatMergeTexture,vec2 t_uv,float lod)
{
    vec4 lodvec = vec4(0.5,1.0,0.0,0.0);
    lodvec.x = lodvec.x * pow(0.5,lod);
    lodvec.y = lodvec.x * 2.0;
    lodvec.z = 1.0 - lodvec.y;
    
    t_uv = t_uv * lodvec.xy + lodvec.zw;
    t_uv = floor(t_uv * imageSize) / imageSize;
    
    vec4 tColor = texture2D(s_splatMergeTexture,t_uv);
    return tColor;
}

//参考 http://blog.csdn.net/cgwbr/article/details/6620318
//计算MipMap层函数：
float mipmapLevel(vec2 uv, vec2 textureSize)
{
    vec2 dx = dFdx(uv * textureSize.x);
    vec2 dy = dFdy(uv * textureSize.y);
    float d = max(dot(dx, dx), dot(dy, dy));  
    return 0.5 * log2(d);
}

vec4 terrainTexture2DLodMix(sampler2D s_splatMergeTexture,vec2 t_uv,vec4 offset)
{
    float lod = mipmapLevel(t_uv,tileSize);
    lod = clamp(lod,0.0,maxLod);
    t_uv = fract(t_uv);
    t_uv = t_uv * offset.xy + offset.zw;
 
    #ifdef LOD_LINEAR
        vec4 tColor = mix(terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod)),terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod)),fract(lod));
    #else
        vec4 tColor = terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod));
    #endif
    return tColor;
}

vec4 terrainTexture2D(sampler2D s_splatMergeTexture,vec2 t_uv,float splatRepeat,vec4 offset)
{
    t_uv = t_uv.xy * splatRepeat;
    
    vec2 dx = dFdx(t_uv);
    vec2 dy = dFdy(t_uv);
    
    vec4 tColor0 = terrainTexture2DLodMix(s_splatMergeTexture, t_uv, offset);
    vec4 tColor1 = terrainTexture2DLodMix(s_splatMergeTexture, t_uv + dx, offset);

    vec4 tColor = mix(tColor0,tColor1,0.5);

    return tColor;
}

vec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) 
{
    
    offset[0] = vec4(0.5,0.5,0.0,0.0);
    offset[1] = vec4(0.5,0.5,0.5,0.0);
    offset[2] = vec4(0.5,0.5,0.0,0.5);
    
    vec4 blend = texture2D(s_blendTexture,v_uv);
    for(int i = 0; i < 3; i++)
    {
        vec4 tColor = terrainTexture2D(s_splatMergeTexture,v_uv,u_splatRepeats[i],offset[i]);
        diffuseColor = (tColor - diffuseColor) * blend[i] + diffuseColor;
    }

    // diffuseColor.xyz = vec3(1.0,0.0,0.0);
    // diffuseColor.xyz = vec3(floor(lod)/7.0,0.0,0.0);
    return diffuseColor;
}