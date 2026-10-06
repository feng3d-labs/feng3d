import { reactive } from 'feng3d';
import type { Object3D } from 'feng3d';
import { createPhysicsDemo } from './PhysicsDemo';
import { createBox, createGroundPlane, createParticle, createSphere } from './PhysicsSceneParts';

const demo = createPhysicsDemo(document.getElementById('webgpu') as HTMLCanvasElement);

/** 给对象挂一个约束组件（挂在 A 端，按名字指向 B 端） */
function attachConstraint(host: Object3D, data: Record<string, unknown>): void
{
    (host.components as unknown[]).push(data);
}

/** 给对象设置速度（经响应式写入） */
function setVelocity(target: Object3D, velocity: { x: number; y: number; z: number }): void
{
    (reactive(target) as unknown as { velocity?: unknown }).velocity = velocity;
}

/**
 * 约束示例 —— 1:1 对应 cannon-es 的 `constraints.html`（**七幕**）。
 *
 * 七幕从简到繁地把约束族走一遍：锁链 → 双点链 → 布料 → 摆 → 球链 → 钉住的布 → 3D 布块。
 * 其中三幕是**粒子布料**（用 `ParticleCollider` + 大量 `DistanceConstraint`），
 * 最重的"3D cloth structure"要建 54 个粒子并连出法向 + 2D 对角 + 3D 对角三类约束。
 */
demo.addScene('Lock', (world) =>
{
    reactive(world).gravity = { x: 0, y: -10, z: 0 };
    reactive(world).solverIterations = 20;

    const size = 0.5;
    const mass = 1;
    const space = size * 0.1;
    const N = 10;

    const boxes: Object3D[] = [];
    for (let i = 0; i < N; i++)
    {
        const x = -(N - i - N / 2) * (size * 2 + 2 * space);
        const box = createBox('LockBox-' + i, { x, y: size * 6 + space, z: 0 }, { x: size, y: size, z: size }, { mass });
        boxes.push(box);

        // 当前盒子锁到上一个（LockConstraint 会连相对位置与姿态一起锁死）
        if (i > 0)
        {
            attachConstraint(box, { __type__: 'LockConstraint', targetName: 'LockBox-' + (i - 1) });
        }
    }

    // 两个静态支柱
    const stand1 = createBox('Stand-1', { x: -(-N / 2 + 1) * (size * 2 + 2 * space), y: size * 3, z: 0 },
        { x: size, y: size, z: size }, { mass: 0, color: { r: 0.6, g: 0.6, b: 0.65 } });
    const stand2 = createBox('Stand-2', { x: -(N / 2) * (size * 2 + space * 2), y: size * 3, z: 0 },
        { x: size, y: size, z: size }, { mass: 0, color: { r: 0.6, g: 0.6, b: 0.65 } });

    return [stand1, stand2, ...boxes];
});

demo.addScene('Links', (world) =>
{
    reactive(world).gravity = { x: 0, y: -20, z: -1 };

    const size = 1;
    const space = size * 0.1;
    const N = 10;

    const boxes: Object3D[] = [];
    for (let i = 0; i < N; i++)
    {
        // 原版：第一个（i=0）质量 0 当锚点，其余 0.3
        const mass = i === 0 ? 0 : 0.3;
        const y = (N - i) * (size * 2 + space * 2) + size * 2 + space;
        const box = createBox('LinkBox-' + i, { x: 0, y, z: 0 },
            { x: size, y: size, z: size * 0.1 }, { mass, linearDamping: 0.01, angularDamping: 0.01 });
        boxes.push(box);

        if (i > 0)
        {
            // 用两个角点把相邻两块连起来（点对点约束）
            attachConstraint(box, {
                __type__: 'PointToPointConstraint',
                targetName: 'LinkBox-' + (i - 1),
                pivotA: { x: size, y: size + space, z: 0 },
                pivotB: { x: size, y: -size - space, z: 0 },
            });
            attachConstraint(box, {
                __type__: 'PointToPointConstraint',
                targetName: 'LinkBox-' + (i - 1),
                pivotA: { x: -size, y: size + space, z: 0 },
                pivotB: { x: -size, y: -size - space, z: 0 },
            });
        }
    }

    return boxes;
});

demo.addScene('Cloth on sphere', (_world) =>
{
    const dist = 0.2;
    const mass = 0.5;
    const rows = 15;
    const cols = 15;

    const particles: Object3D[] = [];
    for (let i = 0; i < cols; i++)
    {
        for (let j = 0; j < rows; j++)
        {
            const particle = createParticle('P-' + i + '-' + j, {
                x: -(i - cols * 0.5) * dist,
                y: 5,
                z: (j - rows * 0.5) * dist,
            }, { mass });
            particles.push(particle);
        }
    }

    // 相邻粒子之间连一条距离约束（向右、向上各一条）
    for (let i = 0; i < cols; i++)
    {
        for (let j = 0; j < rows; j++)
        {
            const host = particles[i * rows + j];
            if (i < cols - 1)
            {
                attachConstraint(host, { __type__: 'DistanceConstraint', targetName: 'P-' + (i + 1) + '-' + j, distance: dist });
            }
            if (j < rows - 1)
            {
                attachConstraint(host, { __type__: 'DistanceConstraint', targetName: 'P-' + i + '-' + (j + 1), distance: dist });
            }
        }
    }

    // 布料盖上去的静态球
    const ball = createSphere('ClothSphere', { x: 0, y: 3.5, z: 0 }, 1.5, {
        mass: 0,
        color: { r: 0.55, g: 0.6, b: 0.7 },
    });

    return [ball, ...particles];
});

demo.addScene('Sphere pendulum', (_world) =>
{
    const size = 1;
    const mass = 1;

    const swinging = createSphere('SwingingSphere', { x: 0, y: size * 3, z: 0 }, size, { mass });
    setVelocity(swinging, { x: -5, y: 0, z: 0 });

    const anchor = createSphere('AnchorSphere', { x: 0, y: size * 7, z: 0 }, size, {
        mass: 0,
        color: { r: 0.6, g: 0.6, b: 0.65 },
    });

    // 原版用点对点约束把两球的两个"外极点"钉在一起
    attachConstraint(swinging, {
        __type__: 'PointToPointConstraint',
        targetName: 'AnchorSphere',
        pivotA: { x: 0, y: size * 2, z: 0 },
        pivotB: { x: 0, y: -size * 2, z: 0 },
    });

    return [anchor, swinging];
});

demo.addScene('Sphere chain', (world) =>
{
    const size = 0.5;
    const dist = size * 2 + 0.12;
    const mass = 1;
    const N = 20;

    // 原版：要传播 N 个球的力，solver 至少要有 N 次迭代
    reactive(world).solverIterations = N;

    const spheres: Object3D[] = [];
    for (let i = 0; i < N; i++)
    {
        const sphere = createSphere('ChainSphere-' + i, { x: 0, y: dist * (N - i), z: 0 }, size, {
            mass: i === 0 ? 0 : mass,
        });
        // 每球给一个不同的水平初速度，链子会甩起来
        setVelocity(sphere, { x: -i, y: 0, z: 0 });
        spheres.push(sphere);

        if (i > 0)
        {
            attachConstraint(sphere, {
                __type__: 'DistanceConstraint',
                targetName: 'ChainSphere-' + (i - 1),
                distance: dist,
            });
        }
    }

    return spheres;
});

demo.addScene('Particle cloth', (world) =>
{
    reactive(world).solverIterations = 18;

    const dist = 0.2;
    const mass = 0.5;
    const rows = 15;
    const cols = 15;

    const particles: Object3D[] = [];
    for (let i = 0; i < cols; i++)
    {
        for (let j = 0; j < rows; j++)
        {
            // 原版：**最上面一排（j = rows-1）质量 0**，等于把布钉在空中
            const isNailed = j === rows - 1;
            const particle = createParticle('PC-' + i + '-' + j, { x: -dist * i, y: dist * j + 5, z: 0 }, {
                mass: isNailed ? 0 : mass,
            });
            setVelocity(particle, { x: 0, y: 0, z: (Math.sin(i * 0.1) + Math.sin(j * 0.1)) * 3 });
            particles.push(particle);
        }
    }

    for (let i = 0; i < cols; i++)
    {
        for (let j = 0; j < rows; j++)
        {
            const host = particles[i * rows + j];
            if (i < cols - 1)
            {
                attachConstraint(host, { __type__: 'DistanceConstraint', targetName: 'PC-' + (i + 1) + '-' + j, distance: dist });
            }
            if (j < rows - 1)
            {
                attachConstraint(host, { __type__: 'DistanceConstraint', targetName: 'PC-' + i + '-' + (j + 1), distance: dist });
            }
        }
    }

    return particles;
});

demo.addScene('3D cloth structure', (world) =>
{
    reactive(world).solverIterations = 10;

    const dist = 1;
    const mass = 1;
    const Nx = 6;
    const Ny = 3;
    const Nz = 3;

    const name = (i: number, j: number, k: number) => 'D3-' + i + '-' + j + '-' + k;
    const particles: Object3D[] = [];
    const at = new Map<string, Object3D>();
    for (let i = 0; i < Nx; i++)
    {
        for (let j = 0; j < Ny; j++)
        {
            for (let k = 0; k < Nz; k++)
            {
                const particle = createParticle(name(i, j, k), { x: -dist * i, y: dist * k + dist * Nz * 0.3 + 1, z: dist * j }, { mass });
                setVelocity(particle, { x: 0, y: 0, z: (Math.sin(i * 0.1) + Math.sin(j * 0.1)) * 30 });
                particles.push(particle);
                at.set(name(i, j, k), particle);
            }
        }
    }

    const connect = (i1: number, j1: number, k1: number, i2: number, j2: number, k2: number, distance: number) =>
    {
        const host = at.get(name(i1, j1, k1));
        if (host === undefined) return;
        attachConstraint(host, { __type__: 'DistanceConstraint', targetName: name(i2, j2, k2), distance });
    };

    for (let i = 0; i < Nx; i++)
    {
        for (let j = 0; j < Ny; j++)
        {
            for (let k = 0; k < Nz; k++)
            {
                // 三个法向
                if (i < Nx - 1) connect(i, j, k, i + 1, j, k, dist);
                if (j < Ny - 1) connect(i, j, k, i, j + 1, k, dist);
                if (k < Nz - 1) connect(i, j, k, i, j, k + 1, dist);

                // 3D 对角
                if (i < Nx - 1 && j < Ny - 1 && k < Nz - 1)
                {
                    connect(i, j, k, i + 1, j + 1, k + 1, Math.sqrt(3) * dist);
                    connect(i + 1, j, k, i, j + 1, k + 1, Math.sqrt(3) * dist);
                    connect(i, j + 1, k, i + 1, j, k + 1, Math.sqrt(3) * dist);
                    connect(i, j, k + 1, i + 1, j + 1, k, Math.sqrt(3) * dist);
                }

                // 2D 对角（三个平面）
                if (i < Nx - 1 && j < Ny - 1)
                {
                    connect(i + 1, j, k, i, j + 1, k, Math.sqrt(2) * dist);
                    connect(i, j + 1, k, i + 1, j, k, Math.sqrt(2) * dist);
                }
                if (i < Nx - 1 && k < Nz - 1)
                {
                    connect(i + 1, j, k, i, j, k + 1, Math.sqrt(2) * dist);
                    connect(i, j, k + 1, i + 1, j, k, Math.sqrt(2) * dist);
                }
                if (j < Ny - 1 && k < Nz - 1)
                {
                    connect(i, j + 1, k, i, j, k + 1, Math.sqrt(2) * dist);
                    connect(i, j, k + 1, i, j + 1, k, Math.sqrt(2) * dist);
                }
            }
        }
    }

    return [createGroundPlane(), ...particles];
});
