# @feng3d/filesystem

一个文件系统模块，提供了文件系统的操作接口。

源码：https://gitee.com/feng3d/filesystem

文档：https://feng3d.com/filesystem

## 安装

```bash
npm install @feng3d/filesystem
```

## 使用

### 通过http请求读取文件
```html
<script type="module">
    import { HttpFS, ReadFS } from "@feng3d/filesystem";

    const readFs = new ReadFS(new HttpFS(""));

    const obj = await readFs.readObject("a.json");   // 读取json文件 a.json {"a":1}
    console.log(obj); // { a: 1 }
</script>
```

### 通过indexedDB读写文件系统
```html
<script type="module">
    import { HttpFS, ReadFS } from "@feng3d/filesystem";

    // 
    const indexedDBWriteFS = new ReadWriteFS(new IndexedDBFS("feng3d"));
    indexedDBWriteFS.initproject("test");   // 初始化项目

    await indexedDBWriteFS.writeObject("a.json", { a: 1 });  // 写入json文件 a.json {"a":1}
    const obj1 = await indexedDBWriteFS.readObject("a.json");  // 读取json文件 a.json {"a":1}
    console.log(obj1); // { a: 1 }
</script>
```
