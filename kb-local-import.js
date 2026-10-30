(function(){
'use strict';
// Biblioteca documental distribuída com o site; preserva somente a consulta local como contingência.
const DB='tjes_kb_importada_v1',STORE='artigos';
const panel=document.querySelector('#view-scripts .panel'),search=document.querySelector('#scriptSearch'),scriptArea=document.querySelector('#scriptArea');
if(!panel||!search||!scriptArea)return;
const wrap=document.createElement('section');wrap.id='kbImportedLibrary';
wrap.className='knowledge-document-library';
wrap.innerHTML='<h3>Artigos da biblioteca</h3><p class="hint" id="kbLocalStatus" aria-live="polite">Carregando os artigos da Base de Conhecimento...</p><div id="kbLocalResults"></div>';
scriptArea.before(wrap);
const status=wrap.querySelector('#kbLocalStatus'),results=wrap.querySelector('#kbLocalResults');
const sidebar=document.querySelector('#kbSide'),sideSearch=document.querySelector('#kbSearch');
const sideLibrary=document.createElement('section');
sideLibrary.id='kbSideImportedResults';
sideLibrary.setAttribute('aria-label','Artigos encontrados na biblioteca');
sideLibrary.innerHTML='<h3>Artigos encontrados</h3><p class="kb-small" id="kbSideImportedStatus" aria-live="polite"></p><div id="kbSideImportedItems"></div>';
const sideStatus=sideLibrary.querySelector('#kbSideImportedStatus'),sideItems=sideLibrary.querySelector('#kbSideImportedItems');
if(sidebar)sidebar.append(sideLibrary);

const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
let articles=[],indexed=[],error=false,searchTimer=null;
const summaryInput=document.querySelector('#ticketForm [name="problema"]');
const stopWords=new Set(['para','como','com','uma','uns','das','dos','que','por','de','da','do','em','na','no','um','ao','aos','incidente','solicitacao','solicitar','usuario','usuaria','requerente','problema','sistema','erro','preciso','precisa','gostaria','informando','relata','relatando','acesso','realizar','fazer','esta','estao','tem','ter','mais','qual','quando','durante']);
const synonymGroups=[
 ['senha','reset','redefinir','redefinicao','recuperar','recuperacao','troca senha','esqueceu senha','alterar senha','desbloquear senha'],
 ['login','logon','logar','autenticacao','autenticar','entrar','conectar','conexao','credenciais'],
 ['bloqueio','bloqueado','bloqueada','desbloqueio','desbloquear','intrusao','conta travada'],
 ['pje','processo judicial eletronico','pjeoffice','assinador','assinatura digital'],
 ['certificado digital','token','cartao criptografico','certificacao','icp brasil','assinatura digital'],
 ['email','e-mail','correio eletronico','webmail','groupwise','caixa postal','mensagem eletronica'],
 ['impressora','impressao','imprimir','toner','fotocondutor','papel','fila de impressao'],
 ['rede','internet','wifi','wi-fi','conectividade','sem conexao','ethernet','proxy'],
 ['lento','lentidao','travando','travamento','demora','nao responde','congelando'],
 ['instalar','instalacao','reinstalar','configurar','configuracao','atualizar','atualizacao'],
 ['cadastro','cadastrar','inclusao','incluir','criar usuario','novo usuario'],
 ['permissao','perfil','habilitacao','liberacao','conceder acesso','autorizacao'],
 ['navegador','browser','firefox','mozilla','chrome','google chrome','edge'],
 ['chamado','ticket','assyst','central de servicos','service desk','atendimento'],
 ['sei','sistema eletronico de informacoes','processo administrativo'],
 ['documento','arquivo','anexo','pdf','digitalizar','digitalizacao'],
 ['telefone','ramal','telefonia','ligacao','aparelho telefonico'],
 ['erro 403','403','acesso negado','sem permissao'],
 ['erro 404','404','pagina nao encontrada','link quebrado']
];
const synonymMap=new Map();
for(const group of synonymGroups){
 const terms=[...new Set(group.flatMap(s=>normalize(s).split(/[^a-z0-9]+/).filter(x=>x.length>=4)))];
 for(const term of terms){
  if(!synonymMap.has(term))synonymMap.set(term,new Set());
  for(const synonym of terms)if(synonym!==term)synonymMap.get(term).add(synonym);
 }
}
function significantTerms(value){
 return [...new Set(normalize(value).split(/[^a-z0-9]+/).filter(w=>w.length>=3&&!stopWords.has(w)))].slice(0,12);
}
function articleSections(article){
 const text=String(article.text||'');
 const start=text.search(/\bPROBLEMA\b/i),solution=text.search(/\bSOLUÇÃO\b/i);
 const bodyStart=Math.max(0,start);
 const issue=start>=0?text.slice(bodyStart+8,solution>start?solution:bodyStart+1200):'';
 const header=text.slice(0,Math.max(0,start>=0?start:450)).replace(/\b(GSC|CRIADO EM|PUBLICADO EM|VISUALIZAÇÕES|USOS|ÚLTIMA VISUALIZAÇÃO)\b/gi,' ');
 return {issue:normalize(issue.slice(0,1800)),header:normalize(header.slice(0,500))};
}
function makeEntry(article){
 const sections=articleSections(article),heading=articleHeading(article);
 const primary=normalize(String(article.key||'').split('|')[0]+' '+heading+' '+sections.header);
 const category=normalize(String(article.category||'')+' '+String(article.group||''));
 return {article,head:primary,group:category,issue:sections.issue,body:normalize(article.text)};
}
function relevance(entry,query,terms){
 let score=0,matched=0;
 if(entry.head.includes(query))score+=125;
 if(entry.issue.includes(query))score+=105;
 if(entry.group.includes(query))score+=45;
 for(const term of terms){
  if(entry.head.includes(term)){score+=32;matched++;continue}
  if(entry.issue.includes(term)){score+=25;matched++;continue}
  if(entry.group.includes(term)){score+=14;matched++;continue}
  if(entry.body.includes(term)){score+=4;matched++;continue}
  const alternatives=synonymMap.get(term);
  if(alternatives){
   let best=0;
   for(const alias of alternatives){
    if(entry.head.includes(alias)){best=12;break}
    if(entry.issue.includes(alias))best=Math.max(best,10);
    else if(entry.body.includes(alias))best=Math.max(best,2);
   }
   if(best){score+=best;matched++}
  }
 }
 if(terms.length>=3&&matched<2&&!entry.head.includes(query)&&!entry.issue.includes(query))return 0;
 return score+(matched===terms.length&&matched>1?20:0);
}
function readAll(){return new Promise((resolve,reject)=>{
 const opening=indexedDB.open(DB,1);
 opening.onupgradeneeded=()=>{if(!opening.result.objectStoreNames.contains(STORE))opening.result.createObjectStore(STORE,{keyPath:'key'})};
 opening.onerror=()=>reject(opening.error);
 opening.onsuccess=()=>{const db=opening.result;const tx=db.transaction(STORE,'readonly');
 const request=tx.objectStore(STORE).getAll();request.onsuccess=()=>resolve(request.result||[]);request.onerror=()=>reject(request.error);tx.oncomplete=()=>db.close();};
});}
async function loadArticles(){
 try{
  const response=await fetch('./biblioteca-tjes.json',{cache:'no-cache'});
  if(!response.ok)throw Error('Biblioteca indisponível (HTTP '+response.status+')');
  const payload=await response.json();
  if(payload.version!==1||!Array.isArray(payload.records)||payload.records.length!==472)throw Error('Índice de artigos inválido');
  const unique=new Set();
  return payload.records.map((record,i)=>{
   if(!record||typeof record!=='object'||typeof record.id!=='string'||!record.id||typeof record.text!=='string'||record.text.length>100000||unique.has(record.id))throw Error('Artigo inválido '+i);
   unique.add(record.id);
   return {key:record.id+'|'+(record.path||i),title:String(record.title||record.id),category:String(record.category||''),group:String(record.group||''),pages:Number(record.pages)||0,text:record.text};
  });
 }catch(e){
  const local=await readAll();
  if(!local.length)throw e;
  status.textContent='Biblioteca online temporariamente indisponível; utilizando os artigos já armazenados neste navegador.';
  return local;
 }
}
function articleHeading(article){
 const lines=String(article.text||'').split('\n').map(s=>s.trim()).filter(Boolean);
 const code=String(article.key||'').split('|')[0];
 const first=lines.findIndex(line=>line.startsWith(code));
 const relevant=lines.slice(first<0?0:first+1);
 const parts=[];
 for(const line of relevant){
  if(/^(GSC|CRIADO EM|PUBLICADO|VISUALIZAÇÕES|PROBLEMA|SOLUÇÃO|AMBIENTE|CAUSA|—)/i.test(line))break;
  if(/^(faq|cat\d+)$/i.test(line))break;
  if(line.length<180)parts.push(line);
  if(parts.length===2)break;
 }
 return parts.join(' ').trim()||String(article.title||code).replace(/^[A-Z0-9]+\s*[·–—-]\s*(CONHECIMENTO|OUTRO)\s*$/i,'')||code;
}
function render(){
 results.replaceChildren();
 const manual=normalize(search.value.trim());
 const summary=summaryInput?normalize(summaryInput.value.trim()):'';
 const q=manual||summary;
 if(error){status.textContent='Não foi possível carregar a biblioteca. Atualize a página e tente novamente.';return}
 if(!articles.length){status.textContent='Artigos indisponíveis. Os modelos da Base de Conhecimento continuam acessíveis abaixo.';return}
 if(q.length<3){status.textContent=articles.length+' artigos disponíveis na Base de Conhecimento. Digite um resumo ou pesquise por título, código ou assunto.';return}
 const terms=significantTerms(q);
 if(!terms.length){status.textContent='Escreva um assunto mais específico para encontrar artigos.';return}
 const matches=[];
 for(const entry of indexed){
  const score=relevance(entry,q,terms);
  if(score>0)matches.push({r:entry.article,score});
 }
 matches.sort((a,b)=>b.score-a.score);
 matches.length=Math.min(matches.length,20);
 status.textContent=matches.length+' artigo(s) sugeridos '+(manual?'pela pesquisa':'pelo resumo')+' (máximo 20).';
 for(const {r} of matches){
  const card=document.createElement('div');card.className='script';
  const top=document.createElement('div');top.className='row between';
  const title=document.createElement('strong');title.textContent=(String(r.key||'').split('|')[0]||'Artigo')+' — '+articleHeading(r);
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

function renderSideLibrary(){
 if(!sidebar)return;
 const manual=normalize(sideSearch?.value.trim()||'');
 const summary=normalize(summaryInput?.value.trim()||'');
 const query=manual||summary;
 sideItems.replaceChildren();
 if(error||!indexed.length){sideLibrary.hidden=true;return}
 if(query.length<3){sideLibrary.hidden=true;return}
 const terms=significantTerms(query);
 if(!terms.length){sideLibrary.hidden=true;return}
 const found=[];
 for(const entry of indexed){
  const score=relevance(entry,query,terms);
  if(score>0)found.push({article:entry.article,score});
 }
 found.sort((a,b)=>b.score-a.score);
 sideLibrary.hidden=false;
 sideStatus.textContent=found.length+' artigo(s) encontrado(s). Role a lista para ver todos.';
 if(!found.length){sideItems.textContent='Nenhum artigo encontrado para este termo.';return}
 const fragment=document.createDocumentFragment();
 for(const {article} of found){
  const details=document.createElement('details');details.className='kb-side-article';
  const heading=document.createElement('summary');
  heading.textContent=(String(article.key||'').split('|')[0]||'Artigo')+' — '+articleHeading(article);
  const info=document.createElement('small');info.textContent=[article.category,article.group].filter(Boolean).join(' • ');
  const pre=document.createElement('pre');pre.textContent=String(article.text||'').slice(0,45000);
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar texto';
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(String(article.text||''));copy.textContent='Copiado!'}catch{copy.textContent='Falha ao copiar'}};
  details.append(heading,info,pre,copy);fragment.append(details);
 }
 sideItems.append(fragment);
}
function scheduleRender(){if(searchTimer!==null)clearTimeout(searchTimer);searchTimer=setTimeout(()=>{searchTimer=null;render();renderSideLibrary()},130)}
search.addEventListener('input',scheduleRender);
if(sideSearch)sideSearch.addEventListener('input',scheduleRender);
if(summaryInput)summaryInput.addEventListener('input',scheduleRender);
loadArticles().then(rows=>{articles=rows;indexed=rows.map(makeEntry);render();renderSideLibrary()}).catch(()=>{error=true;render();renderSideLibrary()});
})();
