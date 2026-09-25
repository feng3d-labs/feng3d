// 编辑器只读桥接 CLI（P1）—— 不经 MCP 直接验证桥接通道
//
// 用法：
//   node scripts/editor-bridge-cli.mjs scene.summary
//   node scripts/editor-bridge-cli.mjs scene.list --params "{\"path\":\"/Untitled\",\"depth\":1}"
//   node scripts/editor-bridge-cli.mjs scene.get --params "{\"objectId\":\"/Untitled/Cube\"}"
//   node scripts/editor-bridge-cli.mjs <method> --url http://127.0.0.1:3001
//
// 前提：编辑器 dev server 正在运行，且页面已在浏览器中打开（桥接前端跑在页面里）。
const PREFIX = '/__editor-bridge';

const args = process.argv.slice(2);
const method = args.find((a) => !a.startsWith('--'));

if (!method)
{
    console.error('用法: node scripts/editor-bridge-cli.mjs <method> [--url <base>] [--params <json>]');
    process.exit(2);
}

const readOption = (name, fallback) =>
{
    const index = args.indexOf(name);

    return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const base = readOption('--url', 'http://127.0.0.1:3001');
// 也支持环境变量 BRIDGE_PARAMS：PowerShell 向 node 传参时会剥离内层双引号，
// `--params '{"a":1}'` 常被破坏成 `{a:1}`，用环境变量最稳。
const paramsText = readOption('--params', process.env.BRIDGE_PARAMS ?? '{}');
let params;
try
{
    params = JSON.parse(paramsText);
}
catch (e)
{
    console.error(`--params 不是合法 JSON: ${e.message}`);
    process.exit(2);
}

const callResponse = await fetch(`${base}${PREFIX}/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params }),
});

if (!callResponse.ok)
{
    console.error(`调用失败: HTTP ${callResponse.status} ${await callResponse.text()}`);
    process.exit(1);
}

const { id } = await callResponse.json();
const resultResponse = await fetch(`${base}${PREFIX}/result?id=${encodeURIComponent(id)}`);
const payload = await resultResponse.json();

if (payload.ok === false)
{
    console.error(`执行失败: ${payload.error}`);
    process.exit(1);
}

console.log(JSON.stringify(payload.result, null, 2));
