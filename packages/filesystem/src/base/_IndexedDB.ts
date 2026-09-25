const databases: { [name: string]: IDBDatabase } = {};

/**
 * 从 IndexedDB 事件目标中提取结果
 *
 * IndexedDB 请求事件的 target 上会挂载 result 字段，但 TS 内置 Event 类型未声明该字段，
 * 这里通过泛型约束安全地取出结果。
 *
 * @param event IndexedDB 请求事件
 * @returns 事件目标的 result 字段
 */
function getIDBTargetResult<T>(event: Event): T
{
    return (event.target as IDBRequest<T>).result;
}

/**
 *
 */
export class _IndexedDB
{
    /**
     * 数据库状态
     */
    private _dbStatus: {
        [dbname: string]: {
            /**
             * 状态
             */
            status: DBStatus,
            /**
             * 开启或者升级成功回调
             */
            onsuccessCallbacks: ((err: Error | Event, database: IDBDatabase) => void)[],
            /**
             * 升级回调
             */
            onupgradeneededCallbacks: ((newdatabase: IDBDatabase) => void)[],
        }
    } = {};

    /**
     * 是否支持 indexedDB
     */
    support()
    {
        if (typeof indexedDB === 'undefined')
        {
            return false;
        }

        return true;
    }

    /**
     * 获取数据库，如果不存在则新建数据库
     *
     * @param dbname 数据库名称
     */
    async getDatabase(dbname: string)
    {
        if (databases[dbname])
        {
            return databases[dbname] as IDBDatabase;
        }

        const database: IDBDatabase = await new Promise((resolve, reject) =>
        {
            this._open(dbname, (err, database) =>
            {
                if (err)
                {
                    reject(err);
                }
                else
                {
                    resolve(database);
                }
            });
        });

        return database;
    }

    /**
     * 打开或者升级数据库
     *
     * @param dbname 数据库名称
     * @param callback 完成回调
     * @param upgrade 是否升级数据库
     * @param onupgrade 升级回调
     */
    private _open(dbname: string, callback: (err: Error | Event, database: IDBDatabase) => void, upgrade = false, onupgrade?: (newdatabase: IDBDatabase) => void)
    {
        if (!this._dbStatus[dbname]) this._dbStatus[dbname] = { status: DBStatus.unOpen, onsuccessCallbacks: [], onupgradeneededCallbacks: [] };

        this._dbStatus[dbname].onsuccessCallbacks.push(callback);
        if (upgrade)
        {
            console.assert(!!onupgrade);
            this._dbStatus[dbname].onupgradeneededCallbacks.push(onupgrade);
        }
        if (this._dbStatus[dbname].status === DBStatus.opening || this._dbStatus[dbname].status === DBStatus.upgrading) return;

        let request: IDBOpenDBRequest;

        if (!upgrade)
        {
            request = indexedDB.open(dbname);
            this._dbStatus[dbname].status = DBStatus.opening;
        }
        else
        {
            const oldDatabase = databases[dbname];

            oldDatabase.close();
            delete databases[dbname];

            request = indexedDB.open(dbname, oldDatabase.version + 1);
            this._dbStatus[dbname].status = DBStatus.upgrading;
        }

        request.onupgradeneeded = (event) =>
        {
            const newdatabase: IDBDatabase = getIDBTargetResult<IDBDatabase>(event);

            request.onupgradeneeded = null;

            const callbacks = this._dbStatus[dbname].onupgradeneededCallbacks.concat();

            this._dbStatus[dbname].onupgradeneededCallbacks.length = 0;
            callbacks.forEach((element) =>
            {
                element(newdatabase);
            });
        };
        request.onsuccess = (event) =>
        {
            databases[dbname] = getIDBTargetResult<IDBDatabase>(event);
            request.onsuccess = null;

            this._dbStatus[dbname].status = DBStatus.opened;

            const callbacks = this._dbStatus[dbname].onsuccessCallbacks.concat();

            this._dbStatus[dbname].onsuccessCallbacks.length = 0;
            callbacks.forEach((element) =>
            {
                element(null, databases[dbname]);
            });
        };
        request.onerror = (event) =>
        {
            request.onerror = null;

            this._dbStatus[dbname].status = DBStatus.error;

            const callbacks = this._dbStatus[dbname].onsuccessCallbacks.concat();

            this._dbStatus[dbname].onsuccessCallbacks.length = 0;
            callbacks.forEach((element) =>
            {
                element(event, null);
            });
        };
    }

    /**
     * 删除数据库
     *
     * @param dbname 数据库名称
     */
    async deleteDatabase(dbname: string)
    {
        await new Promise((resolve, reject) =>
        {
            const request = indexedDB.deleteDatabase(dbname);

            request.onsuccess = function (_event)
            {
                delete databases[dbname];
                resolve(null);
                request.onsuccess = null;
            };
            request.onerror = function (event)
            {
                reject(event);
                request.onerror = null;
            };
        });
    }

    /**
     * 是否存在指定的对象存储
     *
     * @param dbname 数据库名称
     * @param objectStroreName 对象存储名称
     */
    async hasObjectStore(dbname: string, objectStroreName: string)
    {
        const database = await this.getDatabase(dbname);

        return database.objectStoreNames.contains(objectStroreName);
    }

    /**
     * 获取对象存储名称列表
     *
     * @param dbname 数据库
     */
    async getObjectStoreNames(dbname: string)
    {
        const database = await this.getDatabase(dbname);
        const objectStoreNames: string[] = [];
        for (let i = 0; i < database.objectStoreNames.length; i++)
        {
            objectStoreNames.push(database.objectStoreNames.item(i));
        }

        return objectStoreNames;
    }

    /**
     * 创建对象存储
     *
     * @param dbname 数据库名称
     * @param objectStroreName 对象存储名称
     */
    async createObjectStore(dbname: string, objectStroreName: string)
    {
        const database = await this.getDatabase(dbname);

        if (database.objectStoreNames.contains(objectStroreName))
        {
            return;
        }

        await new Promise((resolve, reject) =>
        {
            this._open(dbname, (err, database) =>
            {
                if (err)
                {
                    reject(err);

                    return;
                }
                resolve(database);
            }, true, (newdatabase: IDBDatabase) =>
            {
                newdatabase.createObjectStore(objectStroreName);
            });
        });
    }

    /**
     * 删除对象存储
     *
     * @param dbname 数据库名称
     * @param objectStroreName 对象存储名称
     */
    async deleteObjectStore(dbname: string, objectStroreName: string)
    {
        const database = await this.getDatabase(dbname);
        if (!database.objectStoreNames.contains(objectStroreName))
        {
            return;
        }

        await new Promise((resolve, reject) =>
        {
            this._open(dbname, (err, database) =>
            {
                if (err)
                {
                    reject(err);
                }
                else
                {
                    resolve(database);
                }
            }, true, (newdatabase: IDBDatabase) =>
            {
                newdatabase.deleteObjectStore(objectStroreName);
            });
        });
    }

    /**
     * 获取对象存储中所有键列表
     *
     * @param dbname 数据库名称
     * @param objectStroreName 对象存储名称
     */
    async getAllKeys(dbname: string, objectStroreName: string)
    {
        const database = await this.getDatabase(dbname);

        const keys: string[] = await new Promise<string[]>((resolve, reject) =>
        {
            try
            {
                const transaction = database.transaction([objectStroreName], 'readwrite');
                const objectStore = transaction.objectStore(objectStroreName);
                const request = objectStore.getAllKeys();

                request.onsuccess = function (event)
                {
                    resolve(getIDBTargetResult<IDBValidKey[]>(event) as string[]);
                    request.onsuccess = null;
                };
            }
            catch (error)
            {
                reject(error);
            }
        });

        return keys;
    }

    /**
     * 获取对象存储中指定键对应的数据
     *
     * @param dbname 数据库名称
     * @param objectStroreName 对象存储名称
     * @param key 键
     */
    async objectStoreGet(dbname: string, objectStroreName: string, key: string | number)
    {
        const database = await this.getDatabase(dbname);
        const data = await new Promise((resolve, reject) =>
        {
            const transaction = database.transaction([objectStroreName], 'readwrite');
            const objectStore = transaction.objectStore(objectStroreName);
            const request = objectStore.get(key);

            request.onsuccess = function (event)
            {
                const result = getIDBTargetResult<unknown>(event);

                resolve(result);

                request.onsuccess = null;
            };
            request.onerror = (ev) =>
            {
                reject(ev);
                request.onerror = null;
            };
        });

        return data;
    }

    /**
     * 设置对象存储的键与值，如果不存在指定键则新增否则修改。
     *
     * @param dbname 数据库名称
     * @param objectStroreName 对象存储名称
     * @param key 键
     * @param data 数据
     */
    async objectStorePut(dbname: string, objectStroreName: string, key: string | number, data: unknown)
    {
        const database = await this.getDatabase(dbname);
        await new Promise((resolve, reject) =>
        {
            try
            {
                const transaction = database.transaction([objectStroreName], 'readwrite');
                const objectStore = transaction.objectStore(objectStroreName);
                const request = objectStore.put(data, key);

                request.onsuccess = function (_event)
                {
                    resolve(null);
                    request.onsuccess = null;
                };
            }
            catch (error)
            {
                reject(error);
            }
        });
    }

    /**
     * 删除对象存储中指定键以及对于数据
     *
     * @param dbname 数据库名称
     * @param objectStroreName 对象存储名称
     * @param key 键
     */
    async objectStoreDelete(dbname: string, objectStroreName: string, key: string | number)
    {
        const database = await this.getDatabase(dbname);
        await new Promise((resolve, reject) =>
        {
            try
            {
                const transaction = database.transaction([objectStroreName], 'readwrite');
                const objectStore = transaction.objectStore(objectStroreName);
                const request = objectStore.delete(key);

                request.onsuccess = function (_event)
                {
                    resolve(undefined);
                    request.onsuccess = null;
                };
            }
            catch (error)
            {
                reject(error);
            }
        });
    }

    /**
     * 清空对象存储中数据
     *
     * @param dbname 数据库名称
     * @param objectStroreName 对象存储名称
     */
    async objectStoreClear(dbname: string, objectStroreName: string)
    {
        const database = await this.getDatabase(dbname);
        await new Promise((resolve, reject) =>
        {
            try
            {
                const transaction = database.transaction([objectStroreName], 'readwrite');
                const objectStore = transaction.objectStore(objectStroreName);
                const request = objectStore.clear();

                request.onsuccess = function (_event)
                {
                    resolve(undefined);
                    request.onsuccess = null;
                };
            }
            catch (error)
            {
                reject(error);
            }
        });
    }
}

/**
 *
 */
export const _indexedDB = new _IndexedDB();

/**
 * 数据库状态
 */
enum DBStatus
{
    /**
     * 未开启
     */
    unOpen,

    /**
     * 正在开启中
     */
    opening,

    /**
     * 已开启
     */
    opened,

    /**
     * 正在升级中
     */
    upgrading,

    /**
     * 开启或者升级失败
     */
    error,
}
