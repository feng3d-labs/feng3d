/**
 * 标准材质顶点着色器的**对外导出**（issue #711 / #712）。
 *
 * 实现已迁到 TSL（见 \`shaders/tsl/standardVertex\`），这里只保留原有的导出名与模块级常量形态——
 * 既有代码把 \`standardVertexWGSL\` 当作**身份**用（如 \`SkinnedMeshRenderer\` 在
 * \`sourcePipeline?.vertex?.wgsl === standardVertexWGSL\` 里判断"这是不是标准管线"），
 * 所以不能改成"每次调用返回新值"的 getter。字符串比较是值比较，同一份内容仍然成立。
 */
import { getStandardMorphVertexWGSL, getStandardSkinnedVertexWGSL, getStandardVertexWGSL } from '../shaders/tsl/standardVertex';

/**
 * 标准材质顶点着色器（非蒙皮）。
 */
export const standardVertexWGSL = getStandardVertexWGSL();

/**
 * 标准材质顶点着色器（蒙皮变体，issue #337）。
 */
export const standardSkinnedVertexWGSL = getStandardSkinnedVertexWGSL();

/**
 * 标准材质顶点着色器（morph target 变体，阶段 C）。
 *
 * 与蒙皮变体同一套路：`MorphMeshRenderer` 在 `beforeRender` 里把管线换成它，
 * 顶点位置先经 `morphPosition` 加权 morph delta。
 */
export const standardMorphVertexWGSL = getStandardMorphVertexWGSL();
