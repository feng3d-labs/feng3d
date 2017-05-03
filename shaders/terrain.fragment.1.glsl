

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
    // vec4 finalColor = texture2D(s_texture,t_uv);
    vec4 finalColor = vec4(0.0, 0.0, 0.0, 0.0);
    
    vec4 blend = texture2D(s_blendTexture,v_uv);

    float offset = 1.0/512.0;
    // float offset = 1.0 / 1024.0;
    // float offset = 0.000000001;
   // float width = 0.5 - offset;
   // float delta = 0.5 + offset;

     float width = 0.5;
     float delta = 0.5;

    t_uv = v_uv.xy * u_splatRepeats.y;
    t_uv.x = fract(t_uv.x);
    t_uv.y = fract(t_uv.y);
    t_uv.x = t_uv.x * width;
    t_uv.y = t_uv.y * width;
    vec4 tColor = texture2D(s_splatTexture1,t_uv);
    finalColor = (tColor - finalColor) * blend.x + finalColor;

    t_uv = v_uv.xy * u_splatRepeats.z;
    t_uv.x = fract(t_uv.x);
    t_uv.y = fract(t_uv.y);
    t_uv.x = t_uv.x * width + delta;
    t_uv.y = t_uv.y * width;
    tColor = texture2D(s_splatTexture1,t_uv);
    finalColor = (tColor - finalColor) * blend.y + finalColor;

    t_uv = v_uv.xy * u_splatRepeats.w;
    t_uv.x = fract(t_uv.x);
    t_uv.y = fract(t_uv.y);
    t_uv.x = t_uv.x * width;
    t_uv.y = t_uv.y * width + delta;
    tColor = texture2D(s_splatTexture1,t_uv);
    finalColor = (tColor - finalColor) * blend.z + finalColor;

    gl_FragColor = finalColor;
}