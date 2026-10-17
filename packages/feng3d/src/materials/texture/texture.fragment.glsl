// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
precision mediump float;

uniform sampler2D s_texture;
varying vec2 v_uv;

uniform vec4 u_color;

void main() {

    vec4 color = texture2D(s_texture, v_uv);
    gl_FragColor = color * u_color;
}
