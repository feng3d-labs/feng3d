module feng3d
{

    /**
     * 粒子几何体
     * @author feng 2016-04-28
     */
    export class ParticleGeometry extends Geometry
    {

        /**
         * 粒子数量
         */
        private _numParticle = 1;

        /**
         * 单个粒子几何体
         */
        public elementGeometry: Geometry;

        private isDirty = true;

        constructor()
        {
            super();
            this.elementGeometry = new PlaneGeometry(10, 10, 1, 1, false);
        }

        /**
         * 粒子数量
         */
        public get numParticle()
        {
            return this._numParticle;
        }

        public set numParticle(value: number)
        {
            if (this._numParticle != value)
            {
                this._numParticle = value;
                this.isDirty = true;
            }
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            if (this.isDirty)
            {
                this.cloneFrom(new PlaneGeometry(10, 10, 1, 1, false));
                for (var i = 1; i < this.numParticle; i++)
                {
                    this.addGeometry(this.elementGeometry);
                }
                this.isDirty = false;
            }
            super.updateRenderData(renderContext, renderData);
        }
    }
}