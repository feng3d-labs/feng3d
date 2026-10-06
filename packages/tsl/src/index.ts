// variables - 变量相关
export { array, arrayWithValues } from './variables/array';
export type { Array as TSLArray } from './variables/array';
export { attribute } from './variables/attribute';
export { struct } from './variables/struct';
export type { Struct, StructBase, StructMembers, StructType } from './variables/struct';
export { arrayLength } from './variables/arrayLength';
export { storageBuffer, type StorageAccess, type StorageBuffer, type StorageBufferOptions } from './variables/storageBuffer';
export { atomicAdd, atomicLoad, atomicMax, atomicMin, atomicStore, atomicSub } from './variables/atomicOps';
export { uniform } from './variables/uniform';
export { varying } from './variables/varying';
export { let_ } from './variables/let';
export { assign } from './variables/assign';
export { var_ } from './variables/var';

// shader - 着色器相关
export { compute, Compute, type ComputeOptions, type WorkgroupSize, type WorkgroupSizeComponent } from './shader/compute';
export { type FragmentOptions, fragment } from './shader/fragment';
export { overrideBool, overrideF32, overrideI32, overrideU32 } from './shader/override';
export { transform } from './shader/transform';
export { type VertexOptions, vertex } from './shader/vertex';
export { func } from './shader/func';
export type { FuncDefinitionSource, ShaderFuncCallable } from './shader/func';

// glsl - GLSL 专有
export { builtin, Builtin } from './glsl/builtin/builtin';
export { precision } from './glsl/precision';
export { fragColor } from './glsl/fragColor';

// glsl/sampler - 采样器
export { sampler2D } from './glsl/sampler/sampler2D';
export { sampler2DArray } from './glsl/sampler/sampler2DArray';
export { sampler3D } from './glsl/sampler/sampler3D';
export { samplerComparison } from './glsl/sampler/samplerComparison';
export { samplerCube } from './glsl/sampler/samplerCube';
export { usampler2D } from './glsl/sampler/usampler2D';
export { depthSampler } from './glsl/sampler/depthSampler';
export { type SampledDepthTexture, sampledDepthTexture } from './glsl/sampler/sampledDepthTexture';

// glsl/builtin - 内置变量
export { gl_Position, gl_FragColor, gl_VertexID, gl_FragCoord, gl_InstanceID, gl_FrontFacing, gl_PointSize } from './glsl/builtin/builtins';

// glsl/texture - 纹理函数
export { texelFetch } from './glsl/texture/texelFetch';
export { type StorageTexture2D, storageTexture2D } from './glsl/texture/storageTexture2D';
export { type StorageTexture3D, storageTexture3D } from './glsl/texture/storageTexture3D';
export { textureStore } from './glsl/texture/textureStore';
export { textureDimensions } from './glsl/texture/textureDimensions';
export { texelFetchOffset } from './glsl/texture/texelFetchOffset';
export { texture } from './glsl/texture/texture';
export { texture2D } from './glsl/texture/texture2D';
export { textureSampleCompare } from './glsl/texture/textureSampleCompare';
export { textureGrad } from './glsl/texture/textureGrad';
export { textureLod } from './glsl/texture/textureLod';
export { textureOffset } from './glsl/texture/textureOffset';
export { textureSize } from './glsl/texture/textureSize';

// glsl/derivative - 导数函数
export { dFdx } from './glsl/derivative/dFdx';
export { dFdy } from './glsl/derivative/dFdy';

// control - 控制流
export { continue_ } from './control/continue_';
export { storageBarrier, textureBarrier, workgroupBarrier } from './control/barrier';
export { statement } from './control/statement';
export { void_, type Void } from './types/scalar/void';
export { while_ } from './control/while_';
export { switch_ } from './control/switch_';
export { type Overrides, type OverrideValue } from './shader/overrides';
export { type SwitchBuilder } from './control/switch_';
export { discard } from './control/discard';
export { forRange_, forU32_ } from './control/for_';
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
export { distance } from './math/geometric/distance';
export { length } from './math/geometric/length';
export { exp } from './math/exponential/exp';
export { log2 } from './math/exponential/log2';
export { pow } from './math/exponential/pow';
export { sqrt } from './math/exponential/sqrt';

// math/common - 通用数学函数
export { abs } from './math/common/abs';
export { floor } from './math/common/floor';
export { clamp } from './math/common/clamp';
export { saturate } from './math/common/saturate';
export { fract } from './math/common/fract';
export { max } from './math/common/max';
export { min } from './math/common/min';
export { mix } from './math/common/mix';
export { smoothstep } from './math/common/smoothstep';
export { step } from './math/common/step';

// types/scalar - 标量类型
export { bool, Bool } from './types/scalar/bool';
export { float, Float } from './types/scalar/float';
export { int } from './types/scalar/int';
export { UInt, uint } from './types/scalar/uint';

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
export { mat3 } from './types/matrix/mat3';
export type { Mat3 } from './types/matrix/mat3';
export { mat4 } from './types/matrix/mat4';
export type { Mat4 } from './types/matrix/mat4';
export { mat4x3 } from './types/matrix/mat4x3';
