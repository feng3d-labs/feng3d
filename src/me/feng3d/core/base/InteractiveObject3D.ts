module feng3d
{
	

	
	

	/**
	 * 当鼠标点击时触发
	 * @eventType me.feng3d.events.MouseEvent3D
	 */
	[Event(name = "click3d", type = "me.feng3d.events.MouseEvent3D")]

	/**
	 * 当鼠标移上时触发
	 * @eventType me.feng3d.events.MouseEvent3D
	 */
	[Event(name = "mouseOver3d", type = "me.feng3d.events.MouseEvent3D")]

	/**
	 * 当鼠标移出时触发
	 * @eventType me.feng3d.events.MouseEvent3D
	 */
	[Event(name = "mouseOut3d", type = "me.feng3d.events.MouseEvent3D")]

	/**
	 * 当鼠标移动时触发
	 * @eventType me.feng3d.events.MouseEvent3D
	 */
	[Event(name = "mouseMove3d", type = "me.feng3d.events.MouseEvent3D")]

	/**
	 * 当鼠标双击时触发
	 * @eventType me.feng3d.events.MouseEvent3D
	 */
	[Event(name = "doubleClick3d", type = "me.feng3d.events.MouseEvent3D")]

	/**
	 * 当鼠标按下时触发
	 * @eventType me.feng3d.events.MouseEvent3D
	 */
	[Event(name = "mouseDown3d", type = "me.feng3d.events.MouseEvent3D")]

	/**
	 * 当鼠标弹起时触发
	 * @eventType me.feng3d.events.MouseEvent3D
	 */
	[Event(name = "mouseUp3d", type = "me.feng3d.events.MouseEvent3D")]

	/**
	 * 当滚动鼠标滚轮时触发
	 * @eventType me.feng3d.events.MouseEvent3D
	 */
	[Event(name = "mouseWheel3d", type = "me.feng3d.events.MouseEvent3D")]

	/**
	 * InteractiveObject3D 类是用户可以使用鼠标、键盘或其他用户输入设备与之交互的所有显示对象的抽象基类。
	 * @see		flash.display.InteractiveObject
	 * @author 	warden_feng 2014-5-5
	 */
	export class InteractiveObject3D extends Object3D
	{
		protected _mouseEnabled:boolean = false;

		/**
		 * 调用新的 InteractiveObject3D() 构造函数会引发 ArgumentError 异常。
		 * @throws	me.feng.error.AbstractClassError
		 */
		public InteractiveObject3D()
		{
			super();

			AbstractClassError.check(this);
		}

		/**
		 * 是否开启鼠标事件
		 */
		public get mouseEnabled():boolean
		{
			return _mouseEnabled;
		}

		public set mouseEnabled(value:boolean):void
		{
			_mouseEnabled = value;
		}

		/**
		 * @inheritDoc
		 */
		public dispatchEvent(event:Event):boolean
		{
			//处理3D鼠标事件禁用
			if (event is MouseEvent3D && !mouseEnabled)
			{
				if (parent)
				{
					return parent.dispatchEvent(event);
				}
				return false;
			}
			return super.dispatchEvent(event);
		}
	}
}
