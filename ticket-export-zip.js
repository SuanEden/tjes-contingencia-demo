(function(){
'use strict';
// Exportador ZIP sem dependências externas (ZIP STORE/sem compressão).
const encoder=new TextEncoder();
const u16=(arr,p,n)=>{arr[p]=n&255;arr[p+1]=(n>>>8)&255};
const u32=(arr,p,n)=>{arr[p]=n&255;arr[p+1]=(n>>>8)&255;arr[p+2]=(n>>>16)&255;arr[p+3]=(n>>>24)&255};
const crcTable=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let j=0;j<8;j++)c=c&1?(0xedb88320^(c>>>1)):(c>>>1);crcTable[n]=c>>>0}
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function safeFile(name){return String(name||'arquivo').replace(/[\/\\:*?"<>|\x00-\x1f]/g,'_').replace(/^\.+/,'_').slice(0,110)||'arquivo'}
function makeZip(entries){
 const chunks=[],central=[];let offset=0;
 for(const [path,content] of entries){
  const name=encoder.encode(path),bytes=content instanceof Uint8Array?content:encoder.encode(String(content));
  const checksum=crc32(bytes),local=new Uint8Array(30+name.length),c=new Uint8Array(46+name.length);
  u32(local,0,0x04034b50);u16(local,4,20);u16(local,6,0x0800);u16(local,8,0);
  u32(local,14,checksum);u32(local,18,bytes.length);u32(local,22,bytes.length);u16(local,26,name.length);local.set(name,30);
  u32(c,0,0x02014b50);u16(c,4,20);u16(c,6,20);u16(c,8,0x0800);u16(c,10,0);
  u32(c,16,checksum);u32(c,20,bytes.length);u32(c,24,bytes.length);u16(c,28,name.length);u32(c,42,offset);c.set(name,46);
  chunks.push(local,bytes);central.push(c);offset+=local.length+bytes.length;
 }
 const centralOffset=offset,centralLength=central.reduce((n,x)=>n+x.length,0),end=new Uint8Array(22);
 u32(end,0,0x06054b50);u16(end,8,entries.length);u16(end,10,entries.length);
 u32(end,12,centralLength);u32(end,16,centralOffset);
 return new Blob([...chunks,...central,end],{type:'application/zip'});
}
function downloadBlob(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function exportZip(tickets,textForTickets){
 if(!tickets.length){alert('Não há atendimentos selecionados.');return}
 if(typeof window.ticketAttachments?.getTicketFiles!=='function'){alert('Aguarde os anexos carregarem e tente novamente.');return}
 const entries=[],txtExtras=new Map();
 for(let i=0;i<tickets.length;i++){
  const ticket=tickets[i],files=await window.ticketAttachments.getTicketFiles(ticket.id);
  const folder='anexos/atendimento_'+String(i+1).padStart(2,'0')+'_'+safeFile(ticket.chamado||ticket.id).slice(0,65);
  const names=[];
  for(let j=0;j<files.length;j++){
   const file=files[j];
   if(!(file.blob instanceof Blob))throw Error('Anexo sem dados: '+file.name);
   const name=String(j+1).padStart(2,'0')+'_'+safeFile(file.name);
   const data=new Uint8Array(await file.blob.arrayBuffer());
   entries.push([folder+'/'+name,data]);names.push(name);
  }
  txtExtras.set(ticket.id,names.length?'\n• ANEXOS ('+names.length+'):\n'+names.map(n=>'  - '+folder+'/'+n).join('\n'):'');
 }
 const content=textForTickets(tickets,txtExtras);
 entries.unshift(['atendimentos.txt',encoder.encode('\uFEFF'+content.replace(/\n/g,'\r\n'))]);
 entries.push(['LEIA-ME.txt',encoder.encode('Este pacote contém os chamados e seus anexos exportados do navegador.\r\nOs arquivos permanecem locais e não foram enviados a servidores.\r\nTransfira somente por meios autorizados pela instituição.\r\n')]);
 if(entries.length>65535)throw Error('Número de arquivos excede o limite do ZIP.');
 const blob=makeZip(entries);
 downloadBlob(blob,'TJES_atendimentos_com_anexos_'+new Date().toISOString().slice(0,10)+'.zip');
}
window.tjesExportZip=exportZip;
})();