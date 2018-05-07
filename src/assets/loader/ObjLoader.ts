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
        load: load,
        parse: parse,
    }
    /**
     * 加载资源
     * @param url   路径
     */
    function load(url: string, completed?: (gameObject: GameObject) => void)
    {
        Loader.loadText(url, (content: string) =>
        {
            var material = materialFactory.create("standard")
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

    function parse(content: string, completed?: (gameObject: GameObject) => void)
    {
        var material = materialFactory.create("standard")
        var objData = OBJParser.parser(content);
        createObj(objData, material, null, completed);
    }

    function createObj(objData: OBJ_OBJData, material: Material, mtlData: Mtl_Mtl | null, completed?: (gameObject: GameObject) => void)
    {
        var object = GameObject.create();
        var objs = objData.objs;
        for (var i = 0; i < objs.length; i++)
        {
            var obj = objs[i];
            var gameObject = createSubObj(objData, obj, material, mtlData);
            object.addChild(gameObject);
        }
        completed && completed(object);
    }

    function createSubObj(objData: OBJ_OBJData, obj: OBJ_OBJ, material: Material, mtlData: Mtl_Mtl | null)
    {
        var gameObject = GameObject.create(obj.name);

        var subObjs = obj.subObjs;
        for (var i = 0; i < subObjs.length; i++)
        {
            var materialObj = createMaterialObj(objData, subObjs[i], material, mtlData);
            gameObject.addChild(materialObj);
        }
        return gameObject;
    }

    var _realIndices: string[];
    var _vertexIndex: number;

    function createMaterialObj(obj: OBJ_OBJData, subObj: OBJ_SubOBJ, material: Material, mtlData: Mtl_Mtl | null)
    {
        var gameObject = GameObject.create();
        var model = gameObject.addComponent(MeshRenderer);
        model.material = material || materialFactory.create("standard");
        model.material.renderParams.cullFace = CullFace.FRONT;

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

        if (mtlData && subObj.material && mtlData[subObj.material])
        {
            var materialInfo = mtlData[subObj.material];
            var kd = materialInfo.kd;
            var standardMaterial = materialFactory.create("standard");
            var materialInfo = mtlData[subObj.material];
            var kd = materialInfo.kd;
            standardMaterial.uniforms.u_diffuse = new Color4(kd[0], kd[1], kd[2]);
            model.material = standardMaterial;
        }
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