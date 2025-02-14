// @see https://github.com/mikolalysenko/resl

/* global XMLHttpRequest */
const configParameters = [
    'manifest',
    'onDone',
    'onProgress',
    'onError'
];

const manifestParameters = [
    'type',
    'src',
    'stream',
    'credentials',
    'parser'
];

const parserParameters = [
    'onData',
    'onDone'
];

const STATE_ERROR = -1;
const STATE_DATA = 0;
const STATE_COMPLETE = 1;

function raise(message)
{
    throw new Error(`resl: ${message}`);
}

function checkType(object, parameters, name)
{
    Object.keys(object).forEach(function (param)
    {
        if (parameters.indexOf(param) < 0)
        {
            raise(`invalid parameter "${param}" in ${name}`);
        }
    });
}

function Loader(name, cancel)
{
    this.state = STATE_DATA;
    this.ready = false;
    this.progress = 0;
    this.name = name;
    this.cancel = cancel;
}

export function resl(config)
{
    if (typeof config !== 'object' || !config)
    {
        raise('invalid or missing configuration');
    }

    checkType(config, configParameters, 'config');

    const manifest = config.manifest;
    if (typeof manifest !== 'object' || !manifest)
    {
        raise('missing manifest');
    }

    function getFunction(name, _dflt?)
    {
        if (name in config)
        {
            const func = config[name];
            if (typeof func !== 'function')
            {
                raise(`invalid callback "${name}"`);
            }

            return func;
        }

        return null;
    }

    const onDone = getFunction('onDone');
    if (!onDone)
    {
        raise('missing onDone() callback');
    }

    const onProgress = getFunction('onProgress');
    const onError = getFunction('onError');

    const assets = {};

    let state = STATE_DATA;

    function loadXHR(request)
    {
        const name = request.name;
        const stream = request.stream;
        const binary = request.type === 'binary';
        const parser = request.parser;

        const xhr = new XMLHttpRequest();
        let asset = null;

        const loader = new Loader(name, cancel);

        if (stream)
        {
            xhr.onreadystatechange = onReadyStateChange;
        }
        else
        {
            xhr.onreadystatechange = function ()
            {
                if (xhr.readyState === 4)
                {
                    onReadyStateChange();
                }
            };
        }

        if (binary)
        {
            xhr.responseType = 'arraybuffer';
        }

        function onReadyStateChange()
        {
            if (xhr.readyState < 2
                || loader.state === STATE_COMPLETE
                || loader.state === STATE_ERROR)
            {
                return;
            }
            if (xhr.status !== 200)
            {
                return abort(`error loading resource "${request.name}"`);
            }
            if (xhr.readyState > 2 && loader.state === STATE_DATA)
            {
                let response;
                if (request.type === 'binary')
                {
                    response = xhr.response;
                }
                else
                {
                    response = xhr.responseText;
                }
                if (parser.data)
                {
                    try
                    {
                        asset = parser.data(response);
                    }
                    catch (e)
                    {
                        return abort(e);
                    }
                }
                else
                {
                    asset = response;
                }
            }
            if (xhr.readyState > 3 && loader.state === STATE_DATA)
            {
                if (parser.done)
                {
                    try
                    {
                        asset = parser.done();
                    }
                    catch (e)
                    {
                        return abort(e);
                    }
                }
                loader.state = STATE_COMPLETE;
            }
            assets[name] = asset;
            loader.progress = 0.75 * loader.progress + 0.25;
            loader.ready
                = (request.stream && !!asset)
                || loader.state === STATE_COMPLETE;
            notifyProgress();
        }

        function cancel()
        {
            if (loader.state === STATE_COMPLETE || loader.state === STATE_ERROR)
            {
                return;
            }
            xhr.onreadystatechange = null;
            xhr.abort();
            loader.state = STATE_ERROR;
        }

        // set up request
        if (request.credentials)
        {
            xhr.withCredentials = true;
        }
        xhr.open('GET', request.src, true);
        xhr.send();

        return loader;
    }

    function loadElement(request, element)
    {
        const name = request.name;
        const parser = request.parser;

        const loader = new Loader(name, cancel);
        let asset = element;

        function handleProgress()
        {
            if (loader.state === STATE_DATA)
            {
                if (parser.data)
                {
                    try
                    {
                        asset = parser.data(element);
                    }
                    catch (e)
                    {
                        return abort(e);
                    }
                }
                else
                {
                    asset = element;
                }
            }
        }

        function onProgress(e)
        {
            handleProgress();
            assets[name] = asset;
            if (e.lengthComputable)
            {
                loader.progress = Math.max(loader.progress, e.loaded / e.total);
            }
            else
            {
                loader.progress = 0.75 * loader.progress + 0.25;
            }
            notifyProgress(name);
        }

        function onComplete()
        {
            handleProgress();
            if (loader.state === STATE_DATA)
            {
                if (parser.done)
                {
                    try
                    {
                        asset = parser.done();
                    }
                    catch (e)
                    {
                        return abort(e);
                    }
                }
                loader.state = STATE_COMPLETE;
            }
            loader.progress = 1;
            loader.ready = true;
            assets[name] = asset;
            removeListeners();
            notifyProgress(`finish ${name}`);
        }

        function onError()
        {
            abort(`error loading asset "${name}"`);
        }

        if (request.stream)
        {
            element.addEventListener('progress', onProgress);
        }
        if (request.type === 'image')
        {
            element.addEventListener('load', onComplete);
        }
        else
        {
            let canPlay = false;
            let loadedMetaData = false;
            element.addEventListener('loadedmetadata', function ()
            {
                loadedMetaData = true;
                if (canPlay)
                {
                    onComplete();
                }
            });
            element.addEventListener('canplay', function ()
            {
                canPlay = true;
                if (loadedMetaData)
                {
                    onComplete();
                }
            });
        }
        element.addEventListener('error', onError);

        function removeListeners()
        {
            if (request.stream)
            {
                element.removeEventListener('progress', onProgress);
            }
            if (request.type === 'image')
            {
                element.addEventListener('load', onComplete);
            }
            else
            {
                element.addEventListener('canplay', onComplete);
            }
            element.removeEventListener('error', onError);
        }

        function cancel()
        {
            if (loader.state === STATE_COMPLETE || loader.state === STATE_ERROR)
            {
                return;
            }
            loader.state = STATE_ERROR;
            removeListeners();
            element.src = '';
        }

        // set up request
        if (request.credentials)
        {
            element.crossOrigin = 'use-credentials';
        }
        else
        {
            element.crossOrigin = 'anonymous';
        }
        element.src = request.src;

        return loader;
    }

    const loaders = {
        text: loadXHR,
        binary(request)
        {
            // TODO use fetch API for streaming if supported
            return loadXHR(request);
        },
        image(request)
        {
            return loadElement(request, document.createElement('img'));
        },
        video(request)
        {
            return loadElement(request, document.createElement('video'));
        },
        audio(request)
        {
            return loadElement(request, document.createElement('audio'));
        }
    };

    // First we parse all objects in order to verify that all type information
    // is correct
    const pending = Object.keys(manifest).map(function (name)
    {
        let request = manifest[name];
        if (typeof request === 'string')
        {
            request = {
                src: request
            };
        }
        else if (typeof request !== 'object' || !request)
        {
            raise(`invalid asset definition "${name}"`);
        }

        checkType(request, manifestParameters, `asset "${name}"`);

        function getParameter(prop, accepted, init)
        {
            let value = init;
            if (prop in request)
            {
                value = request[prop];
            }
            if (accepted.indexOf(value) < 0)
            {
                raise(`invalid ${prop} "${value}" for asset "${name}", possible values: ${accepted}`);
            }

            return value;
        }

        function getString(prop, required, init)
        {
            let value = init;
            if (prop in request)
            {
                value = request[prop];
            }
            else if (required)
            {
                raise(`missing ${prop} for asset "${name}"`);
            }
            if (typeof value !== 'string')
            {
                raise(`invalid ${prop} for asset "${name}", must be a string`);
            }

            return value;
        }

        function getParseFunc(name, dflt?)
        {
            if (name in request.parser)
            {
                const result = request.parser[name];
                if (typeof result !== 'function')
                {
                    raise(`invalid parser callback ${name} for asset "${name}"`);
                }

                return result;
            }

            return dflt;
        }

        let parser = {};
        if ('parser' in request)
        {
            if (typeof request.parser === 'function')
            {
                parser = {
                    data: request.parser
                };
            }
            else if (typeof request.parser === 'object' && request.parser)
            {
                checkType(parser, parserParameters, `parser for asset "${name}"`);
                if (!('onData' in parser))
                {
                    raise(`missing onData callback for parser in asset "${name}"`);
                }
                parser = {
                    data: getParseFunc('onData'),
                    done: getParseFunc('onDone')
                };
            }
            else
            {
                raise(`invalid parser for asset "${name}"`);
            }
        }

        return {
            name,
            type: getParameter('type', Object.keys(loaders), 'text'),
            stream: !!request.stream,
            credentials: !!request.credentials,
            src: getString('src', true, ''),
            parser
        };
    }).map(function (request)
    {
        return (loaders[request.type])(request);
    });

    function abort(message)
    {
        if (state === STATE_ERROR || state === STATE_COMPLETE)
        {
            return;
        }
        state = STATE_ERROR;
        pending.forEach(function (loader)
        {
            loader.cancel();
        });
        if (onError)
        {
            if (typeof message === 'string')
            {
                onError(new Error(`resl: ${message}`));
            }
            else
            {
                onError(message);
            }
        }
        else
        {
            console.error('resl error:', message);
        }
    }

    function notifyProgress(message?)
    {
        if (state === STATE_ERROR || state === STATE_COMPLETE)
        {
            return;
        }

        let progress = 0;
        let numReady = 0;
        pending.forEach(function (loader)
        {
            if (loader.ready)
            {
                numReady += 1;
            }
            progress += loader.progress;
        });

        if (numReady === pending.length)
        {
            state = STATE_COMPLETE;
            onDone(assets);
        }
        else
        if (onProgress)
            {
                onProgress(progress / pending.length, message);
            }
    }

    if (pending.length === 0)
    {
        setTimeout(function ()
        {
            notifyProgress('done');
        }, 1);
    }
}
