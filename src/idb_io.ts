
import { openDB } from 'idb';

export async function createIdb() {
    return await openDB("db1", 4, {
        upgrade(db) {
            db.createObjectStore('file');
            db.createObjectStore('media');
        }
    })
}
// export const idb1 =

export async function saveIndexeddb(idb: any, mode: string, storeName: string, key: string = '', value: any = undefined) {
    // example: saveIndexeddb('put', 'store1', "hello", "world")
    // example: saveIndexeddb('clear', 'store1')
    switch (mode) {
        case 'get':
            return (await idb).get(storeName, key);
            break;
        case 'put':
            return (await idb).put(storeName, value, key);
            break;
        case 'delete':
            return (await idb).delete(storeName, key);
            break;
        case 'clear':
            return (await idb).clear(storeName);
            break;
        case 'getAllKeys':
            return (await idb).getAllKeys(storeName);
            break;
        default:
            break;
    }
}

export async function store(idb: any, mode: string, obj: any) {
    // 写store主要是为了以后兼容多个接口, 比如兼容IndexedDB_API和restful api
    switch (mode) {
        case 'get':
            return await saveIndexeddb(idb, 'get', obj.storeName, obj.key)
            break;
        case 'put':
            return await saveIndexeddb(idb, 'put', obj.storeName, obj.key, obj.value)
            break;
        case 'update':
            try {
                console.log(obj)
                const res = await saveIndexeddb(idb, 'get', obj.storeName, obj.key)
                console.log('找到了数据库', res)
            } catch (error) {
                console.log('没有找到数据库', error)
            }
            break
        case 'delete':
            break;
        case 'clear':
            return await saveIndexeddb(idb, 'clear', obj.storeName)
            break;
        case 'getAllKeys':
            return await saveIndexeddb(idb, 'getAllKeys', obj.storeName)
            break;
        case 'load':
            break
        case 'save':
            break
        default:
            break;
    }

}
