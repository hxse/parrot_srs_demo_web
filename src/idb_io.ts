
import { openDB } from 'idb';

export const idb1 = await openDB("db1", 4, {
    upgrade(db) {
        db.createObjectStore('file');
        db.createObjectStore('media');
    }
})

export async function saveIndexeddb(mode, storeName, key, value) {
    // example: saveIndexeddb('put', 'store1', "hello", "world")
    // example: saveIndexeddb('clear', 'store1')
    switch (mode) {
        case 'get':
            return (await idb1).get(storeName, key);
            break;
        case 'put':
            return (await idb1).put(storeName, value, key);
            break;
        case 'delete':
            return (await idb1).delete(storeName, key);
            break;
        case 'clear':
            return (await idb1).clear(storeName);
            break;
        case 'getAllKeys':
            return (await idb1).getAllKeys(storeName);
            break;
        default:
            break;
    }
}

export async function store(mode, obj) {
    // 写store主要是为了以后兼容多个接口, 比如兼容IndexedDB_API和restful api
    switch (mode) {
        case 'get':
            return await saveIndexeddb('get', obj.storeName, obj.key)
            break;
        case 'put':
            return await saveIndexeddb('put', obj.storeName, obj.key, obj.value)
            break;
        case 'update':
            try {
                console.log(obj)
                const res = await saveIndexeddb('get', obj.storeName, obj.key)
                console.log('找到了数据库', res)
            } catch (error) {
                console.log('没有找到数据库', error)
            }
            break
        case 'delete':
            break;
        case 'clear':
            return await saveIndexeddb('clear', obj.storeName)
            break;
        case 'getAllKeys':
            return await saveIndexeddb('getAllKeys', obj.storeName)
            break;
        case 'load':
            break
        case 'save':
            break
        default:
            break;
    }

}
