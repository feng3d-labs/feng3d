// variables - 变量相关
export { array } from './variables/array';
export { attribute } from './variables/attribute';
export { struct } from './variables/struct';
export { uniform } from './variables/uniform';
export { varying } from './variables/varying';
export { let_ } from './variables/let';
export { var_ } from './variables/var';

// shader - 着色器相关
export { fragment } from './shader/fragment';
export { transform } from './shader/transform';
export { vertex } from './shader/vertex';
export { func } from './shader/func';

// glsl - GLSL 专有
export { precision } from './glsl/precision';
export { fragColor } from './glsl/fragColor';

// glsl/sampler - 采样器
export { sampler2D } from './glsl/sampler/sampler2D';
export { sampler2DArray } from './glsl/sampler/sampler2DArray';
export { sampler3D } from './glsl/sampler/sampler3D';
export { usampler2D } from './glsl/sampler/usampler2D';
export { depthSampler } from './glsl/sampler/depthSampler';

// glsl/builtin - 内置变量
export { gl_Position, gl_FragColor, gl_VertexID, gl_FragCoord, gl_InstanceID, gl_FrontFacing, gl_PointSize } from './glsl/builtin/builtins';

// glsl/texture - 纹理函数
export { texelFetch } from './glsl/texture/texelFetch';
export { texelFetchOffset } from './glsl/texture/texelFetchOffset';
export { texture } from './glsl/texture/texture';
export { texture2D } from './glsl/texture/texture2D';
export { textureGrad } from './glsl/texture/textureGrad';
export { textureLod } from './glsl/texture/textureLod';
export { textureOffset } from './glsl/texture/textureOffset';
export { textureSize } from './glsl/texture/textureSize';

// glsl/derivative - 导数函数
export { dFdx } from './glsl/derivative/dFdx';
export { dFdy } from './glsl/derivative/dFdy';

// control - 控制流
export { if_ } from './control/if_';
export { return_ } from './control/return';
export { select } from './control/select';

// vector - 向量运算
export { cross } from './vector/cross';
export { dot } from './vector/dot';
export { lessThan } from './vector/lessThan';
export { normalize } from './vector/normalize';
export { reflect } from './vector/reflect';

// math/trigonometric - 三角函数
export { acos } from './math/trigonometric/acos';
export { atan } from './math/trigonometric/atan';
export { cos } from './math/trigonometric/cos';
export { sin } from './math/trigonometric/sin';

// math/exponential - 指数函数
export { exp } from './math/exponential/exp';
export { log2 } from './math/exponential/log2';
export { pow } from './math/exponential/pow';
export { sqrt } from './math/exponential/sqrt';

// math/common - 通用数学函数
export { clamp } from './math/common/clamp';
export { fract } from './math/common/fract';
export { max } from './math/common/max';
export { mix } from './math/common/mix';
export { smoothstep } from './math/common/smoothstep';
export { step } from './math/common/step';

// types/scalar - 标量类型
export { bool, Bool } from './types/scalar/bool';
export { float, Float } from './types/scalar/float';
export { int } from './types/scalar/int';
export { uint } from './types/scalar/uint';

// types/vector - 向量类型
export { bvec3 } from './types/vector/bvec3';
export { ivec2 } from './types/vector/ivec2';
export { ivec3 } from './types/vector/ivec3';
export { ivec4 } from './types/vector/ivec4';
export { uvec2 } from './types/vector/uvec2';
export { uvec3 } from './types/vector/uvec3';
export { uvec4 } from './types/vector/uvec4';
export { vec2, Vec2 } from './types/vector/vec2';
export { vec3 } from './types/vector/vec3';
export { vec4 } from './types/vector/vec4';

// types/matrix - 矩阵类型
export { mat2 } from './types/matrix/mat2';
export { mat4 } from './types/matrix/mat4';
export { mat4x3 } from './types/matrix/mat4x3';
