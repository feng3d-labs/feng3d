namespace CANNON
{
    export class Spring
    {

        /**
         * Rest length of the spring.
         */
        restLength = 1;

        /**
         * Stiffness of the spring.
         */
        stiffness = 100;

        /**
         * Damping of the spring.
         */
        damping = 1;

        /**
         * First connected body.
         */
        bodyA: Body;

        /**
         * Second connected body.
         */
        bodyB: Body;

        /**
         * Anchor for bodyA in local bodyA coordinates.
         */
        localAnchorA = new feng3d.Vector3();

        /**
         * Anchor for bodyB in local bodyB coordinates.
         */
        localAnchorB = new feng3d.Vector3();

        /**
         * A spring, connecting two bodies.
         * 
         * @param bodyA 
         * @param bodyB 
         * @param options 
         */
        constructor(bodyA: Body, bodyB: Body)
        {
            this.bodyA = bodyA;
            this.bodyB = bodyB;
        }

        /**
         * Set the anchor point on body A, using world coordinates.
         * @param worldAnchorA
         */
        setWorldAnchorA(worldAnchorA: feng3d.Vector3)
        {
            this.bodyA.pointToLocalFrame(worldAnchorA, this.localAnchorA);
        }

        /**
         * Set the anchor point on body B, using world coordinates.
         * @param worldAnchorB
         */
        setWorldAnchorB(worldAnchorB: feng3d.Vector3)
        {
            this.bodyB.pointToLocalFrame(worldAnchorB, this.localAnchorB);
        }

        /**
         * Get the anchor point on body A, in world coordinates.
         * @param result The vector to store the result in.
         */
        getWorldAnchorA(result: feng3d.Vector3)
        {
            this.bodyA.pointToWorldFrame(this.localAnchorA, result);
        }

        /**
         * Get the anchor point on body B, in world coordinates.
         * @param result The vector to store the result in.
         */
        getWorldAnchorB(result: feng3d.Vector3)
        {
            this.bodyB.pointToWorldFrame(this.localAnchorB, result);
        }

        /**
         * Apply the spring force to the connected bodies.
         */
        applyForce()
        {
            var k = this.stiffness,
                d = this.damping,
                l = this.restLength,
                bodyA = this.bodyA,
                bodyB = this.bodyB;

            var worldAnchorA = new feng3d.Vector3(),
                worldAnchorB = new feng3d.Vector3(),
                ri = new feng3d.Vector3(),
                rj = new feng3d.Vector3(),
                ri_x_f = new feng3d.Vector3(),
                rj_x_f = new feng3d.Vector3();

            // Get world anchors
            this.getWorldAnchorA(worldAnchorA);
            this.getWorldAnchorB(worldAnchorB);

            // Get offset points
            worldAnchorA.subTo(bodyA.position, ri);
            worldAnchorB.subTo(bodyB.position, rj);

            // Compute distance vector between world anchor points
            var r = worldAnchorB.subTo(worldAnchorA, r);
            var rlen = r.length;
            var r_unit = r.clone();
            r_unit.normalize();

            // Compute relative velocity of the anchor points, u
            var u = bodyB.velocity.subTo(bodyA.velocity);
            // Add rotational velocity

            var tmp = bodyB.angularVelocity.crossTo(rj);
            u.addTo(tmp, u);
            bodyA.angularVelocity.crossTo(ri, tmp);
            u.subTo(tmp, u);

            // F = - k * ( x - L ) - D * ( u )
            var f = r_unit.scaleNumberTo(-k * (rlen - l) - d * u.dot(r_unit));

            // Add forces to bodies
            bodyA.force.subTo(f, bodyA.force);
            bodyB.force.addTo(f, bodyB.force);

            // Angular force
            ri.crossTo(f, ri_x_f);
            rj.crossTo(f, rj_x_f);
            bodyA.torque.subTo(ri_x_f, bodyA.torque);
            bodyB.torque.addTo(rj_x_f, bodyB.torque);
        }

    }
}

