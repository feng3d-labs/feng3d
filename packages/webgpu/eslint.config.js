// 导入 ESLint 核心模块
import eslint from '@eslint/js';
// 导入 TypeScript ESLint 配置
import tseslint from 'typescript-eslint';
// 导入全局变量定义
import globals from 'globals';

// 导出 ESLint 配置
export default [
    // 忽略检查的文件和目录
    {
        ignores: [
            '**/node_modules/**',    // 忽略所有 node_modules 目录
            '**/dist/**',            // 忽略所有 dist 目录
            '**/lib/**',             // 忽略所有 lib 目录
            '**/public/**',          // 忽略所有 public 目录
            '**/coverage/**',        // 忽略所有 coverage 目录
            '**/.git/**',            // 忽略所有 .git 目录
        ],
    },
    // 使用 ESLint 推荐配置
    eslint.configs.recommended,
    // 使用 TypeScript ESLint 推荐配置
    ...tseslint.configs.recommended,
    {
        // 语言选项配置
        languageOptions: {
            // 全局变量配置
            globals: {
                ...globals.browser,   // 浏览器环境全局变量
                ...globals.node,      // Node.js 环境全局变量
                ...globals.es2021,    // ES2021 全局变量
                global: false,        // 禁用 global 全局变量
            },
            // 解析器选项
            parserOptions: {
                ecmaVersion: 2021,    // 使用 ES2021 语法
                sourceType: 'module', // 使用 ES 模块
                tsconfigRootDir: import.meta.dirname, // 明确指定 tsconfig 根目录
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',           // 允许未使用的变量
            '@typescript-eslint/no-explicit-any': 'off',          // 允许使用 any 类型
            'no-prototype-builtins': 'off',                       // 允许直接使用 Object.prototype 方法
            '@typescript-eslint/ban-ts-comment': 'off',           // 允许使用 @ts 注释
            '@typescript-eslint/no-unused-expressions': 'off',    // 允许未使用的表达式
            '@typescript-eslint/no-empty-object-type': 'off',     // 允许空对象类型
            '@typescript-eslint/no-unsafe-declaration-merging': 'off', // 允许不安全的声明合并
            '@typescript-eslint/no-unsafe-function-type': 'off',  // 允许不安全的函数类型
            '@typescript-eslint/no-this-alias': 'off',            // 允许 this 别名
            'prefer-const': 'off',                                // 不强制使用 const
            'no-fallthrough': 'off',                              // 允许 fallthrough
            'no-constant-binary-expression': 'off',              // 允许常量二进制表达式

            // 注释格式规则
            'spaced-comment': ['warn', 'always', {
                'line': {
                    'markers': ['/'],              // 以 / 开头的注释需要空格
                    'exceptions': ['-', '+'],      // 允许以 - 和 + 开头的注释不需要空格
                },
                'block': {
                    'markers': ['!'],              // 以 ! 开头的块级注释需要空格
                    'exceptions': ['*'],           // 允许以 * 开头的块级注释不需要空格
                    'balanced': true,              // 要求块级注释的 * 对齐
                },
            }],

            // 空格和换行规则
            'no-trailing-spaces': ['warn', {       // 禁止行尾空格
                'skipBlankLines': false,           // 不跳过空行
                'ignoreComments': false,           // 不忽略注释
            }],
            'no-multiple-empty-lines': ['warn', {  // 限制空行数量
                'max': 1,                          // 最多允许 1 个空行
                'maxEOF': 1,                       // 文件末尾最多 1 个空行
                'maxBOF': 0,                       // 文件开头不允许空行
            }],
            'lines-between-class-members': ['warn', 'always', {  // 类成员之间需要空行
                'exceptAfterSingleLine': true,     // 单行成员后可以没有空行
            }],
            'padding-line-between-statements': [   // 语句之间的空行规则
                'warn',
                { 'blankLine': 'always', 'prev': '*', 'next': 'return' },  // return 前需要空行
                { 'blankLine': 'always', 'prev': ['const', 'let', 'var'], 'next': '*' },  // 变量声明后需要空行
                { 'blankLine': 'any', 'prev': ['const', 'let', 'var'], 'next': ['const', 'let', 'var'] },  // 变量声明之间可以没有空行
            ],

            // 缩进规则
            'indent': ['warn', 4, {               // 使用 4 空格缩进
                'SwitchCase': 1,                  // switch case 缩进 1 级
                'VariableDeclarator': 'first',    // 变量声明对齐到第一个变量
                'outerIIFEBody': 1,               // 外层 IIFE 缩进 1 级
                'MemberExpression': 1,            // 成员表达式缩进 1 级
                'FunctionDeclaration': {          // 函数声明缩进规则
                    'parameters': 1,              // 参数缩进 1 级
                    'body': 1,                    // 函数体缩进 1 级
                },
                'FunctionExpression': {           // 函数表达式缩进规则
                    'parameters': 1,              // 参数缩进 1 级
                    'body': 1,                    // 函数体缩进 1 级
                },
                'CallExpression': {               // 函数调用缩进规则
                    'arguments': 1,               // 参数缩进 1 级
                },
                'ArrayExpression': 1,             // 数组表达式缩进 1 级
                'ObjectExpression': 1,            // 对象表达式缩进 1 级
                'ImportDeclaration': 1,           // import 声明缩进 1 级
                'flatTernaryExpressions': false,  // 不扁平化三元表达式
                'ignoreComments': false,          // 不忽略注释
            }],

            // 引号规则
            'quotes': ['warn', 'single', {        // 使用单引号
                'avoidEscape': true,              // 允许使用转义字符
                'allowTemplateLiterals': true,    // 允许使用模板字符串
            }],

            // 其他格式规则
            'semi': ['off'],           // 要求使用分号
            'comma-dangle': ['warn', 'always-multiline'],  // 多行时要求尾随逗号
            'object-curly-spacing': ['warn', 'always'],    // 对象括号内要求空格
            'array-bracket-spacing': ['warn', 'never'],    // 数组括号内不允许空格
            'arrow-spacing': ['warn', {           // 箭头函数空格规则
                'before': true,                   // 箭头前需要空格
                'after': true,                    // 箭头后需要空格
            }],
            'block-spacing': ['warn', 'always'],  // 块级代码需要空格
            'brace-style': ['warn', 'allman', {   // 大括号风格
                'allowSingleLine': false,         // 不允许单行大括号
            }],
            'comma-spacing': ['warn', {           // 逗号空格规则
                'before': false,                  // 逗号前不允许空格
                'after': true,                    // 逗号后需要空格
            }],
            'comma-style': ['warn', 'last'],      // 逗号放在行尾
            'key-spacing': ['warn', {             // 对象键值对空格规则
                'beforeColon': false,             // 冒号前不允许空格
                'afterColon': true,               // 冒号后需要空格
            }],
            'keyword-spacing': ['warn', {         // 关键字空格规则
                'before': true,                   // 关键字前需要空格
                'after': true,                    // 关键字后需要空格
            }],
            'space-before-blocks': ['warn', 'always'],  // 块级代码前需要空格
            'space-before-function-paren': ['warn', {    // 函数括号前空格规则
                'anonymous': 'always',            // 匿名函数括号前需要空格
                'named': 'never',                 // 命名函数括号前不允许空格
                'asyncArrow': 'always',           // 异步箭头函数括号前需要空格
            }],
            'space-in-parens': ['warn', 'never'], // 括号内不允许空格
            'space-infix-ops': ['warn'],          // 操作符前后需要空格
            'space-unary-ops': ['warn', {         // 一元操作符空格规则
                'words': true,                    // 单词类操作符需要空格
                'nonwords': false,                // 非单词类操作符不需要空格
            }],
        },
    },
];
