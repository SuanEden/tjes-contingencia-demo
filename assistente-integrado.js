(function(){
'use strict';
const host=document.querySelector('#view-form .panel');
if(!host||document.getElementById('tjesAssistantTemplates'))return;
const css=document.createElement('style');
css.textContent='#tjesAssistantTemplates{border:1px solid #c1d4e6;border-radius:10px;background:#f5f9fe;margin:0 0 16px;overflow:hidden;color:#243c55}#tjesAssistantTemplates>summary{cursor:pointer;padding:14px 16px;font-weight:700}#tjesAssistantTemplates .assistant-inner{padding:14px;border-top:1px solid #d4e0eb}#tjesAssistantTemplates .assistant-layout{display:grid;grid-template-columns:minmax(160px,1fr) minmax(0,1.3fr);gap:12px}#tjesAssistantTemplates .assistant-list{display:flex;flex-direction:column;gap:7px}#tjesAssistantTemplates .assistant-card{text-align:left;width:100%;display:block;border:1px solid #c6d6e6;border-radius:8px;padding:10px;background:#fff}#tjesAssistantTemplates .assistant-card strong,#tjesAssistantTemplates .assistant-card small{display:block}#tjesAssistantTemplates .assistant-card small{font-size:11px;color:#5d7288;margin-top:4px}#tjesAssistantTemplates .assistant-card[aria-pressed=true]{background:#e4f2ff;border-color:#1676b9}#tjesAssistantTemplates .assistant-detail{border:1px solid #d3dfe9;border-radius:8px;padding:12px;background:#fff;min-width:0}#tjesAssistantTemplates .assistant-role{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}#tjesAssistantTemplates .assistant-role button[aria-pressed=true]{background:#17649e;color:white}#tjesAssistantTemplates .assistant-preview{white-space:pre-wrap;overflow:auto;max-height:260px;background:#f0f5fa;padding:12px;border-radius:6px;font-size:12px;line-height:1.55;word-break:break-word}#tjesAssistantTemplates .assistant-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}#tjesAssistantTemplates .assistant-hint{font-size:12px;color:#526b83;line-height:1.45}#tjesAssistantTemplates .assistant-feedback{font-size:12px;color:#245c7e;min-height:16px;margin-bottom:0}[data-theme=dark] #tjesAssistantTemplates{background:#1d3046;color:#eff7ff;border-color:#435d7a}[data-theme=dark] #tjesAssistantTemplates .assistant-detail,[data-theme=dark] #tjesAssistantTemplates .assistant-card{background:#253c55;color:#edf5fc;border-color:#526c89}[data-theme=dark] #tjesAssistantTemplates .assistant-preview{background:#172b40;color:#eff7ff}[data-theme=dark] #tjesAssistantTemplates .assistant-hint{color:#c8d7e6}@media(max-width:700px){#tjesAssistantTemplates .assistant-layout{grid-template-columns:1fr}}';
document.head.append(css);
const panel=document.createElement('details');
panel.id='tjesAssistantTemplates';
panel.innerHTML='<summary>Assistente TJES · Padrões da extensão</summary><div class="assistant-inner"><p class="assistant-hint">Modelos para o atendimento local. A página não acessa o Assyst autenticado, não atribui usuários e não salva automaticamente.</p><div class="assistant-layout"><div class="assistant-list" id="assistantModelList"></div><div class="assistant-detail" id="assistantModelDetail"></div></div><p id="assistantModelMessage" class="assistant-feedback" role="status"></p></div>';
host.insertBefore(panel,host.firstElementChild);
const list=panel.querySelector('#assistantModelList');
const detail=panel.querySelector('#assistantModelDetail');
const feedback=panel.querySelector('#assistantModelMessage');
let models=[],paths=[],selected=null,role=null;
function addField(text,label,value){
 if(!value)return text;
 const safe=label.replace(/[.*+?^$()|[\]{}\\]/g,'\\$&');
 const rx=new RegExp('(^\\s*•\\s*'+safe+':\\s*)\\[PREENCHER\\]','im');
 return text.replace(rx,function(_,prefix){return prefix+value});
}
function description(){
 if(!selected)return '';
 const variant=selected.variants&&selected.variants.find(function(x){return x.role===role});
 let txt=variant?variant.description:selected.description;
 const value=id=>document.getElementById(id)?.value?.trim()||'';
 const name=value('f-nome'),email=value('f-email'),phone=value('f-telefone');
 if(selected.serviceId==='1840'&&role==='Chefiado'){
  txt=addField(txt,'Nome do chefiado',name);
 }else{
  for(const label of ['Nome','Nome completo','Nome do solicitante'])txt=addField(txt,label,name);
  txt=addField(txt,'Contato',email||phone);
 }
 if(selected.id==='certificado-digital-fornecer-token'){
  for(const pair of [['CPF','f-cpf'],['Cargo/Função','f-ocupacao'],['Local de trabalho','f-departamento'],['Endereço','f-endereco'],['Telefone (WhatsApp)','f-telefone'],['E-mail institucional','f-email']]){
   txt=addField(txt,pair[0],value(pair[1]));
  }
 }
 return txt;
}
function message(text){feedback.textContent=text}
function render(){
 list.replaceChildren();detail.replaceChildren();
 for(const model of models){
  const b=document.createElement('button');b.type='button';b.className='assistant-card';
  b.setAttribute('aria-pressed',String(selected?.id===model.id));
  const strong=document.createElement('strong');strong.textContent=model.name;
  const small=document.createElement('small');small.textContent=model.serviceId?'Serviço '+model.serviceId+' · Modelo local':'Modelo local';
  b.append(strong,small);
  b.addEventListener('click',()=>{selected=model;role=null;render()});
  list.append(b);
 }
 if(!selected){const p=document.createElement('p');p.className='assistant-hint';p.textContent='Selecione um modelo para preparar o resumo e a descrição.';detail.append(p);return}
 const title=document.createElement('strong');title.textContent=selected.name;detail.append(title);
 if(selected.variants?.length){
  const caption=document.createElement('p');caption.className='assistant-hint';caption.textContent='Quem está solicitando?';detail.append(caption);
  const choices=document.createElement('div');choices.className='assistant-role';
  for(const v of selected.variants){
   const b=document.createElement('button');b.type='button';b.textContent=v.role;b.setAttribute('aria-pressed',String(role===v.role));
   b.addEventListener('click',()=>{role=v.role;render()});choices.append(b);
  }
  detail.append(choices);
 }
 const route=paths.find(x=>x.serviceId===selected.serviceId);
 if(route){const p=document.createElement('p');p.className='assistant-hint';p.textContent='Percurso no Assyst (referência): '+route.path.join(' › ');detail.append(p)}
 const summary=document.createElement('p');summary.className='assistant-hint';summary.textContent='Resumo: '+selected.summary;detail.append(summary);
 const preview=document.createElement('div');preview.className='assistant-preview';
 preview.textContent=selected.variants&&!role?'Selecione Chefia ou Chefiado.':description();detail.append(preview);
 const row=document.createElement('div');row.className='assistant-actions';
 const apply=document.createElement('button');apply.type='button';apply.className='primary';apply.textContent='Usar no atendimento';apply.disabled=!!(selected.variants&&!role);
 apply.addEventListener('click',()=>{
  const summary=document.querySelector('#f-problema'),desc=document.querySelector('#f-descricao');
  if(!summary||!desc){message('Campos do formulário não encontrados.');return}
  if((summary.value.trim()||desc.value.trim())&&!confirm('Substituir o resumo e a descrição existentes?'))return;
  summary.value=selected.summary;desc.value=description();
  for(const el of [summary,desc]){
   el.dispatchEvent(new Event('input',{bubbles:true}));
   el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  message('Resumo e descrição preparados. Revise e salve manualmente.');
 });
 const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar descrição';copy.disabled=!!(selected.variants&&!role);
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(description());message('Descrição copiada.')}catch{message('Não foi possível copiar automaticamente.')}});
 row.append(apply,copy);detail.append(row);
}
document.getElementById('ticketForm')?.addEventListener('input',event=>{
 if(!selected||!['f-nome','f-email','f-telefone','f-cpf','f-departamento','f-endereco','f-ocupacao'].includes(event.target.id))return;
 const p=detail.querySelector('.assistant-preview');if(p&&(!selected.variants||role))p.textContent=description();
});
fetch('./assistente-padroes.json').then(r=>{if(!r.ok)throw Error('Arquivo indisponível');return r.json()})
 .then(data=>{
  if(data.source!=='assistente-tjes-assyst'||!Array.isArray(data.procedures))throw Error('Catálogo inválido');
  models=data.procedures.filter(x=>x&&typeof x.summary==='string'&&typeof x.description==='string');
  paths=Array.isArray(data.paths)?data.paths:[];
  render();
 }).catch(e=>message('Não foi possível carregar modelos: '+e.message));
})();
