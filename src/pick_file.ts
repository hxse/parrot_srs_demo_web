import {
    showDirectoryPicker,
    showOpenFilePicker,
} from 'native-file-system-adapter'
import { compatibleZip } from './convert-zip'

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



export async function openFile() {
    const [fileHandle] = await showOpenFilePicker(pickerOptsFile);
    return fileHandle
}

export async function openDir() {
    const dirHandle = await showDirectoryPicker();
    return dirHandle
}

export async function getFile(fileHandle: any) {
    const fileData = await fileHandle.getFile();
    return fileData
}


export async function parseDir(dirHandle: any, mode: any) {
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
                    for await (const [, v] of value.entries()) {
                        mediaArr.push(v)
                    }
                    dirArr.push(value)
                }
            }
        }
    }
    return { fileArr: fileArr, mediaArr: mediaArr, dirArr: dirArr }
}
