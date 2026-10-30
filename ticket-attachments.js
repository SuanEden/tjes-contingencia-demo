(function(){
'use strict';
const input=document.getElementById('ticketAttachmentInput'),list=document.getElementById('ticketAttachmentList');
if(!input||!list)return;
const DB='tjes_ticket_anexos_v1',STORE='files',MAX_FILE=8*1024*1024,MAX_TOTAL=25*1024*1024;
const saveButton=document.getElementById('ticketAttachmentSave'),saveStatus=document.getElementById('ticketAttachmentSaveStatus');
function statusMessage(message){if(saveStatus)saveStatus.textContent=message}

let currentId=null,pending=[],removed=new Set(),saved=[],generation=0,urls=[];
function dbOpen(){return new Promise((resolve,reject)=>{
 const req=indexedDB.open(DB,1);
 req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE)){const store=db.createObjectStore(STORE,{keyPath:'id'});store.createIndex('ticketId','ticketId',{unique:false})}};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
})}
async function transact(mode,task){const db=await dbOpen();try{
 return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);let result;
 tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||new Error('Erro no armazenamento'));tx.onabort=()=>reject(tx.error||new Error('Transação cancelada'));
 try{task(store,v=>{result=v})}catch(e){tx.abort();reject(e)}
 })}finally{db.close()}}
function getTicketFiles(id){if(!id)return Promise.resolve([]);return transact('readonly',(store,done)=>{
 const idx=store.index('ticketId');const req=idx.getAll(id);req.onsuccess=()=>done(req.result||[]);
})}
function readable(size){return size<1024?size+' B':size<1048576?(size/1024).toFixed(1)+' KB':(size/1048576).toFixed(1)+' MB'}
const toggle=document.getElementById('ticketAttachmentToggle'),counter=document.getElementById('ticketAttachmentCount');
function closeDialog(){document.getElementById('ticketAttachmentDialog')?.close?.()}
function updateCount(count){if(!counter)return;counter.hidden=count===0;counter.textContent=String(count);toggle?.setAttribute('title',count?count+' anexo(s) · clique para abrir':'Anexos do chamado')}
function resetUrls(){for(const url of urls)URL.revokeObjectURL(url);urls=[]}
function display(){
 resetUrls();list.replaceChildren();
 const rows=[...saved.filter(f=>!removed.has(f.id)),...pending.map(f=>({id:f.id,name:f.file.name,size:f.file.size,type:f.file.type,blob:f.file,temporary:true}))];
 updateCount(rows.length);
 for(const item of rows){
  const row=document.createElement('div');row.className='ticket-attachment-row';
  const name=document.createElement('small');name.textContent=item.name+' ('+readable(item.size)+')';row.append(name);
  const actions=document.createElement('div');actions.className='ticket-attachment-actions';
  const blob=item.blob;
  if(blob){
   const url=URL.createObjectURL(blob);urls.push(url);
   const link=document.createElement('a');link.href=url;link.download=item.name;link.textContent='Baixar';link.className='button';actions.append(link);
   if(/^image\/(jpeg|png|gif|webp)$/.test(item.type)||item.type==='application/pdf'){
    const see=document.createElement('button');see.type='button';see.textContent='Visualizar';see.onclick=()=>window.open(url,'_blank','noopener,noreferrer');actions.append(see);
   }
  }
  const remove=document.createElement('button');remove.type='button';remove.textContent='Remover';remove.setAttribute('aria-label','Remover '+item.name);
  remove.onclick=()=>{if(item.temporary)pending=pending.filter(f=>f.id!==item.id);else removed.add(item.id);statusMessage('Alterações ainda não salvas.');display()};actions.append(remove);row.append(actions);list.append(row);
 }
 if(!rows.length){const hint=document.createElement('p');hint.className='hint';hint.textContent='Nenhum arquivo anexado.';list.append(hint)}
}
function reset(){closeDialog();statusMessage('');generation++;currentId=null;pending=[];removed.clear();saved=[];input.value='';display()}
async function load(id){closeDialog();statusMessage('');const n=++generation;currentId=id;pending=[];removed.clear();saved=[];input.value='';display();try{const rows=await getTicketFiles(id);if(n!==generation)return;saved=rows;display()}catch(e){if(n===generation)alert('Não foi possível carregar os anexos: '+e.message)}}
input.addEventListener('change',()=>{
 for(const file of Array.from(input.files||[])){
  if(file.size>MAX_FILE){alert(file.name+': limite de 8 MB por arquivo.');continue}
  if(/\.(exe|bat|cmd|ps1|js|html?|svg|msi|scr)$/i.test(file.name)){alert(file.name+': tipo de arquivo não permitido.');continue}
  const all=[...saved.filter(f=>!removed.has(f.id)),...pending.map(f=>({size:f.file.size}))];
  if(all.reduce((sum,f)=>sum+Number(f.size||0),0)+file.size>MAX_TOTAL){alert('Limite de 25 MB por chamado.');break}
  pending.push({id:crypto.randomUUID(),file});
 }
 input.value='';statusMessage('Alterações ainda não salvas.');display()
});
async function save(id){
 if(!pending.length&&!removed.size)return;
 const toAdd=pending.slice(),toRemove=[...removed],total=saved.filter(x=>!removed.has(x.id)).reduce((sum,f)=>sum+f.size,0)+toAdd.reduce((sum,f)=>sum+f.file.size,0);
 if(total>MAX_TOTAL)throw Error('Limite de anexos excedido');
 await transact('readwrite',store=>{
  for(const oldId of toRemove)store.delete(oldId);
  for(const {id:fileId,file} of toAdd)store.put({id:fileId,ticketId:id,name:file.name,size:file.size,type:file.type||'application/octet-stream',blob:file,created:new Date().toISOString()});
 });
 pending=[];removed.clear();
 saved=await getTicketFiles(id);currentId=id;display()
}
if(saveButton)saveButton.addEventListener('click',async()=>{
 if(saveButton.disabled)return;
 if(!pending.length&&!removed.size){statusMessage('Não há alterações para salvar.');return}
 if(!currentId){
  statusMessage('Anexos selecionados. Para concluir, clique em “Salvar atendimento” no formulário.');
  closeDialog();return;
 }
 saveButton.disabled=true;
 statusMessage('Salvando anexos neste navegador...');
 try{await save(currentId);statusMessage('Anexos salvos com sucesso neste navegador.')}
 catch(e){statusMessage('Erro ao salvar: '+(e?.message||'verifique o armazenamento do navegador'))}
 finally{saveButton.disabled=false}
});
async function removeTicket(id){await transact('readwrite',store=>{
 const req=store.index('ticketId').openCursor(IDBKeyRange.only(id));
 req.onsuccess=()=>{const cursor=req.result;if(cursor){cursor.delete();cursor.continue()}};
})}
window.ticketAttachments={reset,load,save,removeTicket};
display();
})();
