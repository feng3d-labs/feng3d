namespace feng3d
{
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    export var ObjLoader = {
        /**
         * 加载Obj模型
         */
        load: load
    }

    /**
     * 加载资源
     * @param url   路径
     */
    function load(url: string, material: Material, completed: (object3D: GameObject) => void = null)
    {
        Loader.loadText(url, (content: string) =>
        {
            var objData = OBJParser.parser(content);
            var mtl = objData.mtl;
            if (mtl)
            {
                var mtlRoot = url.substring(0, url.lastIndexOf("/") + 1);
                Loader.loadText(mtlRoot + mtl, (content) =>
                {
                    var mtlData = MtlParser.parser(content);
                    createObj(objData, material, mtlData, completed);
                });
            } else
            {
                createObj(objData, material, null, completed);
            }
        });
    }

    function createObj(objData: OBJ_OBJData, material: Material, mtlData: Mtl_Mtl, completed: (object3D: GameObject) => void)
    {
        var object = GameObject.create();
        var objs = objData.objs;
        for (var i = 0; i < objs.length; i++)
        {
            var obj = objs[i];
            var object3D = createSubObj(obj, material, mtlData);
            object.transform.addChild(object3D.transform);
        }
        completed && completed(object);
    }

    function createSubObj(obj: OBJ_OBJ, material: Material, mtlData: Mtl_Mtl)
    {
        var object3D = GameObject.create(obj.name);

        var subObjs = obj.subObjs;
        for (var i = 0; i < subObjs.length; i++)
        {
            var materialObj = createMaterialObj(obj, subObjs[i], material, mtlData);
            object3D.transform.addChild(materialObj.transform);
        }
        return object3D;
    }

    var _realIndices: string[];
    var _vertexIndex: number;

    function createMaterialObj(obj: OBJ_OBJ, subObj: OBJ_SubOBJ, material: Material, mtlData: Mtl_Mtl)
    {
        var gameObject = GameObject.create();
        var model = gameObject.addComponent(MeshRenderer);
        model.material = material || new ColorMaterial();

        var meshFilter = gameObject.addComponent(MeshFilter);
        var geometry = meshFilter.mesh = new Geometry();
        var vertices: number[] = [];
        var normals: number[] = [];
        var uvs: number[] = [];
        _realIndices = [];
        _vertexIndex = 0;
        var faces = subObj.faces;
        var indices: number[] = [];
        for (var i = 0; i < faces.length; i++)
        {
            var face = faces[i];
            var numVerts = face.indexIds.length - 1;
            for (var j = 1; j < numVerts; ++j)
            {
                translateVertexData(face, j, vertices, uvs, indices, normals, obj);
                translateVertexData(face, 0, vertices, uvs, indices, normals, obj);
                translateVertexData(face, j + 1, vertices, uvs, indices, normals, obj);
            }
        }
        geometry.setIndices(new Uint16Array(indices));
        geometry.setVAData("a_position", new Float32Array(vertices), 3);
        geometry.setVAData("a_normal", new Float32Array(normals), 3);
        geometry.setVAData("a_uv", new Float32Array(uvs), 2);
        geometry.createVertexTangents();

        if (mtlData && mtlData[subObj.material])
        {
            var materialInfo = mtlData[subObj.material];
            var kd = materialInfo.kd;
            var colorMaterial = new ColorMaterial();
            colorMaterial.color.r = kd[0];
            colorMaterial.color.g = kd[1];
            colorMaterial.color.b = kd[2];
            model.material = colorMaterial;
        }
        return gameObject;

        function translateVertexData(face: OBJ_Face, vertexIndex: number, vertices: Array<number>, uvs: Array<number>, indices: Array<number>, normals: Array<number>, obj: OBJ_OBJ)
        {
            var index: number;
            var vertex: { x: number; y: number; z: number; };
            var vertexNormal: { x: number; y: number; z: number; };
            var uv: { u: number, v: number, s: number };
            if (!_realIndices[face.indexIds[vertexIndex]])
            {
                index = _vertexIndex;
                _realIndices[face.indexIds[vertexIndex]] = ++_vertexIndex;
                vertex = obj.vertex[face.vertexIndices[vertexIndex] - 1];
                vertices.push(vertex.x, vertex.y, vertex.z);
                if (face.normalIndices.length > 0)
                {
                    vertexNormal = obj.vn[face.normalIndices[vertexIndex] - 1];
                    normals.push(vertexNormal.x, vertexNormal.y, vertexNormal.z);
                }
                if (face.uvIndices.length > 0)
                {
                    try 
                    {
                        uv = obj.vt[face.uvIndices[vertexIndex] - 1];
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
                index = _realIndices[face.indexIds[vertexIndex]] - 1;
            indices.push(index);
        }
    }

}