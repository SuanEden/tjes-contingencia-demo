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
let articles=[],indexed=[],error=false,searchTimer=null;
const summaryInput=document.querySelector('#ticketForm [name="problema"]');
const stopWords=new Set(['para','como','com','sem','uma','uns','das','dos','que','por','de','da','do','em','na','no','um','ao','aos','incidente','solicitacao','solicitação']);
function significantTerms(value){return normalize(value).split(/[^a-z0-9]+/).filter(w=>w.length>=3&&!stopWords.has(w)).slice(0,8)}
function readAll(){return new Promise((resolve,reject)=>{
 const opening=indexedDB.open(DB,1);
 opening.onupgradeneeded=()=>{if(!opening.result.objectStoreNames.contains(STORE))opening.result.createObjectStore(STORE,{keyPath:'key'})};
 opening.onerror=()=>reject(opening.error);
 opening.onsuccess=()=>{const db=opening.result;const tx=db.transaction(STORE,'readonly');
 const request=tx.objectStore(STORE).getAll();request.onsuccess=()=>resolve(request.result||[]);request.onerror=()=>reject(request.error);tx.oncomplete=()=>db.close();};
});}
function render(){
 results.replaceChildren();
 const manual=normalize(search.value.trim());
 const summary=summaryInput?normalize(summaryInput.value.trim()):'';
 const q=manual||summary;
 if(error){status.textContent='Não foi possível consultar os artigos armazenados neste navegador.';return}
 if(!articles.length){status.textContent='Nenhum artigo documental disponível neste navegador. Os modelos da Base de Conhecimento continuam acessíveis abaixo.';return}
 if(q.length<3){status.textContent=articles.length+' artigos disponíveis neste navegador. Digite um resumo ou pesquise por título, código ou assunto.';return}
 const terms=significantTerms(q);
 if(!terms.length){status.textContent='Escreva um assunto mais específico para encontrar artigos.';return}
 const matches=[];
 for(const entry of indexed){
  let score=0;
  if(entry.head.includes(q))score+=120;
  if(entry.group.includes(q))score+=60;
  for(const term of terms){
   if(entry.head.includes(term))score+=24;
   else if(entry.group.includes(term))score+=12;
   else if(entry.body.includes(term))score+=3;
  }
  if(score)matches.push({r:entry.article,score});
 }
 matches.sort((a,b)=>b.score-a.score);
 matches.length=Math.min(matches.length,20);
 status.textContent=matches.length+' artigo(s) sugeridos '+(manual?'pela pesquisa':'pelo resumo')+' (máximo 20).';
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
function scheduleRender(){if(searchTimer!==null)clearTimeout(searchTimer);searchTimer=setTimeout(()=>{searchTimer=null;render()},130)}
search.addEventListener('input',scheduleRender);
if(summaryInput)summaryInput.addEventListener('input',scheduleRender);
readAll().then(rows=>{articles=rows;indexed=rows.map(article=>({
 article,head:normalize(String(article.key||'')+' '+String(article.title||'')),
 group:normalize(String(article.category||'')+' '+String(article.group||'')),body:normalize(article.text)
}));render()}).catch(()=>{error=true;render()});
})();
