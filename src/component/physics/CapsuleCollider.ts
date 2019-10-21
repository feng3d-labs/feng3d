namespace feng3d
{
    /**
     * 胶囊体碰撞体
     */
    export class CapsuleCollider extends Collider
    {
        /**
         * 胶囊体半径
         */
        @serialize
        @oav()
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
        @serialize
        @oav()
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
        @serialize
        @oav()
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
        @serialize
        @oav()
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
        @serialize
        @oav()
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


        init()
        {
            this.invalidateGeometry();
        }

        private invalidateGeometry()
        {
            var g = new CapsuleGeometry();
            g.radius = this._radius;
            g.height = this._height;
            g.segmentsW = this._segmentsW;
            g.segmentsH = this._segmentsH;
            g.yUp = this._yUp;

        }
    }
}