// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
attribute vec3 a_position;

uniform vec3 u_cameraPos;
uniform mat4 u_viewProjection;

uniform float u_skyBoxSize;

varying vec3 v_worldPos;

void main()
{
    vec3 worldPos = a_position.xyz * u_skyBoxSize + u_cameraPos.xyz;
    gl_Position = u_viewProjection * vec4(worldPos.xyz, 1.0);
    v_worldPos = worldPos;
}