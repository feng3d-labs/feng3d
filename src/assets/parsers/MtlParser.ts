module feng3d
{

    export type Mtl_Material = {
        name: string;
        ka: number[];
        kd: number[];
        ks: number[];
        ns: number;
        ni: number;
        d: number;
        illum: number;
    };
    export type Mtl_Mtl = { [name: string]: Mtl_Material }

	/**
	 * Obj模型Mtl解析器
     * @author feng 2017-01-13
	 */
    export class MtlParser
    {

        static parser(context: string)
        {

            var mtl: Mtl_Mtl = {};
            var lines = context.split("\n").reverse();
            do
            {
                var line = lines.pop();
                parserLine(line, mtl);
            } while (line);
            return mtl;
        }
    }


    var newmtlReg = /newmtl\s+([\w.]+)/;
    var kaReg = /Ka\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
    var kdReg = /Kd\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
    var ksReg = /Ks\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
    var nsReg = /Ns\s+([\d.]+)/;
    var niReg = /Ni\s+([\d.]+)/;
    var dReg = /d\s+([\d.]+)/;
    var illumReg = /illum\s+([\d]+)/;
    var currentMaterial: Mtl_Material;

    function parserLine(line: string, mtl: Mtl_Mtl)
    {
        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;
        if (line.charAt(0) == "#")
            return;

        var result: RegExpExecArray;
        if ((result = newmtlReg.exec(line)) && result[0] == line)
        {
            currentMaterial = { name: result[1], ka: [], kd: [], ks: [], ns: 0, ni: 0, d: 0, illum: 0 };
            mtl[currentMaterial.name] = currentMaterial;
        } else if ((result = kaReg.exec(line)) && result[0] == line)
        {
            currentMaterial.ka = [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
        } else if ((result = kdReg.exec(line)) && result[0] == line)
        {
            currentMaterial.kd = [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
        } else if ((result = ksReg.exec(line)) && result[0] == line)
        {
            currentMaterial.ks = [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
        } else if ((result = nsReg.exec(line)) && result[0] == line)
        {
            currentMaterial.ns = parseFloat(result[1]);
        } else if ((result = niReg.exec(line)) && result[0] == line)
        {
            currentMaterial.ni = parseFloat(result[1]);
        } else if ((result = dReg.exec(line)) && result[0] == line)
        {
            currentMaterial.d = parseFloat(result[1]);
        } else if ((result = illumReg.exec(line)) && result[0] == line)
        {
            currentMaterial.illum = parseFloat(result[1]);
        } else
        {
            throw new Error(`无法解析${line}`);
        }
    }
}