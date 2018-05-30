namespace feng3d
{
    /**
     * The Water component renders the terrain.
     */
    export class Water extends MeshRenderer
    {
        geometry = new PlaneGeometry({ width: 10, height: 10 });

        material = materialFactory.create("water");

        preRender(renderAtomic: RenderAtomic)
        {
            var sun = this.gameObject.scene.collectComponents.directionalLights.list[0];
            if (sun)
            {
                this.material.uniforms.u_sunColor = sun.color;
                this.material.uniforms.u_sunDirection = sun.transform.localToWorldMatrix.forward.clone().negate();
            }

            this.material.uniforms.u_time += 1.0 / 60.0;

            this.material.uniforms.u_textureMatrix

            super.preRender(renderAtomic);
        }
    }
}