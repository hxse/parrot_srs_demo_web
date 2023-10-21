import{_ as o}from"./index-601bed5e.js";const p={INVALID:["seeking position failed.","InvalidStateError"],GONE:["A requested file or directory could not be found at the time an operation was processed.","NotFoundError"],MISMATCH:["The path supplied exists, but was not an entry of requested type.","TypeMismatchError"],MOD_ERR:["The object can not be modified in this way.","InvalidModificationError"],SYNTAX:t=>[`Failed to execute 'write' on 'UnderlyingSinkBase': Invalid params passed. ${t}`,"SyntaxError"],SECURITY:["It was determined that certain files are unsafe for access within a Web application, or that too many calls are being made on file resources.","SecurityError"],DISALLOWED:["The request is not allowed by the user agent or the platform in the current context.","NotAllowedError"]},w={writable:globalThis.WritableStream};async function E(t){console.warn("deprecated fromDataTransfer - use `dt.items[0].getAsFileSystemHandle()` instead");const[n,a,e]=await Promise.all([o(()=>import("./memory-d72f8e54.js"),["assets/memory-d72f8e54.js","assets/index-601bed5e.js","assets/index-ceb6ba7c.css"]),o(()=>import("./sandbox-787c10f5.js"),["assets/sandbox-787c10f5.js","assets/index-601bed5e.js","assets/index-ceb6ba7c.css"]),o(()=>import("./index-601bed5e.js").then(r=>r.F),["assets/index-601bed5e.js","assets/index-ceb6ba7c.css"])]),i=new n.FolderHandle("",!1);return i._entries=t.map(r=>r.isFile?new a.FileHandle(r,!1):new a.FolderHandle(r,!1)),new e.FileSystemDirectoryHandle(i)}async function y(t){const{FolderHandle:n,FileHandle:a}=await o(()=>import("./memory-d72f8e54.js"),["assets/memory-d72f8e54.js","assets/index-601bed5e.js","assets/index-ceb6ba7c.css"]),{FileSystemDirectoryHandle:e}=await o(()=>import("./index-601bed5e.js").then(s=>s.F),["assets/index-601bed5e.js","assets/index-ceb6ba7c.css"]),i=Array.from(t.files),r=i[0].webkitRelativePath.split("/",1)[0],_=new n(r,!1);return i.forEach(s=>{const d=s.webkitRelativePath.split("/");d.shift();const m=d.pop(),f=d.reduce((c,l)=>(c._entries[l]||(c._entries[l]=new n(l,!1)),c._entries[l]),_);f._entries[m]=new a(s.name,s,!1)}),new e(_)}async function h(t){const{FileHandle:n}=await o(()=>import("./memory-d72f8e54.js"),["assets/memory-d72f8e54.js","assets/index-601bed5e.js","assets/index-ceb6ba7c.css"]),{FileSystemFileHandle:a}=await o(()=>import("./index-601bed5e.js").then(e=>e.a),["assets/index-601bed5e.js","assets/index-ceb6ba7c.css"]);return Array.from(t.files).map(e=>new a(new n(e.name,e,!1)))}export{w as config,p as errors,E as fromDataTransfer,y as getDirHandlesFromInput,h as getFileHandlesFromInput};
