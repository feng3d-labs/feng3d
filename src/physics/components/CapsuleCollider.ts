namespace feng3d { export interface ComponentMap { CapsuleCollider: CANNON.CapsuleCollider; } }

namespace CANNON
{
    /**
     * 胶囊体碰撞体
     */
    @feng3d.RegisterComponent()
    export class CapsuleCollider extends Collider
    {
        /**
         * 胶囊体半径
         */
        @feng3d.serialize
        @feng3d.oav()
        get radius()
        {
            return this._radius;
        }
        set radius(v)
        {
            if (this._radius == v) return;
            this._radius = v;
            this.invalidateGeometry();
        }
        private _radius = 0.5;

        /**
         * 胶囊体高度
         */
        @feng3d.serialize
        @feng3d.oav()
        get height()
        {
            return this._height;
        }
        set height(v)
        {
            if (this._height == v) return;
            this._height = v;
            this.invalidateGeometry();
        }
        private _height = 1

        /**
         * 横向分割数
         */
        @feng3d.serialize
        @feng3d.oav()
        get segmentsW()
        {
            return this._segmentsW;
        }
        set segmentsW(v)
        {
            if (this._segmentsW == v) return;
            this._segmentsW = v;
            this.invalidateGeometry();
        }
        private _segmentsW = 16

        /**
         * 纵向分割数
         */
        @feng3d.serialize
        @feng3d.oav()
        get segmentsH()
        {
            return this._segmentsH;
        }
        set segmentsH(v)
        {
            if (this._segmentsH == v) return;
            this._segmentsH = v;
            this.invalidateGeometry();
        }
        private _segmentsH = 15;

        /**
         * 正面朝向 true:Y+ false:Z+
         */
        @feng3d.serialize
        @feng3d.oav()
        get yUp()
        {
            return this._yUp;
        }
        set yUp(v)
        {
            if (this._yUp == v) return;
            this._yUp = v;
            this.invalidateGeometry();
        }
        private _yUp = true;

        readonly shape: Trimesh;
        protected _shape: Trimesh;

        init()
        {
            this.invalidateGeometry();
        }

        private invalidateGeometry()
        {
            var g = new feng3d.CapsuleGeometry();
            g.radius = this._radius;
            g.height = this._height;
            g.segmentsW = this._segmentsW;
            g.segmentsH = this._segmentsH;
            g.yUp = this._yUp;
            g.updateGrometry();
            this._shape = new Trimesh(g.positions, g.indices);
        }
    }
}