module feng3d
{

    /**
     * 面数据
     */
    export type OBJ_Face = {
        /** 顶点索引 */
        vertexIndices: number[];
        /** uv索引 */
        uvIndices?: number[];
        /** 法线索引 */
        normalIndices?: number[];
    };

    /**
     * 子对象
     */
    export type OBJ_SubOBJ = {
        /** 材质名称 */
        material?: string;
        /**  */
        g?: string,
        /** 面列表 */
        faces: OBJ_Face[];
    };

    /**
     * 对象
     */
    export type OBJ_OBJ = {
        //模型名称
        name: string;
        /** 顶点坐标 */
        vertex: number[];
        /** 顶点法线 */
        vn: number[];
        /** 顶点uv */
        vt: number[];
        /** 子对象 */
        subObjs: OBJ_SubOBJ[];
    };

    /**
     * Obj模型数据
     */
    export type OBJ_OBJData = {
        /** mtl文件路径 */
        mtl: string;
        /** 模型列表 */
        objs: OBJ_OBJ[];
    }

	/**
	 * Obj模型解析器
     * @author feng 2017-01-13
	 */
    export class OBJParser
    {

        static parser(context: string)
        {

            var objData: OBJ_OBJData = { mtl: null, objs: [] };
            var lines = context.split("\n").reverse();
            do
            {
                var line = lines.pop();
                parserLine(line, objData);
            } while (line);
            currentObj = null;
            currentSubObj = null;
            return objData;
        }


    }

    /** mtl正则 */
    var mtlReg = /mtllib\s+([\w.]+)/;
    /** 对象名称正则 */
    var objReg = /o\s+([\w]+)/;
    /** 顶点坐标正则 */
    var vertexReg = /v\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
    /** 顶点法线正则 */
    var vnReg = /vn\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
    /** 顶点uv正则 */
    var vtReg = /vt\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
    /** 使用材质正则 */
    var usemtlReg = /usemtl\s+([\w.]+)/;
    /** 面正则 vertex */
    var faceVReg = /f\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;
    /** 面正则 vertex/uv/normal */
    var faceVUNReg = /f\s+(\d+)\/(\d+)\/(\d+)\s+(\d+)\/(\d+)\/(\d+)\s+(\d+)\/(\d+)\/(\d+)/;


    var gReg = /g\s+(\w+)/;
    var sReg = /s\s+(\w+)/;

    //
    var currentObj: OBJ_OBJ;
    var currentSubObj: OBJ_SubOBJ;

    function parserLine(line: string, objData: OBJ_OBJData)
    {
        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;
        if (line.charAt(0) == "#")
            return;

        var result: RegExpExecArray;
        if ((result = mtlReg.exec(line)) && result[0] == line)
        {
            objData.mtl = result[1];
        } else if ((result = objReg.exec(line)) && result[0] == line)
        {
            currentObj = { name: result[1], vertex: [], subObjs: [], vn: [], vt: [] };
            objData.objs.push(currentObj);
        } else if ((result = vertexReg.exec(line)) && result[0] == line)
        {
            if (currentObj == null)
            {
                currentObj = { name: "", vertex: [], subObjs: [], vn: [], vt: [] };
                objData.objs.push(currentObj);
            }
            currentObj.vertex.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
        } else if ((result = vnReg.exec(line)) && result[0] == line)
        {
            currentObj.vn.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
        } else if ((result = vtReg.exec(line)) && result[0] == line)
        {
            currentObj.vt.push(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]));
        } else if ((result = gReg.exec(line)) && result[0] == line)
        {
            if (currentSubObj == null)
            {
                currentSubObj = { faces: [] };
                currentObj.subObjs.push(currentSubObj);
            }
            currentSubObj.g = result[1];
        } else if ((result = sReg.exec(line)) && result[0] == line)
        {

        } else if ((result = usemtlReg.exec(line)) && result[0] == line)
        {
            currentSubObj = { faces: [] };
            currentObj.subObjs.push(currentSubObj);
            currentSubObj.material = result[1];
        } else if ((result = faceVReg.exec(line)) && result[0] == line)
        {
            currentSubObj.faces.push({
                vertexIndices: [parseInt(result[1]), parseInt(result[2]), parseInt(result[3]), parseInt(result[4])]
            });
        } else if ((result = faceVUNReg.exec(line)) && result[0] == line)
        {
            currentSubObj.faces.push({
                vertexIndices: [parseInt(result[1]), parseInt(result[4]), parseInt(result[7])],
                uvIndices: [parseInt(result[2]), parseInt(result[5]), parseInt(result[8])],
                normalIndices: [parseInt(result[3]), parseInt(result[6]), parseInt(result[9])]
            });
        } else
        {
            throw new Error(`无法解析${line}`);
        }
    }
}