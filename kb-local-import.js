(function(){
'use strict';
// Consulta local da biblioteca documental. Não há importação nem envio de arquivos.
const DB='tjes_kb_importada_v1',STORE='artigos';
const panel=document.querySelector('#view-scripts .panel'),search=document.querySelector('#scriptSearch'),scriptArea=document.querySelector('#scriptArea');
if(!panel||!search||!scriptArea)return;
const wrap=document.createElement('section');wrap.id='kbImportedLibrary';
wrap.className='knowledge-document-library';
wrap.innerHTML='<h3>Artigos da biblioteca</h3><p class="hint" id="kbLocalStatus" aria-live="polite">Consultando documentos disponíveis...</p><div id="kbLocalResults"></div>';
scriptArea.before(wrap);
const status=wrap.querySelector('#kbLocalStatus'),results=wrap.querySelector('#kbLocalResults');
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
let articles=[],error=false;
function readAll(){return new Promise((resolve,reject)=>{
 const opening=indexedDB.open(DB,1);
 opening.onupgradeneeded=()=>{if(!opening.result.objectStoreNames.contains(STORE))opening.result.createObjectStore(STORE,{keyPath:'key'})};
 opening.onerror=()=>reject(opening.error);
 opening.onsuccess=()=>{const db=opening.result;const tx=db.transaction(STORE,'readonly');
 const request=tx.objectStore(STORE).getAll();request.onsuccess=()=>resolve(request.result||[]);request.onerror=()=>reject(request.error);tx.oncomplete=()=>db.close();};
});}
function render(){
 results.replaceChildren();
 const q=normalize(search.value.trim());
 if(error){status.textContent='Não foi possível consultar os artigos armazenados neste navegador.';return}
 if(!articles.length){status.textContent='Nenhum artigo documental disponível neste navegador. Os modelos da Base de Conhecimento continuam acessíveis abaixo.';return}
 if(q.length<2){status.textContent=articles.length+' artigos documentais disponíveis neste navegador. Pesquise pelo título, código ou assunto para consultar.';return}
 const matches=articles.map(r=>{
  const title=normalize(String(r.key||'')+' '+String(r.title||''));
  const group=normalize(String(r.category||'')+' '+String(r.group||''));
  const body=normalize(r.text);
  const score=(title.includes(q)?4:0)+(group.includes(q)?2:0)+(body.includes(q)?1:0);
  return {r,score}
 }).filter(x=>x.score).sort((a,b)=>b.score-a.score).slice(0,40);
 status.textContent=matches.length+' artigo(s) encontrados na biblioteca local (máximo 40 por pesquisa).';
 for(const {r} of matches){
  const card=document.createElement('div');card.className='script';
  const top=document.createElement('div');top.className='row between';
  const title=document.createElement('strong');title.textContent=(String(r.key||'').split('|')[0]||'Artigo')+' — '+String(r.title||'Documento');
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar texto';
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(String(r.text||''));copy.textContent='Copiado'}catch{copy.textContent='Não foi possível copiar'}};
  top.append(title,copy);card.append(top);
  const metadata=document.createElement('p');metadata.className='knowledge-summary';metadata.textContent=[r.category,r.group,r.pages?r.pages+' página(s)':''].filter(Boolean).join(' • ');
  card.append(metadata);
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Consultar conteúdo do artigo';
  const body=document.createElement('pre');body.textContent=String(r.text||'Documento sem texto pesquisável').slice(0,45000);
  details.append(summary,body);card.append(details);results.append(card);
 }
}
search.addEventListener('input',render);
readAll().then(rows=>{articles=rows;render()}).catch(()=>{error=true;render()});
})();
