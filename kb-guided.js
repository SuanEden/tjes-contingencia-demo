(function(){
'use strict';
const host=document.querySelector('#view-scripts .panel');if(!host)return;
const section=document.createElement('section');section.id='kbGuided';section.style.cssText='padding:16px;margin:14px 0;border:1px solid #637f93;border-radius:10px;background:var(--surface,#fff);color:var(--text,#22374b)';
section.innerHTML='<h3 style="margin-top:0">🧭 Consulta guiada de atendimento</h3><p class="hint">Pesquise um problema e abra o artigo. Consulte a fonte antes de aplicar. A descrição de chamado é um rascunho, não um procedimento certificado.</p><div class="row" style="gap:8px;flex-wrap:wrap"><input id="guidedSearch" placeholder="Ex.: senha, SATE, PJe, certificado" aria-label="Pesquisar problemas na biblioteca" style="flex:1;min-width:200px"><button id="guidedRefresh" type="button">Atualizar resultados</button></div><p id="guidedCount" class="hint" aria-live="polite"></p><div id="guidedItems"></div>';
host.insertBefore(section,document.getElementById('knowledgeEditor'));
const search=section.querySelector('#guidedSearch'),count=section.querySelector('#guidedCount'),items=section.querySelector('#guidedItems');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
const dbName='tjes_kb_importada_v1',storeName='artigos';
function load(){return new Promise((resolve,reject)=>{const op=indexedDB.open(dbName,1);op.onupgradeneeded=()=>{if(!op.result.objectStoreNames.contains(storeName))op.result.createObjectStore(storeName,{keyPath:'key'});};op.onerror=()=>reject(op.error);op.onsuccess=()=>{const db=op.result,tx=db.transaction(storeName,'readonly'),req=tx.objectStore(storeName).getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();};});}
function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
async function copy(text,button){try{await navigator.clipboard.writeText(text);button.textContent='✓ Copiado';}catch{button.textContent='Falha ao copiar';}}
function addBtn(box,label,text){const b=node('button',label);b.type='button';b.style.margin='4px 6px 4px 0';b.addEventListener('click',()=>copy(text,b));box.append(b);}
let records=[];
function render(){items.replaceChildren();const term=norm(search.value.trim());if(term.length<2){count.textContent=records.length+' artigos locais. Digite pelo menos 2 caracteres.';return;}
const found=records.map(r=>({r,rank:(norm(r.key+' '+r.title).includes(term)?3:0)+(norm(r.category+' '+r.group).includes(term)?2:0)+(norm(r.text).includes(term)?1:0)})).filter(x=>x.rank).sort((a,b)=>b.rank-a.rank).slice(0,35);
count.textContent=found.length+' resultado(s) apresentados (máximo 35).';
if(!found.length){items.append(node('p','Nenhum procedimento encontrado.'));return;}
for(const {r} of found){const d=document.createElement('details');d.style.cssText='margin:8px 0;border:1px solid #8a9dab;border-radius:8px;padding:11px;background:rgba(128,147,167,.08)';
const title=node('summary',(r.key.split('|')[0]||'Artigo')+' · '+r.title);title.style.cssText='cursor:pointer;font-weight:600';d.append(title);
const meta=node('p',[r.category,r.group,r.pages?'PDF · '+r.pages+' páginas':''].filter(Boolean).join(' • '),'hint');d.append(meta);
const heading=node('h4','Orientação documentada');heading.style.margin='12px 0 8px';d.append(heading);
const preview=node('pre',(r.text||'Documento sem texto pesquisável').slice(0,24000));preview.style.cssText='white-space:pre-wrap;overflow:auto;max-height:350px;padding:12px;border:1px solid #b5cbd8;border-radius:6px;background:rgba(128,147,167,.06);color:inherit;font:13px/1.55 inherit';d.append(preview);
const buttons=node('div');addBtn(buttons,'Copiar procedimento',r.text||'');
const draft='Referência consultada: '+(r.key.split('|')[0]||r.title)+'\nAssunto: '+r.title+'\nDescrição da solicitação: [preencher com o relato real]\nValidações efetuadas: [preencher após executar]\nTratativa e resultado: [preencher após confirmar]';
addBtn(buttons,'Copiar modelo de chamado',draft);d.append(buttons);
const warning=node('p','Não copie dados pessoais, senhas ou informação institucional para serviços públicos. Confirme as etapas com o procedimento oficial.','hint');d.append(warning);items.append(d);}}
async function refresh(){count.textContent='Carregando base local...';try{records=await load();render();}catch(e){count.textContent='Não foi possível acessar a biblioteca local: '+e.message;}}
search.addEventListener('input',render);section.querySelector('#guidedRefresh').addEventListener('click',refresh);
const fileInput=document.getElementById('kbLocalFile');if(fileInput)fileInput.addEventListener('change',()=>setTimeout(refresh,700));
refresh();
})();