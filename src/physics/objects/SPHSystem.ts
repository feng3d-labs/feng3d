namespace CANNON
{
    export class SPHSystem
    {
        particles: Body[];
        /**
         * Density of the system (kg/m3).
         */
        density: number;
        /**
         * Distance below which two particles are considered to be neighbors.
         * It should be adjusted so there are about 15-20 neighbor particles within this radius.
         */
        smoothingRadius: number;
        speedOfSound: number;
        /**
         * Viscosity of the system.
         */
        viscosity: number;
        eps: number;
        pressures: number[];
        densities: number[];
        neighbors: Body[][];

        /**
         * Smoothed-particle hydrodynamics system
         */
        constructor()
        {
            this.particles = [];

            this.density = 1;

            this.smoothingRadius = 1;
            this.speedOfSound = 1;

            this.viscosity = 0.01;
            this.eps = 0.000001;

            // Stuff Computed per particle
            this.pressures = [];
            this.densities = [];
            this.neighbors = [];
        }

        /**
         * Add a particle to the system.
         * 
         * @param particle
         */
        add(particle: Body)
        {
            this.particles.push(particle);
            if (this.neighbors.length < this.particles.length)
            {
                this.neighbors.push([]);
            }
        }

        /**
         * Remove a particle from the system.
         * 
         * @param particle
         */
        remove(particle: Body)
        {
            var idx = this.particles.indexOf(particle);
            if (idx !== -1)
            {
                this.particles.splice(idx, 1);
                if (this.neighbors.length > this.particles.length)
                {
                    this.neighbors.pop();
                }
            }
        }

        /**
         * Get neighbors within smoothing volume, save in the array neighbors
         * 
         * @param particle
         * @param neighbors
         */
        getNeighbors(particle: Body, neighbors: Body[])
        {
            var N = this.particles.length,
                id = particle.id,
                R2 = this.smoothingRadius * this.smoothingRadius,
                dist = SPHSystem_getNeighbors_dist;
            for (var i = 0; i !== N; i++)
            {
                var p = this.particles[i];
                p.position.subTo(particle.position, dist);
                if (id !== p.id && dist.lengthSquared < R2)
                {
                    neighbors.push(p);
                }
            }
        }

        update()
        {
            var N = this.particles.length,
                dist = SPHSystem_update_dist,
                cs = this.speedOfSound,
                eps = this.eps;

            for (var i = 0; i !== N; i++)
            {
                var p = this.particles[i]; // Current particle
                var neighbors = this.neighbors[i];

                // Get neighbors
                neighbors.length = 0;
                this.getNeighbors(p, neighbors);
                neighbors.push(this.particles[i]); // Add current too
                var numNeighbors = neighbors.length;

                // Accumulate density for the particle
                var sum = 0.0;
                for (var j = 0; j !== numNeighbors; j++)
                {

                    //printf("Current particle has position %f %f %f\n",objects[id].pos.x(),objects[id].pos.y(),objects[id].pos.z());
                    p.position.subTo(neighbors[j].position, dist);
                    var len = dist.length;

                    var weight = this.w(len);
                    sum += neighbors[j].mass * weight;
                }

                // Save
                this.densities[i] = sum;
                this.pressures[i] = cs * cs * (this.densities[i] - this.density);
            }

            // Add forces

            // Sum to these accelerations
            var a_pressure = SPHSystem_update_a_pressure;
            var a_visc = SPHSystem_update_a_visc;
            var gradW = SPHSystem_update_gradW;
            var r_vec = SPHSystem_update_r_vec;
            var u = SPHSystem_update_u;

            for (var i = 0; i !== N; i++)
            {

                var particle = this.particles[i];

                a_pressure.set(0, 0, 0);
                a_visc.set(0, 0, 0);

                // Init vars
                var Pij;
                var nabla;
                var Vij;

                // Sum up for all other neighbors
                var neighbors = this.neighbors[i];
                var numNeighbors = neighbors.length;

                //printf("Neighbors: ");
                for (var j = 0; j !== numNeighbors; j++)
                {

                    var neighbor = neighbors[j];
                    //printf("%d ",nj);

                    // Get r once for all..
                    particle.position.subTo(neighbor.position, r_vec);
                    var r = r_vec.length;

                    // Pressure contribution
                    Pij = -neighbor.mass * (this.pressures[i] / (this.densities[i] * this.densities[i] + eps) + this.pressures[j] / (this.densities[j] * this.densities[j] + eps));
                    this.gradw(r_vec, gradW);
                    // Add to pressure acceleration
                    gradW.scaleNumberTo(Pij, gradW);
                    a_pressure.addTo(gradW, a_pressure);

                    // Viscosity contribution
                    neighbor.velocity.subTo(particle.velocity, u);
                    u.scaleNumberTo(1.0 / (0.0001 + this.densities[i] * this.densities[j]) * this.viscosity * neighbor.mass, u);
                    nabla = this.nablaw(r);
                    u.scaleNumberTo(nabla, u);
                    // Add to viscosity acceleration
                    a_visc.addTo(u, a_visc);
                }

                // Calculate force
                a_visc.scaleNumberTo(particle.mass, a_visc);
                a_pressure.scaleNumberTo(particle.mass, a_pressure);

                // Add force to particles
                particle.force.addTo(a_visc, particle.force);
                particle.force.addTo(a_pressure, particle.force);
            }
        }

        // Calculate the weight using the W(r) weightfunction
        w(r: number)
        {
            // 315
            var h = this.smoothingRadius;
            return 315.0 / (64.0 * Math.PI * Math.pow(h, 9)) * Math.pow(h * h - r * r, 3);
        }

        // calculate gradient of the weight function
        gradw(rVec: Vector3, resultVec: Vector3)
        {
            var r = rVec.length,
                h = this.smoothingRadius;
            rVec.scaleNumberTo(945.0 / (32.0 * Math.PI * Math.pow(h, 9)) * Math.pow((h * h - r * r), 2), resultVec);
        }

        // Calculate nabla(W)
        nablaw(r: number)
        {
            var h = this.smoothingRadius;
            var nabla = 945.0 / (32.0 * Math.PI * Math.pow(h, 9)) * (h * h - r * r) * (7 * r * r - 3 * h * h);
            return nabla;
        }
    }


    var SPHSystem_getNeighbors_dist = new Vector3();
    var SPHSystem_update_dist = new Vector3();
    var SPHSystem_update_a_pressure = new Vector3();
    var SPHSystem_update_a_visc = new Vector3();
    var SPHSystem_update_gradW = new Vector3();
    var SPHSystem_update_r_vec = new Vector3();
    var SPHSystem_update_u = new Vector3(); // Relative velocity
}