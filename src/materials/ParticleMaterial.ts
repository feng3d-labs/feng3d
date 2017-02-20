module feng3d
{

    /**
     * 粒子材质（为了使用独立的着色器，暂时设置粒子材质）
     * @author feng 2017-01-09
     */
    export class ParticleMaterial extends Material
    {

        constructor()
        {
            super();
            this.shaderName = "particle";
            this.renderMode = RenderMode.POINTS;
        }
    }
}