const fs = require('fs');
const glob = require('fast-glob');

main();

async function main()
{
    // 清理生成的ts文件
    const deleteFiles = await glob('**/*glsl.ts');
    deleteFiles.forEach((v) =>
    {
        fs.unlinkSync(v);
    });

    // 重新生成ts文件
    const files = await glob('**/*.glsl');
    files.forEach((f) =>
    {
        const content = fs.readFileSync(f, 'utf8');
        f = f.replace(/\./g, '_');
        fs.writeFileSync(`${f}.ts`, `export default \`${content}\`;\n`);
    });
}
