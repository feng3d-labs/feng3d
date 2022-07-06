namespace feng3d { export interface ComponentMap { CylinderCollider: CANNON.CylinderCollider; } }

namespace CANNON
{
    /**
     * 圆柱体碰撞体
     */
    @feng3d.AddComponentMenu("Physics/Cylinder Collider")
    @feng3d.RegisterComponent()
    export class CylinderCollider extends Collider
    {
        /**
         * 顶部半径
         */
        @feng3d.oav()
        @feng3d.serialize
        topRadius = 0.5;

        /**
         * 底部半径
         */
        @feng3d.oav()
        @feng3d.serialize
        bottomRadius = 0.5;

        /**
         * 高度
         */
        @feng3d.oav()
        @feng3d.serialize
        height = 2;

        /**
         * 横向分割数
         */
        @feng3d.oav()
        @feng3d.serialize
        segmentsW = 16;

        readonly shape: Cylinder;
        protected _shape: Cylinder;

        init()
        {
            this._shape = new Cylinder(this.topRadius, this.bottomRadius, this.height, this.segmentsW);
        }
    }
}