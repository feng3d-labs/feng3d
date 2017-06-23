module feng3d
{
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    export class ObjLoader
    {
        private _objData: OBJ_OBJData;
        private _mtlData: Mtl_Mtl;
        private _completed: (object3D: GameObject) => void;
        private _url: string;
        private _material: Material;

        /**
         * 加载资源
         * @param url   路径
         */
        public load(url: string, material: Material, completed: (object3D: GameObject) => void = null)
        {
            this._completed = completed;
            this._url = url;
            this._material = material;

            var loader = new Loader();
            loader.addEventListener(LoaderEvent.COMPLETE, this.onComplete, this)
            loader.loadText(url);
        }

        private onComplete(e: LoaderEvent)
        {
            var objData = this._objData = OBJParser.parser(e.data.content);
            var mtl = objData.mtl;
            if (mtl)
            {
                var mtlRoot = this._url.substring(0, this._url.lastIndexOf("/") + 1);
                var mtlLoader = new Loader();
                mtlLoader.loadText(mtlRoot + mtl);
                mtlLoader.addEventListener(LoaderEvent.COMPLETE, function (e: LoaderEvent)
                {
                    var mtlData = this._mtlData = MtlParser.parser(e.data.content);
                    this.createObj(this._material);
                }, this);
            } else
            {
                this.createObj(this._material);
            }
        }

        private createObj(material: Material)
        {
            var object = new GameObject();
            var objData = this._objData;
            var objs = objData.objs;
            for (var i = 0; i < objs.length; i++)
            {
                var obj = objs[i];
                var object3D = this.createSubObj(obj, material);
                object.addChild(object3D);
            }
            if (this._completed)
            {
                this._completed(object);
            }
        }

        private createSubObj(obj: OBJ_OBJ, material: Material)
        {
            var object3D = new GameObject(obj.name);

            var subObjs = obj.subObjs;
            for (var i = 0; i < subObjs.length; i++)
            {
                var materialObj = this.createMaterialObj(obj, subObjs[i], material);
                object3D.addChild(materialObj);
            }
            return object3D;
        }

        private _vertices: {x: number;y: number;z: number;}[];
        private _vertexNormals :{x: number;y: number;z: number;}[];
        private _uvs:{u:number,v:number,s:number}[];
        private _realIndices:string[];
        private _vertexIndex:number;
        
        private createMaterialObj(obj: OBJ_OBJ, subObj: OBJ_SubOBJ, material: Material)
        {
            var object3D = new GameObject();
            var model = object3D.getOrCreateComponentByClass(Model);
            model.material = material || new ColorMaterial();

            this._vertices = obj.vertex;
            this._vertexNormals = obj.vn;
            this._uvs = obj.vt;

            var geometry = model.geometry = new Geometry();
            var vertices: number[] = [];
            var normals: number[] = [];
            var uvs: number[] = [];
            this._realIndices = [];
            this._vertexIndex = 0;
            var faces = subObj.faces;
            var indices: number[] = [];
            for (var i = 0; i < faces.length; i++)
            {
                var face = faces[i];
                var numVerts = face.indexIds.length - 1;
                for (var j = 1; j < numVerts; ++j)
                {
                    this.translateVertexData(face, j, vertices, uvs, indices, normals);
                    this.translateVertexData(face, 0, vertices, uvs, indices, normals);
                    this.translateVertexData(face, j + 1, vertices, uvs, indices, normals);
                }
            }
            geometry.setIndices(new Uint16Array(indices));
            geometry.setVAData(GLAttribute.a_position, new Float32Array(vertices), 3);
            geometry.setVAData(GLAttribute.a_normal, new Float32Array(normals), 3);
            geometry.setVAData(GLAttribute.a_uv, new Float32Array(uvs), 2);
            geometry.createVertexTangents();

            if (this._mtlData && this._mtlData[subObj.material])
            {
                var materialInfo = this._mtlData[subObj.material];
                var kd = materialInfo.kd;
                var colorMaterial = new ColorMaterial();
                colorMaterial.color.r = kd[0];
                colorMaterial.color.g = kd[1];
                colorMaterial.color.b = kd[2];
                model.material = colorMaterial;
            }
            return object3D;
        }

        private translateVertexData(face: OBJ_Face, vertexIndex: number, vertices: Array<number>, uvs: Array<number>, indices: Array<number>, normals: Array<number>)
        {
            var index: number;
            var vertex: {x: number;y: number;z: number;};
            var vertexNormal: {x: number;y: number;z: number;};
            var uv: {u:number,v:number,s:number};
            if (!this._realIndices[face.indexIds[vertexIndex]])
            {
                index = this._vertexIndex;
                this._realIndices[face.indexIds[vertexIndex]] = ++this._vertexIndex;
                vertex = this._vertices[face.vertexIndices[vertexIndex] - 1];
                vertices.push(vertex.x, vertex.y, vertex.z);
                if (face.normalIndices.length > 0)
                {
                    vertexNormal = this._vertexNormals[face.normalIndices[vertexIndex] - 1];
                    normals.push(vertexNormal.x, vertexNormal.y, vertexNormal.z);
                }
                if (face.uvIndices.length > 0)
                {
                    try 
                    {
                        uv = this._uvs[face.uvIndices[vertexIndex] - 1];
                        uvs.push(uv.u, uv.v);
                    }
                    catch (e)
                    {
                        switch (vertexIndex)
                        {
                            case 0:
                                uvs.push(0, 1);
                                break;
                            case 1:
                                uvs.push(.5, 0);
                                break;
                            case 2:
                                uvs.push(1, 1);
                        }
                    }
                }
            }
            else
                index = this._realIndices[face.indexIds[vertexIndex]] - 1;
            indices.push(index);
        }
    }
}