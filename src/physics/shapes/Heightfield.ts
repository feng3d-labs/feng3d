namespace CANNON
{
    /**
     * 高度场
     */
    export class Heightfield extends Shape
    {
        type = ShapeType.HEIGHTFIELD;

        /**
         * 沿x轴展开的一组数字或高度值。
         */
        data: number[][];
        /**
         * 最大值
         */
        maxValue: number;
        /**
         * 最小值
         */
        minValue: number;
        /**
          * 每个元素的宽度
          */
        elementSize: number;
        cacheEnabled: boolean;

        pillarConvex = new ConvexPolyhedron();

        pillarOffset = new feng3d.Vector3();

        private _cachedPillars: {
            [key: string]: {
                convex: ConvexPolyhedron,
                offset: feng3d.Vector3
            }
        };

        /**
         * Heightfield shape class. Height data is given as an array. These data points are spread out evenly with a given distance.
         * 
         * @param data An array of Y values that will be used to construct the terrain.
         * @param options
         * @param options.minValue] Minimum value of the data points in the data array. Will be computed automatically if not given.
         * @param options.maxValue Maximum value.
         * @param options.elementSize=0.1 World spacing between the data points in X direction.
         * @todo Should be possible to use along all axes, not just y
         * @todo should be possible to scale along all axes
         *
         * @example
         *     // Generate some height data (y-values).
         *     var data = [];
         *     for(var i = 0; i < 1000; i++){
         *         var y = 0.5 * Math.cos(0.2 * i);
         *         data.push(y);
         *     }
         *
         *     // Create the heightfield shape
         *     var heightfieldShape = new Heightfield(data, {
         *         elementSize: 1 // Distance between the data points in X and Y directions
         *     });
         *     var heightfieldBody = new Body();
         *     heightfieldBody.addShape(heightfieldShape);
         *     world.addBody(heightfieldBody);
         */
        constructor(data: number[][], options: { elementSize?: number, minValue?: number, maxValue?: number } = {})
        {
            super();
            options = Utils.defaults(options, {
                maxValue: null,
                minValue: null,
                elementSize: 1
            });

            this.data = data;

            this.maxValue = options.maxValue;

            this.minValue = options.minValue;

            this.elementSize = options.elementSize;

            if (options.minValue === null)
            {
                this.updateMinValue();
            }
            if (options.maxValue === null)
            {
                this.updateMaxValue();
            }

            this.cacheEnabled = true;

            super();

            this.updateBoundingSphereRadius();

            this._cachedPillars = {};
        }

        /**
         * 更新
         */
        update()
        {
            this._cachedPillars = {};
        }

        /**
         * 更新最小值
         */
        updateMinValue()
        {
            var data = this.data;
            var minValue = data[0][0];
            for (var i = 0; i !== data.length; i++)
            {
                for (var j = 0; j !== data[i].length; j++)
                {
                    var v = data[i][j];
                    if (v < minValue)
                    {
                        minValue = v;
                    }
                }
            }
            this.minValue = minValue;
        }

        /**
         * 更新最大值
         */
        updateMaxValue()
        {
            var data = this.data;
            var maxValue = data[0][0];
            for (var i = 0; i !== data.length; i++)
            {
                for (var j = 0; j !== data[i].length; j++)
                {
                    var v = data[i][j];
                    if (v > maxValue)
                    {
                        maxValue = v;
                    }
                }
            }
            this.maxValue = maxValue;
        }

        /**
         * 在索引处设置高度值。完成后不要忘记更新maxValue和minValue。
         * 
         * @param xi
         * @param yi
         * @param value
         */
        setHeightValueAtIndex(xi: number, yi: number, value: number)
        {
            var data = this.data;
            data[xi][yi] = value;

            // Invalidate cache
            this.clearCachedConvexTrianglePillar(xi, yi, false);
            if (xi > 0)
            {
                this.clearCachedConvexTrianglePillar(xi - 1, yi, true);
                this.clearCachedConvexTrianglePillar(xi - 1, yi, false);
            }
            if (yi > 0)
            {
                this.clearCachedConvexTrianglePillar(xi, yi - 1, true);
                this.clearCachedConvexTrianglePillar(xi, yi - 1, false);
            }
            if (yi > 0 && xi > 0)
            {
                this.clearCachedConvexTrianglePillar(xi - 1, yi - 1, true);
            }
        }

        /**
         * 获取矩形数据中的最大最小值
         * 
         * @param iMinX
         * @param iMinY
         * @param iMaxX
         * @param iMaxY
         * @param result
         */
        getRectMinMax(iMinX: number, iMinY: number, iMaxX: number, iMaxY: number, result: number[])
        {
            result = result || [];

            // Get max and min of the data
            var data = this.data,
                max = this.minValue; // Set first value
            for (var i = iMinX; i <= iMaxX; i++)
            {
                for (var j = iMinY; j <= iMaxY; j++)
                {
                    var height = data[i][j];
                    if (height > max)
                    {
                        max = height;
                    }
                }
            }

            result[0] = this.minValue;
            result[1] = max;
        }

        /**
         * 获取heightfield上本地位置的索引。索引表示矩形，因此，如果地形由N x N个高度数据点组成，则矩形索引的范围为0到N-1。
         * 
         * @param x
         * @param y
         * @param result
         * @param clamp
         */
        getIndexOfPosition(x: number, y: number, result: number[], clamp: boolean)
        {
            // Get the index of the data points to test against
            var w = this.elementSize;
            var data = this.data;
            var xi = Math.floor(x / w);
            var yi = Math.floor(y / w);

            result[0] = xi;
            result[1] = yi;

            if (clamp)
            {
                // Clamp index to edges
                if (xi < 0) { xi = 0; }
                if (yi < 0) { yi = 0; }
                if (xi >= data.length - 1) { xi = data.length - 1; }
                if (yi >= data[0].length - 1) { yi = data[0].length - 1; }
            }

            // Bail out if we are out of the terrain
            if (xi < 0 || yi < 0 || xi >= data.length - 1 || yi >= data[0].length - 1)
            {
                return false;
            }

            return true;
        }

        /**
         * 获取三角形
         * 
         * @param x 
         * @param y 
         * @param edgeClamp 
         * @param a 
         * @param b 
         * @param c 
         */
        getTriangleAt(x: number, y: number, edgeClamp: boolean, a: feng3d.Vector3, b: feng3d.Vector3, c: feng3d.Vector3)
        {
            var idx: number[] = [];
            this.getIndexOfPosition(x, y, idx, edgeClamp);
            var xi = idx[0];
            var yi = idx[1];

            var data = this.data;
            if (edgeClamp)
            {
                xi = Math.min(data.length - 2, Math.max(0, xi));
                yi = Math.min(data[0].length - 2, Math.max(0, yi));
            }

            var elementSize = this.elementSize;
            var lowerDist2 = Math.pow(x / elementSize - xi, 2) + Math.pow(y / elementSize - yi, 2);
            var upperDist2 = Math.pow(x / elementSize - (xi + 1), 2) + Math.pow(y / elementSize - (yi + 1), 2);
            var upper = lowerDist2 > upperDist2;
            this.getTriangle(xi, yi, upper, a, b, c);
            return upper;
        }

        /**
         * 获取法线
         * 
         * @param x 
         * @param y 
         * @param edgeClamp 
         * @param result 
         */
        getNormalAt(x: number, y: number, edgeClamp: boolean, result: feng3d.Vector3)
        {
            var a = new feng3d.Vector3();
            var b = new feng3d.Vector3();
            var c = new feng3d.Vector3();
            var e0 = new feng3d.Vector3();
            var e1 = new feng3d.Vector3();
            this.getTriangleAt(x, y, edgeClamp, a, b, c);
            b.subTo(a, e0);
            c.subTo(a, e1);
            e0.crossTo(e1, result);
            result.normalize();
        }

        /**
         * 获取指定位置的包围盒
         * 
         * @param xi
         * @param yi
         * @param result
         */
        getAabbAtIndex(xi: number, yi: number, result: feng3d.AABB)
        {
            var data = this.data;
            var elementSize = this.elementSize;

            result.min.init(
                xi * elementSize,
                yi * elementSize,
                data[xi][yi]
            );
            result.max.init(
                (xi + 1) * elementSize,
                (yi + 1) * elementSize,
                data[xi + 1][yi + 1]
            );
        }

        /**
         * 获取指定位置高度
         * 
         * @param x
         * @param y
         * @param edgeClamp
         */
        getHeightAt(x: number, y: number, edgeClamp: boolean)
        {
            var data = this.data;

            var getHeightAt_weights = new feng3d.Vector3();

            var a = new feng3d.Vector3();
            var b = new feng3d.Vector3();
            var c = new feng3d.Vector3();
            var idx: number[] = [];

            this.getIndexOfPosition(x, y, idx, edgeClamp);
            var xi = idx[0];
            var yi = idx[1];
            if (edgeClamp)
            {
                xi = Math.min(data.length - 2, Math.max(0, xi));
                yi = Math.min(data[0].length - 2, Math.max(0, yi));
            }
            var upper = this.getTriangleAt(x, y, edgeClamp, a, b, c);
            barycentricWeights(x, y, a.x, a.y, b.x, b.y, c.x, c.y, getHeightAt_weights);

            var w = getHeightAt_weights;

            if (upper)
            {
                // Top triangle verts
                return data[xi + 1][yi + 1] * w.x + data[xi][yi + 1] * w.y + data[xi + 1][yi] * w.z;

            } else
            {
                // Top triangle verts
                return data[xi][yi] * w.x + data[xi + 1][yi] * w.y + data[xi][yi + 1] * w.z;
            }
        }

        /**
         * 获取缓冲键值
         * 
         * @param xi 
         * @param yi 
         * @param getUpperTriangle 
         */
        getCacheConvexTrianglePillarKey(xi: number, yi: number, getUpperTriangle: boolean)
        {
            return xi + '_' + yi + '_' + (getUpperTriangle ? 1 : 0);
        }

        /**
         * 获取缓冲值
         * 
         * @param xi 
         * @param yi 
         * @param getUpperTriangle 
         */
        getCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean)
        {
            return this._cachedPillars[this.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)];
        }

        /**
         * 设置缓冲值
         * 
         * @param xi 
         * @param yi 
         * @param getUpperTriangle 
         * @param convex 
         * @param offset 
         */
        setCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean, convex: ConvexPolyhedron, offset: feng3d.Vector3)
        {
            this._cachedPillars[this.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)] = {
                convex: convex,
                offset: offset
            };
        }

        /**
         * 清楚缓冲
         * 
         * @param xi 
         * @param yi 
         * @param getUpperTriangle 
         */
        clearCachedConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean)
        {
            delete this._cachedPillars[this.getCacheConvexTrianglePillarKey(xi, yi, getUpperTriangle)];
        }

        /**
         * 获取三角形
         * 
         * @param xi
         * @param yi
         * @param upper
         * @param a
         * @param b
         * @param c
         */
        getTriangle(xi: number, yi: number, upper: boolean, a: feng3d.Vector3, b: feng3d.Vector3, c: feng3d.Vector3)
        {
            var data = this.data;
            var elementSize = this.elementSize;

            if (upper)
            {

                // Top triangle verts
                a.init((xi + 1) * elementSize, (yi + 1) * elementSize, data[xi + 1][yi + 1]);
                b.init(xi * elementSize, (yi + 1) * elementSize, data[xi][yi + 1]);
                c.init((xi + 1) * elementSize, yi * elementSize, data[xi + 1][yi]);

            } else
            {
                // Top triangle verts
                a.init(xi * elementSize, yi * elementSize, data[xi][yi]);
                b.init((xi + 1) * elementSize, yi * elementSize, data[xi + 1][yi]);
                c.init(xi * elementSize, (yi + 1) * elementSize, data[xi][yi + 1]);
            }
        };

        /**
         * 在地形中以三角形凸形的形式得到一个三角形。
         * 
         * @param i
         * @param j
         * @param getUpperTriangle
         */
        getConvexTrianglePillar(xi: number, yi: number, getUpperTriangle: boolean)
        {
            var result = this.pillarConvex;
            var offsetResult = this.pillarOffset;

            if (this.cacheEnabled)
            {
                var data0 = this.getCachedConvexTrianglePillar(xi, yi, getUpperTriangle);
                if (data0)
                {
                    this.pillarConvex = data0.convex;
                    this.pillarOffset = data0.offset;
                    return;
                }

                result = new ConvexPolyhedron();
                offsetResult = new feng3d.Vector3();

                this.pillarConvex = result;
                this.pillarOffset = offsetResult;
            }

            var data = this.data;
            var elementSize = this.elementSize;
            var faces = result.faces;

            // Reuse verts if possible
            result.vertices.length = 6;
            for (var i = 0; i < 6; i++)
            {
                if (!result.vertices[i])
                {
                    result.vertices[i] = new feng3d.Vector3();
                }
            }

            // Reuse faces if possible
            faces.length = 5;
            for (var i = 0; i < 5; i++)
            {
                if (!faces[i])
                {
                    faces[i] = <any>[];
                }
            }

            var verts = result.vertices;

            var h = (Math.min(
                data[xi][yi],
                data[xi + 1][yi],
                data[xi][yi + 1],
                data[xi + 1][yi + 1]
            ) - this.minValue) / 2 + this.minValue;

            if (!getUpperTriangle)
            {
                // Center of the triangle pillar - all polygons are given relative to this one
                offsetResult.init(
                    (xi + 0.25) * elementSize, // sort of center of a triangle
                    (yi + 0.25) * elementSize,
                    h // vertical center
                );

                // Top triangle verts
                verts[0].init(
                    -0.25 * elementSize,
                    -0.25 * elementSize,
                    data[xi][yi] - h
                );
                verts[1].init(
                    0.75 * elementSize,
                    -0.25 * elementSize,
                    data[xi + 1][yi] - h
                );
                verts[2].init(
                    -0.25 * elementSize,
                    0.75 * elementSize,
                    data[xi][yi + 1] - h
                );

                // bottom triangle verts
                verts[3].init(
                    -0.25 * elementSize,
                    -0.25 * elementSize,
                    -h - 1
                );
                verts[4].init(
                    0.75 * elementSize,
                    -0.25 * elementSize,
                    -h - 1
                );
                verts[5].init(
                    -0.25 * elementSize,
                    0.75 * elementSize,
                    -h - 1
                );

                // top triangle
                faces[0][0] = 0;
                faces[0][1] = 1;
                faces[0][2] = 2;

                // bottom triangle
                faces[1][0] = 5;
                faces[1][1] = 4;
                faces[1][2] = 3;

                // -x facing quad
                faces[2][0] = 0;
                faces[2][1] = 2;
                faces[2][2] = 5;
                faces[2][3] = 3;

                // -y facing quad
                faces[3][0] = 1;
                faces[3][1] = 0;
                faces[3][2] = 3;
                faces[3][3] = 4;

                // +xy facing quad
                faces[4][0] = 4;
                faces[4][1] = 5;
                faces[4][2] = 2;
                faces[4][3] = 1;

            } else
            {

                // Center of the triangle pillar - all polygons are given relative to this one
                offsetResult.init(
                    (xi + 0.75) * elementSize, // sort of center of a triangle
                    (yi + 0.75) * elementSize,
                    h // vertical center
                );

                // Top triangle verts
                verts[0].init(
                    0.25 * elementSize,
                    0.25 * elementSize,
                    data[xi + 1][yi + 1] - h
                );
                verts[1].init(
                    -0.75 * elementSize,
                    0.25 * elementSize,
                    data[xi][yi + 1] - h
                );
                verts[2].init(
                    0.25 * elementSize,
                    -0.75 * elementSize,
                    data[xi + 1][yi] - h
                );

                // bottom triangle verts
                verts[3].init(
                    0.25 * elementSize,
                    0.25 * elementSize,
                    - h - 1
                );
                verts[4].init(
                    -0.75 * elementSize,
                    0.25 * elementSize,
                    - h - 1
                );
                verts[5].init(
                    0.25 * elementSize,
                    -0.75 * elementSize,
                    - h - 1
                );

                // Top triangle
                faces[0][0] = 0;
                faces[0][1] = 1;
                faces[0][2] = 2;

                // bottom triangle
                faces[1][0] = 5;
                faces[1][1] = 4;
                faces[1][2] = 3;

                // +x facing quad
                faces[2][0] = 2;
                faces[2][1] = 5;
                faces[2][2] = 3;
                faces[2][3] = 0;

                // +y facing quad
                faces[3][0] = 3;
                faces[3][1] = 4;
                faces[3][2] = 1;
                faces[3][3] = 0;

                // -xy facing quad
                faces[4][0] = 1;
                faces[4][1] = 4;
                faces[4][2] = 5;
                faces[4][3] = 2;
            }

            result.computeNormals();
            result.computeEdges();
            result.updateBoundingSphereRadius();

            this.setCachedConvexTrianglePillar(xi, yi, getUpperTriangle, result, offsetResult);
        };

        calculateLocalInertia(mass: number, target = new feng3d.Vector3())
        {
            target.init(0, 0, 0);
            return target;
        }

        volume()
        {
            return Number.MAX_VALUE; // The terrain is infinite
        }

        calculateWorldAABB(pos: feng3d.Vector3, quat: feng3d.Quaternion, min: feng3d.Vector3, max: feng3d.Vector3)
        {
            // TODO: do it properly
            min.init(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            max.init(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        }

        updateBoundingSphereRadius()
        {
            // Use the bounding box of the min/max values
            var data = this.data,
                s = this.elementSize;
            this.boundingSphereRadius = new feng3d.Vector3(data.length * s, data[0].length * s, Math.max(Math.abs(this.maxValue), Math.abs(this.minValue))).length;
        }

        /**
         * 设置图像的高度值。目前只支持浏览器。
         * 
         * @param image
         * @param scale
         */
        setHeightsFromImage(image: HTMLImageElement, scale: feng3d.Vector3)
        {
            var canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            var context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            var imageData = context.getImageData(0, 0, image.width, image.height);

            var matrix = this.data;
            matrix.length = 0;
            this.elementSize = Math.abs(scale.x) / imageData.width;
            for (var i = 0; i < imageData.height; i++)
            {
                var row = [];
                for (var j = 0; j < imageData.width; j++)
                {
                    var a = imageData.data[(i * imageData.height + j) * 4];
                    var b = imageData.data[(i * imageData.height + j) * 4 + 1];
                    var c = imageData.data[(i * imageData.height + j) * 4 + 2];
                    var height = (a + b + c) / 4 / 255 * scale.z;
                    if (scale.x < 0)
                    {
                        row.push(height);
                    } else
                    {
                        row.unshift(height);
                    }
                }
                if (scale.y < 0)
                {
                    matrix.unshift(row);
                } else
                {
                    matrix.push(row);
                }
            }
            this.updateMaxValue();
            this.updateMinValue();
            this.update();
        }
    }

    // from https://en.wikipedia.org/wiki/Barycentric_coordinate_system
    function barycentricWeights(x: number, y: number, ax: number, ay: number, bx: number, by: number, cx: number, cy: number, result: feng3d.Vector3)
    {
        result.x = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / ((by - cy) * (ax - cx) + (cx - bx) * (ay - cy));
        result.y = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / ((by - cy) * (ax - cx) + (cx - bx) * (ay - cy));
        result.z = 1 - result.x - result.y;
    }
}