//代码实现lod以及线性插值 feng
#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

#define LOD_LINEAR

uniform sampler2D s_splatMergeTexture;
uniform sampler2D s_blendTexture;
uniform vec4 u_splatRepeats;

uniform vec2 u_imageSize;
uniform vec4 u_tileOffset[3];
uniform vec4 u_lod0vec;
uniform vec2 u_tileSize;
uniform float u_maxLod;
uniform float u_scaleByDepth;
uniform float u_uvPositionScale;


vec4 terrainTexture2DLod(sampler2D s_splatMergeTexture,vec2 uv,float lod,vec4 offset){

    //计算不同lod像素缩放以及起始坐标
    vec4 lodvec = u_lod0vec;
    lodvec.x = lodvec.x * pow(0.5,lod);
    lodvec.y = lodvec.x * 2.0;
    lodvec.z = 1.0 - lodvec.y;

    //lod块尺寸
    vec2 lodSize = u_imageSize * lodvec.xy;
    vec2 lodPixelOffset = 1.0 / lodSize * 2.0;

    // uv = uv - 1.0 / lodPixelOffset;
    vec2 mixFactor = mod(uv, lodPixelOffset) / lodPixelOffset;

    //lod块中像素索引
    vec2 t_uv = fract(uv + lodPixelOffset * vec2(0.0, 0.0));
    t_uv = t_uv * offset.xy + offset.zw;
    //添加lod起始坐标
    t_uv = t_uv * lodvec.xy + lodvec.zw;
    //取整像素
    t_uv = floor(t_uv * u_imageSize) / u_imageSize;
    vec4 tColor00 = texture2D(s_splatMergeTexture,t_uv);

    t_uv = fract(uv + lodPixelOffset * vec2(1.0, 0.0));
    t_uv = t_uv * offset.xy + offset.zw;
    //添加lod起始坐标
    t_uv = t_uv * lodvec.xy + lodvec.zw;
    //取整像素
    t_uv = floor(t_uv * u_imageSize) / u_imageSize;
    vec4 tColor10 = texture2D(s_splatMergeTexture,t_uv);

    t_uv = fract(uv + lodPixelOffset * vec2(0.0, 1.0));
    t_uv = t_uv * offset.xy + offset.zw;
    //添加lod起始坐标
    t_uv = t_uv * lodvec.xy + lodvec.zw;
    //取整像素
    t_uv = floor(t_uv * u_imageSize) / u_imageSize;
    vec4 tColor01 = texture2D(s_splatMergeTexture,t_uv);

    t_uv = fract(uv + lodPixelOffset * vec2(1.0, 1.0));
    t_uv = t_uv * offset.xy + offset.zw;
    //添加lod起始坐标
    t_uv = t_uv * lodvec.xy + lodvec.zw;
    //取整像素
    t_uv = floor(t_uv * u_imageSize) / u_imageSize;
    vec4 tColor11 = texture2D(s_splatMergeTexture,t_uv);

    vec4 tColor0 = mix(tColor00,tColor10,mixFactor.x);
    vec4 tColor1 = mix(tColor01,tColor11,mixFactor.x);
    vec4 tColor = mix(tColor0,tColor1,mixFactor.y);

    return tColor;

    // return vec4(mixFactor.x,mixFactor.y,0.0,1.0);
    // return vec4(mixFactor.x + 0.5,mixFactor.y + 0.5,0.0,1.0);
}

//参考 http://blog.csdn.net/cgwbr/article/details/6620318
//计算MipMap层函数：
float mipmapLevel(vec2 uv)
{
    vec2 dx = dFdx(uv);
    vec2 dy = dFdy(uv);
    float d = max(dot(dx, dx), dot(dy, dy));
    return 0.5 * log2(d);
}

//根据距离以及法线计算MipMap层函数：
float mipmapLevel1(vec2 uv)
{
    //视线方向
    vec3 viewDir = u_cameraMatrix[3].xyz - v_globalPosition.xyz;
    float fogDistance = length(viewDir);
    float value = u_scaleByDepth * fogDistance * u_uvPositionScale;//uv变化率与距离成正比，0.001为顶点位置与uv的变化比率
    viewDir = normalize(viewDir);
    float dd = clamp(dot(viewDir, v_normal),0.05,1.0);//取法线与视线余弦值的倒数，余弦值越大（朝向摄像机时uv变化程度越低）lod越小
    value = value / dd;
    value = value * 0.5;//还没搞懂0.5的来历
    return log2(value);
}

vec4 terrainTexture2D(sampler2D s_splatMergeTexture,vec2 t_uv,float lod,vec4 offset){
 
    #ifdef LOD_LINEAR
        vec4 tColor = mix(terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod),offset),terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod),offset),fract(lod));
    #else
        vec4 tColor = terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod),offset);
    #endif

    return tColor;
}

vec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) {
    
    float lod = 0.0;
    vec4 blend = texture2D(s_blendTexture,v_uv);
    for(int i = 0; i < 3; i++)
    {
        vec2 t_uv = v_uv * u_splatRepeats[i];
        // lod = mipmapLevel(v_uv) + log2(u_tileSize.x * u_splatRepeats[i]);
        lod = mipmapLevel1(v_uv) + log2(u_tileSize.x * u_splatRepeats[i]);
        lod = clamp(lod,0.0,u_maxLod);
        vec4 tColor = terrainTexture2D(s_splatMergeTexture,t_uv,lod,u_tileOffset[i]);
        diffuseColor = (tColor - diffuseColor) * blend[i] + diffuseColor;
    }

    // diffuseColor.xyz = vec3(1.0,0.0,0.0);
    // diffuseColor.xyz = vec3(lod/u_maxLod,0.0,0.0);
    // diffuseColor.xyz = vec3(floor(lod)/u_maxLod,0.0,0.0);
    return diffuseColor;
}