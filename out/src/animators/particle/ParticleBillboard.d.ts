declare namespace feng3d {
    class ParticleBillboard extends ParticleComponent {
        private _camera;
        private _matrix;
        /** 广告牌轴线 */
        private _billboardAxis;
        /**
         * 创建一个广告牌节点
         * @param billboardAxis
         */
        constructor(camera: Camera, billboardAxis?: Vector3D);
        setRenderState(particleAnimator: ParticleAnimator): void;
        /**
         * 广告牌轴线
         */
        billboardAxis: Vector3D;
    }
}
