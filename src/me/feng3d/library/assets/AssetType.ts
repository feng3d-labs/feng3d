module feng3d
{

	export class AssetType
	{
		/** 实体 */
		public static ENTITY:string = 'entity';
		/** 天空盒 */
		public static SKYBOX:string = 'skybox';
		/** 摄像机 */
		public static CAMERA:string = 'camera';
		/** 线条 */
		public static SEGMENT_SET:string = 'segmentSet';
		/** 网格 */
		public static MESH:string = 'mesh';
		/** 几何体 */
		public static GEOMETRY:string = 'geometry';
		/** 骨骼 */
		public static SKELETON:string = 'skeleton';
		/** 骨骼姿势 */
		public static SKELETON_POSE:string = 'skeletonPose';
		/** 容器 */
		public static CONTAINER:string = 'container';
		/** 纹理 */
		public static TEXTURE:string = 'texture';

		public static TEXTURE_PROJECTOR:string = 'textureProjector';
		/** 材质 */
		public static MATERIAL:string = 'material';
		public static ANIMATION_SET:string = 'animationSet';
		/** 动画状态 */
		public static ANIMATION_STATE:string = 'animationState';
		/** 动画节点 */
		public static ANIMATION_NODE:string = 'animationNode';
		/** 动画 */
		public static ANIMATOR:string = 'animator';

		public static STATE_TRANSITION:string = 'stateTransition';
		/** 灯光 */
		public static LIGHT:string = 'light';
		/** 灯光采集器 */
		public static LIGHT_PICKER:string = 'lightPicker';
		/** 阴影投射方法 */
		public static SHADOW_MAP_METHOD:string = 'shadowMapMethod';
		public static EFFECTS_METHOD:string = 'effectsMethod';
	}
}
