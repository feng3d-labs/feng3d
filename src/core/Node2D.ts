namespace feng3d
{
    export interface IDestroyOptions
    {
        children?: boolean;
        texture?: boolean;
        baseTexture?: boolean;
    }

    export interface Node2D
    {
        /**
         * Adds a child to the container at a specified index. If the index is out of bounds an error will be thrown
         *
         * @param {feng3d.Node2D} child - The child to add
         * @param {number} index - The index to place the child in
         * @return {feng3d.Node2D} The child that was added.
         */
        addChildAt<T extends Node2D>(child: T, index: number): T;

        /**
         * Returns the child at the specified index
         *
         * @param {number} index - The index to get the child at
         * @return {feng3d.Node2D} The child at the given index, if any.
         */
        getChildAt(index: number): Node2D;

        /**
         * Removes all children from this container that are within the begin and end indexes.
         *
         * @param {number} [beginIndex=0] - The beginning position.
         * @param {number} [endIndex=this.children.length] - The ending position. Default value is size of the container.
         * @returns {feng3d.Node2D[]} List of removed children
         */
        removeChildren(beginIndex?: number, endIndex?: number): Node2D[];

        /**
         * Removes a child from the specified index position.
         *
         * @param {number} index - The index to get the child from
         * @return {feng3d.Node2D} The child that was removed.
         */
        removeChildAt(index: number): Node2D;

        /**
         * Adds a child to the container at a specified index. If the index is out of bounds an error will be thrown
         *
         * @param {feng3d.Node2D} child - The child to add
         * @param {number} index - The index to place the child in
         * @return {feng3d.Node2D} The child that was added.
         */
        addChildAt<T extends Node2D>(child: T, index: number): T
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
    export class Node2D<T extends Component2DEventMap = Component2DEventMap> extends Node<T>
    {
        public worldAlpha: number;
        public transform: Transform;

        @oav()
        public alpha: number;

        @oav()
        public visible: boolean;

        protected _destroyed: boolean;

        protected tempDisplayObjectParent: Node2D;
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
            this._parent = null;

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
            const parent = this.parent;
            if (parent && parent instanceof Node2D)
            {
                parent._recursivePostUpdateTransform();
                this.transform.updateTransform(parent.transform);
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
        toGlobal(position: Vector2, point?: Vector2, skipUpdate = false): Vector2
        {
            if (!skipUpdate)
            {
                this._recursivePostUpdateTransform();

                // this parent check is for just in case the item is a root object.
                // If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
                // this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
                if (!this.parent)
                {
                    this._setParent(this._tempDisplayObjectParent);
                    this.displayObjectUpdateTransform();
                    this._setParent(null);
                }
                else
                {
                    this.displayObjectUpdateTransform();
                }
            }

            // don't need to update the lot
            return this.worldTransform.apply(position, point);
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
        toLocal(position: Vector2, from?: Node2D, point?: Vector2, skipUpdate?: boolean): Vector2
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
                    this._setParent(this._tempDisplayObjectParent);
                    this.displayObjectUpdateTransform();
                    this._setParent(null);
                }
                else
                {
                    this.displayObjectUpdateTransform();
                }
            }

            // simply apply the matrix..
            return this.worldTransform.applyInverse(position, point);
        }

        protected _setParent(value: Node)
        {
            this._parent = value;
            this.transform._parentID = -1;
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
            this.x = x;
            this.y = y;
            this.scaleX = !scaleX ? 1 : scaleX;
            this.scaleX = !scaleY ? 1 : scaleY;
            this.rotation = rotation;
            this.skewX = skewX;
            this.skewY = skewY;
            this.pivotX = pivotX;
            this.pivotY = pivotY;

            return this;
        }

        /**
         * @protected
         * @member {PIXI.Container}
         */
        get _tempDisplayObjectParent(): Node2D
        {
            return this.tempDisplayObjectParent;
        }

        /**
         * The position of the displayObject on the x axis relative to the local coordinates of the parent.
         * An alias to position.x
         *
         * @member {number}
         */
        @oav()
        @serialize
        get x(): number
        {
            return this.transform.x;
        }

        set x(value: number)
        {
            this.transform.x = value;
        }

        /**
         * The position of the displayObject on the y axis relative to the local coordinates of the parent.
         * An alias to position.y
         *
         * @member {number}
         */
        @oav()
        @serialize
        get y(): number
        {
            return this.transform.y;
        }

        set y(value: number)
        {
            this.transform.y = value;
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
         * The scale factors of this object along the local coordinate axes.
         *
         * The default scale is (1, 1).
         */
        @oav()
        @serialize
        get scaleX()
        {
            return this.transform.scaleX;
        }

        set scaleX(v)
        {
            this.transform.scaleX = v;
        }

        @oav()
        @serialize
        get scaleY()
        {
            return this.transform.scaleY;
        }

        set scaleY(v)
        {
            this.transform.scaleY = v;
        }

        /**
         * The center of rotation, scaling, and skewing for this display object in its local space. The `position`
         * is the projection of `pivot` in the parent's local space.
         *
         * By default, the pivot is the origin (0, 0).
         */
        @oav()
        @serialize
        get pivotX()
        {
            return this.transform.pivotX;
        }

        set pivotX(value)
        {
            this.transform.pivotX = value;
        }

        @oav()
        @serialize
        get pivotY()
        {
            return this.transform.pivotY;
        }

        set pivotY(value)
        {
            this.transform.pivotY = value;
        }

        /**
         * The skew factor for the object in radians.
         */
        @oav()
        @serialize
        get skewX()
        {
            return this.transform.skewX;
        }

        set skewX(value)
        {
            this.transform.skewX = value;
        }

        @oav()
        @serialize
        get skewY()
        {
            return this.transform.skewY;
        }

        set skewY(value)
        {
            this.transform.skewY = value;
        }

        /**
         * The rotation of the object in radians.
         * 'rotation' and 'angle' have the same effect on a display object; rotation is in radians, angle is in degrees.
         */
        @oav()
        @serialize
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
         */
        @oav()
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
         */
        get worldVisible(): boolean
        {
            let item: Node = this;

            do
            {
                if (!item.visible)
                {
                    return false;
                }

                item = item.parent;

            } while (item && item instanceof Node2D);

            return true;
        }

        /**
         * Updates the transform on all children of this container for rendering
         */
        updateTransform(): void
        {
            const parent = this.parent as Node2D;
            this.transform.updateTransform(parent.transform);

            // TODO: check render flags, how to process stuff here
            this.worldAlpha = this.alpha * parent.worldAlpha;

            for (let i = 0, j = this.children.length; i < j; ++i)
            {
                const child = this.children[i] as Node2D;

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

            this._parent = null;

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