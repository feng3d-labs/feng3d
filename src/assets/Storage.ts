namespace feng3d
{
    var databases: { [name: string]: IDBDatabase } = {};

    /**
     * 
     */
    export var _indexedDB: _IndexedDB;

    /**
     * 
     */
    export class _IndexedDB
    {
        /**
         * 是否支持 indexedDB 
         */
        support()
        {
            if (typeof indexedDB == "undefined")
            {
                indexedDB = window.indexedDB || window["mozIndexedDB"] || window["webkitIndexedDB"] || window["msIndexedDB"];

                if (indexedDB == undefined)
                {
                    return false;
                }
            }
            return true;
        }

        /**
         * 获取数据库，如果不存在则新建数据库
         * 
         * @param dbname 数据库名称
         * @param callback 完成回调
         */
        getDatabase(dbname: string, callback: (err: any, database: IDBDatabase) => void)
        {
            if (databases[dbname])
            {
                callback(null, databases[dbname]);
                return;
            }
            var request = indexedDB.open(dbname);
            request.onsuccess = function (event)
            {
                databases[dbname] = event.target["result"];
                callback(null, databases[dbname]);
                request.onsuccess = null;
            };
            request.onerror = function (event)
            {
                callback(event, <any>null);
                request.onerror = null;
            };
        }

        /**
         * 删除数据库
         * 
         * @param dbname 数据库名称
         * @param callback 完成回调
         */
        deleteDatabase(dbname: string, callback?: (err: any) => void)
        {
            var request = indexedDB.deleteDatabase(dbname);
            request.onsuccess = function (event)
            {
                delete databases[dbname];
                callback && callback(null);
                request.onsuccess = null;
            };
            request.onerror = function (event)
            {
                callback && callback(event);
                request.onerror = null;
            };
        }

        /**
         * 是否存在指定的对象存储
         * 
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        hasObjectStore(dbname: string, objectStroreName: string, callback: (has: boolean) => void)
        {
            this.getDatabase(dbname, (err, database) =>
            {
                callback(database.objectStoreNames.contains(objectStroreName));
            });
        }

        /**
         * 获取对象存储名称列表
         * 
         * @param dbname 数据库
         * @param callback 完成回调
         */
        getObjectStoreNames(dbname: string, callback: (err: Error | null, objectStoreNames: string[]) => void)
        {
            this.getDatabase(dbname, (err, database) =>
            {
                var objectStoreNames: string[] = [];
                for (let i = 0; i < database.objectStoreNames.length; i++)
                {
                    objectStoreNames.push(<string>database.objectStoreNames.item(i));
                }
                callback(null, objectStoreNames)
            });
        }

        /**
         * 创建对象存储
         * 
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        createObjectStore(dbname: string, objectStroreName: string, callback?: (err: any) => void)
        {
            this.getDatabase(dbname, (err, database) =>
            {
                if (database.objectStoreNames.contains(objectStroreName))
                {
                    callback && callback(null);
                    return;
                }
                database.close();

                delete databases[dbname];

                var request = indexedDB.open(database.name, database.version + 1);
                request.onupgradeneeded = function (event)
                {
                    var newdatabase: IDBDatabase = event.target["result"];
                    newdatabase.createObjectStore(objectStroreName);
                    databases[newdatabase.name] = newdatabase;
                    request.onupgradeneeded = null;
                    callback && callback(null);
                }
                request.onsuccess = function (event)
                {
                    var newdatabase: IDBDatabase = event.target["result"];
                    databases[newdatabase.name] = newdatabase;
                    request.onsuccess = null;
                    callback && callback(null);
                }
                request.onerror = function (event)
                {
                    request.onerror = null;
                    callback && callback(event);
                };
            });
        }

        /**
         * 删除对象存储
         * 
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        deleteObjectStore(dbname: string, objectStroreName: string, callback?: (err: any) => void)
        {
            this.getDatabase(dbname, (err, database) =>
            {
                if (!database.objectStoreNames.contains(objectStroreName))
                {
                    callback && callback(null);
                    return;
                }
                database.close();
                delete databases[dbname];
                var request = indexedDB.open(database.name, database.version + 1);
                request.onupgradeneeded = function (event)
                {
                    var newdatabase: IDBDatabase = event.target["result"];
                    newdatabase.deleteObjectStore(objectStroreName);
                    request.onupgradeneeded = null;
                    callback && callback(null);
                }
                request.onsuccess = function (event)
                {
                    var newdatabase: IDBDatabase = event.target["result"];
                    databases[newdatabase.name] = newdatabase;
                    request.onsuccess = null;
                    callback && callback(event);
                }
                request.onerror = function (event)
                {
                    request.onerror = null;
                    callback && callback(event);
                };
            });
        }

        /**
         * 获取对象存储中所有键列表
         * 
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        getAllKeys(dbname: string, objectStroreName: string, callback?: (err: Error, keys: string[]) => void)
        {
            this.getDatabase(dbname, (err, database) =>
            {
                try
                {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.getAllKeys();
                    request.onsuccess = function (event)
                    {
                        callback && callback(null, event.target["result"]);
                        request.onsuccess = null;
                    };
                } catch (error)
                {
                    callback && callback(error, null);
                }
            });
        }

        /**
         * 获取对象存储中指定键对应的数据
         * 
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param key 键
         * @param callback 完成回调
         */
        objectStoreGet(dbname: string, objectStroreName: string, key: string | number, callback?: (err: Error, data: ArrayBuffer) => void)
        {
            this.getDatabase(dbname, (err, database) =>
            {
                var transaction = database.transaction([objectStroreName], 'readwrite');
                var objectStore = transaction.objectStore(objectStroreName);
                var request = objectStore.get(key);
                request.onsuccess = function (event)
                {
                    var result = event.target["result"];
                    callback && callback(result ? null : new Error(`没有找到资源 ${key}`), result);
                    request.onsuccess = null;
                };
            });
        }

        /**
         * 设置对象存储的键与值，如果不存在指定键则新增否则修改。
         * 
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param key 键
         * @param data 数据
         * @param callback 完成回调
         */
        objectStorePut(dbname: string, objectStroreName: string, key: string | number, data: ArrayBuffer, callback?: (err: Error) => void)
        {
            this.getDatabase(dbname, (err, database) =>
            {
                try
                {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.put(data, key);
                    request.onsuccess = function (event)
                    {
                        callback && callback(null);
                        request.onsuccess = null;
                    };
                } catch (error)
                {
                    callback && callback(error);
                }
            });
        }

        /**
         * 删除对象存储中指定键以及对于数据
         * 
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param key 键
         * @param callback 完成回调
         */
        objectStoreDelete(dbname: string, objectStroreName: string, key: string | number, callback?: (err?: Error) => void)
        {
            this.getDatabase(dbname, (err, database) =>
            {
                try
                {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.delete(key);
                    request.onsuccess = function (event)
                    {
                        callback && callback();
                        request.onsuccess = null;
                    };
                } catch (error)
                {
                    callback && callback(error);
                }
            });
        }

        /**
         * 清空对象存储中数据
         * 
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        objectStoreClear(dbname: string, objectStroreName: string, callback?: (err?: Error) => void)
        {
            this.getDatabase(dbname, (err, database) =>
            {
                try
                {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.clear();
                    request.onsuccess = function (event)
                    {
                        callback && callback();
                        request.onsuccess = null;
                    };
                } catch (error)
                {
                    callback && callback(error);
                }
            });
        }
    }

    _indexedDB = new _IndexedDB();
}