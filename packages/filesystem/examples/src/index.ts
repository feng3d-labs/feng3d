import { HttpFS, IndexedDBFS, IReadWriteFS, ReadFS, ReadWriteFS } from "@feng3d/filesystem";

// 通过Http请求读取文件系统
const httpReadFs = new ReadFS(new HttpFS(""));

const obj = await httpReadFs.readObject("a.json");   // 读取json文件 a.json {"a":1}
console.log(obj); // { a: 1 }

// 通过indexedDB读写文件系统
const indexedDBWriteFS = new ReadWriteFS(new IndexedDBFS("feng3d"));
indexedDBWriteFS.initproject("test");   // 初始化项目
await indexedDBWriteFS.writeObject("a.json", { a: 1 });  // 写入json文件 a.json {"a":1}
const obj1 = await indexedDBWriteFS.readObject("a.json");  // 读取json文件 a.json {"a":1}
console.log(obj1); // { a: 1 }