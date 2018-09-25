namespace feng3d
{

	/**
	 * OBJ模型解析器
	 */
    export var objParser: OBJParser;

	/**
	 * OBJ模型解析器
	 */
    export class OBJParser
    {
        /**
         * 解析
         * @param context 
         */
        parser(context: string)
        {
            currentObj = null;
            currentSubObj = null;
            //
            var objData: OBJ_OBJData = { mtl: null, objs: [], vertex: [], vn: [], vt: [] };
            var lines = context.split("\n").reverse();
            do
            {
                var line = lines.pop();
                line && parserLine(line, objData);
            } while (lines.length > 0);
            return objData;
        }
    }
    objParser = new OBJParser();

    /**
     * 面数据
     */
    export type OBJ_Face = {
        /** 顶点索引 */
        vertexIndices: string[];
        /** uv索引 */
        uvIndices?: string[];
        /** 法线索引 */
        normalIndices?: string[];
        /** 索引数据 */
        indexIds: string[];
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
        /** 子对象 */
        subObjs: OBJ_SubOBJ[];
    };

    /**
     * Obj模型数据
     */
    export type OBJ_OBJData = {
        /** 
         * 模型名称
         */
        name?: string;
        /** mtl文件路径 */
        mtl: string | null;
        /** 顶点坐标 */
        vertex: { x: number, y: number, z: number }[];
        /** 顶点法线 */
        vn: { x: number, y: number, z: number }[];
        /** 顶点uv */
        vt: { u: number, v: number, s: number }[];
        /** 模型列表 */
        objs: OBJ_OBJ[];
    }

    /** mtl正则 */
    var mtlReg = /mtllib\s+([\w\s]+\.mtl)/;
    /** 对象名称正则 */
    var objReg = /o\s+([\w\.]+)/;
    /** 顶点坐标正则 */
    var vertexReg = /v\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
    /** 顶点法线正则 */
    var vnReg = /vn\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
    /** 顶点uv正则 */
    var vtReg = /vt\s+([-\d.]+)\s+([-\d.]+)(\s+([-\d.]+))?/;
    /** 使用材质正则 */
    var usemtlReg = /usemtl\s+([\w.]+)/;
    /** 面正则 vertex */
    var faceV3Reg = /f\s+(\d+)\s+(\d+)\s+(\d+)/;
    /** 面正则 vertex */
    var faceVReg = /f\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;
    /** 面正则 vertex/uv/normal */
    var faceVUNReg = /f\s+((\d+)\/(\d+)\/(\d+))\s+((\d+)\/(\d+)\/(\d+))\s+((\d+)\/(\d+)\/(\d+))/;
    /** 面正则 vertex//normal */
    var faceVN3Reg = /f\s+(\d+)\/\/(\d+)\s+(\d+)\/\/(\d+)\s+(\d+)\/\/(\d+)/;
    // g
    var gReg = /g\s+([\(\)\w]+)?/;

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

        var result: RegExpExecArray | null;
        if ((result = mtlReg.exec(line)) && result[0] == line)
        {
            objData.mtl = result[1];
        } else if ((result = objReg.exec(line)) && result[0] == line)
        {
            currentObj = { name: result[1], subObjs: [] };
            objData.objs.push(currentObj);
        } else if ((result = vertexReg.exec(line)) && result[0] == line)
        {
            if (currentObj == null)
            {
                currentObj = { name: "", subObjs: [] };
                objData.objs.push(currentObj);
            }
            objData.vertex.push({ x: parseFloat(result[1]), y: parseFloat(result[2]), z: parseFloat(result[3]) });
        } else if ((result = vnReg.exec(line)) && result[0] == line)
        {
            objData.vn.push({ x: parseFloat(result[1]), y: parseFloat(result[2]), z: parseFloat(result[3]) });
        } else if ((result = vtReg.exec(line)) && result[0] == line)
        {
            objData.vt.push({ u: parseFloat(result[1]), v: 1 - parseFloat(result[2]), s: parseFloat(result[4]) });
        } else if ((result = gReg.exec(line)) && result[0] == line)
        {
            currentSubObj = { faces: [] };
            currentObj.subObjs.push(currentSubObj);
            currentSubObj.g = result[1];
        } else if ((result = sReg.exec(line)) && result[0] == line)
        {

        } else if ((result = usemtlReg.exec(line)) && result[0] == line)
        {
            currentSubObj = { faces: [] };
            currentObj.subObjs.push(currentSubObj);
            currentSubObj.material = result[1];
        } else if ((result = faceV3Reg.exec(line)) && result[0] == line)
        {
            currentSubObj.faces.push({
                indexIds: [result[2], result[1], result[3]],
                vertexIndices: [result[2], result[1], result[3]]
            });
        } else if ((result = faceVN3Reg.exec(line)) && result[0] == line)
        {
            currentSubObj.faces.push({
                indexIds: [result[3], result[1], result[5]],
                vertexIndices: [result[3], result[1], result[5]],
                normalIndices: [result[4], result[2], result[6]],
            });
        } else if ((result = faceVReg.exec(line)) && result[0] == line)
        {
            currentSubObj.faces.push({
                indexIds: [result[2], result[1], result[3]],
                vertexIndices: [result[2], result[1], result[3]]
            });
            currentSubObj.faces.push({
                indexIds: [result[4], result[3], result[1]],
                vertexIndices: [result[4], result[3], result[1]]
            });
        } else if ((result = faceVUNReg.exec(line)) && result[0] == line)
        {
            currentSubObj.faces.push({
                indexIds: [result[5], result[1], result[9]],
                vertexIndices: [result[6], result[2], result[10]],
                uvIndices: [result[7], result[3], result[11]],
                normalIndices: [result[8], result[4], result[12]]
            });
        } else
        {
            throw new Error(`无法解析${line}`);
        }
    }
}