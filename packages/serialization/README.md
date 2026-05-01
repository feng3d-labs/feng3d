# @feng3d/serialization

任意对象序列化反序列化。

源码：https://gitee.com/feng3d/serialization

文档：https://feng3d.com/serialization

## 安装
```
npm install @feng3d/serialization
```

## 示例

### 基本类型序列化和反序列化
```
import { $deserialize, $serialize } from "@feng3d/serialization";

const numberValue = 42;
const serializedNumber = $serialize(numberValue);
const deserializedNumber = $deserialize(serializedNumber);

console.log(deserializedNumber); // 42

const stringValue = "Hello, world!";
const serializedString = $serialize(stringValue);
const deserializedString = $deserialize(serializedString);

console.log(deserializedString); // "Hello, world!"
```

### 数组序列化和反序列化
```
import { $deserialize, $serialize } from "@feng3d/serialization";

const arrayValue = [1, 2, 3, { key: "value" }];
const serializedArray = $serialize(arrayValue);
const deserializedArray = $deserialize(serializedArray);

console.log(deserializedArray); // [1, 2, 3, { key: "value" }]
```

### 对象序列化和反序列化
```
import { $deserialize, $serialize } from "@feng3d/serialization";

const objectValue = { name: "Alice", age: 30, hobbies: ["reading", "traveling"] };
const serializedObject = $serialize(objectValue);
const deserializedObject = $deserialize(serializedObject);

console.log(deserializedObject); // { name: "Alice", age: 30, hobbies: ["reading", "traveling"] }
```

### 处理循环引用以及多次引用
```
import { $deserialize, $serialize } from "@feng3d/serialization";

const a = { a: null, a1: null, a2: null };
a.a = a;
a.a1 = a;
a.a2 = a;

const r = $serialize(a);
const r1 = $deserialize(r);

console.log(r1.a === r1); // true
console.log(r1.a1 === r1); // true
console.log(r1.a2 === r1); // true
```
