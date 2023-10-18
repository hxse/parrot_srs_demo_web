import {
    showDirectoryPicker,
    showOpenFilePicker,
    showSaveFilePicker,
    getOriginPrivateDirectory
} from 'native-file-system-adapter'
import indexedDbAdapter from 'native-file-system-adapter/src/adapters/indexeddb.js'
import { compatibleZip } from './convert-zip'

const dirHandle = await getOriginPrivateDirectory(indexedDbAdapter)

export async function saveFileSystem(mode = 'indexeddb', key, value) {
    if (mode == 'indexeddb') {
        const fileHandle = await dirHandle.getFileHandle(key, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(value)
        await writable.close()
    }
}

export async function readFileSystem(mode = 'indexeddb') {
    if (mode == 'indexeddb') {
        for await (const [key, value] of dirHandle.entries()) {
            const file = await getFile(value)
            // downloadBlob(file, file.name)
        }
    }
}

export async function deleteFileSystem(mode = 'indexeddb') {
    if (mode == 'indexeddb') {
        for await (const [key, value] of dirHandle.entries()) {
            value.remove()
        }
    }
}


export const pickerOptsFile = {
    types: [
        // {
        //     description: "Text file",
        //     accept: { "text/plain": [".txt", ".json"] },
        // },
        {
            description: 'Zip file',
            accept: {
                'application/zip': ['.zip']
            }
        },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
};


export const pickerOptsDir = {
    types: [
        {
            description: "Text file",
            accept: { "text/plain": [".txt", ".json"] },
        },
        // {
        //     description: 'Zip file',
        //     accept: {
        //         'application/zip': ['.zip']
        //     }
        // },
    ],
    excludeAcceptAllOption: true,
    multiple: false,
};


export async function openFile() {
    const [fileHandle] = await showOpenFilePicker(pickerOptsFile);
    return fileHandle
}

export async function openDir() {
    const dirHandle = await showDirectoryPicker(pickerOptsDir);
    return dirHandle
}

export async function getFile(fileHandle) {
    const fileData = await fileHandle.getFile();
    return fileData
}

export async function saveFile(fileHandle, text) {
    const writableStream = await fileHandle.createWritable();
    await writableStream.write(text);
    await writableStream.close();
}

export async function downloadFile(data) {
    const fileHandle = await showSaveFilePicker(pickerOptsFile);
    const writableStream = await fileHandle.createWritable();
    await writableStream.write(data);
    await writableStream.close();
}


export async function parseDir(dirHandle, mode) {
    const fileArr = []
    const mediaArr = []
    const dirArr = []
    if (mode == 'zip') {
        let obj = dirHandle
        for (let key of Object.keys(obj)) {
            let value = obj[key]
            if (!value.dir) {
                if (key.indexOf('media/') != -1) {
                    mediaArr.push(value)
                } else {
                    fileArr.push(value)
                }
            } else {
                dirArr.push(value)
            }
        }
        for (const fileHandle of [...fileArr, ...mediaArr]) {
            await compatibleZip(fileHandle)
        }
    }
    if (mode == 'dir') {
        for await (const [key, value] of dirHandle.entries()) {
            if (value.kind == 'file') {
                fileArr.push(value)
            }
            if (value.kind == 'directory') {
                if (['media'].indexOf(key) != -1) {
                    for await (const [k, v] of value.entries()) {
                        mediaArr.push(v)
                    }
                    dirArr.push(value)
                }
            }
        }
    }
    return { fileArr: fileArr, mediaArr: mediaArr, dirArr: dirArr }
}


export function downloadBlob(blob, name = 'file.txt') {
    if (
        window.navigator &&
        window.navigator.msSaveOrOpenBlob
    ) return window.navigator.msSaveOrOpenBlob(blob);

    // For other browsers:
    // Create a link pointing to the ObjectURL containing the blob.
    const data = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = data;
    link.download = name;

    // this is necessary as link.click() does not work on the latest firefox
    link.dispatchEvent(
        new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        })
    );

    setTimeout(() => {
        // For Firefox it is necessary to delay revoking the ObjectURL
        window.URL.revokeObjectURL(data);
        link.remove();
    }, 100);
}

