import { reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';

const webgpuCanvas = document.getElementById('webgpu') as HTMLCanvasElement;
const demo = createPhysicsDemo(webgpuCanvas);

/**
 * 弹性示例 —— 1:1 对应 cannon-es 的 `examples/bounce.html`。
 *
 * 原版场景（逐项对齐）：
 * - 一个无限大的 Plane 地面（mass 0）
 * - 三个半径 1、质量 10 的球，从同一个高度 y=5 落下，x 分别是 -3 / 0 / 3，z 都是 1
 * - 三个球各自一种材质，与地面之间的 ContactMaterial 弹性分别是 0.0 / 0.7 / 0.9，摩擦都是 0
 * - 线性阻尼 0.01，重力 (0, -10, 0)
 *
 * 视觉与原版的 shapeToGeometry 规则一致：球用 `SphereGeometry(radius, 8, 8)`，
 * 地面用 `PlaneGeometry(500, 500)`。
 */
const SIZE = 1;
const MASS = 10;
const HEIGHT = 5;
const DAMPING = 0.01;

const colors = [
    { r: 0.85, g: 0.85, b: 0.85 },
    { r: 0.60, g: 0.75, b: 0.95 },
    { r: 0.95, g: 0.70, b: 0.45 },
];

demo.addScene('Bounce', (world) =>
{
    // 原版里球与地面是显式的 ContactMaterial（friction 0），所以世界默认也给 0，
    // 这样「球材质 × 世界默认材质」平均出来才是 0，而不是 cannon-es 默认的 0.3
    reactive(world).friction = 0;

    const ground: Object3D = {
        __type__: 'Object3D',
        name: 'Ground',
        // Plane 默认法线朝 +Z，绕 X 转 -90° 让法线朝上（与原版 quaternion.setFromEuler(-PI/2, 0, 0) 一致）
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'PlaneGeometry', width: 500, height: 500, segmentsW: 4, segmentsH: 4 },
            material: {
                __type__: 'ColorMaterial',
                uniforms: { u_diffuseInput: { __type__: 'Color4', r: 0.5, g: 0.5, b: 0.5, a: 1 } },
            },
        }, {
            __type__: 'PlaneCollider',
        }, {
            __type__: 'Rigidbody',
            mass: 0,
            friction: 0,
            restitution: 0,
        }],
    };

    const spheres = [0.0, 0.7, 0.9].map((restitution, i): Object3D => ({
        __type__: 'Object3D',
        name: 'Sphere-' + (i + 1),
        position: { x: (i - 1) * 3, y: HEIGHT, z: SIZE },
        components: [{
            __type__: 'MeshRenderer',
            geometry: { __type__: 'SphereGeometry', radius: SIZE, segmentsW: 8, segmentsH: 8 },
            material: {
                __type__: 'ColorMaterial',
                uniforms: {
                    u_diffuseInput: {
                        __type__: 'Color4',
                        r: colors[i].r, g: colors[i].g, b: colors[i].b, a: 1,
                    },
                },
            },
        }, {
            __type__: 'SphereCollider',
            radius: SIZE,
        }, {
            __type__: 'Rigidbody',
            mass: MASS,
            linearDamping: DAMPING,
            friction: 0,
            restitution,
        }],
    }));

    return [ground, ...spheres];
});
