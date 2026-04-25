import { Body, DistanceConstraint, Particle } from '@feng3d-plugins/cannon';
import { ParametricGeometry, RegisterComponent, Renderable, RunEnvironment, Vector3 } from 'feng3d';
import { PhysicsWorld } from './PhysicsWorld';

declare global
{
    export interface MixinsComponentMap
    {
        Cloth: Cloth;
    }
}

@RegisterComponent()
export class Cloth extends Renderable
{
    runEnvironment = RunEnvironment.feng3d;
    particles: Body[][];
    constraints: DistanceConstraint[];

    init()
    {
        super.init();

        const clothMass = 1; // 1 kg in total
        const clothSize = 1; // 1 meter
        const Nx = 12;
        const Ny = 12;
        const mass = clothMass / Nx * Ny;

        const restDistance = clothSize / Nx;

        const clothFunction = plane(restDistance * Nx, restDistance * Ny);

        function plane(width: number, height: number)
        {
            return function (u: number, v: number)
            {
                const x = (u - 0.5) * width;
                const y = (v + 0.5) * height;
                const z = 0;

                return new Vector3(x, y, z);
            };
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const clothGeometry = this.geometry = new ParametricGeometry(clothFunction, Nx, Ny, true);

        const particles: Body[][] = [];

        // Create cannon particles
        for (let i = 0, il = Nx + 1; i !== il; i++)
        {
            particles.push([]);
            for (let j = 0, jl = Ny + 1; j !== jl; j++)
            {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const idx = j * (Nx + 1) + i;
                const p = clothFunction(i / (Nx + 1), j / (Ny + 1));
                const particle = new Body({
                    mass: j === Ny ? 0 : mass
                });
                particle.addShape(new Particle());
                particle.linearDamping = 0.5;
                particle.position.set(
                    p.x,
                    p.y - Ny * 0.9 * restDistance,
                    p.z
                );
                particles[i].push(particle);
                particle.velocity.set(0, 0, -0.1 * (Ny - j));
            }
        }
        const constraints: DistanceConstraint[] = [];
        function connect(i1: number, j1: number, i2: number, j2: number)
        {
            constraints.push(new DistanceConstraint(particles[i1][j1], particles[i2][j2], restDistance));
        }
        for (let i = 0; i < Nx + 1; i++)
        {
            for (let j = 0; j < Ny + 1; j++)
            {
                if (i < Nx) connect(i, j, i + 1, j);
                if (j < Ny) connect(i, j, i, j + 1);
            }
        }
        this.particles = particles;
        this.constraints = constraints;
    }

    update()
    {
        super.update();

        const physicsWorld = this.getComponentsInParent(PhysicsWorld)[0];
        const world = physicsWorld.world;

        this.particles.forEach((p) =>
        {
            p.forEach((v) =>
            {
                world.addBody(v);
            });
        });
        this.constraints.forEach((v) =>
        {
            world.addConstraint(v);
        });
    }
}
