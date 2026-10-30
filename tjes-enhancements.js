(function(){
'use strict';
// Recursos adicionais isolados: não alteram a grade nem os campos do novo atendimento.
const KEY='tjes_assyst_transfer_v1';
const $=sel=>document.querySelector(sel);
let transfers={};
try{const obj=JSON.parse(localStorage.getItem(KEY)||'{}');if(obj&&typeof obj==='object'&&!Array.isArray(obj))transfers=obj}catch{}
function record(id){return transfers[id]||{status:'Pendente',protocol:'',date:''}}
function persist(id,value){
 const next={...transfers,[id]:{status:value.status,protocol:String(value.protocol||'').slice(0,100),date:value.date||''}};
 localStorage.setItem(KEY,JSON.stringify(next));transfers=next;
}
const list=$('#view-list .panel');
const controls=document.createElement('div');controls.className='tjes-extra-filters';
controls.innerHTML='<label>Situação Assyst <select id="tjesTransferFilter"><option value="">Todas</option><option>Pendente</option><option>Lançado</option><option>Conferido</option></select></label><label>Categoria <select id="tjesCategoryFilter"><option value="">Todas</option><option>PJe</option><option>Senha / acesso</option><option>Certificado</option><option>Equipamento</option><option>Rede</option><option>Outros</option></select></label><label><input id="tjesWithAttachments" type="checkbox"> Somente com anexos</label><button type="button" id="tjesRefreshAttachments">Atualizar anexos</button>';
const table=$('#rows')?.closest('table');
if(list&&table)list.insertBefore(controls,table.closest('.tablewrap'));
const attachments=new Map();let refreshing=false;
function category(t){const q=(t.problema||'').toLocaleLowerCase('pt-BR');if(/pje|processo judicial|pjeoffice/.test(q))return 'PJe';if(/senha|login|acesso|autentic|bloque/.test(q))return 'Senha / acesso';if(/certificado|token|assinatura/.test(q))return 'Certificado';if(/impress|monitor|computador|mouse|teclado/.test(q))return 'Equipamento';if(/internet|rede|vpn|wifi|conex/.test(q))return 'Rede';return 'Outros'}
async function refreshAttachmentCounts(){
 if(refreshing||typeof window.ticketAttachments?.getTicketFiles!=='function')return;
 refreshing=true;
 try{
  for(const t of data.tickets){
   try{attachments.set(t.id,(await window.ticketAttachments.getTicketFiles(t.id)).length)}catch{}
  }
  const existingIds=new Set(data.tickets.map(t=>t.id));
  for(const id of attachments.keys())if(!existingIds.has(id))attachments.delete(id);
  renderList();
 }finally{refreshing=false}
}
function applyFilters(){
 if(!table)return;
 const status=$('#tjesTransferFilter')?.value||'',cat=$('#tjesCategoryFilter')?.value||'',only=$('#tjesWithAttachments')?.checked;
 for(const tr of table.querySelectorAll('#rows tr')){
  const id=tr.dataset.tjesTicketId;if(!id)continue;
  const t=data.tickets.find(x=>x.id===id);
  tr.hidden=!t||(status&&record(id).status!==status)||(cat&&category(t)!==cat)||(only&&!(attachments.get(id)>0));
 }
}
function renderList(){
 if(!table)return;
 const head=table.querySelector('thead tr');
 if(head&&!head.querySelector('.tjes-extra-heading')){
  for(const label of ['Anexos','Lançamento no Assyst']){
   const th=document.createElement('th');th.className='tjes-extra-heading';th.textContent=label;head.append(th)
  }
 }
 for(const tr of table.querySelectorAll('#rows tr')){
  const cb=tr.querySelector('.txt-ticket-check'),id=cb?.dataset.id;if(!id)continue;
  tr.dataset.tjesTicketId=id;
  tr.querySelectorAll('.tjes-extra-cell').forEach(el=>el.remove());
  const attachCell=document.createElement('td');attachCell.className='tjes-extra-cell';
  const count=attachments.get(id);
  attachCell.textContent=count==null?'…':count?count+' 📎':'—';
  tr.append(attachCell);
  const cell=document.createElement('td');cell.className='tjes-extra-cell';
  const state=record(id);
  const select=document.createElement('select');select.className='tjes-status-select';select.setAttribute('aria-label','Situação de lançamento no Assyst');for(const option of ['Pendente','Lançado','Conferido']){const el=document.createElement('option');el.textContent=option;select.append(el)}select.value=state.status;
  const protocol=document.createElement('input');protocol.className='tjes-protocol-input';protocol.placeholder='Protocolo Assyst';protocol.maxLength=100;protocol.value=state.protocol;protocol.setAttribute('aria-label','Protocolo oficial no Assyst');
  const save=()=>{const previous=record(id);const value={status:select.value,protocol:protocol.value,date:previous.status!==select.value?new Date().toISOString():previous.date};try{persist(id,value);renderDashboardMetrics()}catch(e){alert('Falha ao salvar o controle de lançamento: '+e.message)}};
  select.onchange=save;protocol.onchange=save;
  cell.append(select,protocol);tr.append(cell);
 }
 applyFilters();
}
for(const id of ['#tjesTransferFilter','#tjesCategoryFilter','#tjesWithAttachments'])$(id)?.addEventListener('change',applyFilters);
$('#tjesRefreshAttachments')?.addEventListener('click',refreshAttachmentCounts);
const dash=$('#view-dashboard'),summary=document.createElement('section');
summary.id='tjesDashboardExtras';summary.className='tjes-dashboard-extras';
summary.innerHTML='<h3>Indicadores de contingência</h3><div class="tjes-metrics"><div><small>Total de chamados</small><strong id="tjesMetricTotal">0</strong></div><div><small>Aguardando Assyst</small><strong id="tjesMetricPending">0</strong></div><div><small>Lançados</small><strong id="tjesMetricPosted">0</strong></div><div><small>Conferidos</small><strong id="tjesMetricChecked">0</strong></div><div><small>Com anexos</small><strong id="tjesMetricFiles">0</strong></div></div><p id="tjesCategorySummary" class="hint"></p>';
if(dash){const target=dash.querySelector('.dash-overview');target?.insertAdjacentElement('afterend',summary)}
function renderDashboardMetrics(){
 if(!dash)return;
 const date=$('#dashboardDate')?.value;
 const filtered=data.tickets.filter(t=>!date||localDay(new Date(t.created))===date);
 const count=(value)=>filtered.filter(t=>record(t.id).status===value).length;
 $('#tjesMetricTotal').textContent=filtered.length;
 $('#tjesMetricPending').textContent=count('Pendente');
 $('#tjesMetricPosted').textContent=count('Lançado');
 $('#tjesMetricChecked').textContent=count('Conferido');
 $('#tjesMetricFiles').textContent=filtered.filter(t=>(attachments.get(t.id)||0)>0).length;
 const tally={};for(const t of filtered){const cat=category(t);tally[cat]=(tally[cat]||0)+1}
 $('#tjesCategorySummary').textContent='Por categoria (estimativa baseada no resumo): '+(Object.entries(tally).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+': '+v).join(' • ')||'nenhum chamado');
}

// Orientação contextual na lateral; o formulário original permanece intacto.
const guide=document.createElement('section');guide.id='tjesKnowledgeGuide';guide.hidden=true;
guide.innerHTML='<strong>Dados a conferir neste conhecimento</strong><p class="kb-small" id="tjesGuideText"></p>';
$('#kbSide')?.append(guide);
function showGuide(item){
 if(!item){guide.hidden=true;return}
 const text=String(item.txt||''),tokens=[...new Set([...text.matchAll(/\[([^\]\n]{2,45})\]/g)].map(x=>x[1]))].slice(0,14);
 guide.hidden=false;
 $('#tjesGuideText').textContent='Base: '+item.title+'. '+(tokens.length?'Verifique os campos: '+tokens.join(', ')+'. ':'Confira a situação informada pelo usuário. ')+'Registre apenas ações efetivamente realizadas; a solução da base é uma orientação, não comprovação de execução.';
}
window.tjesEnhance={renderList,renderDashboardMetrics,refreshAttachmentCounts,readTransfer:record,showGuide};
renderList();renderDashboardMetrics();refreshAttachmentCounts();
})();