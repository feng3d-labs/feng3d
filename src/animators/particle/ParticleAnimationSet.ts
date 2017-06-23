namespace feng3d
{
    export class ParticleAnimationSet extends RenderDataHolder
    {
        /**
         * 属性数据列表
         */
        private _attributes: { [name: string]: AttributeRenderData } = {};

        private _animations: ParticleComponent[] = [];

        /**
         * 生成粒子函数列表，优先级越高先执行
         */
        public generateFunctions: ({ generate: (particle: Particle) => void, priority: number })[] = [];

        private particleGlobal: ParticleGlobal = <any>{};

        /**
		 * 粒子数量
		 */
        public numParticles: number = 1000;

        private _isDirty = true;

        constructor()
        {
            super();
            this.createInstanceCount(() => this.numParticles);
        }

        /**
         * 粒子全局属性，作用于所有粒子元素
         */
        public setGlobal<K extends keyof ParticleGlobal>(property: K, value: ParticleGlobal[K])
        {
            this.particleGlobal[property] = value;
            this.createUniformData(<any>("u_particle_" + property), value);
            this.createBoolMacro(<any>("D_u_particle_" + property), true);
        }

        public addAnimation(animation: ParticleComponent)
        {
            if (this._animations.indexOf(animation) == -1)
                this._animations.push(animation);
        }

        public update(particleAnimator: ParticleAnimator)
        {
            if (this._isDirty)
            {
                this.generateParticles();
                this._isDirty = false;
            }
            this._animations.forEach(element =>
            {
                element.setRenderState(particleAnimator);
            });
        }

        /**
		 * 生成粒子
		 */
        private generateParticles()
        {
            var generateFunctions = this.generateFunctions.concat();

            var components = this._animations;
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
                this.collectionParticle(particle);
            }
            //更新宏定义
            for (var attribute in this._attributes)
            {
                this.createBoolMacro(<any>("D_" + attribute), true);
            }
        }

        /**
         * 收集粒子数据
         * @param particle      粒子
         */
        private collectionParticle(particle: Particle)
        {
            for (var attribute in particle)
            {
                this.collectionParticleAttribute(attribute, particle);
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
            var attributeRenderData: AttributeRenderData = this._attributes[attributeID];
            var vector3DData: Float32Array;
            if (typeof data == "number")
            {
                if (!attributeRenderData)
                {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(<any>attributeID, new Float32Array(numParticles), 1, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index] = data;
            } else if (data instanceof Vector3D)
            {
                if (!attributeRenderData)
                {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(<any>attributeID, new Float32Array(numParticles * 3), 3, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 3] = data.x;
                vector3DData[index * 3 + 1] = data.y;
                vector3DData[index * 3 + 2] = data.z;
            } else if (data instanceof Color)
            {
                if (!attributeRenderData)
                {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(<any>attributeID, new Float32Array(numParticles * 4), 4, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 4] = data.r;
                vector3DData[index * 4 + 1] = data.g;
                vector3DData[index * 4 + 2] = data.b;
                vector3DData[index * 4 + 3] = data.a;
            } else
            {
                throw new Error(`无法处理${ClassUtils.getQualifiedClassName(data)}粒子属性`);
            }
        }
    }
}