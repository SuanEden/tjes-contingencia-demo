(function(){
'use strict';
const $=s=>document.querySelector(s);
const box=$('#view-backup .transfer-panel');if(!box)return;
const panel=document.createElement('section');panel.className='chief-export-panel';
panel.innerHTML='<h3>Exportar para a chefia</h3><p class="hint">Exporta os chamados criados hoje em XML compatível com o relatório da chefia e abre uma mensagem preparada no Teams. Anexe o arquivo XML e confirme o envio manualmente.</p><div class="chief-export-fields"><label>Destinatário de teste no Teams <input type="email" id="chiefRecipient" value="suan.nascimento@lanlink.com.br" readonly aria-readonly="true"></label></div><div class="row" style="margin-top:10px"><button type="button" class="primary" id="chiefExport">↓ Exportar XML e abrir Teams</button><span class="hint" id="chiefStatus" aria-live="polite"></span></div><p class="hint">Anexos não estão incluídos no XML. Este arquivo contém informações pessoais: use somente um destinatário autorizado. Nenhuma mensagem é enviada automaticamente.</p>';
const transferGrid=box.querySelector('.transfer-grid');
if(transferGrid)transferGrid.insertAdjacentElement('afterend',panel);else box.append(panel);
const CHIEF_RECIPIENT='suan.nascimento@lanlink.com.br';
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
$('#chiefExport').addEventListener('click',()=>{
 const operator='Equipe TJES',recipient=CHIEF_RECIPIENT;
 const tickets=onlyToday();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)){$('#chiefStatus').textContent='Informe o e-mail corporativo da chefia.';$('#chiefRecipient').focus();return}
 if(!tickets.length){$('#chiefStatus').textContent='Nenhum atendimento criado hoje neste navegador.';return}
 const date=localDay(new Date()),file='TJES_chefia_'+date+'.xml';
 const msg='Olá! Segue o relatório TJES de '+new Date().toLocaleDateString('pt-BR')+', enviado pela equipe TJES. Total: '+tickets.length+' chamado(s). Arquivo: '+file+'.';
 const teams='https://teams.microsoft.com/l/chat/0/0?users='+encodeURIComponent(recipient)+'&message='+encodeURIComponent(msg);
 try{
  
  const chat=window.open(teams,'_blank','noopener,noreferrer');
  download(file,xmlFor(tickets,operator));
  $('#chiefStatus').textContent=tickets.length+' chamado(s) exportado(s). No Teams, anexe '+file+' e clique em Enviar.'+(chat?'':' Se necessário, habilite a abertura do Teams.');
 }catch(e){$('#chiefStatus').textContent='Erro ao preparar exportação: '+(e?.message||'verifique o armazenamento')}
});
window.tjesChiefXML={xmlFor,onlyToday,columns};
})();