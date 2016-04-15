declare module feng3d {
    /**
     * 测试基础渲染函数
     * @author feng 2014-10-24
     */
    class BaseShaderTest extends TestBase {
        private context;
        private stage3D;
        private baseGem;
        private baseMesh;
        private CONTEXT_WIDTH;
        private CONTEXT_HEIGHT;
        private DEGS_TO_RADIANS;
        private canvas;
        private gl;
        constructor();
        /**
         * Global initialise function
         */
        init(): void;
        private contextReady();
        private renderFrame(e);
        makeViewMatrix(): Matrix3D;
    }
}
declare module feng3d {
    /**
     * 通过顶点颜色渲染地形
     * @author feng 2014-10-24
     */
    class ColorMapTest extends TestBase {
        private context;
        private stage3D;
        private baseGem;
        private baseMesh;
        private CONTEXT_WIDTH;
        private CONTEXT_HEIGHT;
        constructor();
        /**
         * Global initialise function
         */
        init(): void;
        private contextReady(event);
        private renderFrame(e);
    }
}
declare module feng3d {
    /**
     * 通过顶点颜色渲染地形
     * @author feng 2014-10-24
     */
    class ColorTerrainShaderTest extends TestBase {
        private context;
        private stage3D;
        private baseGem;
        private baseMesh;
        private CONTEXT_WIDTH;
        private CONTEXT_HEIGHT;
        private DEGS_TO_RADIANS;
        private grassPath;
        private rockPath;
        private beachPath;
        constructor();
        /**
         * Global initialise function
         */
        init(): void;
        private contextReady(event);
        private renderFrame(e);
        makeViewMatrix(): Matrix3D;
    }
}
declare module feng3d {
    /**
     * 测试3D环境缓存类
     * @author feng 2015-7-1
     */
    class Context3DCacheDebugText extends TestBase {
        private debugTextPath;
        private stage3D;
        private renderContext;
        private context3DCache;
        constructor();
        /**
         * Global initialise function
         */
        init(): void;
        private contextCreated(event);
        private setupScene();
        private render(event);
        private contextCreationError(error);
    }
}
declare module feng3d {
    /**
     *
     * @author cdz 2015-11-5
     */
    class TextureTest extends TestBase {
        private context;
        private stage3D;
        private baseGem;
        private baseMesh;
        private CONTEXT_WIDTH;
        private CONTEXT_HEIGHT;
        private DEGS_TO_RADIANS;
        private texturePath;
        constructor();
        /**
         * Global initialise function
         */
        init(): void;
        private contextReady(event);
        private renderFrame(e);
        makeViewMatrix(): Matrix3D;
    }
}
declare module feng3d {
    /**
     *
     * @author feng 2014-10-27
     */
    class BaseGeometry extends VertexBufferOwner {
        protected _indices: number[];
        protected numIndices: number;
        constructor();
        protected initBuffers(): void;
        protected updateIndexBuffer(indexBuffer: IndexBuffer): void;
        setGeometry(positionData: number[], colorData: number[], indexData: number[]): void;
    }
}
declare module feng3d {
    /**
     *
     * @author feng 2015-5-14
     */
    class ColorTerrainGeometry extends BaseGeometry {
        constructor();
        vertexUVData: number[];
        protected initBuffers(): void;
    }
}
declare module feng3d {
    /**
     *
     * @author feng 2015-5-14
     */
    class TextureTestGeometry extends BaseGeometry {
        constructor();
        vertexUVData: number[];
        protected initBuffers(): void;
    }
}
declare module feng3d {
    /**
     * 基础材质
     * @author feng 2014-10-27
     */
    class BaseMaterial extends Context3DBufferOwner {
        protected modelViewProjection: Matrix3D;
        private mre;
        private _shaderParams;
        shaderParams: ShaderParams;
        constructor();
        protected initBuffers(): void;
        render(viewMatrix: Matrix3D): void;
        /**
         * 更新投影矩阵
         */
        protected updateProjectionBuffer(projectionBuffer: VCMatrixBuffer): void;
        /**
         * 更新（编译）渲染程序
         */
        protected updateProgramBuffer(programBuffer: ProgramBuffer): void;
    }
}
declare module feng3d {
    /**
     * 颜色映射材质
     * @author feng 2015-5-14
     */
    class ColorMapMaterial extends BaseMaterial {
        /**
         * 通用数据
         */
        protected commonsData: number[];
        /**
         * 创建一个颜色映射材质
         */
        constructor();
        /**
         * @inheritDoc
         */
        protected initBuffers(): void;
        /**
         * 更新通用数据
         */
        protected updateCommonsDataBuffer(vcVectorBuffer: VCVectorBuffer): void;
        /**
         * @inheritDoc
         */
        protected updateProgramBuffer(programBuffer: ProgramBuffer): void;
    }
}
declare module feng3d {
    /**
     * 颜色地形材质
     * @author feng 2015-5-14
     */
    class ColorTerrainMaterial extends BaseMaterial {
        private _splats;
        constructor(splats: any);
        protected initBuffers(): void;
        private updateTerrainTextureBuffer(terrainTextureBufferArr);
        protected updateProgramBuffer(programBuffer: ProgramBuffer): void;
    }
}
declare module feng3d {
    /**
     * 颜色地形材质
     * @author feng 2015-5-14
     */
    class TextureTestMaterial extends BaseMaterial {
        private _texture;
        constructor(texture: TextureProxyBase);
        protected initBuffers(): void;
        private updateTextureBuffer(textureBuffer);
        protected updateProgramBuffer(programBuffer: ProgramBuffer): void;
    }
}
declare module feng3d {
    /**
     *
     * @author feng 2014-10-27
     */
    class BaseMesh {
        private _context3dCache;
        private _geometry;
        private _material;
        constructor(geometry?: BaseGeometry, material?: BaseMaterial);
        render(context3D: Context3D, viewMatrix: Matrix3D): void;
        protected context3dCache: Context3DCache;
    }
}
declare module feng3d {
    class PerspectiveMatrix3D extends Matrix3D {
        constructor(v?: number[]);
        lookAtLH(eye: Vector3D, at: Vector3D, up: Vector3D): void;
        lookAtRH(eye: Vector3D, at: Vector3D, up: Vector3D): void;
        perspectiveLH(width: number, height: number, zNear: number, zFar: number): void;
        perspectiveRH(width: number, height: number, zNear: number, zFar: number): void;
        perspectiveFieldOfViewLH(fieldOfViewY: number, aspectRatio: number, zNear: number, zFar: number): void;
        perspectiveFieldOfViewRH(fieldOfViewY: number, aspectRatio: number, zNear: number, zFar: number): void;
        perspectiveOffCenterLH(left: number, right: number, bottom: number, top: number, zNear: number, zFar: number): void;
        perspectiveOffCenterRH(left: number, right: number, bottom: number, top: number, zNear: number, zFar: number): void;
        orthoLH(width: number, height: number, zNear: number, zFar: number): void;
        orthoRH(width: number, height: number, zNear: number, zFar: number): void;
        orthoOffCenterLH(left: number, right: number, bottom: number, top: number, zNear: number, zFar: number): void;
        orthoOffCenterRH(left: number, right: number, bottom: number, top: number, zNear: number, zFar: number): void;
        private _x;
        private _y;
        private _z;
        private _w;
        private _crossProductTo(a, b);
    }
}
declare module feng3d {
    /**
     *
     * @author cdz 2015-11-9
     */
    class F_TextureTest extends FagalMethod {
        constructor();
        runFunc(): void;
    }
}
declare module feng3d {
    /**
     * 基础片段渲染
     * @author feng 2014-10-24
     */
    class F_baseShader extends FagalMethod {
        constructor();
        runFunc(): void;
    }
}
declare module feng3d {
    /**
     * 输出颜色贴图
     * @author feng 2014-10-24
     */
    class F_colorMap extends FagalMethod {
        constructor();
        runFunc(): void;
    }
}
declare module feng3d {
    /**
     * 基础片段渲染
     * @author feng 2014-10-24
     */
    class F_colorTerrain extends FagalMethod {
        constructor();
        runFunc(): void;
    }
}
declare module feng3d {
    /**
     *
     * @author cdz 2015-11-9
     */
    class V_TextureTest extends FagalMethod {
        constructor();
        runFunc(): void;
    }
}
declare module feng3d {
    /**
     * 基础顶点渲染
     * @author feng 2014-10-24
     */
    class V_baseShader extends FagalMethod {
        constructor();
        runFunc(): void;
    }
}
declare module feng3d {
    /**
     * 输出颜色贴图
     * @author feng 2014-10-24
     */
    class V_colorMap extends FagalMethod {
        constructor();
        runFunc(): void;
    }
}
declare module feng3d {
    /**
     * 顶点颜色渲染地形 顶点渲染
     * @author feng 2014-10-24
     */
    class V_colorTerrain extends FagalMethod {
        constructor();
        runFunc(): void;
    }
}
