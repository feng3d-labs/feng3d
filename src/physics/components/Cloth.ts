namespace feng3d { export interface ComponentMap { Cloth: CANNON.Cloth; } }

namespace CANNON
{
    @feng3d.RegisterComponent()
    export class Cloth extends feng3d.Renderable
    {
        runEnvironment = feng3d.RunEnvironment.feng3d;
        particles: Body[][];
        constraints: DistanceConstraint[];

        init()
        {
            super.init();

            var clothMass = 1;  // 1 kg in total
            var clothSize = 1; // 1 meter
            var Nx = 12;
            var Ny = 12;
            var mass = clothMass / Nx * Ny;

            var restDistance = clothSize / Nx;

            var clothFunction = plane(restDistance * Nx, restDistance * Ny);

            function plane(width: number, height: number)
            {
                return function (u: number, v: number)
                {
                    var x = (u - 0.5) * width;
                    var y = (v + 0.5) * height;
                    var z = 0;
                    return new feng3d.Vector3(x, y, z);
                };
            }

            var clothGeometry = this.geometry = new feng3d.ParametricGeometry(clothFunction, Nx, Ny, true);

            var particles: Body[][] = [];

            // Create cannon particles
            for (var i = 0, il = Nx + 1; i !== il; i++)
            {
                particles.push([]);
                for (var j = 0, jl = Ny + 1; j !== jl; j++)
                {
                    var idx = j * (Nx + 1) + i;
                    var p = clothFunction(i / (Nx + 1), j / (Ny + 1));
                    var particle = new Body({
                        mass: j == Ny ? 0 : mass
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
            var constraints: DistanceConstraint[] = [];
            function connect(i1: number, j1: number, i2: number, j2: number)
            {
                constraints.push(new DistanceConstraint(particles[i1][j1], particles[i2][j2], restDistance));
            }
            for (var i = 0; i < Nx + 1; i++)
            {
                for (var j = 0; j < Ny + 1; j++)
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

            var physicsWorld = this.getComponentsInParents("PhysicsWorld")[0];
            var world = physicsWorld.world;

            this.particles.forEach(p =>
            {
                p.forEach(v =>
                {
                    world.addBody(v);
                });
            });
            this.constraints.forEach(v =>
            {
                world.addConstraint(v);
            });
        }
    }
}