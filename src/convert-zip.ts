import jsZip from 'jszip'
import mime from 'mime';

export function createZip(zipName, fileArr, mediaArr, enableDownload = true) {
    const zip = new jsZip();

    // zip.file("Hello.txt", "Hello World\n");
    for (let file of fileArr) {
        zip.file(file.name, file);
    }
    const mediaDir = zip.folder("media");
    for (let file of mediaArr) {
        mediaDir.file((file.name).split('/').at(-1), file)
    }
    zip.generateAsync({ type: "blob" }).then(function (content) {
        if (enableDownload) {
            downloadUseClickTag(content, zipName)
        }
    });
}
export function createFile(str, name) {
    const file = new File([str], name, { type: mime.getType(name) });
    return file
}

export async function compatibleZip(fileHandle) {
    const zblob = await fileHandle.async("blob");
    const zfile = new File([zblob], fileHandle.name, { type: mime.getType(fileHandle.name) });
    // fileHandle.name = zfile.name
    fileHandle.getFile = () => new Promise((resolve) => resolve(zfile));
}


export function downloadUseClickTag(downfile, name) {
    const tmpLink = document.createElement("a");
    const objectUrl = URL.createObjectURL(downfile);

    tmpLink.style.display = 'none';
    tmpLink.href = objectUrl;
    tmpLink.download = name
    document.body.appendChild(tmpLink);
    tmpLink.click();

    document.body.removeChild(tmpLink);
    URL.revokeObjectURL(objectUrl);
}
