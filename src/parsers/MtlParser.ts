module feng3d {

    type Material = {};
    type Mtl = { materials: Material[] }

	/**
	 * Obj模型Mtl解析器
     * @author feng 2017-01-13
	 */
    export class MtlParser {

        newmtlReg = /newmtl\s+([\w.]+)/;
        kaReg = /Ka\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;

        parser(context: string) {

            var mtl: Mtl = { materials: [] };
            var lines = context.split("\n").reverse();
            do {
                var line = lines.pop();
                this.parserLine(line, mtl);
            } while (line);
            return mtl;
        }

        private parserLine(line: string, mtl: Mtl) {
            if (!line)
                return;
            line = line.trim();
            if (!line.length)
                return;
            if (line.charAt(0) == "#")
                return;

            var result: RegExpExecArray;
            if ((result = this.newmtlReg.exec(line)) && result[0] == line) {
                currentMaterial = { name: result[1] };
                mtl.materials.push(currentMaterial);
            } else {
                throw new Error(`无法解析${line}`);
            }
        }

    }
    var currentMaterial: Material;
}