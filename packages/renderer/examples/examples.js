window.onload = function ()
{
    const type = GetQueryString('type');

    const script = document.createElement('script');
    script.type = 'module';
    script.src = `src/${type}.ts`;
    document.body.appendChild(script);

    function GetQueryString(name)
    {
        const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
        const r = window.location.search.substr(1).match(reg);
        if (r) return r[2];

        return null;
    }
};
