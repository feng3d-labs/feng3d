namespace feng3d
{

    /**
     * 粒子系统发射圆锥体，用于定义基于圆锥体的粒子发射时的初始状态。
     */
    export class ParticleSystemShapeCone extends ParticleSystemShape
    {
        /**
         * Angle of the cone.
         * 圆锥的角度。
         */
        // @oav({ tooltip: "Angle of the cone." })
        @oav({ tooltip: "圆锥的角度。" })
        get angle()
        {
            return this._module.angle;
        }

        set angle(v)
        {
            this._module.angle = v;
        }

        /**
         * 圆锥体底部半径。
         */
        @oav({ tooltip: "圆锥体底部半径。" })
        get radius()
        {
            return this._module.radius;
        }

        set radius(v)
        {
            this._module.radius = v;
        }

        /**
         * Length of the cone.
         * 
         * 圆锥的长度（高度）。
         */
        // @oav({ tooltip: "Length of the cone." })
        @oav({ tooltip: "圆锥的长度（高度）。" })
        get length()
        {
            return this._module.length;
        }

        set length(v)
        {
            this._module.length = v;
        }

        /**
         * Circle arc angle.
         */
        @oav({ tooltip: "圆弧角。" })
        get arc()
        {
            return this._module.arc;
        }

        set arc(v)
        {
            this._module.arc = v;
        }

        /**
         * The mode used for generating particles around the arc.
         * 在弧线周围产生粒子的模式。
         */
        @oav({ tooltip: "在弧线周围产生粒子的模式。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemShapeMultiModeValue } })
        get arcMode()
        {
            return this._module.arcMode;
        }

        set arcMode(v)
        {
            this._module.arcMode = v;
        }

        /**
         * Control the gap between emission points around the arc.
         * 控制弧线周围发射点之间的间隙。
         */
        @oav({ tooltip: "控制弧线周围发射点之间的间隙。" })
        get arcSpread()
        {
            return this._module.arcSpread;
        }

        set arcSpread(v)
        {
            this._module.arcSpread = v;
        }

        /**
         * When using one of the animated modes, how quickly to move the emission position around the arc.
         * 当使用一个动画模式时，如何快速移动发射位置周围的弧。
         */
        @oav({ tooltip: "当使用一个动画模式时，如何快速移动发射位置周围的弧。" })
        get arcSpeed()
        {
            return this._module.arcSpeed;
        }

        set arcSpeed(v)
        {
            this._module.arcSpeed = v;
        }

        /**
         * 粒子系统圆锥体发射类型。
         */
        @oav({ tooltip: "粒子系统圆锥体发射类型。", component: "OAVEnum", componentParam: { enumClass: ParticleSystemShapeConeEmitFrom } })
        emitFrom = ParticleSystemShapeConeEmitFrom.Base;

        /**
         * 计算粒子的发射位置与方向
         * 
         * @param particle 
         * @param position 
         * @param dir 
         */
        calcParticlePosDir(particle: Particle, position: Vector3, dir: Vector3)
        {
            var radius = this.radius;
            var angle = this.angle;
            var arc = this.arc;
            angle = Math.clamp(angle, 0, 87);
            // 在圆心的方向
            var radiusAngle = 0;
            if (this.arcMode == ParticleSystemShapeMultiModeValue.Random)
            {
                radiusAngle = Math.random() * arc;
            } else if (this.arcMode == ParticleSystemShapeMultiModeValue.Loop)
            {
                var totalAngle = particle.birthTime * this.arcSpeed.getValue(particle.birthRateAtDuration) * 360;
                radiusAngle = totalAngle % arc;
            } else if (this.arcMode == ParticleSystemShapeMultiModeValue.PingPong)
            {
                var totalAngle = particle.birthTime * this.arcSpeed.getValue(particle.birthRateAtDuration) * 360;
                radiusAngle = totalAngle % arc;
                if (Math.floor(totalAngle / arc) % 2 == 1)
                {
                    radiusAngle = arc - radiusAngle;
                }
            }
            // else if (this.arcMode == ParticleSystemShapeMultiModeValue.BurstSpread)
            // {
            // }
            if (this.arcSpread > 0)
            {
                radiusAngle = Math.floor(radiusAngle / arc / this.arcSpread) * arc * this.arcSpread;
            }
            radiusAngle = Math.degToRad(radiusAngle);
            // 在圆的位置
            var radiusRate = 1;
            if (this.emitFrom == ParticleSystemShapeConeEmitFrom.Base || this.emitFrom == ParticleSystemShapeConeEmitFrom.Volume)
            {
                radiusRate = Math.random();
            }
            // 在圆的位置
            var basePos = new Vector3(Math.cos(radiusAngle), Math.sin(radiusAngle), 0);
            // 底面位置
            var bottomPos = basePos.scaleNumberTo(radius).scaleNumber(radiusRate);
            // 顶面位置
            var topPos = basePos.scaleNumberTo(radius + this.length * Math.tan(Math.degToRad(angle))).scaleNumber(radiusRate);
            topPos.z = this.length;

            // 计算方向
            dir.copy(topPos).sub(bottomPos).normalize();
            // 计算位置
            position.copy(bottomPos);
            if (this.emitFrom == ParticleSystemShapeConeEmitFrom.Volume || this.emitFrom == ParticleSystemShapeConeEmitFrom.VolumeShell)
            {
                // 上下点进行插值
                position.lerpNumber(topPos, Math.random());
            }
        }
    }
}