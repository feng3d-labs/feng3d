import files from './files';

function extractQuery(): string {
    const p = window.location.search.indexOf('?q=');
    if (p !== -1) {
        return window.location.search.substr(3);
    }
    return '';
}

const panel = document.getElementById('panel') as HTMLDivElement;
const content = document.getElementById('content') as HTMLDivElement;
const viewer = document.getElementById('viewer') as HTMLIFrameElement;

const filterInput = document.getElementById('filterInput') as HTMLInputElement;
const clearFilterButton = document.getElementById('clearFilterButton') as HTMLAnchorElement;

const expandButton = document.getElementById('expandButton') as HTMLAnchorElement;
expandButton.addEventListener('click', (event) => {
    panel.classList.toggle('collapsed');
    event.preventDefault();
});

// iOS iframe auto-resize workaround
if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
    viewer.style.width = getComputedStyle(viewer).width;
    viewer.style.height = getComputedStyle(viewer).height;
    viewer.setAttribute('scrolling', 'no');
}

const container = document.createElement('div');
content.appendChild(container);

const button = document.createElement('div');
button.id = 'button';
button.textContent = 'View source';
button.addEventListener('click', () => {
    window.open(`https://gitlab.com/feng3d/feng3d-examples/tree/master/src/${selected}.ts`);
}, false);
button.style.display = 'none';
document.body.appendChild(button);

const links: Record<string, HTMLAnchorElement> = {};
const paths: Record<string, string> = {};
let selected: string | null = null;

for (const key in files) {
    const section = files[key as keyof typeof files];

    const header = document.createElement('h2');
    header.textContent = key;
    header.setAttribute('data-category', key);
    container.appendChild(header);

    for (let i = 0; i < section.length; i++) {
        ((file: string) => {
            paths[file] = key + "/" + file;

            const link = document.createElement('a');
            link.className = 'link';
            link.textContent = file;
            link.href = `src/${paths[file]}.html`;
            link.setAttribute('target', 'viewer');
            link.addEventListener('click', (event) => {
                if (event.button === 0) {
                    selectFile(file);
                }
            });
            container.appendChild(link);

            links[file] = link;
        })(section[i]);
    }
}

function loadFile(file: string) {
    selectFile(file);
    viewer.src = `src/${paths[file]}.html`;
}

function selectFile(file: string) {
    if (selected !== null) links[selected].classList.remove('selected');

    links[file].classList.add('selected');

    window.location.hash = file;
    viewer.focus();

    button.style.display = '';
    panel.classList.toggle('collapsed');

    selected = file;
}

if (window.location.hash !== '') {
    loadFile(window.location.hash.substring(1));
}

// filter

filterInput.addEventListener('input', () => {
    updateFilter();
});

clearFilterButton.addEventListener('click', (e) => {
    filterInput.value = '';
    updateFilter();
    e.preventDefault();
});

function updateFilter() {
    const v = filterInput.value;
    if (v !== '') {
        window.history.replaceState({}, '', `?q=${v}${window.location.hash}`);
    } else {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }

    const exp = new RegExp(v, 'gi');

    for (const key in files) {
        const section = files[key as keyof typeof files];

        for (let i = 0; i < section.length; i++) {
            filterExample(section[i], exp);
        }
    }

    layoutList();
}

function filterExample(file: string, exp: RegExp) {
    const link = links[file];
    const res = file.match(exp);
    let text: string;

    if (res && res.length > 0) {
        link.classList.remove('filtered');

        for (let i = 0; i < res.length; i++) {
            text = file.replace(res[i], `<b>${res[i]}</b>`);
        }

        link.innerHTML = text;
    } else {
        link.classList.add('filtered');
        link.innerHTML = file;
    }
}

function layoutList() {
    for (const key in files) {
        let collapsed = true;

        const section = files[key as keyof typeof files];

        for (let i = 0; i < section.length; i++) {
            const file = section[i];

            if (!links[file].classList.contains('filtered')) {
                collapsed = false;
                break;
            }
        }

        const element = document.querySelector(`h2[data-category="${key}"]`);

        if (collapsed) {
            element!.classList.add('filtered');
        } else {
            element!.classList.remove('filtered');
        }
    }
}

filterInput.value = extractQuery();
updateFilter();
