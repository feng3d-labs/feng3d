namespace CANNON
{
    export interface WorldEventMap
    {
        /**
         * 添加物体
         */
        addBody: Body;
        /**
         * 移除物体
         */
        removeBody: Body;

        preStep: any;

        postStep: any;

        beginContact: { bodyA: Body, bodyB: Body };

        endContact: { bodyA: Body, bodyB: Body };

        beginShapeContact: { shapeA: Shape, shapeB: Shape, bodyA: Body, bodyB: Body };

        endShapeContact: { shapeA: Shape, shapeB: Shape, bodyA: Body, bodyB: Body };
    }

    export interface World
    {
        once<K extends keyof WorldEventMap>(type: K, listener: (event: feng3d.Event<WorldEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof WorldEventMap>(type: K, data?: WorldEventMap[K], bubbles?: boolean): feng3d.Event<WorldEventMap[K]>;
        has<K extends keyof WorldEventMap>(type: K): boolean;
        on<K extends keyof WorldEventMap>(type: K, listener: (event: feng3d.Event<WorldEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof WorldEventMap>(type?: K, listener?: (event: feng3d.Event<WorldEventMap[K]>) => any, thisObject?: any): void;
    }

    export class World extends feng3d.EventDispatcher
    {

        /**
         * Currently / last used timestep. Is set to -1 if not available. This value is updated before each internal step, which means that it is "fresh" inside event callbacks.
         */
        dt: number;

        /**
         * Makes bodies go to sleep when they've been inactive
         */
        allowSleep: boolean;

        /**
         * All the current contacts (instances of ContactEquation) in the world.
         */
        contacts: ContactEquation[];
        frictionEquations: FrictionEquation[];

        /**
         * How often to normalize quaternions. Set to 0 for every step, 1 for every second etc.. A larger value increases performance. If bodies tend to explode, set to a smaller value (zero to be sure nothing can go wrong).
         */
        quatNormalizeSkip: number;

        /**
         * Set to true to use fast quaternion normalization. It is often enough accurate to use. If bodies tend to explode, set to false.
         */
        quatNormalizeFast: boolean;

        /**
         * The wall-clock time since simulation start
         */
        time: number;

        /**
         * Number of timesteps taken since start
         */
        stepnumber: number;

        /// Default and last timestep sizes
        default_dt: number;

        nextId: number;
        gravity: feng3d.Vector3;

        /**
         * The broadphase algorithm to use. Default is NaiveBroadphase
         */
        broadphase: Broadphase;

        bodies: Body[];

        /**
         * The solver algorithm to use. Default is GSSolver
         */
        solver: Solver;

        constraints: Constraint[];

        narrowphase: Narrowphase;

        collisionMatrix: { [key: string]: boolean } = {}

        /**
         * CollisionMatrix from the previous step.
         */
        collisionMatrixPrevious: { [key: string]: boolean } = {}

        bodyOverlapKeeper: OverlapKeeper;
        shapeOverlapKeeper: OverlapKeeper;

        /**
         * All added materials
         */
        materials: Material[];

        contactmaterials: ContactMaterial[];

        /**
         * Used to look up a ContactMaterial given two instances of Material.
         */
        contactMaterialTable: { [key: string]: any };

        defaultMaterial: Material;

        /**
         * This contact material is used if no suitable contactmaterial is found for a contact.
         */
        defaultContactMaterial: ContactMaterial;

        doProfiling: boolean;

        profile = {
            solve: 0,
            makeContactConstraints: 0,
            broadphase: 0,
            integrate: 0,
            narrowphase: 0,
        };

        /**
         * Time accumulator for interpolation. See http://gafferongames.com/game-physics/fix-your-timestep/
         */
        accumulator: number;

        subsystems: any[];

        /**
         * Dispatched after a body has been added to the world.
         */
        // addBodyEvent = {
        //     type: "addBody",
        //     body: null
        // };

        /**
         * Dispatched after a body has been removed from the world.
         */
        // removeBodyEvent = {
        //     type: "removeBody",
        //     body: null
        // };

        idToBodyMap: { [key: string]: Body } = {};

        /**
         * The physics world
         * @param options 
         */
        constructor(options: { gravity?: feng3d.Vector3, allowSleep?: boolean, broadphase?: Broadphase, solver?: Solver, quatNormalizeFast?: boolean, quatNormalizeSkip?: number } = {})
        {
            super();

            this.dt = -1;
            this.allowSleep = !!options.allowSleep;
            this.contacts = [];
            this.frictionEquations = [];
            this.quatNormalizeSkip = options.quatNormalizeSkip !== undefined ? options.quatNormalizeSkip : 0;
            this.quatNormalizeFast = options.quatNormalizeFast !== undefined ? options.quatNormalizeFast : false;
            this.time = 0.0;
            this.stepnumber = 0;
            this.default_dt = 1 / 60;
            this.nextId = 0;
            this.gravity = new feng3d.Vector3();
            if (options.gravity)
            {
                this.gravity.copy(options.gravity);
            }
            this.broadphase = options.broadphase !== undefined ? options.broadphase : new Broadphase();
            this.bodies = [];
            this.solver = options.solver !== undefined ? options.solver : new GSSolver();
            this.constraints = [];
            this.narrowphase = new Narrowphase(this);
            this.collisionMatrix = {};
            this.collisionMatrixPrevious = {};

            this.bodyOverlapKeeper = new OverlapKeeper();
            this.shapeOverlapKeeper = new OverlapKeeper();
            this.materials = [];
            this.contactmaterials = [];
            this.contactMaterialTable = {};

            this.defaultMaterial = new Material("default");
            this.defaultContactMaterial = new ContactMaterial(this.defaultMaterial, this.defaultMaterial, 0.3, 0.0);
            this.doProfiling = false;
            this.profile = {
                solve: 0,
                makeContactConstraints: 0,
                broadphase: 0,
                integrate: 0,
                narrowphase: 0,
            };
            this.accumulator = 0;
            this.subsystems = [];

            this.idToBodyMap = {};
        }

        /**
         * Get the contact material between materials m1 and m2
         * @param m1
         * @param m2
         * @return  The contact material if it was found.
         */
        getContactMaterial(m1: Material, m2: Material)
        {
            return this.contactMaterialTable[m1.id + "_" + m2.id];
        }

        /**
         * Store old collision state info
         */
        collisionMatrixTick()
        {
            var temp = this.collisionMatrixPrevious;
            this.collisionMatrixPrevious = this.collisionMatrix;
            this.collisionMatrix = temp;
            this.collisionMatrix = {};

            this.bodyOverlapKeeper.tick();
            this.shapeOverlapKeeper.tick();
        }

        /**
         * 
         * @param body 
         */
        addBody(body: Body)
        {
            if (this.bodies.indexOf(body) !== -1)
            {
                return;
            }
            body.index = this.bodies.length;
            this.bodies.push(body);
            body.world = this;
            body.initPosition.copy(body.position);
            body.initVelocity.copy(body.velocity);
            body.timeLastSleepy = this.time;
            if (body instanceof Body)
            {
                body.initAngularVelocity.copy(body.angularVelocity);
                body.initQuaternion.copy(body.quaternion);
            }
            this.idToBodyMap[body.id] = body;
            this.dispatch("addBody", body);
        }

        /**
         * Add a constraint to the simulation.
         * @param c
         */
        addConstraint(c: Constraint)
        {
            this.constraints.push(c);
        }

        /**
         * Removes a constraint
         * @param c
         */
        removeConstraint(c: Constraint)
        {
            var idx = this.constraints.indexOf(c);
            if (idx !== -1)
            {
                this.constraints.splice(idx, 1);
            }
        }

        /**
         * Ray cast, and return information of the closest hit.
         * 
         * @param from 
         * @param to 
         * @param options 
         * @param result 
         * 
         * @return True if any body was hit.
         */
        raycast(from: feng3d.Vector3, to: feng3d.Vector3, result: RaycastResult, mode = Ray.CLOSEST, skipBackfaces = true)
        {
            return tmpRay.intersectWorld(this, from, to, result, mode, skipBackfaces);
        }

        /**
         * Remove a rigid body from the simulation.
         * @param body
         */
        removeBody(body: Body)
        {
            body.world = null;
            var n = this.bodies.length - 1,
                bodies = this.bodies,
                idx = bodies.indexOf(body);
            if (idx !== -1)
            {
                bodies.splice(idx, 1); // Todo: should use a garbage free method

                // Recompute index
                for (var i = 0; i !== bodies.length; i++)
                {
                    bodies[i].index = i;
                }

                delete this.idToBodyMap[body.id];
                this.dispatch("removeBody", body);
            }
        }

        getBodyById(id: number)
        {
            return this.idToBodyMap[id];
        }

        // TODO Make a faster map
        getShapeById(id: number)
        {
            var bodies = this.bodies;
            for (var i = 0, bl = bodies.length; i < bl; i++)
            {
                var shapes = bodies[i].shapes;
                for (var j = 0, sl = shapes.length; j < sl; j++)
                {
                    var shape = shapes[j];
                    if (shape.id === id)
                    {
                        return shape;
                    }
                }
            }
        }

        /**
         * Adds a material to the World.
         * @param m
         * @todo Necessary?
         */
        addMaterial(m: Material)
        {
            this.materials.push(m);
        }

        /**
         * Adds a contact material to the World
         * @param cmat
         */
        addContactMaterial(cmat: ContactMaterial)
        {

            // Add contact material
            this.contactmaterials.push(cmat);

            // Add current contact material to the material table
            var id0 = cmat.materials[0].id;
            var id1 = cmat.materials[1].id;
            this.contactMaterialTable[id0 + "_" + id1] = cmat;
            this.contactMaterialTable[id1 + "_" + id0] = cmat;
        }

        /**
         * 让物理世界在时间上向前迈进。
         *
         * 有两种模式。简单的模式是固定的时间步长没有插值。在本例中，您只使用第一个参数。第二种情况使用插值。因为您还提供了函数上次使用以来的时间，以及要采取的最大固定时间步骤。
         *
         * @param dt 使用固定时间步长。单位为s。
         * @param timeSinceLastCalled 函数上次调用后经过的时间。单位为s。
         * @param maxSubSteps 每个函数调用要执行的最大固定步骤数。
         *
         * @example
         *     // 固定的时间步进没有插值
         *     world.step(1/60);
         */
        step(dt: number, timeSinceLastCalled: number, maxSubSteps: number)
        {
            maxSubSteps = maxSubSteps || 10;
            timeSinceLastCalled = timeSinceLastCalled || 0;

            if (timeSinceLastCalled === 0)
            { // Fixed, simple stepping

                this.internalStep(dt);

                // Increment time
                this.time += dt;

            } else
            {

                this.accumulator += timeSinceLastCalled;
                var substeps = 0;
                while (this.accumulator >= dt && substeps < maxSubSteps)
                {
                    // Do fixed steps to catch up
                    this.internalStep(dt);
                    this.accumulator -= dt;
                    substeps++;
                }

                var t = (this.accumulator % dt) / dt;
                for (var j = 0; j !== this.bodies.length; j++)
                {
                    var b = this.bodies[j];
                    b.previousPosition.lerpNumberTo(b.position, t, b.interpolatedPosition);
                    b.previousQuaternion.slerpTo(b.quaternion, t, b.interpolatedQuaternion);
                    b.previousQuaternion.normalize();
                }
                this.time += timeSinceLastCalled;
            }
        }

        internalStep(dt: number)
        {
            this.dt = dt;

            var contacts = this.contacts,
                p1: Body[] = [],
                p2: Body[] = [],
                N = this.bodies.length,
                bodies = this.bodies,
                solver = this.solver,
                gravity = this.gravity,
                doProfiling = this.doProfiling,
                profile = this.profile,
                DYNAMIC = Body.DYNAMIC,
                profilingStart,
                constraints = this.constraints,
                frictionEquationPool = World_step_frictionEquationPool,
                gnorm = gravity.length,
                gx = gravity.x,
                gy = gravity.y,
                gz = gravity.z,
                i = 0;

            if (doProfiling)
            {
                profilingStart = performance.now();
            }

            // Add gravity to all objects
            for (i = 0; i !== N; i++)
            {
                var bi = bodies[i];
                if (bi.type === DYNAMIC)
                { // Only for dynamic bodies
                    var f = bi.force, m = bi.mass;
                    f.x += m * gx;
                    f.y += m * gy;
                    f.z += m * gz;
                }
            }

            // Update subsystems
            for (var i = 0, Nsubsystems = this.subsystems.length; i !== Nsubsystems; i++)
            {
                this.subsystems[i].update();
            }

            // Collision detection
            if (doProfiling) { profilingStart = performance.now(); }
            p1.length = 0; // Clean up pair arrays from last step
            p2.length = 0;
            this.broadphase.collisionPairs(this, p1, p2);
            if (doProfiling) { profile.broadphase = performance.now() - profilingStart; }

            // Remove constrained pairs with collideConnected == false
            var Nconstraints = constraints.length;
            for (i = 0; i !== Nconstraints; i++)
            {
                var c0 = constraints[i];
                if (!c0.collideConnected)
                {
                    for (var j = p1.length - 1; j >= 0; j -= 1)
                    {
                        if ((c0.bodyA === p1[j] && c0.bodyB === p2[j]) ||
                            (c0.bodyB === p1[j] && c0.bodyA === p2[j]))
                        {
                            p1.splice(j, 1);
                            p2.splice(j, 1);
                        }
                    }
                }
            }

            this.collisionMatrixTick();

            // Generate contacts
            if (doProfiling) { profilingStart = performance.now(); }
            var oldcontacts = World_step_oldContacts;
            var NoldContacts = contacts.length;

            for (i = 0; i !== NoldContacts; i++)
            {
                oldcontacts.push(contacts[i]);
            }
            contacts.length = 0;

            // Transfer FrictionEquation from current list to the pool for reuse
            var NoldFrictionEquations = this.frictionEquations.length;
            for (i = 0; i !== NoldFrictionEquations; i++)
            {
                frictionEquationPool.push(this.frictionEquations[i]);
            }
            this.frictionEquations.length = 0;

            this.narrowphase.getContacts(
                p1,
                p2,
                this,
                contacts,
                oldcontacts, // To be reused
                this.frictionEquations,
                frictionEquationPool
            );

            if (doProfiling)
            {
                profile.narrowphase = performance.now() - profilingStart;
            }

            // Loop over all collisions
            if (doProfiling)
            {
                profilingStart = performance.now();
            }

            // Add all friction eqs
            for (var i = 0; i < this.frictionEquations.length; i++)
            {
                solver.addEquation(this.frictionEquations[i]);
            }

            var ncontacts = contacts.length;
            for (var k = 0; k !== ncontacts; k++)
            {

                // Current contact
                var c = contacts[k];

                // Get current collision indeces
                var bi = c.bi,
                    bj = c.bj,
                    si = c.si,
                    sj = c.sj;

                // Get collision properties
                var cm;
                if (bi.material && bj.material)
                {
                    cm = this.getContactMaterial(bi.material, bj.material) || this.defaultContactMaterial;
                } else
                {
                    cm = this.defaultContactMaterial;
                }

                // c.enabled = bi.collisionResponse && bj.collisionResponse && si.collisionResponse && sj.collisionResponse;

                var mu = cm.friction;
                // c.restitution = cm.restitution;

                // If friction or restitution were specified in the material, use them
                if (bi.material && bj.material)
                {
                    if (bi.material.friction >= 0 && bj.material.friction >= 0)
                    {
                        mu = bi.material.friction * bj.material.friction;
                    }

                    if (bi.material.restitution >= 0 && bj.material.restitution >= 0)
                    {
                        c.restitution = bi.material.restitution * bj.material.restitution;
                    }
                }

                // c.setSpookParams(
                //           cm.contactEquationStiffness,
                //           cm.contactEquationRelaxation,
                //           dt
                //       );

                solver.addEquation(c);

                // // Add friction constraint equation
                // if(mu > 0){

                // 	// Create 2 tangent equations
                // 	var mug = mu * gnorm;
                // 	var reducedMass = (bi.invMass + bj.invMass);
                // 	if(reducedMass > 0){
                // 		reducedMass = 1/reducedMass;
                // 	}
                // 	var pool = frictionEquationPool;
                // 	var c1 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
                // 	var c2 = pool.length ? pool.pop() : new FrictionEquation(bi,bj,mug*reducedMass);
                // 	this.frictionEquations.push(c1, c2);

                // 	c1.bi = c2.bi = bi;
                // 	c1.bj = c2.bj = bj;
                // 	c1.minForce = c2.minForce = -mug*reducedMass;
                // 	c1.maxForce = c2.maxForce = mug*reducedMass;

                // 	// Copy over the relative vectors
                // 	c1.ri.copy(c.ri);
                // 	c1.rj.copy(c.rj);
                // 	c2.ri.copy(c.ri);
                // 	c2.rj.copy(c.rj);

                // 	// Construct tangents
                // 	c.ni.tangents(c1.t, c2.t);

                //           // Set spook params
                //           c1.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);
                //           c2.setSpookParams(cm.frictionEquationStiffness, cm.frictionEquationRelaxation, dt);

                //           c1.enabled = c2.enabled = c.enabled;

                // 	// Add equations to solver
                // 	solver.addEquation(c1);
                // 	solver.addEquation(c2);
                // }

                if (bi.allowSleep &&
                    bi.type === Body.DYNAMIC &&
                    bi.sleepState === Body.SLEEPING &&
                    bj.sleepState === Body.AWAKE &&
                    bj.type !== Body.STATIC
                )
                {
                    var speedSquaredB = bj.velocity.lengthSquared + bj.angularVelocity.lengthSquared;
                    var speedLimitSquaredB = Math.pow(bj.sleepSpeedLimit, 2);
                    if (speedSquaredB >= speedLimitSquaredB * 2)
                    {
                        bi._wakeUpAfterNarrowphase = true;
                    }
                }

                if (bj.allowSleep &&
                    bj.type === Body.DYNAMIC &&
                    bj.sleepState === Body.SLEEPING &&
                    bi.sleepState === Body.AWAKE &&
                    bi.type !== Body.STATIC
                )
                {
                    var speedSquaredA = bi.velocity.lengthSquared + bi.angularVelocity.lengthSquared;
                    var speedLimitSquaredA = Math.pow(bi.sleepSpeedLimit, 2);
                    if (speedSquaredA >= speedLimitSquaredA * 2)
                    {
                        bj._wakeUpAfterNarrowphase = true;
                    }
                }

                // Now we know that i and j are in contact. Set collision matrix state
                this.collisionMatrix[bi.index + "_" + bj.index] = true;
                this.collisionMatrix[bj.index + "_" + bi.index] = true;

                if (!this.collisionMatrixPrevious[bj.index + "_" + bi.index])
                {
                    // First contact!
                    bi.dispatch("collide", { body: bj, contact: c });
                    bi.dispatch("collide", { body: bi, contact: c });
                }

                this.bodyOverlapKeeper.set(bi.id, bj.id);
                this.shapeOverlapKeeper.set(si.id, sj.id);
            }

            this.emitContactEvents();

            if (doProfiling)
            {
                profile.makeContactConstraints = performance.now() - profilingStart;
                profilingStart = performance.now();
            }

            // Wake up bodies
            for (i = 0; i !== N; i++)
            {
                var bi = bodies[i];
                if (bi._wakeUpAfterNarrowphase)
                {
                    bi.wakeUp();
                    bi._wakeUpAfterNarrowphase = false;
                }
            }

            // Add user-added constraints
            var Nconstraints = constraints.length;
            for (i = 0; i !== Nconstraints; i++)
            {
                var c1 = constraints[i];
                c1.update();
                for (var j = 0, Neq = c1.equations.length; j !== Neq; j++)
                {
                    var eq = c1.equations[j];
                    solver.addEquation(eq);
                }
            }

            // Solve the constrained system
            solver.solve(dt, this);

            if (doProfiling)
            {
                profile.solve = performance.now() - profilingStart;
            }

            // Remove all contacts from solver
            solver.removeAllEquations();

            // Apply damping, see http://code.google.com/p/bullet/issues/detail?id=74 for details
            var pow = Math.pow;
            for (i = 0; i !== N; i++)
            {
                var bi = bodies[i];
                if (bi.type & DYNAMIC)
                { // Only for dynamic bodies
                    var ld = pow(1.0 - bi.linearDamping, dt);
                    var v = bi.velocity;
                    v.scaleNumberTo(ld, v);
                    var av = bi.angularVelocity;
                    if (av)
                    {
                        var ad = pow(1.0 - bi.angularDamping, dt);
                        av.scaleNumberTo(ad, av);
                    }
                }
            }

            this.dispatch("preStep");

            // Leap frog
            // vnew = v + h*f/m
            // xnew = x + h*vnew
            if (doProfiling)
            {
                profilingStart = performance.now();
            }
            var stepnumber = this.stepnumber;
            var quatNormalize = stepnumber % (this.quatNormalizeSkip + 1) === 0;
            var quatNormalizeFast = this.quatNormalizeFast;

            for (i = 0; i !== N; i++)
            {
                bodies[i].integrate(dt, quatNormalize, quatNormalizeFast);
            }
            this.clearForces();

            if (doProfiling)
            {
                profile.integrate = performance.now() - profilingStart;
            }

            // Update world time
            this.time += dt;
            this.stepnumber += 1;

            this.dispatch("postStep");

            // Sleeping update
            if (this.allowSleep)
            {
                for (i = 0; i !== N; i++)
                {
                    bodies[i].sleepTick(this.time);
                }
            }
        }

        additions: number[] = [];
        removals: number[] = [];

        emitContactEvents()
        {
            var additions = this.additions;
            var removals = this.removals;

            var hasBeginContact = this.has('beginContact');
            var hasEndContact = this.has('endContact');

            if (hasBeginContact || hasEndContact)
            {
                this.bodyOverlapKeeper.getDiff(additions, removals);
            }

            if (hasBeginContact)
            {
                for (var i = 0, l = additions.length; i < l; i += 2)
                {
                    this.dispatch('beginContact', { bodyA: this.getBodyById(additions[i]), bodyB: this.getBodyById(additions[i + 1]) })
                }
            }

            if (hasEndContact)
            {
                for (var i = 0, l = removals.length; i < l; i += 2)
                {
                    this.dispatch('endContact', { bodyA: this.getBodyById(removals[i]), bodyB: this.getBodyById(removals[i + 1]) })
                }
            }

            additions.length = removals.length = 0;

            var hasBeginShapeContact = this.has('beginShapeContact');
            var hasEndShapeContact = this.has('endShapeContact');

            if (hasBeginShapeContact || hasEndShapeContact)
            {
                this.shapeOverlapKeeper.getDiff(additions, removals);
            }

            if (hasBeginShapeContact)
            {
                for (var i = 0, l = additions.length; i < l; i += 2)
                {
                    var shapeA = this.getShapeById(additions[i]);
                    var shapeB = this.getShapeById(additions[i + 1]);

                    this.dispatch("beginShapeContact", { shapeA: shapeA, shapeB: shapeB, bodyA: shapeA.body, bodyB: shapeB.body })
                }
            }

            if (hasEndShapeContact)
            {
                for (var i = 0, l = removals.length; i < l; i += 2)
                {
                    var shapeA = this.getShapeById(removals[i]);
                    var shapeB = this.getShapeById(removals[i + 1]);

                    this.dispatch("endShapeContact", { shapeA: shapeA, shapeB: shapeB, bodyA: shapeA.body, bodyB: shapeB.body })
                }
            }
        }

        /**
         * Sets all body forces in the world to zero.
         * @method clearForces
         */
        clearForces()
        {
            var bodies = this.bodies;
            var N = bodies.length;
            for (var i = 0; i !== N; i++)
            {
                var b = bodies[i];

                b.force.init(0, 0, 0);
                b.torque.init(0, 0, 0);
            }
        }
    }


    // Temp stuff
    var tmpRay = new Ray();

    // performance.now()
    if (typeof performance === 'undefined')
    {
        throw "performance"

        // performance = {};
    }
    if (!performance.now)
    {
        var nowOffset = Date.now();
        if (performance.timing && performance.timing.navigationStart)
        {
            nowOffset = performance.timing.navigationStart;
        }
        performance.now = function ()
        {
            return Date.now() - nowOffset;
        };
    }

    var World_step_oldContacts = [];// Pools for unused objects
    var World_step_frictionEquationPool = [];
}