const panel = document.getElementById('panel') as HTMLDivElement;
const content = document.getElementById('content') as HTMLDivElement;
const viewer = document.getElementById('viewer') as HTMLIFrameElement;
const filterInput = document.getElementById('filterInput') as HTMLInputElement;
const clearSearchButton = document.getElementById('clearSearchButton') as HTMLDivElement;
const expandButton = document.getElementById('expandButton') as HTMLDivElement;
const viewSrcButton = document.getElementById('button') as HTMLAnchorElement;
const panelScrim = document.getElementById('panelScrim') as HTMLDivElement;
const previewsToggler = document.getElementById('previewsToggler') as HTMLImageElement;

const sectionLink = document.querySelector('#sections > a') as HTMLAnchorElement;
const sectionDefaultHref = sectionLink.href;

const links = {};
const validRedirects = new Map();
const container = document.createElement('div');

let selected = null;

init();

async function init()
{
    content.appendChild(container);

    viewSrcButton.style.display = 'none';

    const files = await (await fetch('./files.json')).json();
    const tags = await (await fetch('./tags.json')).json();

    for (const key in files)
    {
        const category = files[key];

        const header = document.createElement('h2');

        header.textContent = key;
        header.setAttribute('data-category', key);
        container.appendChild(header);

        for (let i = 0; i < category.length; i++)
        {
            const file = category[i];

            if (file)
            {
                validRedirects.set(file, `src/${file}/index.html`);

                const link = createLink(file, tags[file]);

                container.appendChild(link);

                links[file] = link;
            }
        }
    }

    if (window.location.hash !== '')
    {
        let file = window.location.hash.substring(1);

        // use a predefined map of redirects to avoid untrusted URL redirection due to user-provided value

        file = decodeURIComponent(file);
        if (validRedirects.has(file) === true)
        {
            selectFile(file);
            viewer.src = validRedirects.get(file);
            viewer.style.display = 'unset';
        }
        else
        {
            console.warn(`Invalid redirect for ${file}`);
        }
    }

    if (viewer.src === '')
    {
        viewer.srcdoc = (document.getElementById('PlaceholderHTML') as HTMLTemplateElement).innerHTML;
        viewer.style.display = 'unset';
    }

    filterInput.value = extractQuery();

    if (filterInput.value !== '')
    {
        panel.classList.add('searchFocused');

        updateFilter(files, tags);
    }
    else
    {
        updateLink('');
    }

    // Events

    filterInput.onfocus = function ()
    {
        panel.classList.add('searchFocused');
    };

    filterInput.onblur = function ()
    {
        if (filterInput.value === '')
        {
            panel.classList.remove('searchFocused');
        }
    };

    clearSearchButton.onclick = function ()
    {
        filterInput.value = '';
        updateFilter(files, tags);
        filterInput.focus();
    };

    filterInput.addEventListener('input', function ()
    {
        updateFilter(files, tags);
    });

    expandButton.addEventListener('click', function (event)
    {
        event.preventDefault();
        panel.classList.toggle('open');
    });

    panelScrim.onclick = function (event)
    {
        event.preventDefault();
        panel.classList.toggle('open');
    };

    previewsToggler.onclick = function (event)
    {
        event.preventDefault();
        content.classList.toggle('minimal');
    };

    // iOS iframe auto-resize workaround

    if ((/(iPad|iPhone|iPod)/g).test(navigator.userAgent))
    {
        viewer.style.width = getComputedStyle(viewer).width;
        viewer.style.height = getComputedStyle(viewer).height;
        viewer.setAttribute('scrolling', 'no');
    }
}

function createLink(file, tags)
{
    const external = Array.isArray(tags) && tags.includes('external') ? ' <span class="tag">external</span>' : '';

    const template = `
				<div class="card">
					<a href="${validRedirects.get(file)}" target="viewer">
						<div class="cover">
							<img src="screenshots/${file}.jpg" loading="lazy" width="400" />
						</div>
						<div class="title">${getName(file)}${external}</div>
					</a>
				</div>
			`;

    const link = createElementFromHTML(template) as HTMLDivElement;

    const element = link.querySelector('a[target="viewer"]') as HTMLAnchorElement;

    element.addEventListener('click', function (event: MouseEvent)
    {
        if (event.button !== 0 || event.ctrlKey || event.altKey || event.metaKey) return;

        selectFile(file);
    });

    return link;
}

function selectFile(file)
{
    if (selected !== null) (links[selected] as HTMLDivElement).classList.remove('selected');

    links[file].classList.add('selected');

    window.location.hash = file;
    viewer.focus();
    viewer.style.display = 'unset';

    panel.classList.remove('open');

    selected = file;

    // Reveal "View source" button and set attributes to this example
    viewSrcButton.style.display = '';
    viewSrcButton.href = `https://gitee.com/feng3d/reactivity/tree/master/examples/src/${selected}/index.ts`;
    viewSrcButton.title = `View source code for ${getName(selected)} on GitHub`;
}

function escapeRegExp(string)
{
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // https://stackoverflow.com/a/6969486/5250847
}

function updateFilter(files, tags)
{
    let v = filterInput.value.trim();

    v = v.replace(/\s+/gi, ' '); // replace multiple whitespaces with a single one

    if (v !== '')
    {
        window.history.replaceState({}, '', `?q=${v}${window.location.hash}`);
    }
    else
    {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }

    const exp = new RegExp(escapeRegExp(v), 'gi');

    for (const key in files)
    {
        const section = files[key];

        for (let i = 0; i < section.length; i++)
        {
            filterExample(section[i], exp, tags);
        }
    }

    layoutList(files);

    updateLink(v);
}

function updateLink(search)
{
    // update docs link

    if (search)
    {
        const link = sectionLink.href.split(/[?#]/)[0];

        sectionLink.href = `${link}?q=${search}`;
    }
    else
    {
        sectionLink.href = sectionDefaultHref;
    }
}

function filterExample(file, exp, tags)
{
    const link = links[file];

    if (!link) return;
    if (file in tags) file += ` ${tags[file].join(' ')}`;
    const res = file.replace(/_+/g, ' ').match(exp);

    if (res && res.length > 0)
    {
        link.classList.remove('hidden');
    }
    else
    {
        link.classList.add('hidden');
    }
}

function getName(file)
{
    // const name = file.split('_');
    // name.shift();

    // return name.join(' / ');
    return file;
}

function layoutList(files)
{
    for (const key in files)
    {
        let collapsed = true;

        const section = files[key];

        for (let i = 0; i < section.length; i++)
        {
            const file = section[i];

            if (links[file].classList.contains('hidden') === false)
            {
                collapsed = false;
                break;
            }
        }

        const element = document.querySelector(`h2[data-category="${key}"]`) as HTMLDivElement;

        if (collapsed)
        {
            element.classList.add('hidden');
        }
        else
        {
            element.classList.remove('hidden');
        }
    }
}

function extractQuery()
{
    const search = window.location.search;

    if (search.indexOf('?q=') !== -1)
    {
        return decodeURI(search.slice(3));
    }

    return '';
}

function createElementFromHTML(htmlString)
{
    const div = document.createElement('div');

    div.innerHTML = htmlString.trim();

    return div.firstChild;
}

function unescapeUnicode(escapedStr)
{
    const regex = /\\u([0-9a-fA-F]{4})/g;

    return escapedStr.replace(regex, (match, p1) =>
    {
        return String.fromCodePoint(parseInt(p1, 16));
    });
}
