(function(){
'use strict';
const $=s=>document.querySelector(s);
const box=$('#view-backup .transfer-panel');if(!box)return;
const panel=document.createElement('section');panel.className='chief-export-panel';
panel.innerHTML='<h3>Compartilhar relatório com a chefia</h3><p class="hint">Gera o XML dos chamados de hoje e abre o compartilhamento do dispositivo. Selecione o Teams para compartilhar o arquivo e a mensagem juntos.</p><div class="chief-export-fields"><label>Destinatário de teste no Teams <input type="email" id="chiefRecipient" value="luis.filho@lanlink.com.br" readonly aria-readonly="true"></label></div><div class="row" style="margin-top:10px"><button type="button" class="primary" id="chiefExport">↗ Compartilhar relatório com a chefia</button><span class="hint" id="chiefStatus" aria-live="polite"></span></div><p class="hint">O compartilhamento exige sua confirmação no Teams. O XML contém dados dos atendimentos; compartilhe somente com destinatários autorizados.</p>';
const transferGrid=box.querySelector('.transfer-grid');
if(transferGrid)transferGrid.insertAdjacentElement('afterend',panel);else box.append(panel);
const CHIEF_RECIPIENT='luis.filho@lanlink.com.br';
$('#chiefRecipient').value=CHIEF_RECIPIENT;
const columns=['Referência','Data/hora de registro','Relógio de ANS parou','Última Ação por Nome','Inativo?','Resolução até','Nome do produto','Item','Categoria','Confirmação de DPS necessária','Salas do edifício','Nome afetado','Telefone de contato','Ramal de contato','Resumo','Descrição','Status do atendimento','ID local'];
const esc=s=>String(s??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const fmtDate=value=>{const d=new Date(value);if(Number.isNaN(d.getTime()))return '';return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getFullYear()).slice(-2)+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const onlyToday=()=>{const today=localDay(new Date());return data.tickets.filter(t=>t.created&&!Number.isNaN(new Date(t.created).getTime())&&localDay(new Date(t.created))===today).sort((a,b)=>String(a.created).localeCompare(String(b.created)))};
const product=t=>{const text=(t.problema||'').toLocaleLowerCase('pt-BR');if(/pje|pjeoffice/.test(text))return ['Sistemas PJe','PJE'];if(/impressora|monitor|notebook|computador|equipamento/.test(text))return ['Equipamentos','EQUIPAMENTO'];if(/certificado|token/.test(text))return ['Certificado Digital','CERTIFICADO_DIGITAL'];if(/rede|vpn|internet|wifi/.test(text))return ['Rede','REDE'];return ['Contingência','ATENDIMENTO_LOCAL']};
function rowValues(t,operator){
 const [group,item]=product(t);
 const status=window.tjesEnhance?.readTransfer?.(t.id)?.status||'Pendente';
 const reference=String(t.chamado||'').trim()||'CONT-'+String(t.id||'').replace(/[^a-z0-9-]/ig,'').slice(0,20);
 return [reference,fmtDate(t.created),'',operator,'','',group,item,'ATENDIMENTO_CONTINGENCIA','',t.sala||t.edificio||'',t.nome||'',t.telefone||'',t.ramal||'',t.problema||'',t.descricao||'',status,t.id||''];
}
function xmlFor(tickets,operator){
 const row=values=>' <row>\n'+values.map(v=>'  <column>'+esc(v)+'</column>').join('\n')+'\n </row>';
 return '<?xml version="1.0" encoding="UTF-8"?>\n<table>\n'+row(columns)+'\n'+tickets.map(t=>row(rowValues(t,operator))).join('\n')+'\n</table>\n';
}
function download(name,txt){
 const blob=new Blob([txt],{type:'application/xml;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
const notice=document.createElement('dialog');
notice.className='chief-export-dialog';
notice.setAttribute('aria-labelledby','chiefNoticeTitle');
notice.innerHTML='<div class="chief-dialog-content"><div class="chief-dialog-icon" aria-hidden="true">↗</div><h2 id="chiefNoticeTitle">Você será redirecionado ao Teams</h2><p>O relatório será baixado no seu computador e a conversa com o destinatário será aberta no Microsoft Teams.</p><ol><li>No Teams, clique em <strong>Anexar arquivo</strong>.</li><li>Selecione o relatório XML que acabou de ser baixado.</li><li>Confira a mensagem e clique em <strong>Enviar</strong>.</li></ol><p class="chief-dialog-note">Importante: o arquivo não é anexado automaticamente. Você precisa selecioná-lo e confirmar o envio no Teams.</p><div class="chief-dialog-actions"><button type="button" id="chiefCancel">Cancelar</button><button type="button" class="primary" id="chiefContinue">Continuar para o Teams</button></div></div>';
document.body.append(notice);
const dialogStyle=document.createElement('style');
dialogStyle.textContent='.chief-export-dialog{color-scheme:light;background:#fff!important;color:#26374a!important;width:min(520px,calc(100% - 32px));padding:0;border:1px solid #d5e0e9;border-radius:14px;box-shadow:0 22px 70px #10283b55;max-height:calc(100vh - 32px);overflow:auto}.chief-export-dialog::backdrop{background:rgba(12,28,43,.68);backdrop-filter:blur(3px)}.chief-export-dialog .chief-dialog-content{padding:26px;background:#fff!important;color:#26374a!important}.chief-export-dialog .chief-dialog-content *{color:inherit}.chief-export-dialog .chief-dialog-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:#e5f2fb;color:#17649e;font-size:24px;font-weight:700;margin-bottom:15px}.chief-export-dialog .chief-dialog-content h2{font-size:21px;line-height:1.3;margin:0 0 10px;color:#1e3d58!important}.chief-export-dialog .chief-dialog-content p{color:#42566a!important;line-height:1.55;margin:8px 0}.chief-export-dialog .chief-dialog-content ol{padding-left:22px;color:#42566a!important;line-height:1.7;margin:15px 0}.chief-export-dialog .chief-dialog-content li{padding-left:2px;margin:3px 0;color:#42566a!important}.chief-export-dialog .chief-dialog-content strong{color:#26374a!important}.chief-export-dialog .chief-dialog-note{padding:11px 13px;background:#fff7e5!important;color:#59451d!important;border-left:4px solid #d39b28;border-radius:4px;font-size:13px}.chief-export-dialog .chief-dialog-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:22px;flex-wrap:wrap}.chief-export-dialog .chief-dialog-actions button{padding:10px 15px;border-radius:7px;background:#f1f5f9!important;color:#26374a!important;border:1px solid #bdcbd8!important}.chief-export-dialog .chief-dialog-actions button.primary{background:#17649e!important;color:#fff!important;border-color:#17649e!important}.chief-export-dialog .chief-dialog-actions button:focus-visible{outline:3px solid #83bce5;outline-offset:2px}@media(max-width:480px){.chief-export-dialog .chief-dialog-content{padding:20px}.chief-export-dialog .chief-dialog-actions{flex-direction:column-reverse}.chief-export-dialog .chief-dialog-actions button{width:100%}}';
document.head.append(dialogStyle);
$('#chiefExport').addEventListener('click',()=>notice.showModal());
$('#chiefCancel').addEventListener('click',()=>notice.close());
async function exportReport(){
 const recipient=CHIEF_RECIPIENT,tickets=onlyToday();
 if(!tickets.length){$('#chiefStatus').textContent='Nenhum atendimento criado hoje neste navegador.';return}
 const date=localDay(new Date()),fileName='TJES_chefia_'+date+'.xml';
 const msg='Olá! Segue o relatório TJES de '+new Date().toLocaleDateString('pt-BR')+', enviado pela equipe TJES. Total: '+tickets.length+' chamado(s).';
 const teams='https://teams.microsoft.com/l/chat/0/0?users='+encodeURIComponent(recipient)+'&message='+encodeURIComponent(msg+' Arquivo: '+fileName+'.');
 // A abertura ocorre diretamente no clique de confirmação do pop-up para evitar bloqueio do navegador.
 const chat=window.open('about:blank','_blank');
 const blob=new Blob([xmlFor(tickets,'Equipe TJES')],{type:'application/xml;charset=utf-8'});
 const file=new File([blob],fileName,{type:'application/xml'});
 try{
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
   await navigator.share({title:'Relatório diário TJES',text:msg,files:[file]});
   if(chat)chat.close();
   $('#chiefStatus').textContent='Selecione Microsoft Teams no compartilhamento, confira o destinatário e confirme o envio.';
   return;
  }
  download(fileName,await blob.text());
  if(chat)chat.location.href=teams;
  $('#chiefStatus').textContent='XML baixado. '+(chat?'Conversa do Teams aberta.':'O navegador bloqueou a nova janela;')+' No Teams, clique em Anexar, selecione '+fileName+' e envie a mensagem.';
 }catch(e){
  if(e?.name==='AbortError'){if(chat)chat.close();$('#chiefStatus').textContent='Compartilhamento cancelado. Nenhum envio foi realizado.';return}
  download(fileName,await blob.text());
  if(chat)chat.location.href=teams;
  $('#chiefStatus').textContent='XML baixado. '+(chat?'Conversa do Teams aberta.':'Pop-up bloqueado: permita pop-ups para este site ou abra o Teams manualmente.')+' No Teams, clique em Anexar e selecione '+fileName+'.';
 }
}
$('#chiefContinue').addEventListener('click',()=>{
 notice.close();
 exportReport();
});

// Importação local reversível do XML de relatório gerado pelo sistema.
const importPanel=document.createElement('section');
importPanel.className='chief-xml-import';
importPanel.innerHTML='<h3>Importar atendimentos de um relatório XML</h3><p class="hint">Selecione um XML exportado em “Compartilhar relatório com a chefia”. Os atendimentos novos serão acrescentados aos seus registros locais, sem substituir os existentes.</p><div class="row"><input type="file" id="chiefXmlFile" accept=".xml,text/xml,application/xml" aria-label="Selecionar relatório XML" style="max-width:360px"><button type="button" id="chiefXmlAnalyze">Analisar XML</button></div><p id="chiefXmlFeedback" role="status" aria-live="polite" class="hint"></p><div id="chiefXmlPreview" hidden><p id="chiefXmlSummary"></p><div style="overflow-x:auto;max-height:280px"><table><thead><tr><th>Referência</th><th>Data</th><th>Usuário</th><th>Resumo</th><th>Resultado</th></tr></thead><tbody id="chiefXmlRows"></tbody></table></div><div class="row" style="margin-top:12px"><button type="button" class="primary" id="chiefXmlConfirm">Adicionar atendimentos novos</button><button type="button" id="chiefXmlCancel">Cancelar</button></div></div>';
panel.insertAdjacentElement('afterend',importPanel);
let pendingChiefImport=null;
const inputXml=$('#chiefXmlFile'),feedbackXml=$('#chiefXmlFeedback'),previewXml=$('#chiefXmlPreview');
const normalizeReference=v=>String(v||'').trim().toLocaleLowerCase('pt-BR');
const dateFromReport=value=>{
 const m=/^(\d{2})\/(\d{2})\/(\d{2}|\d{4}) (\d{2}):(\d{2})$/.exec(String(value||'').trim());
 if(!m)throw Error('Data/hora inválida no relatório: '+String(value||'').slice(0,35));
 const yyyy=m[3].length===2?2000+Number(m[3]):Number(m[3]);
 const day=Number(m[1]),month=Number(m[2]),hour=Number(m[4]),minute=Number(m[5]);
 const d=new Date(yyyy,month-1,day,hour,minute);
 if(d.getFullYear()!==yyyy||d.getMonth()!==month-1||d.getDate()!==day||d.getHours()!==hour||d.getMinutes()!==minute)throw Error('Data inexistente no XML.');
 return d.toISOString();
};
const dateKey=iso=>{
 const d=new Date(iso);
 if(Number.isNaN(d.getTime()))return '';
 return [d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes()].join('-');
};
const duplicateKey=t=>normalizeReference(t.chamado)+'|'+dateKey(t.created);
function readChiefXML(xmlString){
 if(/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xmlString))throw Error('XML com declarações externas não é permitido.');
 const doc=new DOMParser().parseFromString(xmlString,'application/xml');
 if(doc.querySelector('parsererror')||doc.documentElement?.localName!=='table')throw Error('O arquivo não é um XML de relatório válido.');
 const rows=Array.from(doc.documentElement.children);
 if(rows.length<2||rows.length>10001||rows.some(r=>r.tagName!=='row'))throw Error('O XML não contém atendimentos válidos ou excede 10.000 linhas.');
 const cells=r=>Array.from(r.children).map(c=>{
  if(c.tagName!=='column'||c.children.length)throw Error('Estrutura XML inesperada.');
  return (c.textContent||'').trim();
 });
 const headers=cells(rows[0]);
 if(headers.length!==columns.length||headers.some((h,i)=>h!==columns[i]))throw Error('Cabeçalho incompatível. Selecione um XML gerado pela opção de envio à chefia.');
 const tickets=[];
 for(let i=1;i<rows.length;i++){
  const values=cells(rows[i]);
  if(values.length!==headers.length)throw Error('Linha '+(i+1)+' com número de colunas incorreto.');
  const val=name=>values[headers.indexOf(name)];
  const created=dateFromReport(val('Data/hora de registro'));
  const chamado=val('Referência'),nome=val('Nome afetado'),problema=val('Resumo');
  if(!chamado||!problema)throw Error('Linha '+(i+1)+' sem referência ou resumo.');
  if(values.some(v=>v.length>20000))throw Error('Linha '+(i+1)+' contém um campo muito grande.');
  const idSource=val('ID local');
  const statusOriginal=val('Status do atendimento');
  tickets.push({
   id:/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(idSource)?idSource:crypto.randomUUID(),
   chamado,created,updated:created,nome,
   telefone:val('Telefone de contato'),ramal:val('Ramal de contato'),
   sala:val('Salas do edifício'),edificio:'',
   problema,descricao:val('Descrição'),resolucao:'',
   status:['Pendente','Registrado','Resolvido','Transferido ao sistema oficial'].includes(statusOriginal)?statusOriginal:'Pendente',
   panelId:null
  });
 }
 return tickets;
}
function evaluateChiefImport(incoming){
 const keys=new Set(data.tickets.map(duplicateKey));
 const ids=new Set(data.tickets.map(t=>String(t.id)));
 const fresh=[],dupes=[];
 for(const raw of incoming){
  const key=duplicateKey(raw);
  if(keys.has(key)){dupes.push(raw);continue;}
  keys.add(key);
  const t={...raw};
  if(ids.has(String(t.id)))t.id=crypto.randomUUID();
  ids.add(String(t.id));
  fresh.push(t);
 }
 return {fresh,dupes};
}
function resetChiefPreview(){
 pendingChiefImport=null;previewXml.hidden=true;$('#chiefXmlRows').replaceChildren();
}
inputXml.addEventListener('change',()=>{resetChiefPreview();feedbackXml.textContent='';});
$('#chiefXmlCancel').addEventListener('click',()=>{resetChiefPreview();feedbackXml.textContent='Importação cancelada. Nenhum registro foi alterado.';});
$('#chiefXmlAnalyze').addEventListener('click',async()=>{
 resetChiefPreview();
 if(locked){feedbackXml.textContent='O armazenamento local está bloqueado. Importe apenas após resolver o carregamento dos dados.';return;}
 const file=inputXml.files?.[0];
 if(!file){feedbackXml.textContent='Selecione um arquivo XML antes de analisar.';return;}
 if(file.size>5*1024*1024){feedbackXml.textContent='XML muito grande. Limite: 5 MB.';return;}
 try{
  const incoming=readChiefXML(await file.text());
  const {fresh,dupes}=evaluateChiefImport(incoming);
  pendingChiefImport=incoming;
  $('#chiefXmlSummary').textContent='Encontrados: '+incoming.length+' atendimento(s). Novos: '+fresh.length+'. Já existentes/repetidos: '+dupes.length+'.';
  const accepted=new Set(fresh.map(duplicateKey));
  const tbody=$('#chiefXmlRows');
  for(const t of incoming.slice(0,200)){
   const tr=document.createElement('tr');
   for(const value of [t.chamado,new Date(t.created).toLocaleString('pt-BR'),t.nome,t.problema,accepted.has(duplicateKey(t))?'Novo':'Duplicado']){
    const td=document.createElement('td');td.textContent=value||'—';tr.append(td);
   }
   tbody.append(tr);
  }
  if(incoming.length>200){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='Prévia limitada aos primeiros 200 atendimentos.';tr.append(td);tbody.append(tr);}
  $('#chiefXmlConfirm').disabled=!fresh.length;
  previewXml.hidden=false;
  feedbackXml.textContent='Análise concluída. Confirme abaixo para adicionar somente os registros novos.';
 }catch(e){feedbackXml.textContent='Não foi possível analisar o XML: '+e.message;}
});
$('#chiefXmlConfirm').addEventListener('click',async()=>{
 if(!pendingChiefImport||locked)return;
 const {fresh,dupes}=evaluateChiefImport(pendingChiefImport);
 if(!fresh.length){feedbackXml.textContent='Nenhum atendimento novo para importar.';resetChiefPreview();return;}
 if(!confirm('Adicionar '+fresh.length+' atendimento(s) aos registros locais? Os atendimentos atuais serão preservados.'))return;
 const snapshot=data.tickets.slice();
 try{
  data.tickets=[...data.tickets,...fresh];
  await save();
  resetChiefPreview();
  inputXml.value='';
  feedbackXml.textContent='Importação concluída: '+fresh.length+' atendimento(s) adicionado(s). '+dupes.length+' duplicado(s) ignorado(s).';
  $('#dateFilter').value='';
  show('list');
 }catch(e){
  data.tickets=snapshot;
  feedbackXml.textContent='Falha ao salvar. Os registros anteriores foram mantidos. '+e.message;
 }
});

window.tjesChiefXML={xmlFor,onlyToday,columns};
})();