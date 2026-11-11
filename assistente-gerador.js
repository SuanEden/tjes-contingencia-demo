(function(){
'use strict';
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
function fallbackPje(form){
 const category=String(form.categoryLabel||'').trim();
 const service=String(form.serviceLabel||'').trim();
 if(!category||!service||category.length>180||service.length>90)return null;
 const categoryKey=norm(category),context=norm([service,category,form.groupLabel].join(' '));
 const categoryDisplay=category===category.toLocaleUpperCase('pt-BR')
  ?category.charAt(0).toLocaleUpperCase('pt-BR')+category.slice(1).toLocaleLowerCase('pt-BR')
  :category;
 const fromPje=/\bpje(?:office|midias)?\b|processo judicial eletronico/.test(context);
 const isPassword=/^(reset(?:e)? de senha|redefinicao de senha|esqueci (minha )?senha)$/.test(categoryKey);
 const isPrinter=/impress|scanner|digitaliz/.test(context);
 const isEquipment=/computador|notebook|monitor|equipamento|hardware|periferico/.test(context)&&!isPrinter;
 const isNetwork=/internet|rede|vpn|conexao|wi-fi|wifi/.test(context)&&!isPrinter&&!isEquipment;
 const isEmail=/e-mail|email|correio|groupwise/.test(context)&&!fromPje;
 const isAccess=/senha|redefinicao|acesso|permissao|login|credencial|bloqueio/.test(context);
 const isInstall=/instal|configur/.test(categoryKey);
 const isIncident=/erro|falha|indispon|nao funciona|nao liga|nao imprime|nao abre|nao conecta|sem acesso|sem sinal|problema|lento|trav/.test(categoryKey);
 const isPhysical=isPrinter||isEquipment||/cabeamento|ponto de rede|telefone|ramal/.test(context);
 const isSite=isPhysical&&(/instal|configur|manutenc|substitu|troca|visita|presencial/.test(categoryKey)||isPrinter);
 const isTokenSupply=/certificado digital/.test(norm([service,form.groupLabel].join(' ')))&&
  /^(?:fornecer|fornecimento|solicitar|solicitacao de|entrega de)\s+(?:o\s+)?token$/.test(categoryKey);
 const isUserCreation=/\b(?:criar|criacao|cadastrar|cadastro|inclusao|novo)\b.*\b(?:usuario|acesso|conta)\b|\b(?:usuario|conta)\b.*\b(?:novo|criacao|cadastro)\b/.test(categoryKey);
 const subject=isPassword?'Solicitação de redefinição de senha':
  isTokenSupply?'Certificado Digital — Fornecer Token':
  isUserCreation?'Solicitação de criação de usuário — '+service:
  isInstall?(/^(?:instalar ou configurar|instalacao ou configuracao)$/.test(categoryKey)
    ?'Solicitação de instalação ou configuração — '+service
    :'Solicitação de '+categoryDisplay.charAt(0).toLocaleLowerCase('pt-BR')+categoryDisplay.slice(1)):
  isIncident?'Falha em '+service+' — '+categoryDisplay:
  isAccess?'Solicitação de acesso — '+service+' — '+categoryDisplay:
  categoryDisplay;
 let action='',detail='';
 if(isPassword){
  action='solicitar a redefinição de senha de acesso ao serviço '+service;
 }else if(isUserCreation){
  action='solicitar a criação de usuário ou conta de acesso no sistema '+service;
 }else if(fromPje){
  action=isIncident?'relatar uma ocorrência no sistema '+service:'solicitar suporte ao sistema '+service;
  detail=category;
 }else if(isPrinter){
  action=isInstall?'solicitar a instalação ou configuração de dispositivo de impressão ou digitalização':
   isIncident?'relatar uma falha em dispositivo de impressão ou digitalização':
   'solicitar suporte a dispositivo de impressão ou digitalização';
  detail=category;
 }else if(isEquipment){
  action=isInstall?'solicitar a instalação ou configuração de equipamento de informática':
   isIncident?'relatar uma falha em equipamento de informática':
   'solicitar suporte técnico a equipamento de informática';
  detail=category;
 }else if(isNetwork){
  action=isIncident?'relatar uma falha de conectividade':'solicitar suporte de conectividade';
  detail=category;
 }else if(isEmail){
  action=isIncident?'relatar uma falha no correio eletrônico':'solicitar suporte de correio eletrônico';
  detail=category;
 }else if(isAccess){
  action='solicitar suporte referente ao acesso ao serviço '+service;
  detail=category;
 }else{
  action='solicitar atendimento no serviço '+service;
  detail=category;
 }
 // A categoria é o fato confirmado. Não inferir causa, procedimento executado ou resultado.
 const opening='O solicitante entrou em contato com a Central de Serviços para '+action+
  (detail?', referente a "'+detail+'"':'')+'.';
 // Fornecer Token: cadastro obrigatório específico, sem dados pessoais
 // fixos no código. Campos permanecem para conferência do atendente.
 if(isTokenSupply){
  // O motivo real é informado pelo solicitante; não presumir expiração.
  // Dados de chamados anteriores nunca são incorporados ao padrão.
  const description='O solicitante entrou em contato com a Central de Serviços para solicitar o fornecimento de token de certificado digital (serviço Fornecer Token).'+
   '\n\nDados do solicitante:\n'+[
   '• Nome completo: [PREENCHER].',
   '• Data de nascimento: [PREENCHER].',
   '• CPF: [PREENCHER].',
   '• Matrícula: [PREENCHER].',
   '• Cargo/Função: [PREENCHER].',
   '• E-mail institucional: [PREENCHER].',
   '• Local de trabalho: [PREENCHER].',
   '• Endereço: [PREENCHER].',
   '• Telefone (WhatsApp): [PREENCHER].'
  ].join('\n')+
   '\n\nMotivo da solicitação:\n• [PREENCHER].';
  return {id:'categoria-certificado-digital-fornecer-token',
   source:'Modelo local — Certificado Digital',summary:subject,description};
 }
 // A identificação do contato no cabeçalho pertence ao solicitante.
 // Não inferir a identidade de terceiros a partir desses dados.
 const groups=[['Dados do solicitante:',[
  '• Nome do solicitante: [PREENCHER].','• Contato: [PREENCHER].'
 ]]];
 if(isPassword){
  groups.push(['Dados para redefinição de senha:',[
   '• Usuário ou conta: [PREENCHER].',
   '• A solicitação é para o próprio usuário ou para terceiro?: [CONFERIR].'
  ]]);
 }else if(isUserCreation){
  groups.push(['Dados do usuário para criação de acesso:',[
   '• Nome do usuário: [PREENCHER].',
   '• Matrícula ou identificador (quando aplicável): [PREENCHER].',
   '• Unidade/lotação: [PREENCHER].'
  ]]);
 }else if(isAccess){
  groups.push(['Dados de acesso:',[
   '• Usuário ou conta: [PREENCHER].'
  ]]);
 }
 if(isPhysical){
  const locationData=['• Unidade: [PREENCHER].','• Endereço: [PREENCHER].',
   '• Andar: [PREENCHER].','• Sala: [PREENCHER].'];
  if(isSite)locationData.push('• Horário disponível: [PREENCHER].');
  groups.push(['Localização do atendimento:',locationData]);
 }
 if(isEquipment||isPrinter){
  groups.push(['Identificação do equipamento:',[
   '• Equipamento: [PREENCHER].','• Patrimônio: [PREENCHER].'
  ]]);
  // Periféricos interessam à configuração ou ao defeito do computador, não a toda categoria.
  if(isEquipment&&(isInstall||/periferico|monitor|teclado|mouse/.test(context))){
   groups.push(['Periféricos e acessórios:',['• Periféricos: [PREENCHER].']]);
  }
 }
 if(isIncident){
  groups.push(['Ocorrência relatada:',[
   '• Mensagem de erro (se houver): [PREENCHER].',
   '• Descrição do problema: [PREENCHER].',
   '• Momento ou circunstância da ocorrência: [PREENCHER].'
  ]]);
 }else{
  groups.push(['Detalhes da solicitação:',[
   '• Finalidade ou necessidade informada: [PREENCHER].'
  ]]);
 }
 const description=opening+'\n\n'+groups
  .map(([title,fields])=>title+'\n'+fields.join('\n')).join('\n\n');
 return {id:'categoria-'+norm(service)+'-'+norm(category),
  source:fromPje?'Modelo local — PJe':'Modelo local',
  summary:subject,description};
}
window.AssistenteTJESGerador=Object.freeze({gerar(service,category,group=''){
const model=fallbackPje({serviceLabel:String(service||''),categoryLabel:String(category||''),groupLabel:String(group||'')});
if(!model)return null;
return {id:model.id,name:category+' — '+service,summary:model.summary,description:model.description,serviceId:null,generated:true};
}});
})();
