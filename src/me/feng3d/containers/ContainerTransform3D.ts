module feng3d
{
	
	/**
	 * 3d容器变换组件
	 * @author feng 2016-3-9
	 */
	export class ContainerTransform3D extends Component
	{
		private objectContainer3D:Container3D;

		/**
		 * 创建一个3d容器变换组件
		 */
		public ContainerTransform3D()
		{
			this.addEventListener(ComponentEvent.BE_ADDED_COMPONET, this.onBeAddedComponet);
		}

		/**
		 * 处理组件被添加事件
		 * @param event
		 */
		protected onBeAddedComponet(event:ComponentEvent):void
		{
			var data:AddedComponentEventVO = event.data;
			this.objectContainer3D = data.container as Container3D;
			this.objectContainer3D.transform3D.addEventListener(Transform3DEvent.TRANSFORM_CHANGED, this.onContainer3DTranformChange);
		}

		/**
		 * 处理容器变换事件
		 * @param event
		 */
		protected onContainer3DTranformChange(event:Transform3DEvent):void
		{
			var len:number = this.objectContainer3D.numChildren;
			for (var i:number = 0; i < len; i++)
			{
				var transform3D:Transform3D = this.objectContainer3D.getChildAt(i).transform3D;
				transform3D.invalidateTransform();
			}
		}
	}
}
