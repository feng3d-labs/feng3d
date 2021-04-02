namespace feng3d
{
    export interface IDestroyOptions
    {
        children?: boolean;
        texture?: boolean;
        baseTexture?: boolean;
    }

    export interface Node2DEventMap extends Component2DEventMap
    {
        removed: Node2D;
        added: Node2D;
        childAdded: { child: Node2D, parent: Node2D, index: number }
        childRemoved: { child: Node2D, parent: Node2D, index: number }
    }

    /**
     * Container is a general-purpose display object that holds children. It also adds built-in support for advanced
     * rendering features like masking and filtering.
     *
     * It is the base class of all display objects that act as a container for other objects, including Graphics
     * and Sprite.
     *
     * ```js
     * import { BlurFilter } from '@pixi/filter-blur';
     * import { Container } from '@pixi/display';
     * import { Graphics } from '@pixi/graphics';
     * import { Sprite } from '@pixi/sprite';
     *
     * let container = new Container();
     * let sprite = Sprite.from("https://s3-us-west-2.amazonaws.com/s.cdpn.io/693612/IaUrttj.png");
     *
     * sprite.width = 512;
     * sprite.height = 512;
     *
     * // Adds a sprite as a child to this container. As a result, the sprite will be rendered whenever the container
     * // is rendered.
     * container.addChild(sprite);
     *
     * // Blurs whatever is rendered by the container
     * container.filters = [new BlurFilter()];
     *
     * // Only the contents within a circle at the center should be rendered onto the screen.
     * container.mask = new Graphics()
     *  .beginFill(0xffffff)
     *  .drawCircle(sprite.width / 2, sprite.height / 2, Math.min(sprite.width, sprite.height) / 2)
     *  .endFill();
     * ```
     *
     */
    export class Node2D<T extends Node2DEventMap = Node2DEventMap> extends Component<T>
    {
        @AddEntityMenu("Node2D")
        static create(name = "Node2D")
        {
            var node2d = new Entity().addComponent(Node2D);
            node2d.name = name;
            return node2d;
        }

        public parent: Node2D;
        public worldAlpha: number;
        public transform: Transform;
        public alpha: number;
        public visible: boolean;

        public readonly children: Node2D[];

        protected _destroyed: boolean;

        private tempDisplayObjectParent: Node2D;
        public displayObjectUpdateTransform: () => void;

        constructor()
        {
            super();

            this.tempDisplayObjectParent = null;
            /**
             * World transform and local transform of this object.
             * This will become read-only later, please do not assign anything there unless you know what are you doing.
             *
             * @member {PIXI.Transform}
             */
            this.transform = new Transform();

            /**
             * The opacity of the object.
             *
             * @member {number}
             */
            this.alpha = 1;

            /**
             * The visibility of the object. If false the object will not be drawn, and
             * the updateTransform function will not be called.
             *
             * Only affects recursive calls from parent. You can ask for bounds or call updateTransform manually.
             *
             * @member {boolean}
             */
            this.visible = true;

            /**
             * The display object container that contains this display object.
             *
             * @member {PIXI.Container}
             */
            this.parent = null;

            /**
             * The multiplied alpha of the displayObject.
             *
             * @member {number}
             * @readonly
             */
            this.worldAlpha = 1;

            /**
             * If the object has been destroyed via destroy(). If true, it should not be used.
             *
             * @member {boolean}
             * @protected
             */
            this._destroyed = false;

            /**
             * The array of children of this container.
             *
             * @member {feng3d.Node2D[]}
             * @readonly
             */
            this.children = [];
        }

        /**
         * Recursively updates transform of all objects from the root to this one
         * internal function for toLocal()
         */
        _recursivePostUpdateTransform(): void
        {
            if (this.parent)
            {
                this.parent._recursivePostUpdateTransform();
                this.transform.updateTransform(this.parent.transform);
            }
            else
            {
                this.transform.updateTransform(this._tempDisplayObjectParent.transform);
            }
        }

        /**
         * Calculates the global position of the display object.
         *
         * @param {PIXI.IPointData} position - The world origin to calculate from.
         * @param {PIXI.Point} [point] - A Point object in which to store the value, optional
         *  (otherwise will create a new Point).
         * @param {boolean} [skipUpdate=false] - Should we skip the update transform.
         * @return {PIXI.Point} A point object representing the position of this object.
         */
        toGlobal<P extends IPointData = Point>(position: IPointData, point?: P, skipUpdate = false): P
        {
            if (!skipUpdate)
            {
                this._recursivePostUpdateTransform();

                // this parent check is for just in case the item is a root object.
                // If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
                // this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
                if (!this.parent)
                {
                    this.parent = this._tempDisplayObjectParent;
                    this.displayObjectUpdateTransform();
                    this.parent = null;
                }
                else
                {
                    this.displayObjectUpdateTransform();
                }
            }

            // don't need to update the lot
            return this.worldTransform.apply<P>(position, point);
        }

        /**
         * Calculates the local position of the display object relative to another point.
         *
         * @param {PIXI.IPointData} position - The world origin to calculate from.
         * @param {feng3d.Node2D} [from] - The Node2D to calculate the global position from.
         * @param {PIXI.Point} [point] - A Point object in which to store the value, optional
         *  (otherwise will create a new Point).
         * @param {boolean} [skipUpdate=false] - Should we skip the update transform
         * @return {PIXI.Point} A point object representing the position of this object
         */
        toLocal<P extends IPointData = Point>(position: IPointData, from?: Node2D, point?: P, skipUpdate?: boolean): P
        {
            if (from)
            {
                position = from.toGlobal(position, point, skipUpdate);
            }

            if (!skipUpdate)
            {
                this._recursivePostUpdateTransform();

                // this parent check is for just in case the item is a root object.
                // If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
                // this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
                if (!this.parent)
                {
                    this.parent = this._tempDisplayObjectParent;
                    this.displayObjectUpdateTransform();
                    this.parent = null;
                }
                else
                {
                    this.displayObjectUpdateTransform();
                }
            }

            // simply apply the matrix..
            return this.worldTransform.applyInverse<P>(position, point);
        }

        /**
         * Set the parent Container of this Node2D.
         *
         * @param {PIXI.Container} container - The Container to add this Node2D to.
         * @return {PIXI.Container} The Container that this Node2D was added to.
         */
        setParent(container: Node2D): Node2D
        {
            if (!container || !container.addChild)
            {
                throw new Error('setParent: Argument must be a Container');
            }

            container.addChild(<any>this);

            return container;
        }

        /**
         * Convenience function to set the position, scale, skew and pivot at once.
         *
         * @param {number} [x=0] - The X position
         * @param {number} [y=0] - The Y position
         * @param {number} [scaleX=1] - The X scale value
         * @param {number} [scaleY=1] - The Y scale value
         * @param {number} [rotation=0] - The rotation
         * @param {number} [skewX=0] - The X skew value
         * @param {number} [skewY=0] - The Y skew value
         * @param {number} [pivotX=0] - The X pivot value
         * @param {number} [pivotY=0] - The Y pivot value
         * @return {feng3d.Node2D} The Node2D instance
         */
        setTransform(x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0, skewX = 0, skewY = 0, pivotX = 0, pivotY = 0): this
        {
            this.position.x = x;
            this.position.y = y;
            this.scale.x = !scaleX ? 1 : scaleX;
            this.scale.y = !scaleY ? 1 : scaleY;
            this.rotation = rotation;
            this.skew.x = skewX;
            this.skew.y = skewY;
            this.pivot.x = pivotX;
            this.pivot.y = pivotY;

            return this;
        }

        /**
         * @protected
         * @member {PIXI.Container}
         */
        get _tempDisplayObjectParent(): Node2D
        {
            if (this.tempDisplayObjectParent === null)
            {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                this.tempDisplayObjectParent = Node2D.create();
            }

            return this.tempDisplayObjectParent;
        }

        /**
         * The position of the displayObject on the x axis relative to the local coordinates of the parent.
         * An alias to position.x
         *
         * @member {number}
         */
        get x(): number
        {
            return this.position.x;
        }

        set x(value: number)
        {
            this.transform.position.x = value;
        }

        /**
         * The position of the displayObject on the y axis relative to the local coordinates of the parent.
         * An alias to position.y
         *
         * @member {number}
         */
        get y(): number
        {
            return this.position.y;
        }

        set y(value: number)
        {
            this.transform.position.y = value;
        }

        /**
         * Current transform of the object based on world (parent) factors.
         *
         * @member {PIXI.Matrix}
         * @readonly
         */
        get worldTransform(): Matrix
        {
            return this.transform.worldTransform;
        }

        /**
         * Current transform of the object based on local factors: position, scale, other stuff.
         *
         * @member {PIXI.Matrix}
         * @readonly
         */
        get localTransform(): Matrix
        {
            return this.transform.localTransform;
        }

        /**
         * The coordinate of the object relative to the local coordinates of the parent.
         *
         * @since PixiJS 4
         * @member {PIXI.ObservablePoint}
         */
        get position(): ObservablePoint
        {
            return this.transform.position;
        }

        set position(value: ObservablePoint)
        {
            this.transform.position.copyFrom(value);
        }

        /**
         * The scale factors of this object along the local coordinate axes.
         *
         * The default scale is (1, 1).
         *
         * @since PixiJS 4
         * @member {PIXI.ObservablePoint}
         */
        get scale(): ObservablePoint
        {
            return this.transform.scale;
        }

        set scale(value: ObservablePoint)
        {
            this.transform.scale.copyFrom(value);
        }

        /**
         * The center of rotation, scaling, and skewing for this display object in its local space. The `position`
         * is the projection of `pivot` in the parent's local space.
         *
         * By default, the pivot is the origin (0, 0).
         *
         * @since PixiJS 4
         * @member {PIXI.ObservablePoint}
         */
        get pivot(): ObservablePoint
        {
            return this.transform.pivot;
        }

        set pivot(value: ObservablePoint)
        {
            this.transform.pivot.copyFrom(value);
        }

        /**
         * The skew factor for the object in radians.
         *
         * @since PixiJS 4
         * @member {PIXI.ObservablePoint}
         */
        get skew(): ObservablePoint
        {
            return this.transform.skew;
        }

        set skew(value: ObservablePoint)
        {
            this.transform.skew.copyFrom(value);
        }

        /**
         * The rotation of the object in radians.
         * 'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.
         *
         * @member {number}
         */
        get rotation(): number
        {
            return this.transform.rotation;
        }

        set rotation(value: number)
        {
            this.transform.rotation = value;
        }

        /**
         * The angle of the object in degrees.
         * 'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.
         *
         * @member {number}
         */
        get angle(): number
        {
            return this.transform.rotation * Math.RAD2DEG;
        }

        set angle(value: number)
        {
            this.transform.rotation = value * Math.DEG2RAD;
        }

        /**
         * Indicates if the object is globally visible.
         *
         * @member {boolean}
         * @readonly
         */
        get worldVisible(): boolean
        {
            let item = this as Node2D;

            do
            {
                if (!item.visible)
                {
                    return false;
                }

                item = item.parent;
            } while (item);

            return true;
        }

        /**
         * 从自身与子代（孩子，孩子的孩子，...）Entity 中获取所有指定类型的组件
         * 
         * @param type		要检索的组件的类型。
         * @return			返回与给出类定义一致的组件
         * 
         * @todo 与 Node3D.getComponentsInChildren 代码重复，有待优化
         */
        getComponentsInChildren<T extends Components>(type?: Constructor<T>, filter?: (compnent: T) => {
            /**
             * 是否继续查找子项
             */
            findchildren: boolean,
            /**
             * 是否为需要查找的组件
             */
            value: boolean
        }, result?: T[]): T[]
        {
            result = result || [];
            var findchildren = true;
            var cls = type;
            var components = this.entity.components;
            for (var i = 0, n = components.length; i < n; i++)
            {
                var item = <T>components[i];
                if (!cls)
                {
                    result.push(item);
                } else if (item instanceof cls)
                {
                    if (filter)
                    {
                        var filterresult = filter(item);
                        filterresult && filterresult.value && result.push(item);
                        findchildren = filterresult ? (filterresult && filterresult.findchildren) : false;
                    }
                    else
                    {
                        result.push(item);
                    }
                }
            }
            if (findchildren)
            {
                for (var i = 0, n = this.children.length; i < n; i++)
                {
                    this.children[i].getComponentsInChildren(type, filter, result);
                }
            }
            return result;
        }

        /**
         * 从父代（父亲，父亲的父亲，...）中获取组件
         * 
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInParents<T extends Components>(type?: Constructor<T>, result?: T[]): T[]
        {
            result = result || [];
            var parent = this.parent;
            while (parent)
            {
                var compnent = parent.getComponent(type);
                compnent && result.push(compnent);
                parent = parent.parent;
            }
            return result;
        }

        /**
         * Overridable method that can be used by Container subclasses whenever the children array is modified
         *
         * @protected
         */
        protected onChildrenChange(_length?: number): void
        {
            /* empty */
        }

        /**
         * Adds one or more children to the container.
         *
         * Multiple items can be added like so: `myContainer.addChild(thingOne, thingTwo, thingThree)`
         *
         * @param {...feng3d.Node2D} children - The Node2D(s) to add to the container
         * @return {feng3d.Node2D} The first child that was added.
         */
        addChild<T extends Node2D[]>(...children: T): T[0]
        {
            // if there is only one argument we can bypass looping through the them
            if (children.length > 1)
            {
                // loop through the array and add all children
                for (let i = 0; i < children.length; i++)
                {
                    // eslint-disable-next-line prefer-rest-params
                    this.addChild(children[i]);
                }
            }
            else
            {
                const child = children[0];
                // if the child has a parent then lets remove it as PixiJS objects can only exist in one place

                if (child.parent)
                {
                    child.parent.removeChild(child);
                }

                child.parent = this;

                // ensure child transform will be recalculated
                child.transform._parentID = -1;

                this.children.push(child);

                // TODO - lets either do all callbacks or all events.. not both!
                this.onChildrenChange(this.children.length - 1);
                this.emit('childAdded', { child: child, parent: this, index: this.children.length - 1 });
                child.emit('added', this);
            }

            return children[0];
        }

        /**
         * Adds a child to the container at a specified index. If the index is out of bounds an error will be thrown
         *
         * @param {feng3d.Node2D} child - The child to add
         * @param {number} index - The index to place the child in
         * @return {feng3d.Node2D} The child that was added.
         */
        addChildAt<T extends Node2D>(child: T, index: number): T
        {
            if (index < 0 || index > this.children.length)
            {
                throw new Error(`${child}addChildAt: The index ${index} supplied is out of bounds ${this.children.length}`);
            }

            if (child.parent)
            {
                child.parent.removeChild(child);
            }

            child.parent = this;

            // ensure child transform will be recalculated
            child.transform._parentID = -1;

            this.children.splice(index, 0, child);

            // TODO - lets either do all callbacks or all events.. not both!
            this.onChildrenChange(index);
            child.emit('added', this);
            this.emit('childAdded', { child: child, parent: this, index: index });

            return child;
        }

        /**
         * Swaps the position of 2 Display Objects within this container.
         *
         * @param {feng3d.Node2D} child - First display object to swap
         * @param {feng3d.Node2D} child2 - Second display object to swap
         */
        swapChildren(child: Node2D, child2: Node2D): void
        {
            if (child === child2)
            {
                return;
            }

            const index1 = this.getChildIndex(child);
            const index2 = this.getChildIndex(child2);

            this.children[index1] = child2;
            this.children[index2] = child;
            this.onChildrenChange(index1 < index2 ? index1 : index2);
        }

        /**
         * Returns the index position of a child Node2D instance
         *
         * @param {feng3d.Node2D} child - The Node2D instance to identify
         * @return {number} The index position of the child display object to identify
         */
        getChildIndex(child: Node2D): number
        {
            const index = this.children.indexOf(child);

            if (index === -1)
            {
                throw new Error('The supplied Node2D must be a child of the caller');
            }

            return index;
        }

        /**
         * Changes the position of an existing child in the display object container
         *
         * @param {feng3d.Node2D} child - The child Node2D instance for which you want to change the index number
         * @param {number} index - The resulting index number for the child display object
         */
        setChildIndex(child: Node2D, index: number): void
        {
            if (index < 0 || index >= this.children.length)
            {
                throw new Error(`The index ${index} supplied is out of bounds ${this.children.length}`);
            }

            const currentIndex = this.getChildIndex(child);

            this.children.splice(currentIndex, 1); // remove from old position
            this.children.splice(index, 0, child); // add at new position

            this.onChildrenChange(index);
        }

        /**
         * Returns the child at the specified index
         *
         * @param {number} index - The index to get the child at
         * @return {feng3d.Node2D} The child at the given index, if any.
         */
        getChildAt(index: number): Node2D
        {
            if (index < 0 || index >= this.children.length)
            {
                throw new Error(`getChildAt: Index (${index}) does not exist.`);
            }

            return this.children[index];
        }

        /**
         * Removes one or more children from the container.
         *
         * @param {...feng3d.Node2D} children - The Node2D(s) to remove
         * @return {feng3d.Node2D} The first child that was removed.
         */
        removeChild<T extends Node2D[]>(...children: T): T[0]
        {
            // if there is only one argument we can bypass looping through the them
            if (children.length > 1)
            {
                // loop through the arguments property and remove all children
                for (let i = 0; i < children.length; i++)
                {
                    this.removeChild(children[i]);
                }
            }
            else
            {
                const child = children[0];
                const index = this.children.indexOf(child);

                if (index === -1) return null;

                child.parent = null;
                // ensure child transform will be recalculated
                child.transform._parentID = -1;
                this.children.splice(index, 1);

                // TODO - lets either do all callbacks or all events.. not both!
                this.onChildrenChange(index);
                child.emit('removed', this);
                this.emit('childRemoved', { child: child, parent: this, index: index });
            }

            return children[0];
        }

        /**
         * Removes a child from the specified index position.
         *
         * @param {number} index - The index to get the child from
         * @return {feng3d.Node2D} The child that was removed.
         */
        removeChildAt(index: number): Node2D
        {
            const child = this.getChildAt(index);

            // ensure child transform will be recalculated..
            child.parent = null;
            child.transform._parentID = -1;
            this.children.splice(index, 1);

            // TODO - lets either do all callbacks or all events.. not both!
            this.onChildrenChange(index);
            child.emit('removed', this);
            this.emit('childRemoved', { child: child, parent: this, index: index });

            return child;
        }

        /**
         * Removes all children from this container that are within the begin and end indexes.
         *
         * @param {number} [beginIndex=0] - The beginning position.
         * @param {number} [endIndex=this.children.length] - The ending position. Default value is size of the container.
         * @returns {feng3d.Node2D[]} List of removed children
         */
        removeChildren(beginIndex = 0, endIndex = this.children.length): Node2D[]
        {
            const begin = beginIndex;
            const end = endIndex;
            const range = end - begin;
            let removed: Node2D[];

            if (range > 0 && range <= end)
            {
                removed = this.children.splice(begin, range);

                for (let i = 0; i < removed.length; ++i)
                {
                    removed[i].parent = null;
                    if (removed[i].transform)
                    {
                        removed[i].transform._parentID = -1;
                    }
                }

                this.onChildrenChange(beginIndex);

                for (let i = 0; i < removed.length; ++i)
                {
                    removed[i].emit('removed', this);
                    this.emit('childRemoved', { child: removed[i], parent: this, index: i });
                }

                return removed;
            }
            else if (range === 0 && this.children.length === 0)
            {
                return [];
            }

            throw new RangeError('removeChildren: numeric values are outside the acceptable range.');
        }

        /**
         * Updates the transform on all children of this container for rendering
         */
        updateTransform(): void
        {
            this.transform.updateTransform(this.parent.transform);

            // TODO: check render flags, how to process stuff here
            this.worldAlpha = this.alpha * this.parent.worldAlpha;

            for (let i = 0, j = this.children.length; i < j; ++i)
            {
                const child = this.children[i];

                if (child.visible)
                {
                    child.updateTransform();
                }
            }
        }

        /**
         * Removes all internal references and listeners as well as removes children from the display list.
         * Do not use a Container after calling `destroy`.
         *
         * @param {object|boolean} [options] - Options parameter. A boolean will act as if all options
         *  have been set to that value
         * @param {boolean} [options.children=false] - if set to true, all the children will have their destroy
         *  method called as well. 'options' will be passed on to those calls.
         * @param {boolean} [options.texture=false] - Only used for child Sprites if options.children is set to true
         *  Should it destroy the texture of the child sprite
         * @param {boolean} [options.baseTexture=false] - Only used for child Sprites if options.children is set to true
         *  Should it destroy the base texture of the child sprite
         */
        destroy(options?: IDestroyOptions | boolean): void
        {
            if (this.parent)
            {
                this.parent.removeChild(this);
            }
            this.offAll();
            this.transform = null;

            this.parent = null;

            this._destroyed = true;

            const destroyChildren = typeof options === 'boolean' ? options : options && options.children;

            const oldChildren = this.removeChildren(0, this.children.length);

            if (destroyChildren)
            {
                for (let i = 0; i < oldChildren.length; ++i)
                {
                    oldChildren[i].destroy(options);
                }
            }
        }

    }

    /**
     * Node2D default updateTransform, does not update children of container.
     * Will crash if there's no parent element.
     *.Node2D#
     * @method displayObjectUpdateTransform
     */
    Node2D.prototype.displayObjectUpdateTransform = Node2D.prototype.updateTransform;
}