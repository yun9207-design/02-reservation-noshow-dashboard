export function downloadText(name:string,text:string,type='text/plain;charset=utf-8'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function readText(file:File){return file.text();}
export function safeCsvCell(value:unknown){const s=String(value??'');const protectedValue=/^[=+@-]/.test(s)?`'${s}`:s;return /[",\n\r]/.test(protectedValue)?`"${protectedValue.replaceAll('"','""')}"`:protectedValue;}
