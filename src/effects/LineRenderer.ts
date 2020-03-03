namespace feng3d
{
    /**
     * The line renderer is used to draw free-floating lines in 3D space.
     * 
     * 线渲染器用于在三维空间中绘制自由浮动的线。
     */
    @AddComponentMenu("Effects/LineRenderer")
    export class LineRenderer extends Renderable
    {
        @oav({ exclude: true })
        geometry = new SegmentGeometry();

        @oav({ exclude: true })
        material: Material;

        @oav({ exclude: true })
        castShadows = false;

        @oav({ exclude: true })
        receiveShadows = false;

        /**
         * Connect the start and end positions of the line together to form a continuous loop.
         * 
         * 将直线的起点和终点连接在一起，形成一个连续的回路。
         */
        @oav({ tooltip: "将直线的起点和终点连接在一起，形成一个连续的回路。" })
        @serialize
        loop = false;

        /**
         * 顶点列表。
         */
        @oav({ component: "OAVArray", tooltip: "顶点列表。", componentParam: { defaultItem: () => { return new Vector3(); } } })
        @serialize
        positions: Vector3[] = [];

        /**
         * 曲线宽度。
         */
        @oav({ tooltip: "曲线宽度。" })
        @serialize
        lineWidth = serialization.setValue(new MinMaxCurve(), { between0And1: true, curveMultiplier: 0.1, mode: MinMaxCurveMode.Curve });

        /**
         * 
         * 线条颜色。
         */
        @serialize
        @oav({ tooltip: "线条颜色。" })
        lineColor = serialization.setValue(new MinMaxGradient(), { mode: MinMaxGradientMode.Gradient });

        /**
         * Set this to a value greater than 0, to get rounded corners between each segment of the line.
         * 
         * 将此值设置为大于0的值，以在直线的每个线段之间获取圆角。
         */
        @serialize
        @oav({ tooltip: "将此值设置为大于0的值，以在直线的每个线段之间获取圆角。" })
        numCornerVertices = 0;

        /**
         * Set this to a value greater than 0, to get rounded corners on each end of the line.
         * 
         * 将此值设置为大于0的值，以在行的两端获得圆角。
         */
        @serialize
        @oav({ tooltip: "将此值设置为大于0的值，以在直线的每个线段之间获取圆角。" })
        numCapVertices = 0;

        /**
         * Select whether the line will face the camera, or the orientation of the Transform Component.
         * 
         * 选择线是否将面对摄像机，或转换组件的方向。
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "选择线是否将面对摄像机，或转换组件的方向。", componentParam: { enumClass: LineAlignment } })
        alignment = LineAlignment.View;

        /**
         * Choose whether the U coordinate of the line texture is tiled or stretched.
         * 
         * 选择是平铺还是拉伸线纹理的U坐标。
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "选择是平铺还是拉伸线纹理的U坐标。", componentParam: { enumClass: LineTextureMode } })
        textureMode = LineTextureMode.Stretch;

        /**
         * Apply a shadow bias to prevent self-shadowing artifacts. The specified value is the proportion of the line width at each segment.
         * 
         * 应用阴影偏差以防止自阴影伪影。指定的值是每段线宽的比例。
         */
        @serialize
        @oav({ tooltip: "应用阴影偏差以防止自阴影伪影。指定的值是每段线宽的比例。" })
        shadowBias = 0.5;

        /**
         * Configures a line to generate Normals and Tangents. With this data, Scene lighting can affect the line via Normal Maps and the Unity Standard Shader, or your own custom-built Shaders.
         * 
         * 是否自动生成灯光所需的法线与切线。
         */
        @serialize
        @oav({ tooltip: "是否自动生成灯光所需的法线与切线。" })
        generateLightingData = false;

        /**
         * If enabled, the lines are defined in world space.
         * 
         * 如果启用，则在世界空间中定义线。
         */
        @serialize
        @oav({ tooltip: "如果启用，则在世界空间中定义线。" })
        useWorldSpace = false;

        /**
         * Set the curve describing the width of the line at various points along its length.
         * 
         * 设置曲线，以描述沿线长度在各个点处的线宽。
         */
        get widthCurve()
        {
            return this.lineWidth.curve;
        }

        /**
         * Set an overall multiplier that is applied to the LineRenderer.widthCurve to get the final width of the line.
         * 
         * 设置一个应用于LineRenderer.widthCurve的总乘数，以获取线的最终宽度。
         */
        get widthMultiplier()
        {
            return this.lineWidth.curveMultiplier;
        }

        set widthMultiplier(v)
        {
            this.lineWidth.curveMultiplier = v;
        }

        /**
         * Set the color gradient describing the color of the line at various points along its length.
         * 
         * 设置颜色渐变，以描述线条沿其长度的各个点的颜色。
         */
        get colorGradient()
        {
            return this.lineColor.gradient;
        }

        /**
         * Set the color at the end of the line.
         * 
         * 设置线尾颜色。
         */
        get endColor()
        {
            var color4 = new Color4();
            var color3 = this.colorGradient.colorKeys[this.colorGradient.colorKeys.length - 1];
            var alpha = this.colorGradient.alphaKeys[this.colorGradient.alphaKeys.length - 1];
            color4.setTo(color3.color.r, color3.color.g, color3.color.b, alpha.alpha);
            return color4;
        }

        set endColor(v)
        {
            this.colorGradient.alphaKeys[this.colorGradient.alphaKeys.length - 1].alpha = v.a
            this.colorGradient.colorKeys[this.colorGradient.colorKeys.length - 1].color.setTo(v.r, v.g, v.b);
        }

        /**
         * Set the width at the end of the line.
         * 
         * 设置线尾宽度。
         */
        get endWidth()
        {
            return this.widthCurve.keys[this.widthCurve.keys.length - 1].value;
        }

        set endWidth(v)
        {
            this.widthCurve.keys[this.widthCurve.keys.length - 1].value = v;
        }

        /**
         * Set/get the number of vertices.
         * 
         * 设置/获取顶点数。
         */
        get positionCount()
        {
            return this.positions.length;
        }

        set positionCount(v)
        {
            this.positions.length = v;
        }

        /**
         * Set the color at the start of the line.
         * 
         * 设置行线头颜色。
         */
        get startColor()
        {
            var color4 = new Color4();
            var color3 = this.colorGradient.colorKeys[0];
            var alpha = this.colorGradient.alphaKeys[0];
            color4.setTo(color3.color.r, color3.color.g, color3.color.b, alpha.alpha);
            return color4;
        }

        set startColor(v)
        {
            this.colorGradient.alphaKeys[0].alpha = v.a
            this.colorGradient.colorKeys[0].color.setTo(v.r, v.g, v.b);
        }

        /**
         * Set the width at the start of the line.
         * 
         * 设置线头宽度
         */
        get startWidth()
        {
            return this.widthCurve.keys[0].value * this.widthMultiplier;
        }

        set startWidth(v)
        {
            this.widthCurve.keys[0].value = v / this.widthMultiplier;
        }

        /**
         * Creates a snapshot of LineRenderer and stores it in mesh.
         * 
         * 创建LineRenderer的快照并将其存储在网格中。
         */
        BakeMesh

        /**
         * Get the position of a vertex in the line.
         * 
         * 获取直线在顶点的位置。
         */
        GetPosition

        /**
         * Get the positions of all vertices in the line.
         * 
         * 获取行中所有顶点的位置。
         */
        GetPositions

        /**
         * Set the position of a vertex in the line.
         * 
         * 设置顶点在直线中的位置。
         */
        SetPosition

        /**
         * Set the positions of all vertices in the line.
         * 
         * 设置线中所有顶点的位置。
         */
        SetPositions

        /**
         * Generates a simplified version of the original line by removing points that fall within the specified tolerance.
         * 
         * 通过删除落在指定公差范围内的点，生成原始线的简化版本。
         */
        Simplify
    }
}