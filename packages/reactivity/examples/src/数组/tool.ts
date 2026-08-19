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
    let { code, feng3dResult, vueResult } = result;

    code = unescapeUnicode(code);

    // 页面元素可能缺失（如脱离宿主页运行），统一判空跳过
    const setText = (id: string, text: string) =>
    {
        const element = document.getElementById(id);

        if (element) element.textContent = text;
    };

    setText('test-code', code);
    setText('feng3d-time', feng3dResult.time);
    setText('feng3d-values', feng3dResult.values.join(', '));
    setText('vue-time', vueResult.time);
    setText('vue-values', vueResult.values.join(', '));
}

function unescapeUnicode(escapedStr)
{
    const regex = /\\u([0-9a-fA-F]{4})/g;

    return escapedStr.replace(regex, (match, p1) =>
    {
        return String.fromCodePoint(parseInt(p1, 16));
    });
}
