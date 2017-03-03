

precision mediump float;

uniform sampler2D s_texture;
uniform sampler2D s_blendTexture;
uniform sampler2D s_splatTexture1;
uniform sampler2D s_splatTexture2;
uniform sampler2D s_splatTexture3;

uniform vec4 u_splatRepeats;

varying vec2 v_uv;



void main(void) {

    vec2 t_uv = v_uv.xy * u_splatRepeats.x;
    vec4 finalColor = texture2D(s_texture,t_uv);
    
    vec4 blend = texture2D(s_blendTexture,v_uv);

    t_uv = v_uv.xy * u_splatRepeats.y;
    vec4 tColor = texture2D(s_splatTexture1,t_uv);
    finalColor = (tColor - finalColor) * blend.x + finalColor;

    t_uv = v_uv.xy * u_splatRepeats.z;
    tColor = texture2D(s_splatTexture2,t_uv);
    finalColor = (tColor - finalColor) * blend.y + finalColor;

    t_uv = v_uv.xy * u_splatRepeats.w;
    tColor = texture2D(s_splatTexture3,t_uv);
    finalColor = (tColor - finalColor) * blend.z + finalColor;

    gl_FragColor = finalColor;
}