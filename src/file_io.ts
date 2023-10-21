import {
    showSaveFilePicker,
    getOriginPrivateDirectory
} from 'native-file-system-adapter'
import indexedDbAdapter from 'native-file-system-adapter/src/adapters/indexeddb.js'
import { getFile } from './pick_file'


const dirHandle = await getOriginPrivateDirectory(indexedDbAdapter)

export async function saveFileSystem(mode = 'indexeddb', key: string, value: any) {
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
            console.log(key, file)
            // downloadBlob(file, file.name)
        }
    }
}

export async function deleteFileSystem(mode = 'indexeddb') {
    if (mode == 'indexeddb') {
        for await (const [key, value] of dirHandle.entries()) {
            value.remove()
            console.log(key)
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



export async function saveFile(fileHandle: any, text: any) {
    const writableStream = await fileHandle.createWritable();
    await writableStream.write(text);
    await writableStream.close();
}

export async function downloadFile(data: any) {
    const fileHandle = await showSaveFilePicker(pickerOptsFile);
    const writableStream = await fileHandle.createWritable();
    await writableStream.write(data);
    await writableStream.close();
}



export function downloadBlob(blob: any, name = 'file.txt') {

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

