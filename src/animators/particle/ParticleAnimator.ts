module feng3d
{

    /**
     * 粒子动画
     * @author feng 2017-01-09
     */
    export class ParticleAnimator extends Object3DComponent
    {

        /**
         * 是否正在播放
         */
        public isPlaying: boolean;

        /**
         * 粒子时间
         */
        public time: number = 0;

        /**
         * 起始时间
         */
        public startTime: number = 0;

        /**
         * 播放速度
         */
        public playbackSpeed: number = 1;

        /**
		 * 粒子数量
		 */
        public numParticles: number = 1000;

        /**
         * 周期
         */
        public cycle: number = 10000;

        private isDirty = true;

        /**
         * 生成粒子函数列表，优先级越高先执行
         */
        public generateFunctions: ({ generate: (particle: Particle) => void, priority: number })[] = [];

        /**
         * 粒子全局属性，作用于所有粒子元素
         */
        public particleGlobal: ParticleGlobal = <any>{};

        private autoRenderDataHolder: ParticleRenderDataHolder;

        constructor()
        {
            super();
            this.autoRenderDataHolder = new ParticleRenderDataHolder();
            this.addComponent(this.autoRenderDataHolder);
        }

        /**
		 * 生成粒子
		 */
        private generateParticles()
        {

            var generateFunctions = this.generateFunctions.concat();

            var components = this.getComponentsByClass(ParticleComponent);
            components.forEach(element =>
            {
                generateFunctions.push({ generate: element.generateParticle.bind(element), priority: element.priority });
            });
            //按优先级排序，优先级越高先执行
            generateFunctions.sort((a: { priority: number; }, b: { priority: number; }) => { return b.priority - a.priority; })
            //
            for (var i = 0; i < this.numParticles; i++)
            {
                var particle = <Particle>{};
                particle.index = i;
                particle.total = this.numParticles;
                generateFunctions.forEach(element =>
                {
                    element.generate(particle);
                });
                this.autoRenderDataHolder.collectionParticle(particle);
            }
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext)
        {

            if (this.isDirty)
            {

                this.startTime = getTimer();
                this.generateParticles();
                this.isDirty = false;
            }

            this.time = ((getTimer() - this.startTime) / 1000) % this.cycle;
            this.renderData.uniforms[RenderDataID.u_particleTime] = this.time;
            this.renderData.instanceCount = this.numParticles;

            this.autoRenderDataHolder.update(this.particleGlobal);
            super.updateRenderData(renderContext);
        }
    }

    class ParticleRenderDataHolder extends RenderDataHolder
    {

        /**
         * 收集粒子数据
         * @param particle      粒子
         */
        public collectionParticle(particle: Particle)
        {

            for (var attribute in particle)
            {
                this.collectionParticleAttribute(attribute, particle);
            }
        }

        public update(particleGlobal: ParticleGlobal)
        {

            this.renderData.uniforms = {};
            //更新常量数据
            for (var uniform in particleGlobal)
            {
                this.renderData.uniforms["u_particle_" + uniform] = particleGlobal[uniform];
            }

            //更新宏定义
            var boolMacros = this.renderData.shaderMacro.boolMacros = <any>{};
            for (var attribute in this.renderData.attributes)
            {
                boolMacros["D_" + attribute] = true;
            }
            for (var uniform in particleGlobal)
            {
                boolMacros["D_u_particle_" + uniform] = true;
            }
        }

        /**
         * 收集粒子属性数据
         * @param attributeID       属性编号
         * @param index             粒子编号
         * @param data              属性数据      
         */
        private collectionParticleAttribute(attribute: string, particle: Particle)
        {

            var attributeID = "a_particle_" + attribute;
            var data = particle[attribute];
            var index = particle.index;
            var numParticles = particle.total;
            //
            var attributes = this.renderData.attributes;
            var attributeRenderData = attributes[attributeID];
            var vector3DData: Float32Array;
            if (typeof data == "number")
            {
                if (!attributeRenderData)
                {
                    attributeRenderData = attributes[attributeID] = new AttributeRenderData(new Float32Array(numParticles), 1, 1)
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index] = data;
            } else if (data instanceof Vector3D)
            {
                if (!attributeRenderData)
                {
                    attributeRenderData = attributes[attributeID] = new AttributeRenderData(new Float32Array(numParticles * 3), 3, 1)
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 3] = data.x;
                vector3DData[index * 3 + 1] = data.y;
                vector3DData[index * 3 + 2] = data.z;
            } else if (data instanceof Color)
            {
                if (!attributeRenderData)
                {
                    attributeRenderData = attributes[attributeID] = new AttributeRenderData(new Float32Array(numParticles * 4), 4, 1)
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 4] = data.r;
                vector3DData[index * 4 + 1] = data.g;
                vector3DData[index * 4 + 2] = data.b;
                vector3DData[index * 4 + 2] = data.a;
            } else
            {
                throw new Error(`无法处理${ClassUtils.getQualifiedClassName(data)}粒子属性`);
            }
        }
    }
}