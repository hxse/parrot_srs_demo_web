import jsZip from 'jszip'
import mime from 'mime';

export function createZip(zipName: string, fileArr: any[], mediaArr: any[], enableDownload = true) {
    const zip = new jsZip();

    // zip.file("Hello.txt", "Hello World\n");
    for (let file of fileArr) {
        zip.file(file.name, file);
    }
    const mediaDir = zip.folder("media");
    for (let file of mediaArr) {
        mediaDir?.file((file.name).split('/').at(-1), file)
    }
    zip.generateAsync({ type: "blob" }).then(function (content) {
        if (enableDownload) {
            downloadUseClickTag(content, zipName)
        }
    });
}
export function createFile(str: string, name: string) {
    const m = mime.getType(name)
    const file = new File([str], name, { type: m === null ? undefined : m });
    return file
}

export async function compatibleZip(fileHandle: any) {
    const zblob = await fileHandle.async("blob");
    const m = mime.getType(fileHandle.name)
    const zfile = new File([zblob], fileHandle.name, { type: m === null ? undefined : m });
    // fileHandle.name = zfile.name
    fileHandle.getFile = () => new Promise((resolve) => resolve(zfile));
}


export function downloadUseClickTag(downfile: any, name: string) {
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
