'use strict';
const KEY='tjes_offline_plain_v05'; // mantém os registros já salvos na v0.5
const LEGACY_KEY='tjes_offline_enc_v1';
const $=s=>document.querySelector(s);
const THEME_KEY='tjes_theme_v1';
function setTheme(choice){
 const dark=choice==='dark';
 document.documentElement.dataset.theme=dark?'dark':'light';
 const toggle=$('#themeToggle');
 if(toggle){toggle.textContent=dark?'☀ Tema claro':'☾ Tema escuro';toggle.setAttribute('aria-label',dark?'Ativar tema claro':'Ativar tema escuro');toggle.setAttribute('aria-pressed',String(dark))}
 try{localStorage.setItem(THEME_KEY,dark?'dark':'light')}catch{}
}
let savedTheme='light';try{savedTheme=localStorage.getItem(THEME_KEY)||'light'}catch{}
setTheme(savedTheme);
$('#themeToggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));

let data={tickets:[]},editing=null,locked=false;
const CONTACTS_KEY='tjes_contatos_locais_v1';
const CONTACT_FIELDS=['nome','telefone','ramal','email','secao','departamento','edificio','sala','ocupacao','chefia'];
let savedContacts=[];
const contactKey=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g,' ');
function loadSavedContacts(){try{const raw=JSON.parse(localStorage.getItem(CONTACTS_KEY)||'[]');savedContacts=Array.isArray(raw)?raw.filter(v=>v&&typeof v.nome==='string').slice(0,3000):[]}catch{savedContacts=[]}refreshSavedPeople()}
function importPeopleFromHistory(){
 const original=savedContacts.slice();let changed=false;
 const history=[...data.tickets].filter(t=>t&&t.nome).sort((a,b)=>String(b.updated||b.created||'').localeCompare(String(a.updated||a.created||'')));
 for(const t of history){
  const key=contactKey(t.nome),i=savedContacts.findIndex(c=>contactKey(c.nome)===key);
  if(i<0){const p={nome:String(t.nome).trim()};for(const field of CONTACT_FIELDS){if(field!=='nome'&&t[field])p[field]=String(t[field]).trim()}savedContacts.push(p);changed=true}
  else {const p=savedContacts[i];for(const field of CONTACT_FIELDS){if(field!=='nome'&&!p[field]&&t[field]){p[field]=String(t[field]).trim();changed=true}}}
 }
 if(changed){try{localStorage.setItem(CONTACTS_KEY,JSON.stringify(savedContacts));refreshSavedPeople()}catch{savedContacts=original;refreshSavedPeople()}}
}
function refreshSavedPeople(){const list=$('#savedPeopleList');if(!list)return;list.replaceChildren();for(const c of [...savedContacts].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'))){const opt=document.createElement('option');opt.value=c.nome;const context=[c.secao,c.ramal,c.telefone].filter(Boolean).join(' · ');opt.label=context;list.append(opt)}}
function saveContactFromTicket(ticket){const name=String(ticket.nome||'').trim();if(!name)return;const idx=savedContacts.findIndex(c=>contactKey(c.nome)===contactKey(name));const existing=idx<0?{}:savedContacts[idx];const profile={...existing,nome:name};for(const field of CONTACT_FIELDS){if(field==='nome')continue;const value=String(ticket[field]||'').trim();if(value)profile[field]=value}profile.savedAt=new Date().toISOString();const next=[...savedContacts];if(idx>=0)next.splice(idx,1);next.unshift(profile);try{localStorage.setItem(CONTACTS_KEY,JSON.stringify(next));savedContacts=next;refreshSavedPeople();return true}catch{return false}}
// Campos vinculados à identidade da pessoa: jamais manter dados do cadastro anterior.
let lastAutoContact='';
function clearPreviousPersonFields(){
 const form=$('#ticketForm');
 for(const field of CONTACT_FIELDS){
  if(field==='nome')continue;
  const el=form.elements.namedItem(field);
  if(el)el.value='';
 }
}
function autoFillContact(){
 const name=$('#f-nome').value.trim(),key=contactKey(name);
 if(key===lastAutoContact)return;
 // Limpa sempre que o nome mudar, mesmo que a pessoa anterior não fosse cadastrada.
 clearPreviousPersonFields();
 lastAutoContact=key;
 if(!name){$('#contactLookupHint').textContent='Selecione um nome para preencher automaticamente.';return}
 const match=savedContacts.find(c=>contactKey(c.nome)===key);
 if(!match){$('#contactLookupHint').textContent='Pessoa não cadastrada. Preencha os dados dela para salvá-los com o chamado.';return}
 let filled=0;
 const form=$('#ticketForm');
 for(const field of CONTACT_FIELDS){
  if(field==='nome')continue;
  const el=form.elements.namedItem(field);
  if(el&&match[field]){el.value=match[field];filled++}
 }
 $('#contactLookupHint').textContent='Dados de '+match.nome+' recuperados ('+filled+' campos). Confirme se estão corretos.';
}
$('#f-nome').addEventListener('input',autoFillContact);
$('#f-nome').addEventListener('change',autoFillContact);
const SAMPLE_PEOPLE=[
 {nome:'Marina Carvalho (DEMO)',telefone:'(85) 0000-0001',ramal:'2101',email:'marina.carvalho@example.com',secao:'Secretaria Administrativa',departamento:'Apoio Administrativo',edificio:'Bloco A',sala:'101',ocupacao:'Analista',chefia:'Coordenação Administrativa'},
 {nome:'Rafael Monteiro (DEMO)',telefone:'(85) 0000-0002',ramal:'2102',email:'rafael.monteiro@example.com',secao:'Protocolo',departamento:'Atendimento',edificio:'Bloco B',sala:'203',ocupacao:'Assistente',chefia:'Supervisão de Atendimento'},
 {nome:'Beatriz Nogueira (DEMO)',telefone:'(85) 0000-0003',ramal:'3105',email:'beatriz.nogueira@example.com',secao:'Gabinete',departamento:'Secretaria',edificio:'Bloco A',sala:'305',ocupacao:'Assessora'},
 {nome:'Lucas Ferreira (DEMO)',telefone:'(85) 0000-0004',ramal:'2209',email:'lucas.ferreira@example.com',secao:'Arquivo',departamento:'Gestão Documental',edificio:'Anexo',sala:'12',ocupacao:'Técnico'},
 {nome:'Camila Ribeiro (DEMO)',telefone:'(85) 0000-0005',ramal:'1104',email:'camila.ribeiro@example.com',secao:'Recepção',departamento:'Atendimento ao Público',edificio:'Bloco B',sala:'Térreo',ocupacao:'Recepcionista'},
 {nome:'Pedro Almeida (DEMO)',telefone:'(85) 0000-0006',ramal:'4107',email:'pedro.almeida@example.com',secao:'Suporte',departamento:'Tecnologia da Informação',edificio:'Bloco C',sala:'407',ocupacao:'Técnico de TI'}
];
$('#insertSamplePeople').onclick=()=>{
 const known=new Set(savedContacts.map(c=>contactKey(c.nome)));
 const additions=SAMPLE_PEOPLE.filter(p=>!known.has(contactKey(p.nome)));
 if(!additions.length){$('#contactLookupHint').textContent='As 6 pessoas de exemplo já estão cadastradas.';return}
 const next=[...additions,...savedContacts];
 try{localStorage.setItem(CONTACTS_KEY,JSON.stringify(next));savedContacts=next;refreshSavedPeople();$('#contactLookupHint').textContent=additions.length+' pessoa(s) fictícia(s) adicionada(s). Selecione um nome com (DEMO) para testar.'}
 catch{$('#contactLookupHint').textContent='Não foi possível salvar os exemplos neste navegador.'}
};

const enc=new TextEncoder(),dec=new TextDecoder();
const un64=s=>Uint8Array.from(atob(s),x=>x.charCodeAt(0));
async function derive(password,s){const raw=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:s,iterations:250000,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
function validate(obj){if(!obj||!Array.isArray(obj.tickets))throw Error('Dados inválidos');return obj}
async function save(){localStorage.setItem(KEY,JSON.stringify({version:2,tickets:data.tickets}));$('#saveInfo').textContent='Salvo localmente às '+new Date().toLocaleTimeString('pt-BR')}
function initialize(){
 try{const stored=localStorage.getItem(KEY);if(stored)data=validate(JSON.parse(stored));}
 catch(e){alert('Não foi possível carregar os registros locais. O armazenamento existente foi preservado.');locked=true;return}
 loadKnowledgeSnapshot();migratePanelAssignments();loadSavedContacts();importPeopleFromHistory();$('#app').hidden=false;$('#dashboardDate').value=localDay(new Date());$('#dateFilter').value=localDay(new Date());show('form');render();
 if(localStorage.getItem(LEGACY_KEY)){
  const p=document.createElement('div');p.className='warn';p.textContent='Há registros protegidos por senha de uma versão anterior neste navegador. Eles foram preservados e não são carregados automaticamente. Use a importação de arquivos antigos, na seção Importar e exportar, se necessário.';
  $('#view-form').prepend(p);
 }
}
function show(view){for(const s of ['dashboard','form','list','scripts','backup'])$('#view-'+s).classList.toggle('hide',s!==view);document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view==='list'||view==='dashboard')render();if(view==='scripts')renderScripts();if(view==='form')kbRender()}
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>show(b.dataset.view));
function clearForm(){$('#ticketForm').reset();editing=null;$('#formTitle').textContent='Novo atendimento';$('#stamp').textContent='';$('#saveInfo').textContent='';$('#contactLookupHint').textContent='Selecione um nome para preencher automaticamente.';lastAutoContact=''}$('#clearBtn').onclick=clearForm;
$('#ticketForm').onsubmit=async e=>{e.preventDefault();if(locked)return;const fields=Object.fromEntries(new FormData(e.target).entries());const customTarget=fields.status.startsWith('custom:')?fields.status.slice(7):null;if(customTarget)fields.status='Registrado';const now=new Date().toISOString();const old=data.tickets.find(t=>t.id===editing);const rec={...fields,id:editing||crypto.randomUUID(),created:old?.created||now,updated:now,panelId:customTarget&&panelState.custom.some(p=>p.id===customTarget&&panelState.visible.includes(p.id))?customTarget:null};if(old){data.tickets=data.tickets.map(t=>t.id===editing?rec:t)}else data.tickets.push(rec);const previousAssign=panelState.assign[rec.id];if(customTarget&&panelState.custom.some(p=>p.id===customTarget)&&panelState.visible.includes(customTarget))panelState.assign[rec.id]=customTarget;else delete panelState.assign[rec.id];try{await save();storePanelSettings();const contactSaved=saveContactFromTicket(rec);clearForm();show('list');if(rec.nome&&!contactSaved)alert('Atendimento salvo, mas não foi possível atualizar o cadastro local da pessoa.')}catch(err){if(old)data.tickets=data.tickets.map(t=>t.id===rec.id?old:t);else data.tickets=data.tickets.filter(t=>t.id!==rec.id);if(previousAssign)panelState.assign[rec.id]=previousAssign;else delete panelState.assign[rec.id];alert('Falha ao salvar. Verifique o espaço ou as permissões de armazenamento do navegador.')}};
// Registros exclusivamente fictícios para testes da interface e exportação.
const DEMO_EXAMPLES=[
 {id:'demo-tjes-senha',chamado:'DEMO-0001',nome:'Ana Silva (EXEMPLO)',problema:'INCIDENTE - Reset de senha - Usuário sem acesso',descricao:'Usuária de demonstração solicita reset de senha para acesso à intranet.\nNome: Ana Silva (EXEMPLO)\nCPF: [CPF FICTÍCIO]\nE-mail da chefia: [EMAIL_CHEFIA]',resolucao:'Exemplo de resolução: reset de senha realizado conforme SATE0013. Senha temporária enviada ao canal autorizado. Ação simulada, não executada.',status:'Resolvido',secao:'Secretaria — teste'},
 {id:'demo-tjes-pje',chamado:'DEMO-0002',nome:'Bruno Oliveira (EXEMPLO)',problema:'INCIDENTE - PJeOffice indisponível',descricao:'Usuário de demonstração relata falha ao assinar documento no PJe; mensagem: PJeOffice indisponível.',resolucao:'Tratativa pendente: consultar SATE0903 e validar procedimento vigente antes de orientar o usuário.',status:'Pendente',departamento:'Suporte ao PJe — teste'},
 {id:'demo-tjes-cert',chamado:'DEMO-0003',nome:'Carla Martins (EXEMPLO)',problema:'SOLICITAÇÃO - Renovação de certificado digital',descricao:'Solicitação fictícia de renovação de certificado digital.\nMatrícula: [MATRICULA]\nCargo/Função: [OCUPACAO]\nMotivo: Renovação de certificado.\nVerificar documentos e eventual autorização, conforme SATE0275.',resolucao:'Aguardando coleta dos dados necessários para encaminhamento à equipe responsável.',status:'Pendente'},
 {id:'demo-tjes-ramal',chamado:'DEMO-0004',nome:'Diego Costa (EXEMPLO)',problema:'SOLICITAÇÃO - Telefone / ramal sem funcionamento',descricao:'Ramal de teste não realiza chamadas.\nNúmero afetado: [TELEFONE]\nSala: Sala demonstrativa\nTestes realizados: [TRATATIVA].',resolucao:'Exemplo de encaminhamento para 3º Nível — Infraestrutura — Telefonia; transferência não executada.',status:'Transferido ao sistema oficial',secao:'Gabinete de teste'},
 {id:'demo-tjes-lento',chamado:'DEMO-0005',nome:'Elisa Rocha (EXEMPLO)',problema:'INCIDENTE - Computador lento',descricao:'Usuária relata lentidão ao abrir programas e acessar o navegador, em máquina de demonstração.',resolucao:'Exemplo: limpeza de arquivos temporários conforme SATE0765; resultado hipotético. Validar com o usuário no atendimento real.',status:'Resolvido'},
 {id:'demo-tjes-pend',chamado:'DEMO-0006',nome:'Felipe Lima (EXEMPLO)',problema:'PENDENTE - Aguardando informações do usuário',descricao:'Tentativa fictícia de contato por chat para esclarecer falha de acesso. Informações adicionais ainda não recebidas.',resolucao:'Aguardando resposta do usuário; exemplo de pendenciamento, sem envio de mensagem real.',status:'Registrado'}
];
$('#insertExamples').onclick=async()=>{
 if(locked)return;
 const existing=new Set(data.tickets.map(t=>t.id));
 const missing=DEMO_EXAMPLES.filter(t=>!existing.has(t.id));
 if(!missing.length){alert('Os seis exemplos já estão cadastrados neste navegador.');return}
 if(!confirm('Adicionar '+missing.length+' atendimento(s) FICTÍCIO(S)? Os registros existentes serão preservados.'))return;
 const previous=data.tickets;
 const base=Date.now();
 const examples=missing.map((t,i)=>({...t,created:new Date(base-(missing.length-1-i)*60000).toISOString(),updated:new Date(base-(missing.length-1-i)*60000).toISOString()}));
 data.tickets=[...previous,...examples];
 try{await save();$('#dateFilter').value=localDay(new Date());$('#search').value='';render();alert(missing.length+' exemplo(s) adicionados. Os protocolos DEMO são fictícios.')}
 catch{data.tickets=previous;alert('Não foi possível salvar os exemplos. Nenhum registro foi substituído.')}
};
// Seleção para exportação TXT. Não modifica nem persiste dados dos chamados.
const selectedTxtTicketIds=new Set();
function updateTxtSelected(){
 const existing=new Set(data.tickets.map(t=>t.id));for(const id of selectedTxtTicketIds)if(!existing.has(id))selectedTxtTicketIds.delete(id);
 $('#txtSelectedCount').textContent=selectedTxtTicketIds.size+' selecionado(s)';
 const boxes=[...document.querySelectorAll('#rows .txt-ticket-check')];
 $('#txtToggleVisible').checked=boxes.length>0&&boxes.every(b=>b.checked);
 $('#txtToggleVisible').indeterminate=boxes.some(b=>b.checked)&&!boxes.every(b=>b.checked);
}
function txtVisibleIds(){return [...document.querySelectorAll('#rows tr')].map(row=>row.querySelector('.txt-ticket-check')?.dataset.id).filter(Boolean)}
// Texto operacional pronto para seleção e colagem manual no sistema oficial.
// Formato de leitura e colagem: marcadores consistentes por campo.
// TXT operacional em UTF-8: blocos curtos, texto literal e campos vazios opcionais omitidos.
function ticketPasteText(t,index){
 const text=value=>String(value??'').trim().replace(/\r\n?/g,'\n');
 const label=(name,value,required=false)=>{
  const raw=text(value);
  if(!raw&&!required)return null;
  return '• '+name+':'+(raw?' '+raw.replace(/\n/g,'\n    '):'');
 };
 const lines=['• '+(index?index+' - ':'')+'CHAMADO: '+(text(t.chamado)||'Sem protocolo')];
 // Primeiro os dados necessários para identificar o atendimento.
 for(const line of [
  label('Nome',t.nome,true),
  label('CPF',t.cpf),
  label('E-mail',t.email),
  label('Telefone',t.telefone),
  label('Ramal',t.ramal),
  label('Seção',t.secao),
  label('Departamento',t.departamento),
  label('Edifício',t.edificio),
  label('Sala',t.sala),
  label('Ocupação',t.ocupacao),
  label('Endereço',t.endereco),
  label('Chefia',t.chefia)
 ])if(line)lines.push(line);
 lines.push('',label('Resumo',t.problema,true),label('Descrição',t.descricao,true),'',label('Resolução / tratativa',t.resolucao,true));
 return lines.join('\n');
}
function ticketsTxtContent(items){
 if(!items.length)return '';
 const dates=items.map(t=>localDay(new Date(t.created))).filter(Boolean).sort();
 const first=dates[0]?.split('-').reverse().join('/')||'—';
 const last=dates[dates.length-1]?.split('-').reverse().join('/')||'—';
 const interval=first===last?first:first+' a '+last;
 const line='='.repeat(62),divider='-'.repeat(62);
 const header=[
  'CONTROLE DE ATENDIMENTOS PARA LANÇAMENTO',
  line,
  'PERÍODO: '+interval,
  'TOTAL DE ATENDIMENTOS: '+items.length,
  'MARCAÇÃO: - [ ] ainda não lançado  |  - [x] lançado no sistema',
  'Marque manualmente cada atendimento após copiar e colar.',
  line
 ];
 const blocks=items.map((t,i)=>[
  '',
  '- [ ] ATENDIMENTO '+String(i+1).padStart(2,'0')+' DE '+String(items.length).padStart(2,'0'),
  'Data / hora: '+(t.created?new Date(t.created).toLocaleString('pt-BR'):'Não informada'),
  ticketPasteText(t,i+1),
  '',
  divider
 ].join('\n'));
 return [...header,...blocks].join('\n').trimEnd()+'\n';
}
function exportTicketsTxt(items,name){
 if(!items.length){alert('Não há atendimentos para baixar.');return}
 const blob=new Blob(['\uFEFF'+ticketsTxtContent(items).replace(/\n/g,'\r\n')],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function copyTicketForPaste(t){
 const message=ticketPasteText(t);
 try{await navigator.clipboard.writeText(message);alert('Texto do chamado copiado. Cole no campo desejado do sistema oficial.')}
 catch{
  const temp=document.createElement('textarea');temp.value=message;temp.style.position='fixed';temp.style.left='-10000px';document.body.append(temp);temp.select();
  let copied=false;try{copied=document.execCommand('copy')}catch{}
  temp.remove();
  if(copied)alert('Texto do chamado copiado.');else prompt('Selecione e copie este texto:',message);
 }
}
function txtFileName(kind){return 'TJES_atendimentos_'+kind+'_'+localDay(new Date())+'.txt'}
$('#txtPreview').onclick=()=>{
 const marked=data.tickets.filter(t=>selectedTxtTicketIds.has(t.id));
 const items=(marked.length?marked:data.tickets).slice().sort((a,b)=>a.created.localeCompare(b.created));
 if(!items.length){alert('Não há atendimentos para visualizar.');return}
 $('#txtPreviewContent').value=ticketsTxtContent(items);
 $('#txtCopyPreview').textContent='Copiar todo o texto';
 $('#txtPreviewDialog').showModal();
};
$('#txtClosePreview').onclick=()=>$('#txtPreviewDialog').close();
$('#txtCopyPreview').onclick=async()=>{
 const text=$('#txtPreviewContent').value;
 try{await navigator.clipboard.writeText(text);$('#txtCopyPreview').textContent='Copiado!'}
 catch{const box=$('#txtPreviewContent');box.focus();box.select();alert('Texto selecionado. Use Ctrl+C para copiar.')}
};
$('#txtExportAll').onclick=()=>exportTicketsTxt([...data.tickets].sort((a,b)=>a.created.localeCompare(b.created)),txtFileName('todos'));
$('#txtExportSelected').onclick=()=>exportTicketsTxt(data.tickets.filter(t=>selectedTxtTicketIds.has(t.id)).sort((a,b)=>a.created.localeCompare(b.created)),txtFileName('selecionados'));
$('#txtSelectVisible').onclick=()=>{document.querySelectorAll('#rows .txt-ticket-check').forEach(cb=>{cb.checked=true;selectedTxtTicketIds.add(cb.dataset.id)});updateTxtSelected()};
$('#txtClearSelection').onclick=()=>{selectedTxtTicketIds.clear();document.querySelectorAll('#rows .txt-ticket-check').forEach(cb=>cb.checked=false);updateTxtSelected()};
$('#txtToggleVisible').onchange=e=>{document.querySelectorAll('#rows .txt-ticket-check').forEach(cb=>{cb.checked=e.target.checked;if(cb.checked)selectedTxtTicketIds.add(cb.dataset.id);else selectedTxtTicketIds.delete(cb.dataset.id)});updateTxtSelected()};
function render(){if(locked)return;renderDashboard();const q=$('#search').value.trim().toLowerCase(),date=$('#dateFilter').value;const items=data.tickets.filter(t=>(!date||new Date(t.created).toLocaleDateString('en-CA')===date)&&[t.chamado,t.nome,t.problema,t.telefone,t.status].some(v=>(v||'').toLowerCase().includes(q))).sort((a,b)=>b.created.localeCompare(a.created));$('#rows').replaceChildren();$('#count').textContent=items.length+' registro(s)';for(const t of items){const tr=document.createElement('tr');const tdSelect=document.createElement('td');const cb=document.createElement('input');cb.type='checkbox';cb.className='txt-ticket-check';cb.dataset.id=t.id;cb.setAttribute('aria-label','Selecionar chamado '+(t.chamado||t.problema||'sem protocolo'));cb.checked=selectedTxtTicketIds.has(t.id);cb.onchange=()=>{if(cb.checked)selectedTxtTicketIds.add(t.id);else selectedTxtTicketIds.delete(t.id);updateTxtSelected()};tdSelect.append(cb);tr.append(tdSelect);for(const x of [new Date(t.created).toLocaleString('pt-BR'),t.chamado,t.nome,t.problema,t.status]){const td=document.createElement('td');td.textContent=x||'—';tr.append(td)}const act=document.createElement('td');const edit=document.createElement('button');edit.textContent='Editar';edit.onclick=()=>{editing=t.id;const f=$('#ticketForm');for(const [k,v] of Object.entries(t))if(f.elements.namedItem(k))f.elements.namedItem(k).value=v;$('#formTitle').textContent='Editar atendimento';$('#stamp').textContent='Criado em '+new Date(t.created).toLocaleString('pt-BR');setTicketFormStatus(t);show('form')};const del=document.createElement('button');del.textContent='Excluir';del.className='danger';del.onclick=async()=>{if(confirm('Excluir este registro permanentemente?')){const previous=data.tickets;data.tickets=previous.filter(x=>x.id!==t.id);try{await save();render()}catch{data.tickets=previous;alert('Não foi possível excluir')}}};const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar texto';copy.title='Copiar o atendimento para colar no sistema';copy.onclick=()=>copyTicketForPaste(t);act.append(edit,document.createTextNode(' '),copy,document.createTextNode(' '),del);tr.append(act);$('#rows').append(tr)}updateTxtSelected()}function localDay(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function sameDay(ticket,day){return localDay(new Date(ticket.created))===day}
function editTicket(t){editing=t.id;lastAutoContact=contactKey(t.nome);$('#contactLookupHint').textContent='Dados deste chamado carregados. Ao alterar o nome, os dados de contato serão limpos.';const f=$('#ticketForm');for(const [k,v] of Object.entries(t))if(f.elements.namedItem(k))f.elements.namedItem(k).value=v;$('#formTitle').textContent='Editar atendimento';$('#stamp').textContent='Criado em '+new Date(t.created).toLocaleString('pt-BR');setTicketFormStatus(t);show('form')}
// Arrastar um atendimento altera seu status; arrastar o cabeçalho continua trocando as caixas.
const ticketStatusForPanel={All:'Registrado',Pending:'Pendente',Resolved:'Resolvido',Transferred:'Transferido ao sistema oficial'};
const PANEL_SETTINGS_KEY='tjes_panels_custom_v1',FIELD_ORDER_KEY='tjes_field_order_v1';
const dashboardGrid=document.querySelector('.dashgrid');
let dashboardEditing=false;
function setDashboardEditing(value){
 dashboardEditing=Boolean(value);
 $('#view-dashboard').classList.toggle('dash-editing',dashboardEditing);
 $('#dashPanelTools').hidden=!dashboardEditing;
 const btn=$('#dashboardEditToggle');btn.textContent=dashboardEditing?'✓':'✎';
 btn.setAttribute('aria-pressed',String(dashboardEditing));
 btn.setAttribute('aria-label',dashboardEditing?'Concluir edição dos painéis':'Editar organização dos painéis');
 btn.title=btn.getAttribute('aria-label');
 dashboardGrid.querySelectorAll('.dashcardtitle').forEach(el=>el.draggable=dashboardEditing);
 if(!dashboardEditing){draggedPanel=null;clearDashboardDragStyles()}
}
$('#dashboardEditToggle').onclick=()=>setDashboardEditing(!dashboardEditing);
const builtinLabels={All:'TODOS OS ATENDIMENTOS',Pending:'ATENDIMENTOS PENDENTES',Resolved:'ATENDIMENTOS RESOLVIDOS',Transferred:'ATENDIMENTOS REGISTRADOS NO SISTEMA'};
let panelState={visible:['Pending','Transferred','All'],custom:[],assign:{}},draggedTicketId=null,draggedPanel=null,ignoreRowClick=false;
function storePanelSettings(){try{localStorage.setItem(PANEL_SETTINGS_KEY,JSON.stringify(panelState))}catch{}}
function loadPanelSettings(){try{const raw=JSON.parse(localStorage.getItem(PANEL_SETTINGS_KEY)||'null');if(raw&&Array.isArray(raw.visible)&&Array.isArray(raw.custom)){panelState={visible:raw.visible.filter(x=>typeof x==='string'&&x!=='Resolved'),custom:raw.custom.filter(x=>x&&/^Custom-[0-9]+$/.test(x.id)&&typeof x.name==='string').slice(0,30),assign:raw.assign&&typeof raw.assign==='object'?raw.assign:{}}}}catch{}}
function panelName(key){return builtinLabels[key]||panelState.custom.find(x=>x.id===key)?.name||'Painel'}
function panelDefinitions(){const active=panelState.visible.filter(key=>key!=='Resolved'&&(builtinLabels[key]||panelState.custom.some(x=>x.id===key)));return [...active.filter(x=>x!=='All'),...(active.includes('All')?['All']:[])]}
function ticketPanel(t){return t.panelId||panelState.assign[t.id]||null}
function migratePanelAssignments(){let migrated=false;for(const ticket of data.tickets){if(!ticket.panelId&&panelState.assign[ticket.id]){ticket.panelId=panelState.assign[ticket.id];migrated=true}}if(migrated){try{localStorage.setItem(KEY,JSON.stringify({version:2,tickets:data.tickets}))}catch{}}}

function refreshStatusOptions(){const select=$('#ticketForm').elements.namedItem('status');const chosen=select.value;select.querySelectorAll('option[data-custom-panel]').forEach(o=>o.remove());for(const p of panelState.custom){if(!panelState.visible.includes(p.id))continue;const o=document.createElement('option');o.value='custom:'+p.id;o.textContent=p.name+' (painel personalizado)';o.dataset.customPanel=p.id;select.append(o)}if([...select.options].some(o=>o.value===chosen))select.value=chosen}
function setTicketFormStatus(ticket){refreshStatusOptions();const select=$('#ticketForm').elements.namedItem('status');const custom=ticket.panelId||panelState.assign[ticket.id];select.value=custom&&panelState.visible.includes(custom)?'custom:'+custom:ticket.status||'Registrado'}
function savePanelOrder(){panelState.visible=[...dashboardGrid.querySelectorAll('.dashcard')].map(x=>x.dataset.panel);storePanelSettings()}
function clearDashboardDragStyles(){dashboardGrid.querySelectorAll('.dashcard').forEach(x=>x.classList.remove('drag-target','is-dragging','ticket-drop-target'))}
function createDashboardCard(key){
 const card=document.createElement('article');card.className='dashcard';card.dataset.panel=key;
 const title=document.createElement('div');title.className='dashcardtitle';title.draggable=dashboardEditing;title.tabIndex=0;title.title='Arraste o cabeçalho para mudar a posição';
 const caption=document.createElement('span');caption.className='dash-title-text';caption.textContent=panelName(key);caption.title=panelName(key);
 const count=document.createElement('span');count.className='dashcount';count.textContent='0';count.setAttribute('aria-label','Quantidade de chamados no painel');
 const remove=document.createElement('button');remove.type='button';remove.className='dash-remove';remove.title='Remover painel (não exclui atendimentos)';remove.classList.add('dash-edit-only');remove.textContent='×';
 remove.onclick=e=>{e.stopPropagation();if(!confirm('Remover o painel "'+panelName(key)+'"? Os atendimentos serão preservados.'))return;panelState.visible=panelState.visible.filter(x=>x!==key);panelState.custom=panelState.custom.filter(x=>x.id!==key);if(key.startsWith('Custom-')){for(const [id,dest] of Object.entries(panelState.assign))if(dest===key)delete panelState.assign[id];for(const ticket of data.tickets)if(ticket.panelId===key)ticket.panelId=null;void save().catch(()=>alert('Não foi possível salvar a remoção das atribuições.'))}storePanelSettings();rebuildDashboard()};
 const handle=document.createElement('span');handle.className='dash-panel-handle dash-edit-only';handle.textContent='⠿';handle.setAttribute('aria-hidden','true');title.append(handle,caption,count,remove);
 const cols=document.createElement('div');cols.className='dashcolumns';cols.setAttribute('aria-hidden','true');for(const label of ['CHAMADO','USUÁRIO / PROBLEMA','DATA / HORA']){const span=document.createElement('span');span.textContent=label;cols.append(span)}
 const body=document.createElement('div');body.className='dashbody';card.append(title,cols,body);
 title.addEventListener('dragstart',e=>{if(!dashboardEditing){e.preventDefault();return}if(e.target.closest('button')){e.preventDefault();return}draggedPanel=card;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','panel:'+key);card.classList.add('is-dragging')});
 title.addEventListener('dragend',()=>{draggedPanel=null;clearDashboardDragStyles()});
 title.addEventListener('keydown',e=>{if(!dashboardEditing||!e.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const elements=[...dashboardGrid.children],delta=({ArrowLeft:-1,ArrowRight:1,ArrowUp:-2,ArrowDown:2})[e.key],other=elements[elements.indexOf(card)+delta];if(other){const place=document.createComment('swap');card.replaceWith(place);other.replaceWith(card);place.replaceWith(other);savePanelOrder();title.focus()}});
 card.addEventListener('dragover',e=>{if(draggedTicketId||(dashboardEditing&&draggedPanel)){e.preventDefault();e.dataTransfer.dropEffect='move';card.classList.add(draggedTicketId?'ticket-drop-target':'drag-target')}});
 card.addEventListener('dragleave',e=>{if(!card.contains(e.relatedTarget))card.classList.remove('ticket-drop-target','drag-target')});
 card.addEventListener('drop',e=>{if(!draggedTicketId&&!(dashboardEditing&&draggedPanel))return;e.preventDefault();e.stopPropagation();if(draggedTicketId){const id=draggedTicketId;draggedTicketId=null;void moveTicketToPanel(id,key)}else if(draggedPanel&&draggedPanel!==card){const source=draggedPanel;const place=document.createComment('swap');source.replaceWith(place);card.replaceWith(source);place.replaceWith(card);savePanelOrder()}draggedPanel=null;clearDashboardDragStyles()});
 return card;
}
function rebuildDashboard(){dashboardGrid.replaceChildren();for(const key of panelDefinitions())dashboardGrid.append(createDashboardCard(key));refreshStatusOptions();renderDashboard()}
function renderDashboard(){
 const day=$('#dashboardDate').value||localDay(new Date());
 const tickets=data.tickets.filter(t=>sameDay(t,day)).sort((a,b)=>b.created.localeCompare(a.created));
 const counts={Pending:0,Resolved:0,Transferred:0,Custom:0};
 for(const t of tickets){const target=ticketPanel(t);if(target)counts.Custom++;else if(t.status==='Pendente')counts.Pending++;else if(t.status==='Resolvido')counts.Resolved++;else if(t.status==='Transferido ao sistema oficial')counts.Transferred++}
 for(const key of ['Pending','Transferred'])$('#stat'+key).textContent=String(counts[key]);

 for(const card of dashboardGrid.querySelectorAll('.dashcard')){
  const key=card.dataset.panel;
  const items=key==='All'?tickets:key.startsWith('Custom-')?tickets.filter(t=>ticketPanel(t)===key):tickets.filter(t=>!ticketPanel(t)&&t.status===ticketStatusForPanel[key]);
  card.querySelector('.dashcount').textContent=items.length;
  const body=card.querySelector('.dashbody');body.replaceChildren();
  if(!items.length){const empty=document.createElement('div');empty.className='dashempty';empty.textContent=key==='All'?'Nenhum atendimento registrado nesta data':'Nenhum chamado neste painel';body.append(empty)}
  for(const t of items){
   const row=document.createElement('div');row.className='dashitem';row.draggable=true;row.tabIndex=0;row.title='Arraste para mudar de painel; clique para editar';
   for(const txt of [t.chamado||'Sem protocolo',t.nome||t.problema||'Sem nome',new Date(t.created).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})]){
    const span=document.createElement('span');span.textContent=txt;row.append(span)
   }
   row.ondragstart=e=>{draggedTicketId=t.id;ignoreRowClick=true;row.classList.add('ticket-dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','ticket:'+t.id)};
   row.ondragend=()=>{draggedTicketId=null;row.classList.remove('ticket-dragging');clearDashboardDragStyles()};
   row.onclick=()=>{if(ignoreRowClick){ignoreRowClick=false;return}editTicket(t)};
   row.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();editTicket(t)}};
   body.append(row)
  }
 }
}
async function moveTicketToPanel(ticketId,panelKey){
 const ticket=data.tickets.find(t=>t.id===ticketId);if(!ticket)return;
 const oldState={status:ticket.status,panelId:ticket.panelId,assign:panelState.assign[ticketId]};
 if(panelKey==='All'){delete panelState.assign[ticketId];ticket.panelId=null;ticket.status='Registrado'}
 else if(panelKey.startsWith('Custom-')){if(!panelState.custom.some(x=>x.id===panelKey))return;panelState.assign[ticketId]=panelKey;ticket.panelId=panelKey;ticket.status='Registrado'}
 else{delete panelState.assign[ticketId];ticket.panelId=null;ticket.status=ticketStatusForPanel[panelKey]}
 const oldUpdated=ticket.updated;ticket.updated=new Date().toISOString();
 try{await save();storePanelSettings();render()}catch(e){ticket.updated=oldUpdated;ticket.status=oldState.status;ticket.panelId=oldState.panelId;if(oldState.assign)panelState.assign[ticketId]=oldState.assign;else delete panelState.assign[ticketId];alert('Falha ao salvar o atendimento.');render()}
}
loadPanelSettings();rebuildDashboard();
$('#addPanel').onclick=()=>{const missing=Object.keys(builtinLabels).filter(x=>x!=='Resolved'&&!panelState.visible.includes(x));const input=prompt('Nome do novo painel (ou digite TODOS, PENDENTES ou TRANSFERIDOS para restaurar):');if(!input||!input.trim())return;const name=input.trim();const builtin=missing.find(x=>builtinLabels[x].includes(name.toUpperCase())||x.toUpperCase()===name.toUpperCase());if(builtin){panelState.visible.push(builtin);storePanelSettings();rebuildDashboard();return}if(panelDefinitions().length>=30){alert('Limite de 30 painéis');return}const key='Custom-'+Date.now();panelState.custom.push({id:key,name:name.trim().slice(0,70)});panelState.visible.push(key);storePanelSettings();rebuildDashboard()};
$('#resetPanels').onclick=()=>{if(!confirm('Restaurar os quatro painéis originais? Chamados serão preservados.'))return;panelState={visible:['Pending','Transferred','All'],custom:[],assign:{}};for(const ticket of data.tickets)ticket.panelId=null;void save().catch(()=>alert('Não foi possível salvar a redefinição.'));storePanelSettings();rebuildDashboard()};

// Editor com arrastar e soltar entre campos principais e informações complementares.
const formMain=document.querySelector('[data-field-zone="main"]'),formExtra=document.querySelector('[data-field-zone="extra"]');
const fieldZones=[formMain,formExtra],allFieldTiles=[...formMain.children,...formExtra.children];
const defaultFieldLayout={main:[...formMain.children].map(x=>x.querySelector('[name]')?.name),extra:[...formExtra.children].map(x=>x.querySelector('[name]')?.name)};
let activeFieldTile=null;
let layoutEditing=false,dragPointerY=null,fieldAutoScrollTimer=null;
function updateLayoutMode(on){
 layoutEditing=on;
 document.querySelector('#view-form').classList.toggle('layout-editing',on);
 $('#editFields').setAttribute('aria-pressed',String(on));
 $('#editFields').textContent=on?'✓':'✎';
 $('#editFields').title=on?'Concluir edição do layout':'Editar layout dos campos';
 $('#editFields').setAttribute('aria-label',on?'Concluir edição do layout':'Editar layout dos campos');
 $('#resetFields').hidden=!on;$('#layoutHint').hidden=!on;
 if(!on){activeFieldTile=null;stopFieldAutoScroll();clearFieldIndicators()}
}
function stopFieldAutoScroll(){dragPointerY=null;if(fieldAutoScrollTimer!==null){clearInterval(fieldAutoScrollTimer);fieldAutoScrollTimer=null}}
function startFieldAutoScroll(){
 if(fieldAutoScrollTimer!==null)return;
 fieldAutoScrollTimer=setInterval(()=>{
  if(!layoutEditing||!activeFieldTile||dragPointerY===null){stopFieldAutoScroll();return}
  const edge=Math.min(110,Math.max(55,innerHeight*0.14));
  let speed=0;
  if(dragPointerY<edge)speed=-Math.ceil(5+22*(1-Math.max(0,dragPointerY)/edge));
  else if(dragPointerY>innerHeight-edge)speed=Math.ceil(5+22*(1-Math.max(0,innerHeight-dragPointerY)/edge));
  if(speed)window.scrollBy(0,speed);
 },25);
}
window.addEventListener('dragover',e=>{
 if(!layoutEditing||!activeFieldTile)return;
 e.preventDefault();dragPointerY=e.clientY;startFieldAutoScroll();
});
window.addEventListener('drop',()=>{stopFieldAutoScroll()});
window.addEventListener('dragend',()=>{stopFieldAutoScroll();activeFieldTile=null;clearFieldIndicators()});
window.addEventListener('blur',()=>{stopFieldAutoScroll()});
$('#editFields').onclick=()=>updateLayoutMode(!layoutEditing);
updateLayoutMode(false);
function getFieldName(tile){return tile.querySelector('[name]')?.name}
function saveFieldLayout(){try{localStorage.setItem(FIELD_ORDER_KEY,JSON.stringify({version:2,main:[...formMain.children].map(getFieldName),extra:[...formExtra.children].map(getFieldName)}))}catch{}}
function clearFieldIndicators(){for(const zone of fieldZones)zone.classList.remove('zone-drop');for(const tile of allFieldTiles)tile.classList.remove('field-dragging','field-target')}
function restoreFieldLayout(){
 try{
  const saved=JSON.parse(localStorage.getItem(FIELD_ORDER_KEY)||'null');
  const names=allFieldTiles.map(getFieldName),byName=new Map(allFieldTiles.map(tile=>[getFieldName(tile),tile]));
  if(saved&&saved.version===2&&Array.isArray(saved.main)&&Array.isArray(saved.extra)){
   const all=[...saved.main,...saved.extra];if(all.length===names.length&&new Set(all).size===all.length&&all.every(name=>byName.has(name))){
    for(const name of saved.main)formMain.append(byName.get(name));
    for(const name of saved.extra)formExtra.append(byName.get(name));return
   }
  }
  // Migração da ordem antiga, na qual era possível mudar somente os campos principais.
  if(Array.isArray(saved)&&saved.length===defaultFieldLayout.main.length&&saved.every(name=>typeof name==='string')){
   const byClass=new Map(allFieldTiles.map(tile=>[tile.className,tile]));
   if(saved.every(name=>byClass.has(name)))for(const name of saved)formMain.append(byClass.get(name))
  }
 }catch{}
}
function decorateField(tile){
 const field=tile.matches('.field')?tile:tile.querySelector('.field');
 const label=field?.querySelector('label');if(!field||!label)return;
 tile.classList.add('field-tile');
 const name=getFieldName(tile);
 if(['descricao','resolucao','problema'].includes(name))tile.classList.add('long-field');
 else if(['nome','email'].includes(name))tile.classList.add('wide-field');
 // Preservar o atributo for do label: os inputs mantêm sua associação acessível.
 const top=document.createElement('div');top.className='field-top';
 const grip=document.createElement('span');grip.className='field-drag-handle';grip.textContent='⠿';grip.draggable=true;grip.tabIndex=0;grip.setAttribute('role','button');grip.setAttribute('aria-label','Mover campo '+label.textContent);
 label.before(top);top.append(grip,label);
 grip.addEventListener('dragstart',e=>{if(!layoutEditing){e.preventDefault();return}activeFieldTile=tile;e.stopPropagation();e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','field:'+name);tile.classList.add('field-dragging');formExtra.closest('details').open=true});
 grip.addEventListener('dragend',()=>{activeFieldTile=null;stopFieldAutoScroll();clearFieldIndicators()});
 grip.addEventListener('keydown',e=>{if(!layoutEditing||!e.altKey||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const dest=e.key==='ArrowUp'||e.key==='ArrowDown'?(tile.parentElement===formMain?formExtra:formMain):tile.parentElement;const items=[...dest.children];if(dest===tile.parentElement){const pos=items.indexOf(tile)+(e.key==='ArrowLeft'?-1:1);if(items[pos]){if(pos<items.indexOf(tile))items[pos].before(tile);else items[pos].after(tile)}}else dest.append(tile);saveFieldLayout();grip.focus()});
 tile.addEventListener('dragover',e=>{if(!layoutEditing||!activeFieldTile||activeFieldTile===tile)return;e.preventDefault();e.stopPropagation();tile.classList.add('field-target');tile.parentElement.classList.add('zone-drop')});
 tile.addEventListener('dragleave',()=>tile.classList.remove('field-target'));
 tile.addEventListener('drop',e=>{if(!layoutEditing||!activeFieldTile||activeFieldTile===tile)return;e.preventDefault();e.stopPropagation();const from=activeFieldTile;const pos=[...tile.parentElement.children].indexOf(tile);if(from.parentElement===tile.parentElement&&[...tile.parentElement.children].indexOf(from)<pos)tile.after(from);else tile.before(from);activeFieldTile=null;saveFieldLayout();clearFieldIndicators()})
}
for(const tile of allFieldTiles)decorateField(tile);
for(const zone of fieldZones){
 zone.addEventListener('dragover',e=>{if(!layoutEditing||!activeFieldTile)return;e.preventDefault();zone.classList.add('zone-drop')});
 zone.addEventListener('dragleave',e=>{if(!zone.contains(e.relatedTarget))zone.classList.remove('zone-drop')});
 zone.addEventListener('drop',e=>{if(!layoutEditing||!activeFieldTile)return;e.preventDefault();if(e.target.closest('.field-tile')&&e.target.closest('.field-tile')!==activeFieldTile)return;zone.append(activeFieldTile);activeFieldTile=null;saveFieldLayout();clearFieldIndicators()});
}
restoreFieldLayout();
$('#resetFields').onclick=()=>{const byName=new Map(allFieldTiles.map(tile=>[getFieldName(tile),tile]));for(const name of defaultFieldLayout.main)formMain.append(byName.get(name));for(const name of defaultFieldLayout.extra)formExtra.append(byName.get(name));localStorage.removeItem(FIELD_ORDER_KEY);clearFieldIndicators()};
$('#dashboardDate').onchange=render;
$('#dashboardNew').onclick=()=>{clearForm();show('form')};
$('#dailyCopy').onclick=async()=>{const day=$('#dashboardDate').value||localDay(new Date());const items=data.tickets.filter(t=>sameDay(t,day)).sort((a,b)=>a.created.localeCompare(b.created));const fields=[['CHAMADO','chamado'],['Problema','problema'],['Nome','nome'],['Ramal','ramal'],['Seção','secao'],['Departamento','departamento'],['Edifício','edificio'],['Sala','sala'],['CPF','cpf'],['E-mail','email'],['Telefone','telefone'],['Ocupação','ocupacao'],['Endereço','endereco'],['Chefia','chefia'],['Descrição','descricao'],['Resolução','resolucao'],['Status','status']];const report='ATENDIMENTOS DO DIA: '+day.split('-').reverse().join('/')+'\n'+'='.repeat(40)+'\n\n'+(items.length?items.map((t,i)=>(i+1)+' - ATENDIMENTO\n'+fields.map(([label,key])=>label+': '+(t[key]||'')).join('\n')).join('\n\n'+'-'.repeat(40)+'\n\n'):'Nenhum atendimento registrado.');try{await navigator.clipboard.writeText(report);alert('Relatório copiado. Evite colar dados pessoais em locais não autorizados.')}catch{const textarea=document.createElement('textarea');textarea.value=report;document.body.append(textarea);textarea.select();const ok=document.execCommand('copy');textarea.remove();alert(ok?'Relatório copiado.':'Cópia não permitida pelo navegador.')}};
$('#search').oninput=render;$('#dateFilter').onchange=render;$('#showAll').onclick=()=>{$('#dateFilter').value='';render()};

// Busca local por palavras do resumo; nenhuma tratativa é aplicada sem escolha.

let kbSelected=null;
function kbNormalize(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function kbFormValues(){return Object.fromEntries(new FormData($('#ticketForm')).entries())}
function kbFill(text){const fields=kbFormValues();const replacements={ATENDENTE:'',EMAIL_CHEFIA:(fields.chefia||'').includes('@')?fields.chefia:'',ENDERECO:fields.endereco||'',MATRICULA:'',IP:'',NOME:fields.nome,TELEFONE:fields.telefone,CHAMADO:fields.chamado,CPF:fields.cpf,EMAIL:fields.email,OCUPACAO:fields.ocupacao,SECAO:fields.secao,DEPARTAMENTO:fields.departamento,EDIFICIO:fields.edificio,SALA:fields.sala,RAMAL:fields.ramal,PROBLEMA:fields.problema};const missing=[];const rendered=text.replace(/\[([A-Z_]+)\]/g,(match,key)=>{const value=replacements[key];if(!value){missing.push(key);return match}return value});return {rendered,missing}}
// O histórico guarda apenas títulos de modelos neste navegador, nunca dados do chamado.
const KB_RECENTS_KEY='tjes_kb_recent_titles_v1';
const KB_DEFAULT_TITLES=['SATE0013 — Reset de senha — acesso à intranet','SATE0903 — PJeOffice — Local Network Access Checks','SATE0275 — Solicitação de emissão/renovação de certificado','SATE0760 — Reset de senha de aposentado','SATE0375 — encerramento sem retorno','SATE0385 — solicitação de telefone ou ramal'];
function kbRecents(){try{const saved=JSON.parse(localStorage.getItem(KB_RECENTS_KEY)||'[]');return Array.isArray(saved)?saved.filter(x=>typeof x==='string').slice(0,8):[]}catch{return []}}
function kbRemember(title){try{localStorage.setItem(KB_RECENTS_KEY,JSON.stringify([title,...kbRecents().filter(x=>x!==title)].slice(0,8)))}catch{}}
function kbCandidates(){
 const fields=kbFormValues(),query=kbNormalize($('#kbSearch').value),summary=kbNormalize(fields.problema);
 const ranked=scripts.map(([title,txt],index)=>{const tags=KB_TAGS.find(x=>x[0]===title)?.[1]||[];const hits=tags.filter(tag=>summary.includes(kbNormalize(tag))).length;const manual=query&&(kbNormalize(title+' '+txt+' '+tags.join(' ')).includes(query));return {title,txt,index,hits,manual}});
 if(query)return {label:'Resultados da pesquisa',items:ranked.filter(x=>x.manual).sort((a,b)=>b.hits-a.hits).slice(0,12)};
 const matches=ranked.filter(x=>x.hits>0).sort((a,b)=>b.hits-a.hits);
 if(summary&&matches.length)return {label:'Sugestões para o resumo',items:matches.slice(0,8)};
 const recent=kbRecents().map(title=>ranked.find(x=>x.title===title)).filter(Boolean);
 if(recent.length)return {label:'Seus modelos recentes',items:recent};
 const defaults=KB_DEFAULT_TITLES.map(title=>ranked.find(x=>x.title===title)).filter(Boolean);
 return {label:'Modelos sugeridos para começar',items:defaults};
}
function kbRender(){
 const area=$('#kbResults');area.replaceChildren();const {label,items}=kbCandidates();
 $('#kbResultsLabel').textContent=label;
 for(const item of items){
  const b=document.createElement('button');b.className='kb-option';b.type='button';
  const strong=document.createElement('strong');strong.textContent=item.title;
  const sub=document.createElement('small');sub.textContent=item.hits?item.hits+' palavra(s)-chave correspondente(s)':'Modelo disponível';
  b.append(strong,sub);
  b.onclick=()=>{kbSelected=item;kbPreview();show('form');kbApply('descricao');kbRender()};
  area.append(b);
 }
 if(!area.childElementCount)area.textContent='Nenhum modelo encontrado.';
}
function kbPreview(){if(!kbSelected)return;const result=kbFill(kbSelected.txt);$('#kbChosen').hidden=false;$('#kbSelectedTitle').textContent=kbSelected.title;$('#kbPreview').textContent=result.rendered;$('#kbMissing').textContent=result.missing.length?'Campos sem dados serão mantidos como marcadores: '+[...new Set(result.missing)].map(x=>'['+x+']').join(', '):''}
// Resumos curtos alinhados aos modelos existentes, sem afirmar ações não comprovadas.


function kbApply(field){
 if(!kbSelected)return;
 const form=$('#ticketForm'),target=form.elements.namedItem(field),summary=form.elements.namedItem('problema');
 if(!target||!summary)return;
 const resolutionTemplate=field==='resolucao'&&KB_RESOLUTIONS[kbSelected.title];
 const {rendered}=kbFill(resolutionTemplate||kbSelected.txt);
 const newSummary=KB_SUMMARIES[kbSelected.title]||kbSelected.title;
 // O resumo é atualizado sem confirmação; somente a substituição de uma descrição preenchida requer autorização.
 if(field==='descricao' && target.value.trim() && target.value!==rendered && !confirm('A descrição já contém texto. Deseja substituí-la pelo modelo selecionado?'))return;
 // Atualizar ambos na mesma ação. O listener do resumo limpa a sugestão anterior.
 kbRemember(kbSelected.title);
 target.value=rendered;
 summary.value=newSummary;
 summary.dispatchEvent(new Event('input',{bubbles:true}));
 target.dispatchEvent(new Event('input',{bubbles:true}));
 kbSelected=null;
 $('#kbChosen').hidden=true;
 kbRender();
 target.focus();
}
$('#kbApply').onclick=()=>kbApply('descricao');$('#kbResolution').onclick=()=>kbApply('resolucao');$('#kbCancel').onclick=()=>{$('#kbChosen').hidden=true;kbSelected=null};$('#kbSearch').oninput=kbRender;$('#ticketForm').elements.namedItem('problema').addEventListener('input',()=>{$('#kbSearch').value='';kbSelected=null;$('#kbChosen').hidden=true;kbRender()});$('#ticketForm').elements.namedItem('descricao').addEventListener('input',()=>{if(kbSelected)kbPreview()});$('#ticketForm').addEventListener('input',e=>{if(kbSelected&&e.target.name!=='descricao')kbPreview()});kbRender();
let customKnowledgeTitles=new Set(),editingKnowledgeTitle=null;
function closeKnowledgeEditor(){editingKnowledgeTitle=null;$('#knowledgeForm').reset();$('#knowledgeEditor').hidden=true}
function openKnowledgeEditor(title=null){
 if(title&&!customKnowledgeTitles.has(title))return;
 editingKnowledgeTitle=title;
 $('#knowledgeForm').reset();$('#knowledgeEditorTitle').textContent=title?'Editar conhecimento':'Novo conhecimento';
 $('#knowledgeEditor').hidden=false;
 if(title){
  $('#knowledgeTitle').value=title;
  $('#knowledgeSummary').value=KB_SUMMARIES[title]||title;
  $('#knowledgeDescription').value=scripts.find(x=>x[0]===title)?.[1]||'';
  $('#knowledgeResolution').value=KB_RESOLUTIONS[title]||'';
  $('#knowledgeTags').value=(KB_TAGS.find(x=>x[0]===title)?.[1]||[]).join(', ');
 }
 $('#knowledgeTitle').focus();
}
$('#newKnowledge').onclick=()=>openKnowledgeEditor();
$('#cancelKnowledge').onclick=closeKnowledgeEditor;
$('#discardKnowledge').onclick=closeKnowledgeEditor;
// Dados exclusivamente fictícios, incluídos apenas por ação explícita do usuário.
const DEMO_KNOWLEDGE=[
 {title:'DEMO — Acesso à intranet',summary:'INCIDENTE - Dificuldade de acesso à intranet',tags:['intranet','login','acesso'],description:'Usuário informa dificuldade de acesso à intranet.\nValidar o endereço utilizado, a conectividade e a mensagem apresentada.\nRegistrar o resultado das verificações, sem solicitar senhas.',resolution:'Tratativa demonstrativa: orientações de acesso realizadas e validação com o solicitante. Ação fictícia.'},
 {title:'DEMO — Falha de impressão',summary:'INCIDENTE - Impressora não imprime',tags:['impressora','impressão','fila'],description:'Usuário relata que documentos não são impressos.\nIdentificar equipamento, localização e mensagem de erro.\nVerificar fila de impressão e conectividade conforme procedimento autorizado.',resolution:'Tratativa demonstrativa: fila verificada e teste de impressão realizado. Resultado hipotético.'},
 {title:'DEMO — Assinatura no PJe',summary:'INCIDENTE - Falha de assinatura no PJe',tags:['pje','assinatura','certificado'],description:'Usuário informa erro ao assinar documento no PJe.\nRegistrar mensagem exibida e versão do componente de assinatura.\nConsultar o procedimento oficial antes de qualquer alteração.',resolution:'Tratativa demonstrativa: verificações iniciais registradas; encaminhamento fictício.'},
 {title:'DEMO — Telefonia e ramal',summary:'INCIDENTE - Ramal sem funcionamento',tags:['telefone','telefonia','ramal'],description:'Usuário relata indisponibilidade do ramal.\nConfirmar número afetado e setor, verificar alcance da falha e registrar testes permitidos.',resolution:'Tratativa demonstrativa: ocorrência registrada para análise de telefonia. Nenhuma ação real executada.'}
];

// Segundo conjunto ampliado: dados públicos de demonstração, não correspondem a pessoas ou chamados reais.
SAMPLE_PEOPLE.push(...[{"nome":"Aline Vasconcelos (DEMO)","telefone":"(85) 0000-0101","ramal":"3201","email":"demo.pessoa07@example.com","secao":"Secretaria de Vara — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"101","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia"},{"nome":"André Batista (DEMO)","telefone":"(85) 0000-0102","ramal":"3202","email":"demo.pessoa08@example.com","secao":"Gabinete — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"202","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia"},{"nome":"Bianca Peixoto (DEMO)","telefone":"(85) 0000-0103","ramal":"3203","email":"demo.pessoa09@example.com","secao":"Distribuição — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"303","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia"},{"nome":"Caio Menezes (DEMO)","telefone":"(85) 0000-0104","ramal":"3204","email":"demo.pessoa10@example.com","secao":"Protocolo — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"404","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia"},{"nome":"Cecília Duarte (DEMO)","telefone":"(85) 0000-0105","ramal":"3205","email":"demo.pessoa11@example.com","secao":"Atendimento ao Público — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"105","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia"},{"nome":"Daniel Queiroz (DEMO)","telefone":"(85) 0000-0106","ramal":"3206","email":"demo.pessoa12@example.com","secao":"Administração — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"206","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia"},{"nome":"Eduarda Fonseca (DEMO)","telefone":"(85) 0000-0107","ramal":"3207","email":"demo.pessoa13@example.com","secao":"Arquivo — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"307","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia"},{"nome":"Fábio Andrade (DEMO)","telefone":"(85) 0000-0108","ramal":"3208","email":"demo.pessoa14@example.com","secao":"Secretaria de Tecnologia — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"408","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia"},{"nome":"Fernanda Sampaio (DEMO)","telefone":"(85) 0000-0109","ramal":"3209","email":"demo.pessoa15@example.com","secao":"Coordenação — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"101","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia"},{"nome":"Gabriel Morais (DEMO)","telefone":"(85) 0000-0110","ramal":"3210","email":"demo.pessoa16@example.com","secao":"Diretoria — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"202","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia"},{"nome":"Helena Torres (DEMO)","telefone":"(85) 0000-0111","ramal":"3211","email":"demo.pessoa17@example.com","secao":"Contadoria — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"303","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia"},{"nome":"Igor Nascimento (DEMO)","telefone":"(85) 0000-0112","ramal":"3212","email":"demo.pessoa18@example.com","secao":"Setor de Mandados — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"404","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia"},{"nome":"Isabela Moura (DEMO)","telefone":"(85) 0000-0113","ramal":"3213","email":"demo.pessoa19@example.com","secao":"Secretaria de Vara — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"105","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia"},{"nome":"João Vitor Lima (DEMO)","telefone":"(85) 0000-0114","ramal":"3214","email":"demo.pessoa20@example.com","secao":"Gabinete — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"206","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia"},{"nome":"Juliana Correia (DEMO)","telefone":"(85) 0000-0115","ramal":"3215","email":"demo.pessoa21@example.com","secao":"Distribuição — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"307","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia"},{"nome":"Leonardo Freitas (DEMO)","telefone":"(85) 0000-0116","ramal":"3216","email":"demo.pessoa22@example.com","secao":"Protocolo — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"408","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia"},{"nome":"Lívia Castro (DEMO)","telefone":"(85) 0000-0117","ramal":"3217","email":"demo.pessoa23@example.com","secao":"Atendimento ao Público — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"101","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia"},{"nome":"Marcelo Azevedo (DEMO)","telefone":"(85) 0000-0118","ramal":"3218","email":"demo.pessoa24@example.com","secao":"Administração — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"202","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia"},{"nome":"Natália Pinheiro (DEMO)","telefone":"(85) 0000-0119","ramal":"3219","email":"demo.pessoa25@example.com","secao":"Arquivo — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"303","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia"},{"nome":"Otávio Barros (DEMO)","telefone":"(85) 0000-0120","ramal":"3220","email":"demo.pessoa26@example.com","secao":"Secretaria de Tecnologia — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"404","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia"},{"nome":"Patrícia Leal (DEMO)","telefone":"(85) 0000-0121","ramal":"3221","email":"demo.pessoa27@example.com","secao":"Coordenação — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"105","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia"},{"nome":"Ricardo Farias (DEMO)","telefone":"(85) 0000-0122","ramal":"3222","email":"demo.pessoa28@example.com","secao":"Diretoria — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"206","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia"},{"nome":"Sofia Matos (DEMO)","telefone":"(85) 0000-0123","ramal":"3223","email":"demo.pessoa29@example.com","secao":"Contadoria — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"307","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia"},{"nome":"Thiago Braga (DEMO)","telefone":"(85) 0000-0124","ramal":"3224","email":"demo.pessoa30@example.com","secao":"Setor de Mandados — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"408","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia"}]);
DEMO_EXAMPLES.push(...[{"id":"demo-apresentacao-20261028-01","chamado":"APRES-DEMO-001","nome":"Aline Vasconcelos (DEMO)","telefone":"(85) 0000-0101","ramal":"3201","email":"demo.pessoa07@example.com","secao":"Secretaria de Vara — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"101","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Acesso à intranet (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Usuário não consegue autenticar na intranet de demonstração.\nAções sugeridas: Validar URL utilizada, conectividade, horário e mensagem de erro; não solicitar senhas.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Validar URL utilizada, conectividade, horário e mensagem de erro; não solicitar senhas. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-02","chamado":"APRES-DEMO-002","nome":"André Batista (DEMO)","telefone":"(85) 0000-0102","ramal":"3202","email":"demo.pessoa08@example.com","secao":"Gabinete — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"202","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - PJeOffice (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Aplicativo de assinatura não inicia no equipamento fictício.\nAções sugeridas: Identificar versão, contexto do erro e verificar procedimento de suporte autorizado.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-03","chamado":"APRES-DEMO-003","nome":"Bianca Peixoto (DEMO)","telefone":"(85) 0000-0103","ramal":"3203","email":"demo.pessoa09@example.com","secao":"Distribuição — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"303","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Impressão (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Documentos permanecem na fila de impressão.\nAções sugeridas: Conferir impressora selecionada e condições da fila de impressão em ambiente de teste.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-04","chamado":"APRES-DEMO-004","nome":"Caio Menezes (DEMO)","telefone":"(85) 0000-0104","ramal":"3204","email":"demo.pessoa10@example.com","secao":"Protocolo — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"404","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Certificado digital (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Certificado de exemplo não é reconhecido na estação.\nAções sugeridas: Confirmar validade, dispositivo e mensagens; não recolher chaves privadas.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Confirmar validade, dispositivo e mensagens; não recolher chaves privadas. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-05","chamado":"APRES-DEMO-005","nome":"Cecília Duarte (DEMO)","telefone":"(85) 0000-0105","ramal":"3205","email":"demo.pessoa11@example.com","secao":"Atendimento ao Público — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"105","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Ramal (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Telefone de mesa de teste não realiza chamadas.\nAções sugeridas: Confirmar ramal, local e extensão do problema antes de encaminhar.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-06","chamado":"APRES-DEMO-006","nome":"Daniel Queiroz (DEMO)","telefone":"(85) 0000-0106","ramal":"3206","email":"demo.pessoa12@example.com","secao":"Administração — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"206","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Computador lento (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Estação de trabalho apresenta lentidão ao abrir aplicativos.\nAções sugeridas: Verificar recursos, espaço e processos por procedimento permitido.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-07","chamado":"APRES-DEMO-007","nome":"Eduarda Fonseca (DEMO)","telefone":"(85) 0000-0107","ramal":"3207","email":"demo.pessoa13@example.com","secao":"Arquivo — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"307","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Rede cabeada (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Computador demonstra falta de conectividade por cabo.\nAções sugeridas: Verificar conexão física e informações básicas de rede.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Verificar conexão física e informações básicas de rede. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-08","chamado":"APRES-DEMO-008","nome":"Fábio Andrade (DEMO)","telefone":"(85) 0000-0108","ramal":"3208","email":"demo.pessoa14@example.com","secao":"Secretaria de Tecnologia — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"408","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Wi-Fi institucional (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Equipamento fictício não se conecta à rede sem fio.\nAções sugeridas: Registrar rede, erro exibido e resultado de verificações iniciais.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-09","chamado":"APRES-DEMO-009","nome":"Fernanda Sampaio (DEMO)","telefone":"(85) 0000-0109","ramal":"3209","email":"demo.pessoa15@example.com","secao":"Coordenação — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"101","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - E-mail corporativo (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Cliente de e-mail não sincroniza mensagens de teste.\nAções sugeridas: Verificar conexão e mensagens de erro sem pedir credenciais.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-10","chamado":"APRES-DEMO-010","nome":"Gabriel Morais (DEMO)","telefone":"(85) 0000-0110","ramal":"3210","email":"demo.pessoa16@example.com","secao":"Diretoria — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"202","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Monitor (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Monitor secundário não apresenta imagem.\nAções sugeridas: Verificar alimentação, cabos e configuração de exibição.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Verificar alimentação, cabos e configuração de exibição. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-11","chamado":"APRES-DEMO-011","nome":"Helena Torres (DEMO)","telefone":"(85) 0000-0111","ramal":"3211","email":"demo.pessoa17@example.com","secao":"Contadoria — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"303","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Áudio (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Fone de ouvido não reproduz áudio em videoconferência.\nAções sugeridas: Verificar dispositivo de saída e volume no aplicativo.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-12","chamado":"APRES-DEMO-012","nome":"Igor Nascimento (DEMO)","telefone":"(85) 0000-0112","ramal":"3212","email":"demo.pessoa18@example.com","secao":"Setor de Mandados — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"404","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Câmera (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Webcam não é identificada na reunião.\nAções sugeridas: Conferir permissões e seleção de dispositivo no aplicativo.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-13","chamado":"APRES-DEMO-013","nome":"Isabela Moura (DEMO)","telefone":"(85) 0000-0113","ramal":"3213","email":"demo.pessoa19@example.com","secao":"Secretaria de Vara — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"105","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Acesso a pasta (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Pasta compartilhada de teste não abre.\nAções sugeridas: Registrar caminho, permissões aparentes e mensagem do sistema.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Registrar caminho, permissões aparentes e mensagem do sistema. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-14","chamado":"APRES-DEMO-014","nome":"João Vitor Lima (DEMO)","telefone":"(85) 0000-0114","ramal":"3214","email":"demo.pessoa20@example.com","secao":"Gabinete — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"206","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Aplicativo travando (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Sistema de teste encerra inesperadamente.\nAções sugeridas: Reproduzir sintoma, coletar mensagem e registrar versão.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-15","chamado":"APRES-DEMO-015","nome":"Juliana Correia (DEMO)","telefone":"(85) 0000-0115","ramal":"3215","email":"demo.pessoa21@example.com","secao":"Distribuição — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"307","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Atualização (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Aplicativo precisa de atualização autorizada.\nAções sugeridas: Identificar versão e solicitar orientação pela política de TI.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-16","chamado":"APRES-DEMO-016","nome":"Leonardo Freitas (DEMO)","telefone":"(85) 0000-0116","ramal":"3216","email":"demo.pessoa22@example.com","secao":"Protocolo — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"408","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Digitalização (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Digitalizador não inicia a captura de documentos.\nAções sugeridas: Conferir equipamento, driver e configurações permitidas.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Conferir equipamento, driver e configurações permitidas. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-17","chamado":"APRES-DEMO-017","nome":"Lívia Castro (DEMO)","telefone":"(85) 0000-0117","ramal":"3217","email":"demo.pessoa23@example.com","secao":"Atendimento ao Público — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"101","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Token (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Leitor de token não é detectado.\nAções sugeridas: Identificar dispositivo e comportamento sem coletar PIN.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-18","chamado":"APRES-DEMO-018","nome":"Marcelo Azevedo (DEMO)","telefone":"(85) 0000-0118","ramal":"3218","email":"demo.pessoa24@example.com","secao":"Administração — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"202","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Navegador (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Página de trabalho não carrega corretamente.\nAções sugeridas: Validar endereço e teste controlado em navegador alternativo.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-19","chamado":"APRES-DEMO-019","nome":"Natália Pinheiro (DEMO)","telefone":"(85) 0000-0119","ramal":"3219","email":"demo.pessoa25@example.com","secao":"Arquivo — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"303","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Acesso à intranet (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Usuário não consegue autenticar na intranet de demonstração.\nAções sugeridas: Validar URL utilizada, conectividade, horário e mensagem de erro; não solicitar senhas.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Validar URL utilizada, conectividade, horário e mensagem de erro; não solicitar senhas. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-20","chamado":"APRES-DEMO-020","nome":"Otávio Barros (DEMO)","telefone":"(85) 0000-0120","ramal":"3220","email":"demo.pessoa26@example.com","secao":"Secretaria de Tecnologia — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"404","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - PJeOffice (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Aplicativo de assinatura não inicia no equipamento fictício.\nAções sugeridas: Identificar versão, contexto do erro e verificar procedimento de suporte autorizado.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-21","chamado":"APRES-DEMO-021","nome":"Patrícia Leal (DEMO)","telefone":"(85) 0000-0121","ramal":"3221","email":"demo.pessoa27@example.com","secao":"Coordenação — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"105","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Impressão (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Documentos permanecem na fila de impressão.\nAções sugeridas: Conferir impressora selecionada e condições da fila de impressão em ambiente de teste.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-22","chamado":"APRES-DEMO-022","nome":"Ricardo Farias (DEMO)","telefone":"(85) 0000-0122","ramal":"3222","email":"demo.pessoa28@example.com","secao":"Diretoria — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"206","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Certificado digital (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Certificado de exemplo não é reconhecido na estação.\nAções sugeridas: Confirmar validade, dispositivo e mensagens; não recolher chaves privadas.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Confirmar validade, dispositivo e mensagens; não recolher chaves privadas. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-23","chamado":"APRES-DEMO-023","nome":"Sofia Matos (DEMO)","telefone":"(85) 0000-0123","ramal":"3223","email":"demo.pessoa29@example.com","secao":"Contadoria — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"307","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Ramal (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Telefone de mesa de teste não realiza chamadas.\nAções sugeridas: Confirmar ramal, local e extensão do problema antes de encaminhar.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-24","chamado":"APRES-DEMO-024","nome":"Thiago Braga (DEMO)","telefone":"(85) 0000-0124","ramal":"3224","email":"demo.pessoa30@example.com","secao":"Setor de Mandados — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"408","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Computador lento (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Estação de trabalho apresenta lentidão ao abrir aplicativos.\nAções sugeridas: Verificar recursos, espaço e processos por procedimento permitido.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-25","chamado":"APRES-DEMO-025","nome":"Aline Vasconcelos (DEMO)","telefone":"(85) 0000-0101","ramal":"3201","email":"demo.pessoa07@example.com","secao":"Secretaria de Vara — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"101","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Rede cabeada (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Computador demonstra falta de conectividade por cabo.\nAções sugeridas: Verificar conexão física e informações básicas de rede.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Verificar conexão física e informações básicas de rede. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-26","chamado":"APRES-DEMO-026","nome":"André Batista (DEMO)","telefone":"(85) 0000-0102","ramal":"3202","email":"demo.pessoa08@example.com","secao":"Gabinete — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"202","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Wi-Fi institucional (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Equipamento fictício não se conecta à rede sem fio.\nAções sugeridas: Registrar rede, erro exibido e resultado de verificações iniciais.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-27","chamado":"APRES-DEMO-027","nome":"Bianca Peixoto (DEMO)","telefone":"(85) 0000-0103","ramal":"3203","email":"demo.pessoa09@example.com","secao":"Distribuição — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"303","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - E-mail corporativo (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Cliente de e-mail não sincroniza mensagens de teste.\nAções sugeridas: Verificar conexão e mensagens de erro sem pedir credenciais.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-28","chamado":"APRES-DEMO-028","nome":"Caio Menezes (DEMO)","telefone":"(85) 0000-0104","ramal":"3204","email":"demo.pessoa10@example.com","secao":"Protocolo — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"404","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Monitor (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Monitor secundário não apresenta imagem.\nAções sugeridas: Verificar alimentação, cabos e configuração de exibição.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Verificar alimentação, cabos e configuração de exibição. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-29","chamado":"APRES-DEMO-029","nome":"Cecília Duarte (DEMO)","telefone":"(85) 0000-0105","ramal":"3205","email":"demo.pessoa11@example.com","secao":"Atendimento ao Público — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"105","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Áudio (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Fone de ouvido não reproduz áudio em videoconferência.\nAções sugeridas: Verificar dispositivo de saída e volume no aplicativo.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-30","chamado":"APRES-DEMO-030","nome":"Daniel Queiroz (DEMO)","telefone":"(85) 0000-0106","ramal":"3206","email":"demo.pessoa12@example.com","secao":"Administração — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"206","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Câmera (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Webcam não é identificada na reunião.\nAções sugeridas: Conferir permissões e seleção de dispositivo no aplicativo.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-31","chamado":"APRES-DEMO-031","nome":"Eduarda Fonseca (DEMO)","telefone":"(85) 0000-0107","ramal":"3207","email":"demo.pessoa13@example.com","secao":"Arquivo — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"307","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Acesso a pasta (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Pasta compartilhada de teste não abre.\nAções sugeridas: Registrar caminho, permissões aparentes e mensagem do sistema.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Registrar caminho, permissões aparentes e mensagem do sistema. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-32","chamado":"APRES-DEMO-032","nome":"Fábio Andrade (DEMO)","telefone":"(85) 0000-0108","ramal":"3208","email":"demo.pessoa14@example.com","secao":"Secretaria de Tecnologia — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"408","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Aplicativo travando (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Sistema de teste encerra inesperadamente.\nAções sugeridas: Reproduzir sintoma, coletar mensagem e registrar versão.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-33","chamado":"APRES-DEMO-033","nome":"Fernanda Sampaio (DEMO)","telefone":"(85) 0000-0109","ramal":"3209","email":"demo.pessoa15@example.com","secao":"Coordenação — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"101","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Atualização (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Aplicativo precisa de atualização autorizada.\nAções sugeridas: Identificar versão e solicitar orientação pela política de TI.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-34","chamado":"APRES-DEMO-034","nome":"Gabriel Morais (DEMO)","telefone":"(85) 0000-0110","ramal":"3210","email":"demo.pessoa16@example.com","secao":"Diretoria — simulação","departamento":"Atendimento de teste","edificio":"Bloco A — demonstração","sala":"202","ocupacao":"Assistente — demonstração","chefia":"Coordenação fictícia","problema":"SOLICITAÇÃO - Digitalização (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Digitalizador não inicia a captura de documentos.\nAções sugeridas: Conferir equipamento, driver e configurações permitidas.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo de registro no sistema oficial, APENAS SIMULADO. Conferir equipamento, driver e configurações permitidas. Nenhuma transferência real ocorreu.","status":"Transferido ao sistema oficial"},{"id":"demo-apresentacao-20261028-35","chamado":"APRES-DEMO-035","nome":"Helena Torres (DEMO)","telefone":"(85) 0000-0111","ramal":"3211","email":"demo.pessoa17@example.com","secao":"Contadoria — simulação","departamento":"Apoio administrativo fictício","edificio":"Bloco B — demonstração","sala":"303","ocupacao":"Analista — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Token (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Leitor de token não é detectado.\nAções sugeridas: Identificar dispositivo e comportamento sem coletar PIN.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"},{"id":"demo-apresentacao-20261028-36","chamado":"APRES-DEMO-036","nome":"Igor Nascimento (DEMO)","telefone":"(85) 0000-0112","ramal":"3212","email":"demo.pessoa18@example.com","secao":"Setor de Mandados — simulação","departamento":"Unidade de demonstração","edificio":"Anexo — demonstração","sala":"404","ocupacao":"Técnico — demonstração","chefia":"Coordenação fictícia","problema":"INCIDENTE - Navegador (DEMONSTRAÇÃO)","descricao":"Cenário totalmente fictício para apresentação da ferramenta.\nRelato: Página de trabalho não carrega corretamente.\nAções sugeridas: Validar endereço e teste controlado em navegador alternativo.\nNenhum atendimento real foi realizado.","resolucao":"Exemplo pendente: aguardando informação adicional e validação de procedimento.","status":"Pendente"}]);
DEMO_KNOWLEDGE.push(...[{"title":"DEMO — Recuperação de acesso","summary":"INCIDENTE - Usuário sem acesso","tags":["login","acesso","conta"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nValidar o identificador do usuário e a mensagem de erro. Não solicitar senha. Seguir procedimento autorizado para recuperação.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Orientação para VPN","summary":"INCIDENTE - Falha ao acessar VPN","tags":["vpn","acesso remoto","rede"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nIdentificar cliente de conexão, mensagem exibida e rede utilizada. Encaminhar conforme política de suporte.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Instalação de impressora","summary":"SOLICITAÇÃO - Configuração de impressora","tags":["impressora","driver","instalação"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nVerificar modelo, localização e disponibilidade do pacote aprovado. Registrar teste de impressão.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Mapeamento de unidade","summary":"INCIDENTE - Pasta compartilhada indisponível","tags":["pasta","rede","permissão"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nVerificar caminho de rede e permissões necessárias. Registrar o erro sem expor arquivos internos.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Atualização de navegador","summary":"SOLICITAÇÃO - Atualização de navegador","tags":["navegador","atualização","web"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nVerificar versão e política de atualização. Executar somente etapas autorizadas.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Microfone não detectado","summary":"INCIDENTE - Falha no microfone","tags":["microfone","áudio","reunião"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nIdentificar dispositivo selecionado no sistema e no aplicativo. Testar nível de entrada.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Webcam sem imagem","summary":"INCIDENTE - Câmera não detectada","tags":["webcam","câmera","reunião"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nVerificar permissões e dispositivo de vídeo selecionado. Registrar mensagem de erro.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Computador sem vídeo","summary":"INCIDENTE - Monitor sem imagem","tags":["monitor","vídeo","cabo"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nVerificar cabos, alimentação e entrada selecionada. Registrar os testes iniciais.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Lentidão na estação","summary":"INCIDENTE - Computador lento","tags":["desempenho","lentidão","estação"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nRegistrar horário e aplicativos afetados. Verificar indicadores permitidos antes de qualquer manutenção.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Rede sem conectividade","summary":"INCIDENTE - Rede indisponível","tags":["rede","conectividade","ethernet"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nVerificar cabo ou Wi-Fi, mensagens do sistema e alcance do incidente.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Falha na digitalização","summary":"INCIDENTE - Scanner não digitaliza","tags":["scanner","digitalização","driver"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nConfirmar equipamento, aplicativo e mensagem exibida. Aplicar verificações autorizadas.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Ramal indisponível","summary":"INCIDENTE - Telefone sem linha","tags":["ramal","telefonia","linha"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nConfirmar ramal e setor afetados. Registrar testes permitidos e encaminhamento.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Certificado não reconhecido","summary":"INCIDENTE - Certificado digital não identificado","tags":["certificado","token","assinatura"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nConfirmar mídia e validade sem solicitar PIN ou chave privada. Registrar a mensagem exibida.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — PJeOffice não abre","summary":"INCIDENTE - Falha ao iniciar PJeOffice","tags":["pje","pjeoffice","assinatura"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nVerificar versão, erro reportado e procedimento aprovado, sem alterar configurações sensíveis sem autorização.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Cliente de e-mail sem sincronização","summary":"INCIDENTE - E-mail não sincroniza","tags":["email","sincronização","cliente"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nVerificar conexão e mensagem de erro. Não solicitar credenciais pessoais.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."},{"title":"DEMO — Procedimento de registro","summary":"SOLICITAÇÃO - Registro de atendimento","tags":["triagem","registro","protocolo"],"description":"MODELO FICTÍCIO PARA TREINAMENTO\nConferir identificação do usuário, resumo e descrição objetiva antes de registrar a demanda.\nRegistrar ações efetivamente realizadas antes de uso oficial.","resolution":"Tratativa de demonstração: registrar testes realizados, resultado e eventual encaminhamento. Não afirmar execução sem evidência."}]);
$('#prepareDemo').onclick=async()=>{
 if(locked)return;
 const missingTickets=DEMO_EXAMPLES.filter(item=>!data.tickets.some(t=>t.id===item.id));
 const knownPeople=new Set(savedContacts.map(c=>contactKey(c.nome)));
 const missingPeople=SAMPLE_PEOPLE.filter(p=>!knownPeople.has(contactKey(p.nome)));
 const missingKnowledge=DEMO_KNOWLEDGE.filter(k=>!scripts.some(s=>s[0]===k.title));
 if(!missingTickets.length&&!missingPeople.length&&!missingKnowledge.length){alert('A demonstração já foi preparada neste navegador. Os exemplos existentes foram preservados.');return}
 if(!confirm('Inserir '+missingTickets.length+' chamados, '+missingPeople.length+' pessoas e '+missingKnowledge.length+' conhecimentos FICTÍCIOS? Nenhum registro existente será substituído.'))return;
 const old={tickets:data.tickets,contacts:savedContacts,knowledge:knowledgeSnapshot()};
 const values=new Map();
 for(const key of [KEY,CONTACTS_KEY,TRANSFER_KB_KEY])values.set(key,localStorage.getItem(key));
 try{
  const base=Date.now();
  data.tickets=[...data.tickets,...missingTickets.map((t,i)=>({...t,created:new Date(base-(missingTickets.length-i)*60000).toISOString(),updated:new Date(base-(missingTickets.length-i)*60000).toISOString()}))];
  savedContacts=[...missingPeople,...savedContacts];
  for(const item of missingKnowledge){
   scripts.unshift([item.title,item.description]);
   KB_TAGS.push([item.title,item.tags]);
   KB_SUMMARIES[item.title]=item.summary;
   KB_RESOLUTIONS[item.title]=item.resolution;
   customKnowledgeTitles.add(item.title);
  }
  localStorage.setItem(KEY,JSON.stringify({version:2,tickets:data.tickets}));
  localStorage.setItem(CONTACTS_KEY,JSON.stringify(savedContacts));
  persistKnowledge();
  refreshSavedPeople();renderScripts();kbRender();render();
  $('#dashboardDate').value=localDay(new Date());
  $('#dateFilter').value=localDay(new Date());
  show('dashboard');
  render();
  alert('Demonstração preparada: '+missingTickets.length+' chamados, '+missingPeople.length+' pessoas e '+missingKnowledge.length+' conhecimentos fictícios adicionados. Total deste conjunto: '+DEMO_EXAMPLES.length+' chamados, '+SAMPLE_PEOPLE.length+' pessoas e '+DEMO_KNOWLEDGE.length+' conhecimentos. Dados existentes preservados.');
 }catch(e){
  data.tickets=old.tickets;savedContacts=old.contacts;restoreKnowledgeInMemory(old.knowledge);
  for(const [key,value] of values){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch{}}
  refreshSavedPeople();renderScripts();render();
  alert('Não foi possível preparar a demonstração. Os dados anteriores foram preservados.');
 }
};
function persistKnowledge(){
 localStorage.setItem(TRANSFER_KB_KEY,JSON.stringify(knowledgeSnapshot()));
}
$('#knowledgeForm').onsubmit=e=>{
 e.preventDefault();
 const title=$('#knowledgeTitle').value.trim(),summary=$('#knowledgeSummary').value.trim(),description=$('#knowledgeDescription').value.trim(),resolution=$('#knowledgeResolution').value.trim();
 const tags=[...new Set($('#knowledgeTags').value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean))].slice(0,30);
 if(!title||!summary||!description){alert('Preencha título, resumo e descrição.');return}
 if(scripts.some(x=>x[0].toLocaleLowerCase('pt-BR')===title.toLocaleLowerCase('pt-BR')&&x[0]!==editingKnowledgeTitle)){alert('Já existe um conhecimento com esse título.');return}
 const previous=knowledgeSnapshot();
 try{
  if(editingKnowledgeTitle){
   const idx=scripts.findIndex(x=>x[0]===editingKnowledgeTitle);
   if(idx<0)throw Error('Conhecimento não encontrado');
   scripts.splice(idx,1);
   for(let i=KB_TAGS.length-1;i>=0;i--)if(KB_TAGS[i][0]===editingKnowledgeTitle)KB_TAGS.splice(i,1);
   delete KB_SUMMARIES[editingKnowledgeTitle];delete KB_RESOLUTIONS[editingKnowledgeTitle];
   customKnowledgeTitles.delete(editingKnowledgeTitle);
  }
  scripts.unshift([title,description]);KB_TAGS.push([title,tags]);
  KB_SUMMARIES[title]=summary;if(resolution)KB_RESOLUTIONS[title]=resolution;
  customKnowledgeTitles.add(title);
  persistKnowledge();
  closeKnowledgeEditor();renderScripts();kbRender();
 }catch{
  restoreKnowledgeInMemory(previous);
  alert('Não foi possível salvar. Confira o espaço disponível no navegador.');
 }
};
function restoreKnowledgeInMemory(snapshot){
 scripts.splice(0,scripts.length,...snapshot.scripts);
 KB_TAGS.splice(0,KB_TAGS.length,...snapshot.tags);
 for(const key of Object.keys(KB_SUMMARIES))delete KB_SUMMARIES[key];
 for(const key of Object.keys(KB_RESOLUTIONS))delete KB_RESOLUTIONS[key];
 Object.assign(KB_SUMMARIES,snapshot.summaries);Object.assign(KB_RESOLUTIONS,snapshot.resolutions);
 customKnowledgeTitles=new Set(snapshot.customTitles||[]);
}
function deleteKnowledge(title){
 if(!customKnowledgeTitles.has(title)||!confirm('Excluir o conhecimento "'+title+'"? Esta ação não altera chamados existentes.'))return;
 const previous=knowledgeSnapshot();
 try{
  const idx=scripts.findIndex(x=>x[0]===title);if(idx>=0)scripts.splice(idx,1);
  for(let i=KB_TAGS.length-1;i>=0;i--)if(KB_TAGS[i][0]===title)KB_TAGS.splice(i,1);
  delete KB_SUMMARIES[title];delete KB_RESOLUTIONS[title];
  customKnowledgeTitles.delete(title);persistKnowledge();renderScripts();kbRender();
 }catch{restoreKnowledgeInMemory(previous);alert('Não foi possível excluir este conhecimento.')}
}
function renderScripts(){
 const q=$('#scriptSearch').value.toLocaleLowerCase('pt-BR');
 $('#scriptArea').replaceChildren();
 for(const [title,body] of scripts.filter(([name,content])=>[name,content,KB_SUMMARIES[name],(KB_TAGS.find(x=>x[0]===name)?.[1]||[]).join(' ')].join(' ').toLocaleLowerCase('pt-BR').includes(q))){
  const d=document.createElement('div');d.className='script';
  const r=document.createElement('div');r.className='row between';
  const strong=document.createElement('strong');strong.textContent=title;
  if(customKnowledgeTitles.has(title)){const own=document.createElement('small');own.className='knowledge-own-label';own.textContent='Criado por você';strong.append(' ',own)}
  const actions=document.createElement('div');actions.className='row';
  const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar texto';
  copy.onclick=async()=>{try{await navigator.clipboard.writeText(body);copy.textContent='Copiado'}catch{const ta=document.createElement('textarea');ta.value=body;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();copy.textContent='Copiado'}};
  actions.append(copy);
  if(customKnowledgeTitles.has(title)){
   const edit=document.createElement('button');edit.type='button';edit.textContent='Editar';edit.onclick=()=>openKnowledgeEditor(title);actions.append(edit);
   const remove=document.createElement('button');remove.type='button';remove.className='danger';remove.textContent='Excluir';remove.onclick=()=>deleteKnowledge(title);actions.append(remove);
  }
  r.append(strong,actions);
  if(KB_SUMMARIES[title]){const summary=document.createElement('p');summary.className='knowledge-summary';summary.textContent='Resumo: '+KB_SUMMARIES[title];d.append(r,summary)}else d.append(r);
  const pre=document.createElement('pre');pre.textContent=body;d.append(pre);$('#scriptArea').append(d);
 }
}
$('#scriptSearch').oninput=renderScripts;
function download(name,content){const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
const TRANSFER_KB_KEY='tjes_kb_custom_snapshot_v1';
let pendingImport=null;
function knowledgeSnapshot(){return {scripts:scripts.map(x=>[...x]),tags:KB_TAGS.map(x=>[x[0],Array.isArray(x[1])?[...x[1]]:[]]),resolutions:{...KB_RESOLUTIONS},summaries:{...KB_SUMMARIES},customTitles:[...customKnowledgeTitles],recent:kbRecents()}}
function applyKnowledge(snapshot){
 if(!snapshot||!Array.isArray(snapshot.scripts)||!Array.isArray(snapshot.tags)||!snapshot.resolutions||!snapshot.summaries)throw Error('Base inválida');
 if(snapshot.scripts.length>3000||snapshot.tags.length>3000||snapshot.scripts.some(x=>!Array.isArray(x)||x.length!==2||x.some(v=>typeof v!=='string'||v.length>20000)))throw Error('Base inválida');
 const old=knowledgeSnapshot();
 try{
  localStorage.setItem(TRANSFER_KB_KEY,JSON.stringify(snapshot));
  scripts.splice(0,scripts.length,...snapshot.scripts);
  KB_TAGS.splice(0,KB_TAGS.length,...snapshot.tags);
  for(const k of Object.keys(KB_RESOLUTIONS))delete KB_RESOLUTIONS[k];
  for(const k of Object.keys(KB_SUMMARIES))delete KB_SUMMARIES[k];
  Object.assign(KB_RESOLUTIONS,snapshot.resolutions);
  Object.assign(KB_SUMMARIES,snapshot.summaries);
  customKnowledgeTitles=new Set(Array.isArray(snapshot.customTitles)?snapshot.customTitles.filter(t=>typeof t==='string'&&snapshot.scripts.some(x=>x[0]===t)):[]);
  if(Array.isArray(snapshot.recent))localStorage.setItem(KB_RECENTS_KEY,JSON.stringify(snapshot.recent.filter(v=>typeof v==='string').slice(0,8)));
 }catch(e){restoreKnowledgeInMemory(old);throw e}
}
function loadKnowledgeSnapshot(){
 try{const saved=localStorage.getItem(TRANSFER_KB_KEY);if(saved)applyKnowledge(JSON.parse(saved))}catch{localStorage.removeItem(TRANSFER_KB_KEY)}
}
function selectedSections(prefix){return ['Tickets','Contacts','Knowledge','Settings'].filter(s=>$('#'+prefix+s).checked).map(s=>s.toLowerCase())}
function buildExport(sections){
 const payload={format:'tjes-contingencia-transfer',version:3,exportedAt:new Date().toISOString(),sections:{}};
 if(sections.includes('tickets'))payload.sections.tickets=structuredClone(data.tickets);
 if(sections.includes('contacts'))payload.sections.contacts=structuredClone(savedContacts);
 if(sections.includes('knowledge'))payload.sections.knowledge=knowledgeSnapshot();
 if(sections.includes('settings'))payload.sections.settings={
  panels:structuredClone(panelState),
  fields:localStorage.getItem(FIELD_ORDER_KEY),
  theme:localStorage.getItem(THEME_KEY)
 };
 return payload
}
$('#exportBtn').onclick=()=>{
 if(locked)return;const selection=selectedSections('ex');if(!selection.length){alert('Selecione pelo menos uma categoria.');return}
 try{download('TJES_dados_'+localDay(new Date())+'.json',JSON.stringify(buildExport(selection),null,2))}
 catch{alert('Não foi possível gerar o arquivo.')}
};
$('#importBtn').onclick=()=>$('#importFile').click();
function showImportOptions(sections,label){
 pendingImport=sections;
 $('#importOptions').hidden=false;$('#importSummary').textContent=label;
 for(const name of ['Tickets','Contacts','Knowledge','Settings']){
  const el=$('#im'+name),available=Object.hasOwn(sections,name.toLowerCase());
  el.disabled=!available;el.checked=available;
 }
}
$('#importFile').onchange=async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 pendingImport=null;$('#importOptions').hidden=true;
 try{
  if(file.size>120*1024*1024)throw Error('Arquivo muito grande');
  const obj=JSON.parse(await file.text());let sections;
  if(obj.format==='tjes-contingencia-transfer'&&obj.version===3&&obj.sections&&typeof obj.sections==='object')sections=obj.sections;
  else if(obj.version===2){sections={tickets:validate(obj).tickets}}
  else if(obj.version===1&&obj.cipher&&obj.iv&&obj.salt){
   const pw=prompt('Arquivo antigo criptografado. Digite a senha usada anteriormente:');if(!pw)return;
   const key=await derive(pw,un64(obj.salt));
   const buf=await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(obj.iv)},key,un64(obj.cipher));
   sections={tickets:validate(JSON.parse(dec.decode(buf))).tickets};
  }else throw Error('Formato desconhecido');
  if(Object.keys(sections).length===0)throw Error('Arquivo vazio');
  showImportOptions(sections,'Arquivo: '+file.name+' • Selecione as categorias que deseja importar.');
 }catch{alert('Arquivo incompatível ou inválido. Nenhum dado foi alterado.')}
};
$('#importCancel').onclick=()=>{pendingImport=null;$('#importOptions').hidden=true};
$('#importConfirm').onclick=()=>{
 if(!pendingImport)return;
 const selected=selectedSections('im');if(!selected.length){alert('Selecione pelo menos uma categoria.');return}
 try{
  const p=pendingImport;
  if(selected.includes('tickets'))validate({tickets:p.tickets});
  if(selected.includes('contacts')&&(!Array.isArray(p.contacts)||p.contacts.length>50000||p.contacts.some(c=>!c||typeof c.nome!=='string')))throw Error('Contatos inválidos');
  if(selected.includes('settings')&&(!p.settings||typeof p.settings!=='object'))throw Error('Configurações inválidas');
  if(selected.includes('knowledge')&&(!p.knowledge||!Array.isArray(p.knowledge.scripts)))throw Error('Base inválida');
  if(!confirm('Importar '+selected.length+' categoria(s)? Os dados atuais dessas categorias serão SUBSTITUÍDOS. Faça uma exportação prévia para preservar o conteúdo existente.'))return;
  // Prepara e salva o conjunto em armazenamento local antes de atualizar a interface.
  const prior={tickets:data.tickets,contacts:savedContacts,knowledge:localStorage.getItem(TRANSFER_KB_KEY),panels:localStorage.getItem(PANEL_SETTINGS_KEY),fields:localStorage.getItem(FIELD_ORDER_KEY),theme:localStorage.getItem(THEME_KEY)};
  try{
   if(selected.includes('tickets')){const incoming=p.tickets.map(t=>({...t}));localStorage.setItem(KEY,JSON.stringify({version:2,tickets:incoming}));data={tickets:incoming}}
   if(selected.includes('contacts')){localStorage.setItem(CONTACTS_KEY,JSON.stringify(p.contacts));savedContacts=p.contacts.map(c=>({...c}));refreshSavedPeople()}
   if(selected.includes('knowledge'))applyKnowledge(p.knowledge);
   if(selected.includes('settings')){
    const s=p.settings;
    if(s.panels&&Array.isArray(s.panels.visible)&&Array.isArray(s.panels.custom))localStorage.setItem(PANEL_SETTINGS_KEY,JSON.stringify(s.panels));
    if(typeof s.fields==='string')localStorage.setItem(FIELD_ORDER_KEY,s.fields);
    if(s.theme==='dark'||s.theme==='light')localStorage.setItem(THEME_KEY,s.theme);
   }
  }catch(e){
   data={tickets:prior.tickets};savedContacts=prior.contacts;
   for(const [k,v] of [[KEY,JSON.stringify({version:2,tickets:prior.tickets})],[CONTACTS_KEY,JSON.stringify(prior.contacts)],[TRANSFER_KB_KEY,prior.knowledge],[PANEL_SETTINGS_KEY,prior.panels],[FIELD_ORDER_KEY,prior.fields],[THEME_KEY,prior.theme]]){try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch{}}
   throw e;
  }
  pendingImport=null;$('#importOptions').hidden=true;
  alert('Importação concluída. A página será recarregada para aplicar todas as configurações.');
  location.reload();
 }catch{alert('Não foi possível importar. Confira a integridade do arquivo e o espaço do navegador.')}
};
initialize();
