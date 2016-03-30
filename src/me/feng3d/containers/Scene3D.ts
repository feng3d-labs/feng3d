module feng3d
{
	

	/**
	 * 3d场景
	 * @author feng 2014-3-17
	 */
	export class Scene3D extends Container3D
	{
		private _partitions:Partition3D[];

		/** 实体字典 */
		private _entityDic;

		private _displayEntityDic;

		private _mouseCollisionEntitys:Entity[];

		/**
		 * 创建一个3d场景
		 */
		public Scene3D()
		{
			this._isRoot = true;
			this._scene = this;

			this._entityDic = {};
			this._displayEntityDic = {};
			this._mouseCollisionEntitys = [];

			this._partitions = [];

			this.partition = new Partition3D(new NodeBase());
		}

		/** 显示实体字典 */
		public get displayEntityDic()
		{
			return this._displayEntityDic;
		}

		/**
		 * 添加对象到场景
		 * @param object3D		3d对象
		 */
		public addedObject3d(object3D:Object3D):void
		{
			if (getQualifiedClassName(object3D) == "Entity")
			{
				this._entityDic[object3D.name] = object3D;
				if (object3D.visible)
				{
					this._displayEntityDic[object3D.name] = object3D;
				}
			}
		}

		/**
		 * 从场景中移除对象
		 * @param object3D	3d对象
		 */
		public removedObject3d(object3D:Object3D):void
		{
			delete this._entityDic[object3D.name];
			delete this._displayEntityDic[object3D.name];
		}

		/**
		 * 收集需要检测鼠标碰撞的实体
		 */
		public collectMouseCollisionEntitys():void
		{
			this._mouseCollisionEntitys.length = 0;

			//3d对象堆栈
			var mouseCollisionStack:Object3D[] = [];
			mouseCollisionStack.push(this);

			var object3D:Object3D;
			var entity:Entity;
			var container3D:Container3D;
			//遍历堆栈中需要检测鼠标碰撞的实体
			while (mouseCollisionStack.length > 0)
			{
				object3D = mouseCollisionStack.pop();
				if (!object3D.visible)
					continue;
				entity = object3D as Entity;
				container3D = object3D as Container3D;
				//收集需要检测鼠标碰撞的实体到检测列表
				if (entity && entity.mouseEnabled)
				{
					this._mouseCollisionEntitys.push(object3D as Entity);
				}
				//收集容器内子对象到堆栈
				if (container3D && container3D.mouseChildren)
				{
					var len:number = container3D.numChildren;
					for (var i:number = 0; i < len; i++)
					{
						mouseCollisionStack.push(container3D.getChildAt(i));
					}
				}
			}
		}

		/**
		 * 需要检测鼠标碰撞的实体
		 */
		public get mouseCollisionEntitys():Entity[]
		{
			return this._mouseCollisionEntitys;
		}

		/**
		 * 横穿分区
		 * @param traverser 横越者
		 */
		public traversePartitions(traverser:PartitionTraverser):void
		{
			var i:number;
			var len:number = this._partitions.length;

			traverser.scene = this;

			while (i < len)
			{
				this._partitions[i].traverse(traverser);
				i = i + 1;
			}
		}

		/**
		 * 注销实体
		 * @param entity	实体
		 */
		public unregisterEntity(entity:Entity):void
		{
			entity.implicitPartition.removeEntity(entity);
		}

		/**
		 * 注册实体
		 * @param entity		实体
		 */
		public registerEntity(entity:Entity):void
		{
			var partition:Partition3D = entity.implicitPartition;
			this.addPartitionUnique(partition);

			partition.markForUpdate(entity);
		}

		/**
		 * 添加分区，如果不在列表中
		 * @param partition		分区
		 */
		protected addPartitionUnique(partition:Partition3D):void
		{
			if (this._partitions.indexOf(partition) == -1)
				this._partitions.push(partition);
		}

		/**
		 * 注册分区
		 * @param entity	注册分区的实体
		 */
		public registerPartition(entity:Entity):void
		{
			this.addPartitionUnique(entity.implicitPartition);
		}

		/**
		 * 注销分区
		 * @param entity	注销分区的实体
		 */
		public unregisterPartition(entity:Entity):void
		{
			// todo: wait... is this even correct?
			// shouldn't we check the number of children in implicitPartition and remove partition if 0?
			entity.implicitPartition.removeEntity(entity);
		}
	}
}
