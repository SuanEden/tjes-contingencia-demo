(function(){
'use strict';
const $=s=>document.querySelector(s);
const box=$('#view-backup .transfer-panel');if(!box)return;
const panel=document.createElement('section');panel.className='chief-export-panel';
panel.innerHTML='<h3>Compartilhar relatório com a chefia</h3><p class="hint">Gera o XML dos chamados de hoje e abre o compartilhamento do dispositivo. Selecione o Teams para compartilhar o arquivo e a mensagem juntos.</p><div class="chief-export-fields"><label>Destinatário de teste no Teams <input type="email" id="chiefRecipient" value="suan.nascimento@lanlink.com.br" readonly aria-readonly="true"></label></div><div class="row" style="margin-top:10px"><button type="button" class="primary" id="chiefExport">↗ Compartilhar relatório com a chefia</button><span class="hint" id="chiefStatus" aria-live="polite"></span></div><p class="hint">O compartilhamento exige sua confirmação no Teams. O XML contém dados dos atendimentos; compartilhe somente com destinatários autorizados.</p>';
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
const notice=document.createElement('dialog');
notice.className='chief-export-dialog';
notice.setAttribute('aria-labelledby','chiefNoticeTitle');
notice.innerHTML='<div class="chief-dialog-content"><div class="chief-dialog-icon" aria-hidden="true">↗</div><h2 id="chiefNoticeTitle">Você será redirecionado ao Teams</h2><p>O relatório será baixado no seu computador e a conversa com o destinatário será aberta no Microsoft Teams.</p><ol><li>No Teams, clique em <strong>Anexar arquivo</strong>.</li><li>Selecione o relatório XML que acabou de ser baixado.</li><li>Confira a mensagem e clique em <strong>Enviar</strong>.</li></ol><p class="chief-dialog-note">Importante: o arquivo não é anexado automaticamente. Você precisa selecioná-lo e confirmar o envio no Teams.</p><div class="chief-dialog-actions"><button type="button" id="chiefCancel">Cancelar</button><button type="button" class="primary" id="chiefContinue">Continuar para o Teams</button></div></div>';
document.body.append(notice);
const dialogStyle=document.createElement('style');
dialogStyle.textContent='.chief-export-dialog{width:min(520px,calc(100% - 32px));padding:0;border:0;border-radius:14px;box-shadow:0 22px 70px #10283b55;color:#26374a}.chief-export-dialog::backdrop{background:#10283b99;backdrop-filter:blur(3px)}.chief-dialog-content{padding:26px}.chief-dialog-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;background:#e5f2fb;color:#17649e;font-size:24px;font-weight:700;margin-bottom:15px}.chief-dialog-content h2{font-size:21px;margin:0 0 10px;color:#1e3d58}.chief-dialog-content p{line-height:1.5;margin:8px 0}.chief-dialog-content ol{padding-left:22px;line-height:1.65;margin:15px 0}.chief-dialog-note{padding:11px 13px;background:#fff7e5;border-left:4px solid #d39b28;border-radius:4px;font-size:13px}.chief-dialog-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:22px;flex-wrap:wrap}.chief-dialog-actions button{padding:10px 15px;border-radius:7px}.chief-dialog-actions .primary{background:#17649e;color:#fff;border-color:#17649e}@media(max-width:480px){.chief-dialog-content{padding:20px}.chief-dialog-actions{flex-direction:column-reverse}.chief-dialog-actions button{width:100%}}';
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
window.tjesChiefXML={xmlFor,onlyToday,columns};
})();