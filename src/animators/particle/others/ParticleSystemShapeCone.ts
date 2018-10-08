namespace feng3d
{
    /**
     * 粒子系统 发射圆锥体
     */
    export class ParticleSystemShapeCone
    {
        // @oav({ tooltip: "Angle of the cone." })
        @oav({ tooltip: "圆锥体开口角度。" })
        angle = 25;

        @oav({ tooltip: "圆锥体底部半径。" })
        radius = 1;

        // @oav({ tooltip: "New particles are spawned around the arc." })
        @oav({ tooltip: "在弧线周围产生了新的粒子。" })
        arc = 360;

        // arcMode;

        // spread = 0;

        // length = 5;

        // emitFrom;

        // alignToDirection = false;

        // @oav({ tooltip: "随机化发射方向。" })
        // randomizeDirection = 0;

        // @oav({ tooltip: "球化发射方向。" })
        // spherizeDirection = 0;
    }
}