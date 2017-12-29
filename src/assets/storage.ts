interface IDBObjectStore
{
    getAllKeys(): IDBRequest;
}

namespace feng3d
{
    var databases: { [name: string]: IDBDatabase } = {};
    export var storage = {
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
        },
        getDatabase(dbname: string, callback: (err, database: IDBDatabase) => void)
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
            };
            request.onerror = function (event)
            {
                callback(event, <any>null);
            };
        },
        deleteDatabase(dbname: string, callback?: (err) => void)
        {
            var request = indexedDB.deleteDatabase(dbname);
            request.onsuccess = function (event)
            {
                delete databases[dbname];
                callback && callback(null);
            };
            request.onerror = function (event)
            {
                callback && callback(event);
            };
        },
        hasObjectStore(dbname: string, objectStroreName: string, callback: (has: boolean) => void)
        {
            storage.getDatabase(dbname, (err, database) =>
            {
                callback(database.objectStoreNames.contains(objectStroreName));
            });
        },
        getObjectStoreNames(dbname: string, callback: (err: Error | null, objectStoreNames: string[]) => void)
        {
            storage.getDatabase(dbname, (err, database) =>
            {
                var objectStoreNames: string[] = [];
                for (let i = 0; i < database.objectStoreNames.length; i++)
                {
                    objectStoreNames.push(<string>database.objectStoreNames.item(i));
                }
                callback(null, objectStoreNames)
            });
        },
        createObjectStore(dbname: string, objectStroreName: string, callback?: (err) => void)
        {
            storage.getDatabase(dbname, (err, database) =>
            {
                if (database.objectStoreNames.contains(objectStroreName))
                {
                    callback && callback(null);
                    return;
                }
                database.close();
                var request = indexedDB.open(database.name, database.version + 1);
                request.onupgradeneeded = function (event)
                {
                    var newdatabase: IDBDatabase = event.target["result"];
                    newdatabase.createObjectStore(objectStroreName);
                    callback && callback(null);
                }
                request.onsuccess = function (event)
                {
                    var newdatabase: IDBDatabase = event.target["result"];
                    databases[newdatabase.name] = newdatabase;
                }
                request.onerror = function (event)
                {
                    callback && callback(event);
                };
            });
        },
        deleteObjectStore(dbname: string, objectStroreName: string, callback?: (err) => void)
        {
            storage.getDatabase(dbname, (err, database) =>
            {
                if (!database.objectStoreNames.contains(objectStroreName))
                {
                    callback && callback(null);
                    return;
                }
                database.close();
                var request = indexedDB.open(database.name, database.version + 1);
                request.onupgradeneeded = function (event)
                {
                    var newdatabase: IDBDatabase = event.target["result"];
                    newdatabase.deleteObjectStore(objectStroreName);
                    callback && callback(null);
                }
                request.onsuccess = function (event)
                {
                    var newdatabase: IDBDatabase = event.target["result"];
                    databases[newdatabase.name] = newdatabase;
                }
                request.onerror = function (event)
                {
                    callback && callback(event);
                };
            });
        },
        getAllKeys(dbname: string, objectStroreName: string, callback?: (err: Error | null, keys: string[] | null) => void)
        {
            storage.getDatabase(dbname, (err, database) =>
            {
                try
                {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.getAllKeys();
                    request.onsuccess = function (event)
                    {
                        callback && callback(null, event.target["result"]);
                    };
                } catch (error)
                {
                    callback && callback(error, null);
                }
            });
        },
        get(dbname: string, objectStroreName: string, key: string | number, callback?: (err: Error | null, data: any) => void)
        {
            storage.getDatabase(dbname, (err, database) =>
            {
                try
                {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.get(key);
                    request.onsuccess = function (event)
                    {
                        callback && callback(null, event.target["result"]);
                    };
                } catch (error)
                {
                    callback && callback(error, null);
                }
            });
        },
        set(dbname: string, objectStroreName: string, key: string | number, data: any, callback?: (err: Error | null) => void)
        {
            storage.getDatabase(dbname, (err, database) =>
            {
                try
                {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.put(data, key);
                    request.onsuccess = function (event)
                    {
                        callback && callback(null);
                    };
                } catch (error)
                {
                    callback && callback(error);
                }
            });
        },
        delete(dbname: string, objectStroreName: string, key: string | number, callback?: (err?: Error) => void)
        {
            storage.getDatabase(dbname, (err, database) =>
            {
                try
                {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.delete(key);
                    request.onsuccess = function (event)
                    {
                        callback && callback();
                    };
                } catch (error)
                {
                    callback && callback(error);
                }
            });
        },
        clear(dbname: string, objectStroreName: string, callback?: (err?: Error) => void)
        {
            storage.getDatabase(dbname, (err, database) =>
            {
                try
                {
                    var transaction = database.transaction([objectStroreName], 'readwrite');
                    var objectStore = transaction.objectStore(objectStroreName);
                    var request = objectStore.clear();
                    request.onsuccess = function (event)
                    {
                        callback && callback();
                    };
                } catch (error)
                {
                    callback && callback(error);
                }
            });
        }
    }
}