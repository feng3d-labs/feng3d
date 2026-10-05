import { builtin } from './builtin';
import { bool } from '../../types/scalar/bool';
import { float } from '../../types/scalar/float';
import { uint } from '../../types/scalar/uint';
import { vec2 } from '../../types/vector/vec2';
import { vec4 } from '../../types/vector/vec4';

export const gl_Position = builtin('gl_Position', vec4());
export const gl_FragColor = builtin('gl_FragColor', vec4());
export const gl_VertexID = builtin('gl_VertexID', uint());
export const gl_FragCoord = builtin('gl_FragCoord', vec2());
export const gl_InstanceID = builtin('gl_InstanceID', uint());
export const gl_FrontFacing = builtin('gl_FrontFacing', bool());
export const gl_PointSize = builtin('gl_PointSize', float());