'use strict';
const $=s=>document.querySelector(s),LB=2.20462262185,r2=n=>Math.round(n*100)/100;
// Elementos con textContent (nunca innerHTML): sin inyección de HTML
const h=(t,a={},...k)=>{const e=document.createElement(t);for(const[n,v]of Object.entries(a)){if(n==='class')e.className=v;else if(n.startsWith('on'))e.addEventListener(n.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(n,v===true?'':v)}
k.flat(9).forEach(c=>e.append(c instanceof Node?c:document.createTextNode(c??'')));return e};
const B=(t,f,c='',l)=>h('button',{class:'btn '+c,type:'button','aria-label':l,onclick:f},t);
const lab=(t,i)=>h('label',{},t,i);
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const pn=t=>{t=String(t).trim().replace(',','.');const v=parseFloat(t);return t!==''&&v>=0?v:''};
const dn=t=>t==='free'?'Libre':'Día '+t.slice(1);
const NAMES=['Hip thrust','Hack squat','Extensiones de piernas','Curl femoral','Elevaciones laterales','Dominadas','Remo en T','Fondos','Abductores','Aductores','Patada en polea','Peso muerto con remo','Curl de bíceps','Extensiones de tríceps','Encogimiento de hombros','Banco 45°','Soga por debajo del braquial'];
const MED=[['cuello','Cuello'],['pecho','Pecho / busto'],['cintura','Cintura (zona más estrecha)'],['abdomen','Abdomen (a nivel del ombligo)'],['cadera','Cadera (zona más ancha)'],['brazoD','Brazo derecho'],['brazoI','Brazo izquierdo'],['musloD','Muslo derecho'],['musloI','Muslo izquierdo'],['pantD','Pantorrilla derecha'],['pantI','Pantorrilla izquierda']];
const S={type:'d1',tab:'dias',date:today(),view:'main',ctx:null,cat:[],all:[],meds:[],stack:[],name:'',sess:null,med:null,f:{day:'',date:''}},V={};
const TOP={main:1,hist:1,cat:1,data:1};
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,4000)}
const saveProfile=()=>DB.put('kv',{k:'perfil',name:S.name,phone:S.phone,cc:S.cc});
const setSt=t=>$('#st').textContent=t;
// Autoguardado: 's' = sesión, 'm' = medidas
let tm;const dirty=new Set();
function save(k='s'){dirty.add(k);setSt('Guardando');clearTimeout(tm);tm=setTimeout(flush,300)}
async function flush(){clearTimeout(tm);if(!dirty.size)return;const d=[...dirty];dirty.clear();
try{if(d.includes('s')&&S.sess){S.sess.modified=Date.now();await DB.put('sessions',S.sess)}if(d.includes('m')&&S.med)await DB.put('kv',S.med);setSt('Guardado')}
catch(e){d.forEach(x=>dirty.add(x));setSt('Error al guardar');toast(e.name==='QuotaExceededError'?'Almacenamiento lleno: exporta una copia y libera espacio':'No se pudo guardar: '+e.message)}}
addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
const mkEx=id=>({exId:id,name:(S.cat.find(c=>c.id===id)||{}).name||'?',open:true,sets:[0,1,2].map(()=>({r:'',w:'',u:'kg'}))});
const hasMed=m=>m.h!==''||m.w!==''||Object.values(m.m||{}).some(v=>v!==''&&v!=null);
async function load(){S.cat=(await DB.all('catalog')).sort((a,b)=>a.o-b.o);S.all=await DB.all('sessions');
const kv=await DB.all('kv'),pf=kv.find(x=>x.k==='perfil')||{};S.name=pf.name||'';S.phone=pf.phone||'';S.cc=pf.cc||'';S.meds=kv.filter(x=>x.k.startsWith('med-'))}
// Una sesión por tipo de día + fecha: al reabrir se recupera sola. Nueva: copia ejercicios de tu última sesión del mismo día.
async function ensure(){const id=`yo|${S.type}|${S.date}`;let s=S.all.find(x=>x.id===id);
if(!s){const p=S.all.filter(x=>x.type===S.type&&x.id!==id&&x.exercises.length).sort((a,b)=>b.localDate.localeCompare(a.localDate))[0];
s={id,athlete:'yo',type:S.type,date:new Date().toISOString(),localDate:S.date,bw:'',bwUnit:'kg',exercises:p?structuredClone(p.exercises):[],status:'en_curso',created:Date.now(),modified:Date.now()}}
S.sess=s;const k='med-'+S.date;S.med=S.meds.find(x=>x.k===k)||{k,date:S.date,h:'',w:'',wu:'kg',m:{}}}
async function go(v,c,bk){await flush();if(!bk&&v!==S.view)S.stack.push({view:S.view,ctx:S.ctx});if(TOP[v])S.stack=[];S.view=v;S.ctx=c;try{await load();if(v==='main')await ensure()}catch(e){toast('Error de base de datos: '+e.message);return}render();scrollTo(0,0)}
const backBtn=()=>B('← Atrás',()=>{const p=S.stack.pop();go(p.view,p.ctx,true)},'sm alt');
function navSync(v){const nv=$('#nav');nv.hidden=v==='setup';
const a=v==='sum'?((S.stack[S.stack.length-1]||{}).view==='hist'?'hist':'main'):v==='pick'?'main':v;
nv.querySelectorAll('button').forEach(b=>b.dataset.v===a?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'))}
const render=()=>{const v=S.name?S.view:'setup',n=V[v]();$('#app').replaceChildren(...(S.stack.length&&v!=='setup'?[backBtn()]:[]),n);navSync(v)};
const fs=(x,i)=>`Serie ${i+1}: ${x.r===''?'–':x.r} rep × ${x.w===''?'–':r2(x.w)} ${x.u||'kg'}`;
// Campo numérico con unidad editable (kg/lb); convierte desde el valor exacto, sin acumular redondeos
const numU=(o,vk,uk,l,k,onch)=>h('div',{class:'nu'},
h('input',{type:'text',inputmode:'decimal','aria-label':l,placeholder:'0',value:o[vk]===''||o[vk]==null?'':r2(o[vk]),oninput:e=>{o[vk]=pn(e.target.value);save(k);onch&&onch()}}),
h('button',{type:'button',class:'u','aria-label':'Unidad de '+l+': '+(o[uk]||'kg')+'. Pulsa para cambiar',onclick:()=>{const to=(o[uk]||'kg')==='kg'?'lb':'kg',f=to==='lb'?LB:1/LB;if(o[vk]!==''&&o[vk]!=null)o[vk]*=f;o[uk]=to;save(k);render()}},o[uk]||'kg'));
const seg=(it,cur,fn)=>h('div',{class:'seg',role:'tablist'},it.map(([v,t])=>h('button',{type:'button',role:'tab','aria-selected':String(v===cur),class:v===cur?'on':'',onclick:()=>fn(v)},t)));

const phoneBox=(c0,p0)=>{const c=h('input',{type:'text',inputmode:'numeric','aria-label':'Código de país',placeholder:'Cód.',value:c0||'',maxlength:3}),
p=h('input',{type:'text',inputmode:'numeric','aria-label':'Número de WhatsApp de 8 dígitos',placeholder:'8 dígitos',value:p0||'',maxlength:12});
return{el:lab('WhatsApp personal (código de país + número de 8 dígitos)',h('div',{class:'row'},h('div',{style:'width:84px'},c),h('div',{class:'g'},p))),
get(){const cc=c.value.replace(/\D/g,''),ph=p.value.replace(/\D/g,'');if(!ph&&!cc)return{cc:'',phone:''};
if(ph.length!==8){toast('El número de WhatsApp debe tener 8 dígitos');return null}if(!cc){toast('Escribe el código de país (ej. 53)');return null}return{cc,phone:ph}}}};
V.setup=()=>{const i=h('input',{type:'text','aria-label':'Tu nombre',placeholder:'Tu nombre',maxlength:40}),pb=phoneBox('','');
return h('div',{class:'card'},h('h2',{},'Bienvenido/a'),h('p',{class:'mut'},'Esta app es personal: tus datos se guardan solo en este teléfono.'),lab('Tu nombre',i),pb.el,
B('Empezar',async()=>{const n=i.value.trim();if(!n)return toast('Escribe tu nombre');const p=pb.get();if(!p)return;
try{S.name=n;S.cc=p.cc;S.phone=p.phone;await saveProfile();go('main')}catch(e){toast('Error: '+e.message)}},'main'))};

V.main=()=>h('div',{},
S.tab==='med'?B('← Atrás',()=>{S.tab='dias';render()},'sm alt'):'',
h('p',{class:'mut'},'Sesión de '+S.name),
seg([['dias','Días'],['med','Medidas']],S.tab,v=>{S.tab=v;render()}),
lab('Fecha',h('input',{type:'date',value:S.date,onchange:e=>{if(e.target.value){S.date=e.target.value;go('main')}}})),
S.tab==='med'?medView():diasView());

function diasView(){const s=S.sess,p=h('progress'),pt=h('span',{class:'mut'});
const prog=()=>{let t=0,d=0;s.exercises.forEach(e=>e.sets.forEach(x=>{t++;if(x.r!==''&&x.w!=='')d++}));p.max=t||1;p.value=d;pt.textContent=d+' de '+t+' series con datos'};prog();
const cards=s.exercises.map((e,i)=>{
const top=h('div',{class:'row'},h('button',{type:'button',class:'ex','aria-expanded':String(e.open!==false),onclick:()=>{e.open=e.open===false;save();render()}},h('i',{},i+1),e.name,h('span',{},e.open===false?'▸':'▾')));
if(e.open===false)return h('div',{class:'card'},top);
return h('div',{class:'card'},top,h('div',{class:'sr mut'},'#','Peso / unidad','Reps',''),
e.sets.map((x,j)=>h('div',{class:'sr'},h('span',{class:'mut'},j+1),numU(x,'w','u',e.name+' serie '+(j+1)+' peso','s',prog),
h('input',{type:'text',inputmode:'numeric',list:'dl-r','aria-label':e.name+' serie '+(j+1)+' repeticiones',placeholder:'reps',value:x.r,oninput:ev=>{const v=parseInt(ev.target.value,10);x.r=v>0?v:'';save();prog()}}),
B('−',()=>{if(e.sets.length>1){e.sets.splice(j,1);save();render()}},'sm alt','Quitar serie '+(j+1)))),
h('div',{class:'row'},B('+ Serie',()=>{const l=e.sets[e.sets.length-1];e.sets.push({r:'',w:'',u:l?l.u:'kg'});save();render()},'sm alt'),
B('Cambiar',()=>go('pick',{cb:ids=>{const c=S.cat.find(z=>z.id===ids[0]);e.exId=c.id;e.name=c.name;save();go('main')}}),'sm alt','Cambiar ejercicio '+e.name),
B('Quitar',()=>{if(confirm('¿Quitar '+e.name+' de esta sesión?')){s.exercises.splice(i,1);save();render()}},'sm alt')))});
return h('div',{},lab('Día de entrenamiento',seg([1,2,3,4,5,6,7].map(n=>['d'+n,String(n)]),S.type,v=>{S.type=v;go('main')})),
h('div',{class:'card'},lab('Peso corporal del día',numU(s,'bw','bwUnit','Peso corporal','s'))),
h('div',{class:'card'},p,pt),cards,
B('+ Añadir ejercicio',()=>go('pick',{multi:true,cb:ids=>{s.exercises.push(...ids.map(mkEx));save();go('main')}}),'alt'),
B('Finalizar sesión',async()=>{if(!confirm('¿Finalizar la sesión? Se guardará y se abrirá el resumen. Podrás corregirla después.'))return;s.status='finalizada';s.finished=Date.now();save();await flush();go('sum',s)},'main'),
B('Limpiar panel',async()=>{if(!confirm('Se borrarán SOLO los ejercicios, series, repeticiones, cargas y peso de ESTA sesión ('+dn(s.type)+', '+s.localDate+').\n\nNO se borra: catálogo, otras sesiones, historial, medidas corporales ni copias exportadas.\n\n¿Limpiar?'))return;
s.exercises=[];s.bw='';s.status='en_curso';save();await flush();render();toast('Panel limpiado')},'red'),exportBox())}

const exportBox=()=>h('div',{class:'card noshot'},h('b',{},'Exportar'),
h('p',{class:'mut'},'Sesión'),h('div',{class:'row'},B('TXT',()=>expDay('ses','txt'),'alt g'),B('PDF',()=>expDay('ses','pdf'),'alt g')),
h('p',{class:'mut'},'Todos los detalles del día'),h('div',{class:'row'},B('TXT',()=>expDay('all','txt'),'alt g'),B('PDF',()=>expDay('all','pdf'),'alt g')),
B('Exportar como mensaje a WhatsApp',()=>waSend(),'wa'));

function medView(){const m=S.med,box=h('div');
const mt=x=>`Altura: ${x.h===''?'—':x.h+' m'} · Peso: ${x.w===''?'—':r2(x.w)+' '+(x.wu||'kg')}`;
const ml=x=>MED.filter(([k])=>x.m&&x.m[k]!==''&&x.m[k]!=null).map(([k,l])=>l.split(' (')[0]+': '+x.m[k]+' cm').join(' · ');
const draw=()=>{const L=[...S.meds.filter(x=>x.k!==m.k),...(hasMed(m)?[m]:[])].sort((a,b)=>b.date.localeCompare(a.date));
box.replaceChildren(...(L.length?L.map(x=>h('div',{class:'card'},h('b',{},x.date),h('p',{class:'mut'},mt(x)),h('p',{},ml(x)||'Sin medidas'),B('Editar este día',()=>{S.date=x.date;go('main')},'sm alt'))):[h('p',{class:'mut'},'Aún no hay medidas guardadas.')]))};draw();
return h('div',{},h('div',{class:'card'},lab('Altura (m)',h('input',{type:'text',inputmode:'decimal',value:m.h,oninput:e=>{m.h=pn(e.target.value);save('m');draw()}})),
lab('Peso',numU(m,'w','wu','Peso (medidas)','m',draw)),
MED.map(([k,l],i)=>lab((i+1)+'. '+l+' (cm)',h('input',{type:'text',inputmode:'decimal',value:m.m[k]??'',oninput:e=>{m.m[k]=pn(e.target.value);save('m');draw()}})))),
h('h2',{},'Historial de medidas'),box)}

V.pick=()=>{const c=S.ctx,sel=new Set(),box=h('div'),q=h('input',{type:'search','aria-label':'Buscar ejercicio',placeholder:'Buscar…',oninput:()=>draw()}),nn=h('input',{type:'text','aria-label':'Nuevo ejercicio',placeholder:'Nuevo ejercicio personalizado'});
function draw(){const k=q.value.toLowerCase();box.replaceChildren(...S.cat.filter(x=>x.name.toLowerCase().includes(k)).map(x=>c.multi?h('label',{class:'card row'},h('input',{type:'checkbox',style:'width:28px',onchange:e=>e.target.checked?sel.add(x.id):sel.delete(x.id)}),x.name):B(x.name,()=>c.cb([x.id]),'alt')))}
draw();
return h('div',{},h('h2',{},c.multi?'Añadir ejercicios':'Cambiar por…'),q,box,
h('div',{class:'card'},nn,B('Crear y usar',async()=>{const n=nn.value.trim();if(!n)return toast('Escribe un nombre');
let x=S.cat.find(z=>z.name.toLowerCase()===n.toLowerCase());try{if(!x){x={id:uid(),name:n,o:S.cat.length+1};await DB.put('catalog',x);S.cat.push(x)}}catch(e){return toast('Error: '+e.message)}c.cb([x.id])})),
c.multi?B('Añadir seleccionados',()=>{if(!sel.size)return toast('Selecciona al menos uno');c.cb([...sel])},'main'):'',B('Cancelar',()=>go('main'),'alt'))};

V.sum=()=>{const s=S.ctx;
return h('div',{},h('div',{class:'sum',onclick:()=>document.body.classList.remove('cap')},h('h2',{},'GYM RAT APP'),h('p',{},h('b',{},S.name)),
h('p',{},new Date(s.date).toLocaleString('es')),h('p',{},dn(s.type)+(s.status==='finalizada'?'':' (en curso)')),h('p',{},'Peso corporal: '+(s.bw===''||s.bw==null?'—':r2(s.bw)+' '+s.bwUnit)),
s.exercises.map((e,i)=>h('div',{},h('h3',{},(i+1)+'. '+e.name+' — '+e.sets.length+' series'),e.sets.map((x,j)=>h('p',{},fs(x,j)))))),
h('div',{class:'noshot'},B('Modo captura (toca para salir)',()=>document.body.classList.add('cap')),
B('Corregir en la vista principal',()=>{S.type=s.type;S.date=s.localDate;S.tab='dias';go('main')},'alt'),B('Volver',()=>go('main'),'alt'),exportBox()))};

V.hist=()=>{const f=S.f,box=h('div');
function draw(){const L=S.all.filter(s=>s.exercises.length&&(!f.day||s.type===f.day)&&(!f.date||s.localDate===f.date)).sort((a,b)=>b.localDate.localeCompare(a.localDate));
box.replaceChildren(...(L.length?L.map(s=>B(s.localDate+' · '+dn(s.type)+' · '+s.exercises.length+' ej. · '+(s.status==='finalizada'?'finalizada':'en curso'),()=>go('sum',s),'alt')):[h('p',{class:'mut'},'Sin sesiones.')]))}
draw();
return h('div',{},h('h2',{},'Historial'),
lab('Día',h('select',{onchange:e=>{f.day=e.target.value;draw()}},[['','Todos'],...[1,2,3,4,5,6,7].map(n=>['d'+n,'Día '+n])].map(([v,t])=>h('option',{value:v,selected:f.day===v},t)))),
lab('Fecha',h('input',{type:'date',value:f.date,onchange:e=>{f.date=e.target.value;draw()}})),box)};

V.cat=()=>{const inp=h('input',{type:'text','aria-label':'Nuevo ejercicio',placeholder:'Nuevo ejercicio'});
return h('div',{},h('h2',{},'Catálogo'),h('div',{class:'card'},inp,B('Añadir',async()=>{const n=inp.value.trim();
if(!n)return toast('Escribe un nombre');if(S.cat.some(c=>c.name.toLowerCase()===n.toLowerCase()))return toast('Ya existe');
await DB.put('catalog',{id:uid(),name:n,o:S.cat.length+1});go('cat')})),
S.cat.map((c,i)=>h('div',{class:'card row'},h('span',{class:'g'},(i+1)+'. '+c.name),
B('Renombrar',async()=>{const n=(prompt('Nuevo nombre',c.name)||'').trim();if(n){c.name=n;await DB.put('catalog',c);render()}},'sm alt'),
B('Eliminar',async()=>{if(confirm('¿Eliminar "'+c.name+'" del catálogo? El historial conserva sus registros.')){await DB.del('catalog',c.id);go('cat')}},'sm red'))))};

const dl=(n,t,m)=>{const u=URL.createObjectURL(new Blob([t],{type:m}));const a=h('a',{href:u,download:n});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)};
const rep=ss=>ss.map(s=>[`GYM RAT APP — ${S.name}`,`Fecha: ${new Date(s.date).toLocaleString('es')}`,`Tipo: ${dn(s.type)}`,`Peso corporal: ${s.bw===''||s.bw==null?'—':r2(s.bw)+' '+s.bwUnit}`,`Estado: ${s.status==='finalizada'?'finalizada':'en curso'}`,
...s.exercises.flatMap((e,i)=>[`${i+1}. ${e.name} (${e.sets.length} series)`,...e.sets.map((x,j)=>'   '+fs(x,j))]),''].join('\n')).join('\n----------\n');
const medTxt=m=>['MEDIDAS CORPORALES',`Altura: ${m.h===''?'—':m.h+' m'}`,`Peso: ${m.w===''?'—':r2(m.w)+' '+(m.wu||'kg')}`,...MED.map(([k,l],i)=>`${i+1}. ${l}: ${m.m[k]===''||m.m[k]==null?'—':m.m[k]+' cm'}`)].join('\n');
// PDF mínimo sin librerías (offline): A4, Courier, codificación WinAnsi (acentos y ñ)
const W1252={'—':151,'–':150,'…':133,'’':146,'‘':145,'“':147,'”':148,'•':149,'€':128};
const wa=t=>{let o='';for(const ch of t.normalize('NFC')){const c=ch.charCodeAt(0);o+=c<128||(c>=160&&c<256)?ch:String.fromCharCode(W1252[ch]||63)}return o};
const esc=t=>t.replace(/[\\()]/g,'\\$&');
function mkPdf(txt){const M=82,PL=57,L=[];
txt.split('\n').forEach(l=>{l=l.replace(/\t/g,'    ');const ind=Math.min((l.match(/^ */)[0]).length,20);let r=l;
while(r.length>M){let k=r.lastIndexOf(' ',M);if(k<=ind)k=M;L.push(r.slice(0,k));r=' '.repeat(ind)+r.slice(k).trimStart()}L.push(r)});
const P=[];for(let i=0;i<L.length;i+=PL)P.push(L.slice(i,i+PL));if(!P.length)P.push(['']);
const bold=/^(GYM RAT APP|MEDIDAS CORPORALES|Detalles del día|Historial completo)/,n=P.length,ob=[];
ob[1]='<</Type/Catalog/Pages 2 0 R>>';
ob[2]=`<</Type/Pages/Kids[${P.map((_,i)=>(6+2*i)+' 0 R').join(' ')}]/Count ${n}>>`;
ob[3]='<</Type/Font/Subtype/Type1/BaseFont/Courier/Encoding/WinAnsiEncoding>>';
ob[4]='<</Type/Font/Subtype/Type1/BaseFont/Courier-Bold/Encoding/WinAnsiEncoding>>';
P.forEach((pg,i)=>{const c='BT 13 TL 50 782 Td\n'+pg.map(l=>`/${bold.test(l)?'F2':'F1'} 10 Tf (${esc(wa(l))}) Tj T*`).join('\n')+'\nET\n'+`BT /F1 8 Tf 50 28 Td (${esc(wa(`Página ${i+1} de ${n}`))}) Tj ET`;
ob[5+2*i]=`<</Length ${c.length}>>\nstream\n${c}\nendstream`;
ob[6+2*i]=`<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 3 0 R/F2 4 0 R>>>>/Contents ${5+2*i} 0 R>>`});
let pdf='%PDF-1.4\n';const off=[];
for(let i=1;i<ob.length;i++){off[i]=pdf.length;pdf+=`${i} 0 obj\n${ob[i]}\nendobj\n`}
const x=pdf.length;pdf+=`xref\n0 ${ob.length}\n0000000000 65535 f \n`+off.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<</Size ${ob.length}/Root 1 0 R>>\nstartxref\n${x}\n%%EOF`;
return Uint8Array.from(pdf,c=>c.charCodeAt(0)&255)}
const out=(nm,txt,fmt)=>fmt==='pdf'?dl(nm+'.pdf',mkPdf(txt),'application/pdf'):dl(nm+'.txt',txt,'text/plain;charset=utf-8');
// 'ses' = resultados de la sesión mostrada; 'all' = todo lo del día (sesiones + peso + medidas)
async function expDay(kind,fmt='txt'){try{await flush();await load();const sm=S.view==='sum',s=sm?S.ctx:S.sess,d=sm?s.localDate:S.date;
if(kind==='ses'){if(!s||!s.exercises.length)return toast('No hay ejercicios en esta sesión');out(`gym-rat-sesion-${s.localDate}-${s.type}`,rep([s]),fmt)}
else{const ses=S.all.filter(x=>x.localDate===d&&x.exercises.length).sort((a,b)=>a.type.localeCompare(b.type)),m=S.meds.find(x=>x.date===d);
if(!ses.length&&!(m&&hasMed(m)))return toast('No hay datos guardados de ese día');
out(`gym-rat-dia-${d}`,[`GYM RAT APP — ${S.name}`,`Detalles del día ${d}`,'',ses.length?rep(ses):'Sin sesiones de entrenamiento',m&&hasMed(m)?'\n'+medTxt(m):''].join('\n'),fmt)}
toast('Exportación lista')}catch(e){toast('Error al exportar: '+e.message)}}
// WhatsApp: abre wa.me con el resultado de la sesión ya escrito; el envío lo confirmas tú en WhatsApp
async function waSend(){try{await flush();await load();
if(!S.phone||!S.cc){toast('Primero guarda tu número de WhatsApp en General');return go('data')}
const sm=S.view==='sum',s=sm?S.ctx:S.sess;if(!s||!s.exercises.length)return toast('No hay ejercicios en esta sesión');
if(!navigator.onLine)return toast('WhatsApp necesita conexión a internet');
let t=rep([s]);if(t.length>3500)t=t.slice(0,3500).replace(/\n[^\n]*$/,'')+'\n… (mensaje recortado: usa PDF/TXT para el detalle completo)';
const a=h('a',{href:`https://wa.me/${S.cc}${S.phone}?text=${encodeURIComponent(t)}`,target:'_blank',rel:'noopener'});document.body.append(a);a.click();a.remove()}
catch(e){toast('Error al abrir WhatsApp: '+e.message)}}
// Historial completo (todas las sesiones + medidas) en TXT o PDF
const fullTxt=()=>{const ses=S.all.filter(s=>s.exercises.length).sort((a,b)=>a.localDate.localeCompare(b.localDate)||a.type.localeCompare(b.type)),ms=S.meds.filter(hasMed).sort((a,b)=>a.date.localeCompare(b.date));
return [`GYM RAT APP — ${S.name}`,`Historial completo (exportado ${today()})`,`${ses.length} sesiones`,'',ses.length?rep(ses):'Sin sesiones de entrenamiento',
...(ms.length?['','MEDIDAS CORPORALES — HISTORIAL',...ms.flatMap(m=>['',`Fecha: ${m.date}`,...medTxt(m).split('\n').slice(1)])]:[])].join('\n')};
async function exp(kind){try{await flush();await load();const d=today();
if(kind==='json'){const sess=S.all.filter(s=>s.exercises.length).sort((a,b)=>a.date.localeCompare(b.date));
dl(`gym-rat-backup-${d}.json`,JSON.stringify({app:'gym-rat-app',schema:1,exportedAt:new Date().toISOString(),catalog:await DB.all('catalog'),athletes:[],preferences:await DB.all('kv'),sessions:sess},null,1),'application/json')}
else{if(!S.all.some(s=>s.exercises.length)&&!S.meds.some(hasMed))return toast('Aún no hay datos para exportar');out(`gym-rat-historial-${d}`,fullTxt(),kind)}
toast('Exportación lista')}catch(e){toast('Error al exportar: '+e.message)}}
V.data=()=>{const pb=phoneBox(S.cc,S.phone),n=h('input',{type:'text','aria-label':'Tu nombre',value:S.name,maxlength:40});
return h('div',{},h('h2',{},'General'),h('p',{class:'mut'},'Todo se guarda solo en este dispositivo.'),
h('h3',{},'Datos personales'),
h('div',{class:'card'},lab('Tu nombre',n),pb.el,B('Guardar datos',async()=>{const v=n.value.trim();if(!v)return toast('Escribe tu nombre');const p=pb.get();if(!p)return;
try{S.name=v;S.cc=p.cc;S.phone=p.phone;await saveProfile();toast('Datos guardados')}catch(e){toast('Error: '+e.message)}},'alt')),
h('h2',{style:'margin-top:28px;padding-top:16px;border-top:1px solid var(--ln)'},'Exportación'),
h('p',{class:'mut'},'«Guardado General» descarga un archivo con todos tus datos; TXT y PDF son para leer o compartir.'),
B('Guardado General',()=>exp('json'),'main'),
h('div',{class:'card'},h('b',{},'Historial completo'),h('p',{class:'mut'},'Todas las sesiones y medidas, para leer o compartir.'),h('div',{class:'row'},B('TXT',()=>exp('txt'),'alt g'),B('PDF',()=>exp('pdf'),'alt g'))))};

(async()=>{try{
const dl2=h('datalist',{id:'dl-r'});for(let i=6;i<=30;i++)dl2.append(h('option',{value:i}));document.body.append(dl2);
if(!(await DB.all('catalog')).length)for(const [i,n] of NAMES.entries())await DB.put('catalog',{id:'ex'+(i+1),name:n,o:i+1});
navigator.storage&&navigator.storage.persist&&navigator.storage.persist();
document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
const on=()=>$('#on').textContent=navigator.onLine?'En línea':'Sin conexión';on();addEventListener('online',on);addEventListener('offline',on);
if('serviceWorker' in navigator)navigator.serviceWorker.register('service-worker.js').catch(()=>{});
go('main')}catch(e){$('#app').textContent='Error de base de datos: '+e.message}})();
