uniform sampler2D s_splatTexture1;
uniform sampler2D s_splatTexture2;
uniform sampler2D s_splatTexture3;

uniform sampler2D s_blendTexture;
uniform vec4 u_splatRepeats;

vec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) {

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