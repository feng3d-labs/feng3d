// ==========================================================================
// 历史参考样本：不参与构建、不进入发布包、不作为翻译基准。
// 着色器唯一源是 TSL（packages/feng3d/src/shaders/tsl/ 及各材质生成模块）。
// 依据 AGENTS.md §9 / issue #713；整体归档到 docs/archive/ 见 issue #885。
// ==========================================================================
precision highp float;

uniform int u_objectID;

void main()
{
    //支持 255*255*255*255 个索引
    const float invColor = 1.0/255.0;
    float temp = float(u_objectID);
    temp = floor(temp) * invColor;
    gl_FragColor.x = fract(temp);
    temp = floor(temp) * invColor;
    gl_FragColor.y = fract(temp);
    temp = floor(temp) * invColor;
    gl_FragColor.z = fract(temp);
    temp = floor(temp) * invColor;
    gl_FragColor.w = fract(temp);
}