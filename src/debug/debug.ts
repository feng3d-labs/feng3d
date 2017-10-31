module feng3d
{
    var oldFunction: [any, string][] = [];

    debugfunc(console, "error");
    debugfunc(console, "assert", (test?: boolean, message?: string, ...optionalParams: any[]) =>
    {
        return !test;
    });

    function debugfunc(host: any, funcname: string, debugcondition?: Function)
    {
        oldFunction.push([host, funcname]);

        var olderror = host[funcname];
        function debug(message?: any, ...optionalParams: any[]): void
        {
            var argArray = [message];
            if (optionalParams)
            {
                argArray = argArray.concat(optionalParams);
            }

            if (debugcondition)
            {
                if (debugcondition.apply(null, argArray))
                    debugger;
            } else
            {
                debugger
            }
            try
            {
                olderror.apply(null, argArray);
            } catch (error)
            {
                host[funcname] = olderror;
                console.log(`无法使用debug， 还原 ${host} ${funcname}`);
            }
        }
        host[funcname] = debug;
    }
}