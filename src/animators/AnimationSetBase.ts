module feng3d {

	/**
	 * 动画集合基类
	 * @author feng 2014-5-20
	 */
    export abstract class AnimationSetBase extends Component {

        private _usesCPU: boolean;
        /** 动画节点列表 */
        private _animations: AnimationNodeBase[] = [];
        /** 动画名称列表 */
        private _animationNames: string[] = [];
        /** 动画字典 */
        private _animationDictionary = {};

		/**
		 * 创建一个动画集合基类
		 */
        constructor() {
            super();
            this.initBuffers();
        }

		/**
		 * 初始化Context3d缓存
		 */
        protected initBuffers() {

        }

		/**
		 * 是否使用CPU
		 */
        public get usesCPU(): boolean {
            return this._usesCPU;
        }

		/**
		 * Returns a vector of animation state objects that make up the contents of the animation data set.
		 */
        public get animations(): AnimationNodeBase[] {
            return this._animations;
        }

		/**
		 * 添加动画
		 * @param node 动画节点
		 */
        public addAnimation(node: AnimationNodeBase) {

            this._animationDictionary[node.name] = node;

            this._animations.push(node);

            this._animationNames.push(node.name);
        }

		/**
		 * 获取动画节点
		 * @param name 动画名称
		 * @return 动画节点
		 */
        public getAnimation(animationName: string): AnimationNodeBase {
            return this._animationDictionary[animationName];
        }

		/**
		 * 是否有某动画
		 * @param name 动画名称
		 */
        public hasAnimation(animationName: string): boolean {
            return this._animationDictionary[animationName] != null;
        }

		/**
		 * 重置使用GPU
		 */
        public resetGPUCompatibility() {
            this._usesCPU = false;
        }

		/**
		 * 取消使用GPU
		 */
        public cancelGPUCompatibility() {
            this._usesCPU = true;
        }
    }
}
