// 更新结果展示
export function updateResults(result: {
    code: string;
    feng3dResult: {
        time: any;
        values: any[];
    };
    vueResult: {
        time: any;
        values: any[];
    };
    结论?: { feng3d: string, vue: string };
})
{
    let { code, feng3dResult, vueResult, 结论 } = result;

    code = unescapeUnicode(code);

    const testCodeElement = document.getElementById('test-code');

    testCodeElement.textContent = code;

    document.getElementById('feng3d-time').textContent = feng3dResult.time;
    document.getElementById('feng3d-values').textContent = feng3dResult.values.join(', ');

    document.getElementById('vue-time').textContent = vueResult.time;
    document.getElementById('vue-values').textContent = vueResult.values.join(', ');
    document.getElementById('feng3d-分析').textContent = 结论?.feng3d ?? '未提供';
    document.getElementById('vue-分析').textContent = 结论?.vue ?? '未提供';
}

function unescapeUnicode(escapedStr)
{
    const regex = /\\u([0-9a-fA-F]{4})/g;

    return escapedStr.replace(regex, (match, p1) =>
    {
        return String.fromCodePoint(parseInt(p1, 16));
    });
}
