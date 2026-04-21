/**
 * postdocs 脚本
 *
 * 将 typedoc 生成的文档从 public 移动到 public/doc 目录
 */

import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const publicDir = resolve(rootDir, 'public');
const tempDir = resolve(rootDir, 'public_temp');
const docDir = resolve(rootDir, 'public/doc');

// 1. 复制 public 到 public_temp
if (existsSync(publicDir))
{
    // 先删除临时目录（如果存在）
    if (existsSync(tempDir))
    {
        rmSync(tempDir, { recursive: true, force: true });
    }
    // 复制 public 到 public_temp
    cpSync(publicDir, tempDir, { recursive: true });
    // 删除原 public 目录
    rmSync(publicDir, { recursive: true, force: true });
}

// 2. 创建新的 public 目录
mkdirSync(publicDir, { recursive: true });

// 3. 将 public_temp 移动到 public/doc
if (existsSync(tempDir))
{
    // 复制 public_temp 到 public/doc
    cpSync(tempDir, docDir, { recursive: true });
    // 删除 public_temp
    rmSync(tempDir, { recursive: true, force: true });
}

console.log('文档已移动到 public/doc 目录');

