namespace feng3d
{
    /**
     * 粒子系统 发射球体
     */
    export class ParticleSystemShapeSphere extends ParticleSystemShape
    {
        @oav({ tooltip: "球体半径" })
        radius = 1;
    }
}