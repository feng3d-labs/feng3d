import { resolve, dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';
import { defineConfig } from 'vite';
import fg from 'fast-glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_FILE_PATTERN = '**/*.spect.html';
const EXCLUDE_PATTERNS = [
    '**/node_modules/**',
    '**/dist/**',
    '**/test_dist/**',
    '**/.git/**',
];

export default defineConfig({
    root: __dirname,
    publicDir: false,
    server: {
        port: 3002,
        open: '/index.html',
    },
    build: {
        outDir: resolve(__dirname, '../public/test_web'),
        rollupOptions: {
            input: getSpectHtmlFiles(),
            output: {
                entryFileNames: (chunkInfo) =>
                {
                    const name = chunkInfo.name || 'chunk';

                    return `${name.replace(/[/\\]/g, '-')}.js`;
                },
                chunkFileNames: (chunkInfo) =>
                {
                    const name = chunkInfo.name || 'chunk';

                    return `chunks/${name.replace(/[/\\]/g, '-')}-[hash].js`;
                },
                assetFileNames: (assetInfo) =>
                {
                    if (assetInfo.name && assetInfo.name.endsWith('.html'))
                    {
                        const name = assetInfo.name.replace(/[/\\]/g, '-');

                        return name;
                    }

                    const name = assetInfo.name || 'asset';

                    return `assets/${name.replace(/[/\\]/g, '-')}-[hash][extname]`;
                },
            },
        },
    },
    resolve: {
        alias: {
            '@feng3d/webgpu': resolve(__dirname, '../src'),
            '@feng3d/render-api': resolve(__dirname, '../../render-api/src'),
        },
    },
    plugins: [
        shaderToString(),
        generateTestConfigPlugin(),
    ],
});

function findSpectHtmlFiles(baseDir, scanDir, pattern = '**/*.spect.html', excludePatterns = ['**/node_modules/**'])
{
    const patterns = [
        pattern,
        ...excludePatterns.map(p => `!${p}`),
    ];

    const files = fg.sync(patterns, {
        cwd: scanDir,
        absolute: false,
        onlyFiles: true,
    });

    return files.map((file) =>
    {
        const filePath = resolve(scanDir, file);
        const fileName = file.split('/').pop() || file.split('\\').pop() || file;
        const relativeToBase = relative(baseDir, filePath).replace(/\\/g, '/');

        return {
            path: filePath,
            relativePath: file.replace(/\\/g, '/'),
            relativeToBase,
            name: fileName.replace(/\.spect\.html$/, ''),
        };
    });
}

function getSpectHtmlFiles()
{
    const input = {
        main: resolve(__dirname, 'index.html'),
    };

    const testFiles = findSpectHtmlFiles(__dirname, __dirname, TEST_FILE_PATTERN, EXCLUDE_PATTERNS);

    testFiles.forEach((file) =>
    {
        let key = file.relativePath
            .replace(/^\.\.\//g, '')
            .replace(/^\.\//g, '')
            .replace(/\//g, '-')
            .replace(/\\/g, '-')
            .replace(/\.spect\.html$/, '');

        if (!key || input[key])
        {
            key = file.name;
        }

        input[key] = resolve(file.path);
    });

    return input;
}

function extractTestInfo(htmlContent, fileName)
{
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : fileName.replace('.spect.html', '');

    const descriptionMatch = htmlContent.match(/<meta\s+name=["']test-description["']\s+content=["'](.*?)["']/i);
    const description = descriptionMatch ? descriptionMatch[1].trim() : `测试：${title}`;

    const testNameMatch = htmlContent.match(/<meta\s+name=["']test-name["']\s+content=["'](.*?)["']/i);
    const testName = testNameMatch ? testNameMatch[1].trim() : fileName.replace('.spect.html', '');

    return {
        name: title,
        description,
        testName,
    };
}

function generateTestConfig()
{
    const testFiles = findSpectHtmlFiles(__dirname, __dirname, TEST_FILE_PATTERN, EXCLUDE_PATTERNS);

    const tests = testFiles.map((file) =>
    {
        const htmlContent = readFileSync(file.path, 'utf-8');
        const fileName = file.relativePath.split('/').pop() || file.name;
        const testInfo = extractTestInfo(htmlContent, fileName);

        let htmlFile = file.relativePath;

        if (!htmlFile.startsWith('/'))
        {
            htmlFile = '/' + htmlFile;
        }

        const dirPath = file.relativePath.split('/').slice(0, -1).join('/') || '.';

        return {
            name: testInfo.name,
            description: testInfo.description,
            htmlFile,
            testName: testInfo.testName,
            dirPath,
        };
    });

    const testsJson = JSON.stringify(tests, null, 4);
    let testsWithSingleQuotes = testsJson
        .replace(/"([^"]+)":/g, '$1:')
        .replace(/"/g, "'");

    testsWithSingleQuotes = testsWithSingleQuotes.replace(/([^,\n])\n {4}\}/g, '$1,\n    }');
    testsWithSingleQuotes = testsWithSingleQuotes.replace(/(\n {4}\})\n\]/g, '$1,\n]');
    testsWithSingleQuotes = testsWithSingleQuotes.replace(/;;/g, ';');
    testsWithSingleQuotes = testsWithSingleQuotes.replace(/\n,\n\]/g, ',\n]');

    const configContent = `// 此文件由构建工具自动生成，请勿手动编辑
// 此文件包含所有 .spect.html 测试文件的配置信息

export interface TestInfo
{
    name: string;
    description: string;
    htmlFile: string;
    testName: string;
    dirPath: string; // 目录路径（相对于根目录）
}

export const tests: TestInfo[] = ${testsWithSingleQuotes};
`;

    const configPath = join(__dirname, 'test-config.ts');

    writeFileSync(configPath, configContent, 'utf-8');

    return tests;
}

function generateTestConfigPlugin()
{
    return {
        name: 'generate-test-config',
        buildStart()
        {
            generateTestConfig();
        },
        configureServer()
        {
            generateTestConfig();
        },
    };
}

function shaderToString()
{
    return {
        name: 'vite-plugin-string',
        async transform(source, id)
        {
            if (!['glsl', 'wgsl', 'vert', 'frag', 'vs', 'fs'].includes(id.split('.').pop())) return;

            const esm = `export default \`${source}\`;`;

            return { code: esm, map: { mappings: '' } };
        },
    };
}

