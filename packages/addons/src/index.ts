/**
 * @feng3d/addons 入口
 *
 * 非核心扩展模块（移植自 three.js 的几何体/函数库等）。
 *
 * 使用方式：显式 import 触发 registerLogic 副作用（与 three.js addons 模式一致）。
 * ```ts
 * import { ParametricGeometry, klein } from '@feng3d/addons';
 * ```
 *
 * 按目录分模块聚合导出：
 * - `geometries/`：移植自 three.js 的几何体（Polyhedron/Icosa/Octa/Tetra/Circle/Ring/Lathe/TorusKnot/Parametric）+ 参数曲面函数库
 */

// 几何体（类）
export * from './geometries/PolyhedronGeometry';
export * from './geometries/IcosahedronGeometry';
export * from './geometries/OctahedronGeometry';
export * from './geometries/TetrahedronGeometry';
export * from './geometries/CircleGeometry';
export * from './geometries/RingGeometry';
export * from './geometries/LatheGeometry';
export * from './geometries/TorusKnotGeometry';
export * from './geometries/ConvexGeometry';
export * from './geometries/TubeGeometry';
export * from './geometries/ShapeGeometry';
export * from './geometries/ExtrudeGeometry';
export * from './geometries/ParametricGeometry';

// 参数化曲面函数库（无类，仅函数）
export * from './geometries/ParametricFunctions';
