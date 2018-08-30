namespace feng3d
{
    /**
     * Obj模型加载类
     */
    export var objLoader: ObjLoader;

    /**
     * Obj模型加载类
     */
    export class ObjLoader
    {
        /**
         * 加载资源
         * @param url   路径
         */
        load(url: string, completed?: (gameObject: GameObject) => void)
        {
            var root = url.substring(0, url.lastIndexOf("/") + 1);

            assets.readFileAsString(url, (err, content) =>
            {
                var objData = objParser.parser(content);
                var mtl = objData.mtl;
                if (mtl)
                {
                    mtlLoader.load(root + mtl, (err, materials) =>
                    {
                        createObj(objData, materials, completed);
                    });
                } else
                {
                    createObj(objData, null, completed);
                }
            });
        }
    }

    objLoader = new ObjLoader();

    function createObj(objData: OBJ_OBJData, materials: { [name: string]: Material; }, completed?: (gameObject: GameObject) => void)
    {
        var object = new GameObject();
        var objs = objData.objs;
        for (var i = 0; i < objs.length; i++)
        {
            var obj = objs[i];
            var gameObject = createSubObj(objData, obj, materials);
            object.addChild(gameObject);
        }
        completed && completed(object);
    }

    function createSubObj(objData: OBJ_OBJData, obj: OBJ_OBJ, materials: { [name: string]: Material; })
    {
        var gameObject = new GameObject().value({ name: obj.name });

        var subObjs = obj.subObjs;
        for (var i = 0; i < subObjs.length; i++)
        {
            var materialObj = createMaterialObj(objData, subObjs[i], materials);
            gameObject.addChild(materialObj);
        }
        return gameObject;
    }

    var _realIndices: string[];
    var _vertexIndex: number;

    function createMaterialObj(obj: OBJ_OBJData, subObj: OBJ_SubOBJ, materials: { [name: string]: Material; })
    {
        var gameObject = new GameObject();
        var model = gameObject.addComponent(Model);
        if (materials && materials[subObj.material])
            model.material = materials[subObj.material];

        var geometry = model.geometry = new CustomGeometry();
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
        geometry.indices = indices;
        geometry.setVAData("a_position", vertices, 3);

        if (normals.length > 0)
            geometry.setVAData("a_normal", normals, 3);

        if (uvs.length > 0)
            geometry.setVAData("a_uv", uvs, 2);

        return gameObject;

        function translateVertexData(face: OBJ_Face, vertexIndex: number, vertices: Array<number>, uvs: Array<number>, indices: Array<number>, normals: Array<number>, obj: OBJ_OBJData)
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
                if (face.normalIndices && face.normalIndices.length > 0)
                {
                    vertexNormal = obj.vn[face.normalIndices[vertexIndex] - 1];
                    normals.push(vertexNormal.x, vertexNormal.y, vertexNormal.z);
                }
                if (face.uvIndices && face.uvIndices.length > 0)
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