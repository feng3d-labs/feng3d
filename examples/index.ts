const files = {
    base: [
        'base',
        'Container3DTest',
        'FPSControllerTest',
        'BillboardTest',
        'MousePickTest',
        'SkyBoxTest',
        'FogTest',
    ],
    material: [
        'ColorMaterialTest',
        'PointMaterialTest',
        'SegmentMaterialTest',
        'StandardMaterialTest',
        'TextureMaterialTest',
    ],
    geometry: [
        'geometries',
        'PrimitiveTest',
        'GeometryTest',
    ],
    lights: [
        'PointLightTest',
        'physical',
        'physical_f',
    ],
    deserialize: [
        'SceneLoadTest',
        'deserializeTest',
    ],
    advanced: [
        'TerrainTest',
    ],
    away3d: [
        'Basic_View',
        'Basic_SkyBox',
        'Basic_Shading',
    ],
    font: [
        'GeometryFontTest'
    ],
    renderer: [
        'Basic',
        'DashedLine',
    ],
    'regl-examples': [
        'basic',
        'batch',
        'blur',
        'bunny',
        'camera',
        'cloth',
        'cube',
    ],
    WebGL2Samples: [
        'draw_image_space',
        'draw_instanced',
        'draw_primitive_restart',
        'draw_range_arrays',
        'fbo_blit',
    ],
};

function extractQuery()
{
    const p = window.location.search.indexOf('?q=');
    if (p !== -1)
    {
        return window.location.search.substr(3);
    }

    return '';
}

const panel = document.getElementById('panel') as HTMLDivElement;
const content = document.getElementById('content') as HTMLDivElement;
const viewer = document.getElementById('viewer') as HTMLIFrameElement;

const filterInput = document.getElementById('filterInput') as HTMLInputElement;
const clearFilterButton = document.getElementById('clearFilterButton') as HTMLAnchorElement;

const expandButton = document.getElementById('expandButton') as HTMLSpanElement;
expandButton.addEventListener('click', function (event)
{
    panel.classList.toggle('collapsed');
    event.preventDefault();
});

// iOS iframe auto-resize workaround

if ((/(iPad|iPhone|iPod)/g).test(navigator.userAgent))
{
    viewer.style.width = getComputedStyle(viewer).width;
    viewer.style.height = getComputedStyle(viewer).height;
    viewer.setAttribute('scrolling', 'no');
}

const container = document.createElement('div');
content.appendChild(container);

const button = document.createElement('div');
button.id = 'button';
button.textContent = 'View source';
button.addEventListener('click', function (event)
{
    window.open(`https://gitee.com/feng3d/feng3d/tree/master/examples/src/${selected}.ts`);
}, false);
button.style.display = 'none';
document.body.appendChild(button);

const links: { [name: string]: HTMLAnchorElement } = {};
let selected = null;

for (const key in files)
{
    const section = files[key];

    const header = document.createElement('h2');
    header.textContent = key;
    header.setAttribute('data-category', key);
    container.appendChild(header);

    for (let i = 0; i < section.length; i++)
    {
        // eslint-disable-next-line no-loop-func
        (function (file)
        {
            const link = document.createElement('a');
            link.className = 'link';
            link.textContent = file;
            link.href = `src/${key}/${file}.html`;
            link.setAttribute('target', 'viewer');
            link.addEventListener('click', function (event)
            {
                if (event.button === 0)
                {
                    selectFile(`${key}/${file}`);
                }
            });
            container.appendChild(link);

            links[`${key}/${file}`] = link;
        })(section[i]);
    }
}

function loadFile(file)
{
    selectFile(file);
    viewer.src = `src/${file}.html`;
}

function selectFile(file)
{
    if (selected !== null) links[selected].classList.remove('selected');

    links[file].classList.add('selected');

    window.location.hash = file;
    viewer.focus();

    button.style.display = '';
    panel.classList.toggle('collapsed');

    selected = file;
}

if (window.location.hash !== '')
{
    loadFile(window.location.hash.substring(1));
}
else
{
    // 选择第一个对象
    loadFile(`${Object.keys(files)[0]}/${files[Object.keys(files)[0]][0]}`);
}

// filter

filterInput.addEventListener('input', function (e)
{
    updateFilter();
});

clearFilterButton.addEventListener('click', function (e)
{
    filterInput.value = '';
    updateFilter();
    e.preventDefault();
});

function updateFilter()
{
    const v = filterInput.value;
    if (v !== '')
    {
        window.history.replaceState({}, '', `?q=${v}${window.location.hash}`);
    }
    else
    {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }

    const exp = new RegExp(v, 'gi');

    for (const key in files)
    {
        const section = files[key];

        for (let i = 0; i < section.length; i++)
        {
            filterExample(`${key}/${section[i]}`, exp);
        }
    }

    layoutList();
}

function filterExample(file, exp)
{
    const link = links[file];
    const res = file.match(exp);
    let text;

    if (res && res.length > 0)
    {
        link.classList.remove('filtered');

        for (let i = 0; i < res.length; i++)
        {
            text = file.replace(res[i], `<b>${res[i]}</b>`);
        }

        // link.innerHTML = text;
    }
    else
    {
        link.classList.add('filtered');
        // link.innerHTML = file;
    }
}

function layoutList()
{
    for (const key in files)
    {
        let collapsed = true;

        const section = files[key];

        for (let i = 0; i < section.length; i++)
        {
            const file = `${key}/${section[i]}`;

            if (!links[file].classList.contains('filtered'))
            {
                collapsed = false;
                break;
            }
        }

        const element = document.querySelector(`h2[data-category="${key}"]`) as HTMLAnchorElement;

        if (collapsed)
        {
            element.classList.add('filtered');
        }
        else
        {
            element.classList.remove('filtered');
        }
    }
}

filterInput.value = extractQuery();
updateFilter();
