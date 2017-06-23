//代码实现lod，使用默认线性插值
#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

#define LOD_LINEAR

uniform sampler2D s_splatMergeTexture;
uniform sampler2D s_blendTexture;
uniform vec4 u_splatRepeats;

vec2 imageSize =    vec2(2048.0,1024.0);
vec4 offset[3];
vec2 tileSize = vec2(512.0,512.0);
// float maxLod = 7.0;
float maxLod = 5.0;

vec4 terrainTexture2DLod(sampler2D s_splatMergeTexture,vec2 uv,float lod,vec4 offset){

    //计算不同lod像素缩放以及起始坐标
    vec4 lodvec = vec4(0.5,1.0,0.0,0.0);
    lodvec.x = lodvec.x * pow(0.5,lod);
    lodvec.y = lodvec.x * 2.0;
    lodvec.z = 1.0 - lodvec.y;

    //lod块尺寸
    vec2 lodSize = imageSize * lodvec.xy;
    vec2 lodPixelOffset = 1.0 / lodSize;

    //扩展边缘一像素
    offset.xy = offset.xy - lodPixelOffset * 2.0;
    offset.zw = offset.zw + lodPixelOffset;
    //lod块中uv
    vec2 t_uv = uv * offset.xy + offset.zw;
    t_uv = t_uv * lodvec.xy;
    //取整像素
    t_uv = (t_uv * imageSize + vec2(-0.0,0.0)) / imageSize;
    // t_uv = (t_uv * imageSize + 0.5) / imageSize;
    // t_uv = floor(t_uv * imageSize - 1.0) / imageSize;
    // t_uv = ceil(t_uv * imageSize + 1.0) / imageSize;
    //添加lod起始坐标
    t_uv = t_uv * (1.0 - 1.0 / imageSize);
    t_uv = t_uv + lodvec.zw;
    vec4 tColor = texture2D(s_splatMergeTexture,t_uv);

    return tColor;

    // return vec4(mixFactor.x,mixFactor.y,0.0,1.0);
    // return vec4(mixFactor.x + 0.5,mixFactor.y + 0.5,0.0,1.0);
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

vec4 terrainTexture2D(sampler2D s_splatMergeTexture,vec2 t_uv,float lod,vec4 offset){
 
    #ifdef LOD_LINEAR
        vec4 tColor = mix(terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod),offset),terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod),offset),fract(lod));
    #else
        vec4 tColor = terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod),offset);
    #endif

    return tColor;
}

vec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) {
    
    offset[0] = vec4(0.5,0.5,0.0,0.0);
    offset[1] = vec4(0.5,0.5,0.5,0.0);
    offset[2] = vec4(0.5,0.5,0.0,0.5);
    
    vec4 blend = texture2D(s_blendTexture,v_uv);
    for(int i = 0; i < 3; i++)
    {
        vec2 t_uv = v_uv.xy * u_splatRepeats[i];
        float lod = mipmapLevel(t_uv,tileSize);
        lod = clamp(lod,0.0,maxLod);
        // lod = 5.0;
        t_uv = fract(t_uv);
        vec4 tColor = terrainTexture2D(s_splatMergeTexture,t_uv,lod,offset[i]);
        diffuseColor = (tColor - diffuseColor) * blend[i] + diffuseColor;
    }

    // diffuseColor.xyz = vec3(1.0,0.0,0.0);
    // diffuseColor.xyz = vec3(floor(lod)/7.0,0.0,0.0);
    return diffuseColor;
}