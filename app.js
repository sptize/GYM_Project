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
const MED=[['cuello','Cuello'],['pecho','Pecho / busto'],['cintura','Cintura (zona más estrecha)'],['abdomen','Abdomen (a nivel del ombligo)'],['cadera','Cadera (zona más ancha)'],['brazoD','Brazo derecho'],['brazoI','Brazo izquierdo'],['musloD','Muslo derecho'],['musloI','Muslo izquierdo'],['pantD','Pantorrilla derecha'],['pantI','Pantorrilla izquierda']];
const S={type:'d1',tab:'dias',date:today(),view:'main',ctx:null,cat:[],all:[],meds:[],plan:{days:0,routines:{}},stack:[],name:'',sess:null,med:null,ready:'',auto:true,open:{},f:{day:'',date:''},ptab:'m',rm:{k:'1rm',d:{}},rmOpen:{},rmCalc:{},share:0,imp:null},V={};
const TOP={main:1,hist:1,plan:1,data:1};
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,4000)}
const saveProfile=()=>DB.put('kv',{k:'perfil',name:S.name,phone:S.phone,cc:S.cc});
const setSt=t=>$('#st').textContent=t;
// Autoguardado: 's' = sesión, 'm' = medidas, 'r' = 1RM
let tm;const dirty=new Set();
function save(k='s'){dirty.add(k);setSt('Guardando');clearTimeout(tm);tm=setTimeout(flush,300)}
async function flush(){clearTimeout(tm);if(!dirty.size)return;const d=[...dirty];dirty.clear();
try{if(d.includes('s')&&S.sess){S.sess.modified=Date.now();await DB.put('sessions',S.sess)}if(d.includes('m')&&S.med)await DB.put('kv',S.med);if(d.includes('r')&&S.rm)await DB.put('kv',S.rm);setSt('Guardado')}
catch(e){d.forEach(x=>dirty.add(x));setSt('Error al guardar');toast(e.name==='QuotaExceededError'?'Almacenamiento lleno: exporta una copia y libera espacio':'No se pudo guardar: '+e.message)}}
addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
const nameOf=(id,fb)=>(S.cat.find(c=>c.id===id)||{}).name||fb||'?';
const mkEx=(id,fb,n)=>({exId:id,name:nameOf(id,fb),open:true,sets:Array.from({length:n>0&&n<=10?n:3},()=>({r:'',w:'',u:'kg'}))});
const planEx=t=>(S.plan.routines[t]||[]).map(e=>mkEx(e.id,e.name,e.s));
// Hidratación: parte de la sesión. s.hy = [{v,u}] con u 'ml' o 'pomos'; se suman las entradas
const hyTxt=s=>{const it=s.hy||[];if(!it.length)return '';const t={};it.forEach(x=>t[x.u]=(t[x.u]||0)+x.v);
return it.length>1?it.map(x=>r2(x.v)+' '+x.u).join(' + ')+' = '+Object.entries(t).map(([u,v])=>r2(v)+' '+u).join(' + '):r2(it[0].v)+' '+it[0].u};
const hasMed=m=>m.h!==''||m.w!==''||Object.values(m.m||{}).some(v=>v!==''&&v!=null);
async function load(){S.cat=(await DB.all('catalog')).sort((a,b)=>a.name.localeCompare(b.name,'es',{sensitivity:'base'}));S.all=await DB.all('sessions');
const kv=await DB.all('kv'),pf=kv.find(x=>x.k==='perfil')||{};S.name=pf.name||'';S.phone=pf.phone||'';S.cc=pf.cc||'';S.meds=kv.filter(x=>x.k.startsWith('med-'));
const r1=kv.find(x=>x.k==='1rm');S.rm=r1&&r1.d?r1:{k:'1rm',d:{}};
const pl=kv.find(x=>x.k==='plan');S.plan=pl?{days:pl.days||0,routines:pl.routines||{}}:{days:0,routines:{}}}
// Día que toca hoy: el que ya tiene registro en la fecha, o el siguiente al último registrado (cíclico)
function autoDay(){const D=S.plan.days;if(!D)return S.type;
const L=S.all.filter(x=>/^d[1-7]$/.test(x.type)&&x.localDate<=S.date).sort((a,b)=>a.localDate.localeCompare(b.localDate)||(a.modified||0)-(b.modified||0)),l=L[L.length-1];
if(!l)return 'd1';if(l.localDate===S.date&&l.status!=='saltado')return l.type;return 'd'+((+l.type.slice(1))%D+1)}
// Una sesión por tipo de día + fecha: al reabrir se recupera sola. Nueva: copia ejercicios de tu última sesión del mismo día.
async function ensure(){const id=`yo|${S.type}|${S.date}`;let s=S.all.find(x=>x.id===id);
if(!s){const pe=planEx(S.type),p=pe.length?null:S.all.filter(x=>x.type===S.type&&x.id!==id&&x.exercises.length).sort((a,b)=>b.localDate.localeCompare(a.localDate))[0];
s={id,athlete:'yo',type:S.type,date:new Date().toISOString(),localDate:S.date,bw:'',bwUnit:'kg',exercises:pe.length?pe:p?structuredClone(p.exercises):[],hy:[],status:'en_curso',created:Date.now(),modified:Date.now()}}
S.sess=s;const k='med-'+S.date;S.med=S.meds.find(x=>x.k===k)||{k,date:S.date,h:'',w:'',wu:'kg',m:{}};}
async function go(v,c,bk){await flush();if(!bk&&v!==S.view)S.stack.push({view:S.view,ctx:S.ctx});if(TOP[v])S.stack=[];S.view=v;S.ctx=c;try{await load();if(v==='main'){if(S.auto){S.type=autoDay();S.auto=false}await ensure()}}catch(e){toast('Error de base de datos: '+e.message);return}render();scrollTo(0,0)}
const backBtn=()=>B('← Atrás',()=>{const p=S.stack.pop();go(p.view,p.ctx,true)},'sm alt');
function navSync(v){const nv=$('#nav');nv.hidden=v==='setup';
const a=v==='sum'?((S.stack[S.stack.length-1]||{}).view==='hist'?'hist':'main'):v==='pick'?((S.ctx&&S.ctx.back)||'main'):v;
nv.querySelectorAll('button').forEach(b=>b.dataset.v===a?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current'))}
const render=()=>{const v=S.name?S.view:'setup',n=V[v]();$('#app').replaceChildren(...(S.stack.length&&v!=='setup'?[backBtn()]:[]),n);navSync(v)};
const fs=(x,i)=>`Serie ${i+1}: ${x.r===''?'–':x.r} rep × ${x.w===''?'–':r2(x.w)} ${x.u||'kg'}`;
// Campo numérico con unidad editable (kg/lb); convierte desde el valor exacto, sin acumular redondeos
const numU=(o,vk,uk,l,k,onch,ph,dis)=>h('div',{class:'nu'},
h('input',{type:'text',inputmode:'decimal','aria-label':l,placeholder:ph||'–',disabled:!!dis,value:o[vk]===''||o[vk]==null?'':r2(o[vk]),oninput:e=>{o[vk]=pn(e.target.value);save(k);onch&&onch()}}),
h('button',{type:'button',class:'u',disabled:!!dis,'aria-label':'Unidad de '+l+': '+(o[uk]||'kg')+'. Pulsa para cambiar',onclick:()=>{const to=(o[uk]||'kg')==='kg'?'lb':'kg',f=to==='lb'?LB:1/LB;if(o[vk]!==''&&o[vk]!=null)o[vk]*=f;o[uk]=to;save(k);render()}},o[uk]||'kg'));
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
seg([['dias','Días'],['med','Parámetros']],S.tab,v=>{S.tab=v;render()}),
lab('Fecha',h('input',{type:'date',value:S.date,onchange:e=>{if(e.target.value){S.date=e.target.value;S.auto=true;go('main')}}})),
S.tab==='med'?paramView():diasView());

// Parámetros: dos slots bajo la fecha, Medidas y 1RM
const paramView=()=>h('div',{},seg([['m','Medidas'],['rm','1RM']],S.ptab,v=>{S.ptab=v;render()}),S.ptab==='rm'?rmView():medView());
// Fórmula de Epley: 1RM = peso × (1 + reps/30). Con 1 repetición el 1RM es el propio peso
const epley=(w,r)=>!(w>0)||!(r>=1)?0:r===1?r2(w):Math.round(w*(1+r/30)*10)/10;
function rmView(){const D=S.plan.days,seen=new Set(),L=[];
for(let i=1;i<=D;i++)(S.plan.routines['d'+i]||[]).forEach(e=>{if(!seen.has(e.id)){seen.add(e.id);L.push(e)}});
const hint=h('p',{class:'hint'},'1RM (una repetición máxima): el peso más alto que podrías levantar una sola vez con buena técnica. Sirve para medir tu fuerza y ajustar tus cargas. Puedes escribirlo a mano o calcularlo con la fórmula de Epley a partir de un peso y las repeticiones que lograste (más fiable con 10 repeticiones o menos).');
if(!L.length)return h('div',{},hint,h('div',{class:'card'},h('p',{class:'mut'},'Aún no hay ejercicios en tu rutina semanal. Agrégalos en Mis días y aparecerán aquí.'),B('Ir a Mis días',()=>go('plan'),'alt')));
return h('div',{},hint,L.map(e=>{const name=nameOf(e.id,e.name),o=S.rm.d[e.id]||(S.rm.d[e.id]={w:'',u:'kg'}),open=!!S.rmOpen[e.id];
const c=S.rmCalc[e.id]||(S.rmCalc[e.id]={w:'',r:''}),res=h('b',{}),upd=()=>{const v=epley(c.w,c.r);res.textContent=v?v+' '+(o.u||'kg'):'—';res.dataset.v=v||''};
const card=h('div',{class:'card'},h('b',{},name),lab('1RM',numU(o,'w','u','1RM de '+name,'r',()=>{o.upd=S.date})),
o.upd&&o.w!==''?h('p',{class:'hint',style:'margin:2px 0 6px'},'Actualizado: '+o.upd):'',
B(open?'Cerrar calculadora':'Calcular con fórmula',()=>{S.rmOpen[e.id]=!open;render()},'sm alt'));
if(open){upd();card.append(h('div',{class:'calc'},
lab('Peso levantado ('+(o.u||'kg')+')',h('input',{type:'text',inputmode:'decimal','aria-label':'Peso levantado en '+name,value:c.w===''?'':c.w,oninput:ev=>{c.w=pn(ev.target.value);upd()}})),
lab('Repeticiones logradas',h('input',{type:'text',inputmode:'numeric','aria-label':'Repeticiones logradas en '+name,value:c.r===''?'':c.r,oninput:ev=>{const v=parseInt(ev.target.value,10);c.r=v>0?v:'';upd()}})),
h('p',{style:'margin:8px 0'},'1RM estimado: ',res),
B('Usar este valor',()=>{const v=epley(c.w,c.r);if(!v)return toast('Escribe el peso y las repeticiones');o.w=v;o.upd=S.date;save('r');S.rmOpen[e.id]=false;render();toast('1RM guardado: '+v+' '+(o.u||'kg'))},'main')))}
return card}))}

function dayStrip(){const D=S.plan.days;
const st=n=>{const x=S.all.find(z=>z.id===`yo|d${n}|${S.date}`);return !x?'':x.status==='finalizada'?'done':x.status==='saltado'?'skip':''};
return h('div',{class:'seg',role:'group','aria-label':'Días de entrenamiento'},[...Array(D)].map((_,i)=>{const n=i+1,k=st(n),on='d'+n===S.type;
return h('button',{type:'button',class:(on?'on ':'')+k,'aria-pressed':String(on),'aria-label':'Día '+n+(k==='done'?', hecho':k==='skip'?', saltado':''),onclick:()=>{S.type='d'+n;go('main')}},String(n))}))}
let hyIn='',hyU='ml';
function hidCard(lock){const s=S.sess,it=s.hy||(s.hy=[]),inp=h('input',{type:'text',inputmode:'decimal','aria-label':'Cantidad de hidratación',placeholder:'Cantidad',value:hyIn,oninput:e=>{hyIn=e.target.value}});
const add=()=>{const v=pn(inp.value);if(v===''||v<=0)return toast('Escribe una cantidad (ej. 500)');it.push({v,u:hyU});hyIn=String(v);save();render()};
return h('div',{class:'card'},h('b',{},'Hidratación'),h('p',{class:'mut',style:'margin:2px 0 6px'},'Pomos o ml: escribe la cantidad y toca + para sumarla'),
lock?'':h('div',{class:'row'},h('div',{class:'g'},inp),h('div',{class:'g'},seg([['ml','ml'],['pomos','Pomos']],hyU,v=>{hyU=v;hyIn=inp.value;render()})),B('+',add,'sm','Sumar cantidad de hidratación')),
it.length?h('div',{class:'row',style:'margin-top:8px'},it.map((x,i)=>h('button',{type:'button',class:'u',disabled:lock,style:'padding:6px 10px;min-height:36px;min-width:0','aria-label':'Quitar '+r2(x.v)+' '+x.u,onclick:()=>{it.splice(i,1);save();render()}},(i?'+ ':'')+r2(x.v)+' '+x.u+' ×'))):'',
it.length?h('p',{style:'margin:8px 0 0'},h('b',{},'Total: '),hyTxt(s)):'')}
function diasView(){const D=S.plan.days,s=S.sess;
if(!D)return h('div',{class:'card'},h('h3',{style:'margin-top:0'},'Crea tus días de entrenamiento'),h('p',{class:'mut'},'Elige cuántos días entrenas y qué ejercicios haces en cada uno. Después, cada día solo tendrás que anotar tus pesos.'),B('Crear mis días',()=>go('plan'),'main'));
const n=s.type.slice(1),persisted=S.all.some(z=>z.id===s.id),skipped=s.status==='saltado',ready=!skipped&&(S.ready===s.id||persisted),head=h('div',{},dayStrip());
const start=async()=>{if(skipped||!s.exercises.length&&!persisted)s.exercises=planEx(s.type);s.status='en_curso';S.ready=s.id;save();await flush();go('main')};
if(skipped)return h('div',{},head,h('div',{class:'card'},h('b',{},'Día '+n+': lo saltaste hoy'),B('Listo, hacerlo ahora',start,'main')));
if(!ready){const c=s.exercises.length;
return h('div',{},head,h('div',{class:'card'},h('h3',{style:'margin-top:0'},'Día '+n),h('p',{class:'mut'},c?c+(c===1?' ejercicio':' ejercicios'):'Sin ejercicios: agrégalos en Mis días'),
h('div',{class:'row'},B('Listo. ¡Vamos allá!',start,'main g'),B('Paso de hoy',async()=>{s.exercises=[];s.status='saltado';save();await flush();if(S.plan.days>1)S.type='d'+((+n)%D+1);toast('Día '+n+' saltado');go('main')},'alt g'))))}
const p=h('progress'),pt=h('span',{class:'mut'}),lock=s.status==='finalizada';
const prog=()=>{let t=0,d=0;s.exercises.forEach(e=>e.sets.forEach(x=>{t++;if(x.r!==''&&x.w!=='')d++}));p.max=t||1;p.value=d;pt.textContent=d+' de '+t+' series con datos'};prog();
// Referencia por ejercicio: mayor peso (en kg o lb, el que usaste), mayor número de reps y las series de la última vez
const refs=exId=>{let best=null,mr=0,last=null;
S.all.forEach(x=>{if(x.id===s.id)return;const e=x.exercises.find(z=>z.exId===exId);if(!e)return;
e.sets.forEach(t=>{const kg=t.w===''||t.w==null?0:t.u==='lb'?t.w/LB:t.w;if(kg>0&&(!best||kg>best.kg))best={kg,w:t.w,u:t.u||'kg'};if(t.r>mr)mr=t.r});
const ss=e.sets.filter(t=>t.r!==''||(t.w!==''&&t.w!=null));if(ss.length&&(!last||x.localDate>last.d))last={d:x.localDate,ss}});
return{best,mr,last:last&&last.ss}};
// Mover un ejercicio: también deja el mismo orden en tu rutina de Mis días para la próxima vez
const mvEx=async(i,d)=>{const j=i+d;if(j<0||j>=s.exercises.length)return;[s.exercises[i],s.exercises[j]]=[s.exercises[j],s.exercises[i]];save();
try{const L=S.plan.routines[s.type];if(L){const m=new Map(L.map(x=>[x.id,x])),ord=[...new Set(s.exercises.map(e=>e.exId))],n=ord.filter(id=>m.has(id)).map(id=>m.get(id));L.forEach(x=>{if(!ord.includes(x.id))n.push(x)});S.plan.routines[s.type]=n;await DB.put('kv',{k:'plan',days:S.plan.days,routines:S.plan.routines})}}catch(_){}
render()};
let anyRef=false;
const cards=s.exercises.map((e,i)=>{const rf=refs(e.exId);if(rf.best||rf.mr)anyRef=true;
const top=h('div',{class:'row'},h('button',{type:'button',class:'ex','aria-expanded':String(e.open!==false),onclick:()=>{e.open=e.open===false;save();render()}},h('i',{},i+1),e.name,h('span',{},e.open===false?'▸':'▾')));
if(e.open===false)return h('div',{class:'card'},top);
const lt=rf.last?'Última vez: '+rf.last.map(t=>(t.w===''||t.w==null?'–':r2(t.w)+' '+(t.u||'kg'))+' × '+(t.r===''?'–':t.r)).join(' · '):'';
return h('div',{class:'card'},top,
rf.best||rf.mr?h('p',{class:'hint',style:'margin:0 0 4px'},'Tu máximo: '+(rf.best?r2(rf.best.w)+' '+rf.best.u:'–')+' · '+(rf.mr?rf.mr+' reps':'–')):'',lt?h('p',{class:'hint',style:'margin:0 0 4px'},lt):'',
h('div',{class:'sr mut'},'#','Peso / unidad','Reps',''),
e.sets.map((x,j)=>h('div',{class:'sr'},h('span',{class:'mut'},j+1),numU(x,'w','u',e.name+' serie '+(j+1)+' peso','s',prog,rf.best?String(r2(x.u==='lb'?rf.best.kg*LB:rf.best.kg)):'',lock),
h('input',{type:'text',inputmode:'numeric',list:'dl-r',disabled:lock,'aria-label':e.name+' serie '+(j+1)+' repeticiones',placeholder:rf.mr?String(rf.mr):'reps',value:x.r,oninput:ev=>{const v=parseInt(ev.target.value,10);x.r=v>0?v:'';save();prog()}}),
lock?h('span'):B('−',()=>{if(e.sets.length>1){e.sets.splice(j,1);save();render()}},'sm alt','Quitar serie '+(j+1)))),
lock?'':h('div',{class:'row'},B('+ Serie',()=>{const l=e.sets[e.sets.length-1];e.sets.push({r:'',w:'',u:l?l.u:'kg'});save();render()},'sm alt'),
B('↑',()=>mvEx(i,-1),'sm alt','Subir '+e.name),B('↓',()=>mvEx(i,1),'sm alt','Bajar '+e.name),
B('Cambiar',()=>go('pick',{cb:ids=>{const c=S.cat.find(z=>z.id===ids[0]);e.exId=c.id;e.name=c.name;save();go('main')}}),'sm alt','Cambiar ejercicio '+e.name),
B('Eliminar',()=>{if(confirm('¿Eliminar '+e.name+' de esta sesión?')){s.exercises.splice(i,1);save();render()}},'sm red','Eliminar el ejercicio '+e.name)))});
return h('div',{},head,
lock?h('div',{class:'card'},h('b',{},'Sesión finalizada ✓'),h('p',{class:'mut',style:'margin:4px 0 8px'},'Está protegida para evitar cambios por accidente.'),
B('Editar sesión',async()=>{if(!confirm('¿Editar esta sesión finalizada? Podrás corregirla y volver a finalizarla.'))return;s.status='en_curso';save();await flush();go('main')},'main'),B('Ver resumen',()=>go('sum',s),'alt')):'',
h('div',{class:'card'},lab('Peso corporal del día',numU(s,'bw','bwUnit','Peso corporal','s',null,'',lock))),hidCard(lock),
h('div',{class:'card'},p,pt,anyRef?h('p',{class:'hint',style:'margin:6px 0 0'},'Los números en gris son tu máximo anterior en cada ejercicio: tu referencia para saber cuánto avanzar. Al escribir los tuyos los reemplazas.'):''),
s.exercises.length?'':h('p',{class:'mut'},'Sin ejercicios: toca «+ Añadir ejercicio».'),cards,
lock?'':[B('+ Añadir ejercicio',()=>go('pick',{multi:true,cb:ids=>{s.exercises.push(...ids.map(id=>mkEx(id)));save();go('main')}}),'alt'),
B('Finalizar sesión',async()=>{if(!confirm('¿Finalizar la sesión? Se guardará y quedará protegida (podrás editarla con «Editar sesión»).'))return;s.status='finalizada';s.finished=Date.now();save();await flush();go('sum',s)},'main'),
B('Limpiar panel',async()=>{if(!confirm('Se borrarán SOLO los ejercicios, series, repeticiones, cargas, peso e hidratación de ESTA sesión ('+dn(s.type)+', '+s.localDate+').\n\nNO se borra: tus días, el catálogo, otras sesiones, historial, medidas corporales ni copias exportadas.\n\n¿Limpiar?'))return;
s.exercises=[];s.bw='';s.hy=[];s.status='en_curso';save();await flush();render();toast('Panel limpiado')},'red')],exportBox())}

const exportBox=()=>h('div',{class:'card noshot'},h('b',{},'Exportar'),
h('p',{class:'mut'},'Sesión'),h('div',{class:'row'},B('TXT',()=>expDay('ses','txt'),'alt g'),B('PDF',()=>expDay('ses','pdf'),'alt g')),
h('p',{class:'mut'},'Todos los detalles del día'),h('div',{class:'row'},B('TXT',()=>expDay('all','txt'),'alt g'),B('PDF',()=>expDay('all','pdf'),'alt g')),
B('Exportar como mensaje a WhatsApp',()=>waSend(),'wa'));

function medView(){const m=S.med,box=h('div');
const mt=x=>`Altura: ${x.h===''?'—':x.h+' m'} · Peso: ${x.w===''?'—':r2(x.w)+' '+(x.wu||'kg')}`;
const ml=x=>MED.filter(([k])=>x.m&&x.m[k]!==''&&x.m[k]!=null).map(([k,l])=>l.split(' (')[0]+': '+x.m[k]+' cm').join(' · ');
const draw=()=>{const L=[...S.meds.filter(x=>x.k!==m.k),...(hasMed(m)?[m]:[])].sort((a,b)=>b.date.localeCompare(a.date));
box.replaceChildren(...(L.length?L.map(x=>h('div',{class:'card'},h('b',{},x.date),h('p',{class:'mut'},mt(x)),h('p',{},ml(x)||'Sin medidas'),B('Editar este día',()=>{S.date=x.date;S.auto=true;go('main')},'sm alt'))):[h('p',{class:'mut'},'Aún no hay medidas guardadas.')]))};draw();
return h('div',{},h('div',{class:'card'},lab('Altura (m)',h('input',{type:'text',inputmode:'decimal',value:m.h,oninput:e=>{m.h=pn(e.target.value);save('m');draw()}})),
lab('Peso',numU(m,'w','wu','Peso (medidas)','m',draw)),
MED.map(([k,l],i)=>lab((i+1)+'. '+l+' (cm)',h('input',{type:'text',inputmode:'decimal',value:m.m[k]??'',oninput:e=>{m.m[k]=pn(e.target.value);save('m');draw()}})))),
h('h2',{},'Historial de medidas'),box)}

V.pick=()=>{const c=S.ctx,sel=new Set(),box=h('div'),q=h('input',{type:'search','aria-label':'Buscar ejercicio',placeholder:'Buscar…',oninput:()=>draw()}),nn=h('input',{type:'text','aria-label':'Nuevo ejercicio',placeholder:'Nuevo ejercicio personalizado'});
function draw(){const k=q.value.toLowerCase(),L=S.cat.filter(x=>x.name.toLowerCase().includes(k));
box.replaceChildren(...(L.length?L.map(x=>c.multi?h('label',{class:'card row'},h('input',{type:'checkbox',style:'width:28px',checked:sel.has(x.id),onchange:e=>e.target.checked?sel.add(x.id):sel.delete(x.id)}),x.name):B(x.name,()=>c.cb([x.id]),'alt')):[h('p',{class:'mut'},S.cat.length?'Sin resultados.':'Tu catálogo está vacío. Comienza a incluir tus ejercicios aquí: escribe un nombre arriba y toca «Crear y seleccionar».')]))}
draw();
const mk=async()=>{const n=nn.value.trim();if(!n)return toast('Escribe un nombre');
let x=S.cat.find(z=>z.name.toLowerCase()===n.toLowerCase());try{if(!x){x={id:uid(),name:n,o:S.cat.length+1};await DB.put('catalog',x);S.cat.push(x);S.cat.sort((a,b)=>a.name.localeCompare(b.name,'es',{sensitivity:'base'}))}}catch(e){return toast('Error: '+e.message)}if(c.multi){sel.add(x.id);nn.value='';q.value='';draw();return toast('«'+x.name+'» creado y seleccionado. Toca «Añadir seleccionados» cuando termines')}c.cb([x.id])};
return h('div',{},h('h2',{},c.multi?'Añadir ejercicios':'Cambiar por…'),q,
c.multi?h('div',{class:'row',style:'margin:6px 0'},B('Añadir seleccionados',()=>{if(!sel.size)return toast('Selecciona al menos uno');c.cb([...sel])},'main g'),B('Cancelar',()=>go(c.back||'main'),'alt g')):B('Cancelar',()=>go(c.back||'main'),'alt'),
h('div',{class:'card'},nn,B(c.multi?'Crear y seleccionar':'Crear y usar',mk)),box)};

V.sum=()=>{const s=S.ctx;
return h('div',{},h('div',{class:'sum',onclick:()=>document.body.classList.remove('cap')},h('h2',{},'GYM RAT APP'),h('p',{},h('b',{},S.name)),
h('p',{},new Date(s.date).toLocaleString('es')),h('p',{},dn(s.type)+(s.status==='finalizada'?'':' (en curso)')),h('p',{},'Peso corporal: '+(s.bw===''||s.bw==null?'—':r2(s.bw)+' '+s.bwUnit)),hyTxt(s)?h('p',{},'Hidratación: '+hyTxt(s)):'',
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

V.plan=()=>{const P=S.plan,D=P.days;
const sv=async()=>{try{await DB.put('kv',{k:'plan',days:P.days,routines:P.routines});setSt('Guardado')}catch(e){toast('Error: '+e.message)}};
const dayCard=n=>{const key='d'+n,L=P.routines[key]||(P.routines[key]=[]);
const mv=async(i,d)=>{const j=i+d;if(j<0||j>=L.length)return;[L[i],L[j]]=[L[j],L[i]];await sv();render()};
return h('div',{class:'card'},h('h3',{style:'margin:0 0 4px'},'Día '+n),
L.length?L.map((e,i)=>h('div',{class:'row',style:'margin:4px 0'},h('span',{class:'g'},(i+1)+'. '+nameOf(e.id,e.name)+(e.s?' · '+e.s+' series':'')),
B('↑',()=>mv(i,-1),'sm alt','Subir '+nameOf(e.id,e.name)),B('↓',()=>mv(i,1),'sm alt','Bajar '+nameOf(e.id,e.name)),
B('Eliminar',async()=>{if(confirm('¿Eliminar '+nameOf(e.id,e.name)+' del Día '+n+'?')){L.splice(i,1);await sv();render()}},'sm red','Eliminar el ejercicio '+nameOf(e.id,e.name)+' del día '+n))):h('p',{class:'mut'},'Aún no hay ejercicios en este día.'),
B('+ Añadir ejercicios',()=>go('pick',{multi:true,back:'plan',cb:async ids=>{ids.forEach(id=>{if(!L.some(x=>x.id===id))L.push({id,name:nameOf(id)})});await sv();go('plan')}}),'alt'),
L.length?B(S.share===n?'Ocultar código':'Compartir este día',()=>{S.share=S.share===n?0:n;render()},'alt'):'',
S.share===n&&L.length?h('div',{},h('p',{class:'hint'},'Incluye solo los ejercicios y las series, sin pesos ni medidas. Envía este código a tu gymmate: lo pega en su app (Mis días → Importar rutina) y rellena sus propios pesos.'),
shareBox(dayCode(n),'Mi rutina del Día '+n+' en GYM RAT APP. Cópiala y pégala en Mis días → Importar rutina:')):'')};
// Importar rutina de un gymmate: pregunta si crear un día nuevo o reemplazar uno
const applyImp=async(mode)=>{const I=S.imp;try{
const ents=[];for(const [nm,sr] of I.e){let x=S.cat.find(z=>z.name.toLowerCase()===nm.toLowerCase());
if(!x){x={id:uid(),name:nm,o:S.cat.length+1};await DB.put('catalog',x);S.cat.push(x)}
if(!ents.some(z=>z.id===x.id))ents.push({id:x.id,name:x.name,s:sr})}
if(mode==='new'){P.days=Math.min(7,D+1);P.routines['d'+P.days]=ents}else P.routines['d'+mode]=ents;
await sv();S.imp=null;toast('Rutina importada en el Día '+(mode==='new'?P.days:mode));render()}catch(e){toast('Error al importar: '+e.message)}};
const impBox=()=>{const I=S.imp;
if(!I){const ta=h('textarea',{rows:3,'aria-label':'Código de rutina recibido',placeholder:'Pega aquí el código de rutina (empieza con GYMDIA1)'});
return h('div',{class:'card'},h('b',{},'Importar rutina de un gymmate'),h('p',{class:'mut',style:'margin:2px 0 6px'},'Pega el código que te enviaron. Verás los ejercicios antes de decidir dónde guardarlos.'),ta,
B('Leer código',()=>{const r=parseDayCode(ta.value);if(!r)return toast('Código no válido: pega el código completo');S.imp=r;render()},'alt'))}
return h('div',{class:'card'},h('b',{},'Rutina recibida: '+I.e.length+(I.e.length===1?' ejercicio':' ejercicios')),
I.e.map(([nm,sr],i)=>h('p',{style:'margin:3px 0'},(i+1)+'. '+nm+' · '+sr+' series')),
h('p',{class:'mut',style:'margin:10px 0 4px'},'¿Qué quieres hacer con ella?'),
D<7?B('Añadir como Día '+(D+1)+' (nuevo)',()=>applyImp('new'),'main'):'',
D?h('div',{},h('p',{class:'mut',style:'margin:8px 0 4px'},'O reemplazar los ejercicios de un día existente:'),h('div',{class:'row'},[...Array(D)].map((_,i)=>B('Día '+(i+1),()=>{if(confirm('Se reemplazarán los ejercicios del Día '+(i+1)+' por los de esta rutina. Tu historial no se borra.\n\n¿Continuar?'))applyImp(i+1)},'sm red')))):'',
B('Cancelar',()=>{S.imp=null;render()},'alt'))};
return h('div',{},h('h2',{},'Mis días de entrenamiento'),
h('p',{class:'mut'},'Elige cuántos días entrenas y qué ejercicios haces cada uno. Todo queda guardado: en Inicio verás tu rutina y solo anotarás los pesos.'),
lab('¿Cuántos días entrenas?',seg([1,2,3,4,5,6,7].map(n=>[n,String(n)]),D,async v=>{P.days=v;await sv();render()})),
D?[...Array(D)].map((_,i)=>dayCard(i+1)):h('p',{class:'mut'},'Elige el número de días para empezar.'),impBox())};

// Códigos de texto: base64 "url-safe" (sin + / =), fácil de pegar en WhatsApp
const b64=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const unb64=t=>{t=t.replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';const s=atob(t),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u};
const gz=async(u,zip)=>new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(zip?new CompressionStream('gzip'):new DecompressionStream('gzip'))).arrayBuffer());
async function copyTxt(t){try{await navigator.clipboard.writeText(t);toast('Código copiado')}catch(_){const a=h('textarea',{style:'position:fixed;opacity:0'},t);document.body.append(a);a.select();let ok=false;try{ok=document.execCommand('copy')}catch(__){}a.remove();toast(ok?'Código copiado':'No se pudo copiar: mantén pulsado el texto y elige Copiar')}}
const shareBox=(code,msg)=>h('div',{},h('textarea',{rows:3,readonly:true,'aria-label':'Código',onclick:e=>e.target.select()},code),
h('div',{class:'row'},B('Copiar código',()=>copyTxt(code),'sm g'),navigator.share?B('Enviar…',()=>navigator.share({text:msg+'\n'+code}).catch(()=>{}),'sm alt g'):''));
// Rutina de un día: solo ejercicios y series (sin pesos ni medidas). Series = las de tu última sesión de ese día, o las del plan, o 3
const lastSets=(key,id)=>{const x=S.all.filter(z=>z.type===key&&z.exercises.some(e=>e.exId===id)).sort((a,b)=>b.localDate.localeCompare(a.localDate))[0],e=x&&x.exercises.find(z=>z.exId===id);return e?e.sets.length:0};
const dayCode=n=>{const k='d'+n;return 'GYMDIA1.'+b64(new TextEncoder().encode(JSON.stringify({v:1,e:(S.plan.routines[k]||[]).map(e=>[nameOf(e.id,e.name),Math.min(10,Math.max(1,lastSets(k,e.id)||e.s||3))])})))};
const parseDayCode=t=>{try{const m=String(t).match(/GYMDIA1\.[A-Za-z0-9_-]+/);if(!m)return null;const j=JSON.parse(new TextDecoder().decode(unb64(m[0].slice(8))));if(!j||!Array.isArray(j.e))return null;
const e=j.e.slice(0,40).map(x=>[String(x&&x[0]||'').trim().slice(0,80),Math.min(10,Math.max(1,parseInt(x&&x[1],10)||3))]).filter(x=>x[0]);return e.length?{e}:null}catch(_){return null}};

// Desplegable (recuerda si estaba abierto aunque la vista se redibuje)
const dt=(k,t,...c)=>{const d=h('details',{},h('summary',{},t),c);d.open=!!S.open[k];d.addEventListener('toggle',()=>{S.open[k]=d.open});return d};
const catBox=()=>{const inp=h('input',{type:'text','aria-label':'Nuevo ejercicio',placeholder:'Nuevo ejercicio'});
return h('div',{},h('div',{class:'row'},h('div',{class:'g'},inp),B('Añadir',async()=>{const n=inp.value.trim();
if(!n)return toast('Escribe un nombre');if(S.cat.some(c=>c.name.toLowerCase()===n.toLowerCase()))return toast('Ya existe');
await DB.put('catalog',{id:uid(),name:n,o:S.cat.length+1});go('data')},'sm')),
S.cat.length?'':h('p',{class:'mut'},'Tu catálogo está vacío. Comienza a incluir tus ejercicios aquí.'),
S.cat.map((c,i)=>h('div',{class:'card row'},h('span',{class:'g'},(i+1)+'. '+c.name),
B('Renombrar',async()=>{const n=(prompt('Nuevo nombre',c.name)||'').trim();if(n){c.name=n;await DB.put('catalog',c);go('data')}},'sm alt'),
B('Eliminar',async()=>{if(confirm('¿Eliminar "'+c.name+'" del catálogo? El historial conserva sus registros.')){await DB.del('catalog',c.id);go('data')}},'sm red'))))};

const dl=(n,t,m)=>{const u=URL.createObjectURL(new Blob([t],{type:m}));const a=h('a',{href:u,download:n});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)};
const rep=ss=>ss.map(s=>[`GYM RAT APP — ${S.name}`,`Fecha: ${new Date(s.date).toLocaleString('es')}`,`Tipo: ${dn(s.type)}`,`Peso corporal: ${s.bw===''||s.bw==null?'—':r2(s.bw)+' '+s.bwUnit}`,...(hyTxt(s)?[`Hidratación: ${hyTxt(s)}`]:[]),`Estado: ${s.status==='finalizada'?'finalizada':'en curso'}`,
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
async function backupObj(){await flush();await load();const sess=S.all.filter(s=>s.exercises.length||s.status==='saltado').sort((a,b)=>a.date.localeCompare(b.date));
return{app:'gym-rat-app',schema:1,exportedAt:new Date().toISOString(),catalog:await DB.all('catalog'),athletes:[],preferences:await DB.all('kv'),sessions:sess}}
// Código de respaldo (para cambiar de teléfono): todo tu progreso en un texto comprimido
async function backupCode(){const u=new TextEncoder().encode(JSON.stringify(await backupObj()));
return typeof CompressionStream!=='undefined'?'GYMRAT1.'+b64(await gz(u,true)):'GYMRAT0.'+b64(u)}
// Lee un código GYMRAT… o el texto de un archivo de Guardado General; devuelve los datos listos o null si no es válido
async function readBackup(text){try{text=String(text||'').trim();let j;
if(text[0]==='{')j=JSON.parse(text);
else{const m=text.replace(/\s+/g,'').match(/GYMRAT([01])\.([A-Za-z0-9_-]+)/);if(!m)return null;let u=unb64(m[2]);if(m[1]==='1')u=await gz(u,false);j=JSON.parse(new TextDecoder().decode(u))}
if(!j||j.app!=='gym-rat-app'||!Array.isArray(j.sessions))return null;
const ok=(a,f)=>(Array.isArray(a)?a:[]).filter(x=>x&&typeof x==='object'&&f(x)),cat=ok(j.catalog,x=>x.id&&x.name);
return{catalog:cat,athletes:[],sessions:ok(j.sessions,x=>x.id&&x.type&&x.localDate&&Array.isArray(x.exercises)),kv:ok(j.preferences,x=>typeof x.k==='string')}}catch(_){return null}}
async function restoreFrom(text){try{const o=await readBackup(text);if(!o)return toast('Código o archivo no válido: pega el código completo');
if(!confirm('Se reemplazarán TODOS los datos de este teléfono por los de la copia ('+o.sessions.length+' sesiones). Lo que tengas ahora se perderá.\n\n¿Cargar mi progreso?'))return;
dirty.clear();clearTimeout(tm);await DB.replaceAll(o);
S.sess=null;S.med=null;S.hd=null;S.ready='';S.auto=true;S.stack=[];S.open={};S.f={day:'',date:''};S.type='d1';S.tab='dias';S.ptab='m';S.rmOpen={};S.rmCalc={};S.share=0;S.imp=null;S.name='';
await go('main');toast('Progreso cargado')}catch(e){toast('Error al cargar: '+e.message)}}
const codeBox=()=>{const out=h('div'),ta=h('textarea',{rows:3,'aria-label':'Código de respaldo','placeholder':'Pega aquí tu código de respaldo (empieza con GYMRAT)'});
return h('div',{},h('p',{class:'mut'},'Si cambias de teléfono: en el viejo crea tu código y guárdalo (envíatelo por WhatsApp o en tus notas). En el nuevo, pégalo y carga tu progreso. Incluye sesiones, medidas, 1RM, tus días y el catálogo.'),
B('Guardar mi progreso (crear código)',async()=>{try{const c=await backupCode();out.replaceChildren(h('p',{class:'hint'},'Código listo ('+c.length+' caracteres). Cópialo y guárdalo en un lugar seguro: contiene todos tus datos.'),shareBox(c,'Respaldo de GYM RAT APP:'))}catch(e){toast('Error al crear el código: '+e.message)}},'main'),out,
h('div',{class:'card'},h('b',{},'Cargar mi progreso'),ta,B('Cargar desde el código',()=>restoreFrom(ta.value),'alt'),
lab('O elige un archivo de Guardado General (.json)',h('input',{type:'file',accept:'.json,application/json',onchange:async e=>{const f=e.target.files[0];if(f)restoreFrom(await f.text());e.target.value=''}}))))};
async function exp(kind){try{await flush();await load();const d=today();
if(kind==='json'){dl(`gym-rat-backup-${d}.json`,JSON.stringify(await backupObj(),null,1),'application/json')}
else{if(!S.all.some(s=>s.exercises.length)&&!S.meds.some(hasMed))return toast('Aún no hay datos para exportar');out(`gym-rat-historial-${d}`,fullTxt(),kind)}
toast('Exportación lista')}catch(e){toast('Error al exportar: '+e.message)}}
// Borrado: 'hist' = sesiones, medidas e hidratación (conserva tus días, catálogo y datos); 'all' = todo, como app nueva
async function wipe(kind){const all=kind==='all';
if(!confirm(all?'Se borrará TODO: historial, medidas, tus días, el catálogo y tus datos personales. La app quedará como nueva.\n\n¿Ya hiciste un Guardado General?\n\n¿Continuar?':'Se borrarán TODAS las sesiones (con su hidratación), medidas y 1RM. Se conservan tus días, el catálogo y tus datos personales.\n\n¿Ya hiciste un Guardado General?\n\n¿Continuar?'))return;
if((prompt('Para confirmar escribe BORRAR (no se puede deshacer)')||'').trim().toUpperCase()!=='BORRAR')return toast('Cancelado: no se borró nada');
try{dirty.clear();clearTimeout(tm);
const kv=all?[]:(await DB.all('kv')).filter(x=>x.k==='perfil'||x.k==='plan'),cat=all?[]:await DB.all('catalog');
await DB.replaceAll({catalog:cat,athletes:[],sessions:[],kv});
S.sess=null;S.med=null;S.hd=null;S.ready='';S.auto=true;S.stack=[];S.open={};S.f={day:'',date:''};S.type='d1';S.tab='dias';S.ptab='m';S.rmOpen={};S.rmCalc={};S.share=0;S.imp=null;
if(all){S.name='';S.phone='';S.cc=''}
await go('main');toast(all?'App restablecida de cero':'Historial borrado')}
catch(e){toast('Error al borrar: '+e.message)}}
async function updateApp(){try{
if(!navigator.onLine)return toast('Necesitas internet para buscar la actualización');
await flush();
const cur=(await caches.keys()).find(k=>k.startsWith('gymrat-')),t=await(await fetch('service-worker.js',{cache:'no-store'})).text(),nv=(t.match(/V='([^']+)'/)||[])[1];
if(nv&&nv===cur)return toast('Ya tienes la última versión ('+nv+')');
toast('Actualizando a '+(nv||'la nueva versión')+'…');
const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(reg)await reg.update();
setTimeout(()=>location.reload(),2500)}catch(e){toast('No se pudo actualizar: '+e.message)}}
const updBox=()=>{const v=h('p',{class:'mut'},'Versión instalada: …');
caches.keys().then(k=>{v.textContent='Versión instalada: '+(k.find(z=>z.startsWith('gymrat-'))||'desconocida')}).catch(()=>{v.textContent=''});
return h('div',{},v,h('p',{class:'mut'},'Busca en internet (GitHub) una versión nueva y la instala sin borrar la app. Tus datos no se tocan.'),B('Actualizar a la nueva versión',updateApp,'main'))};
const wipeBox=()=>h('div',{},h('p',{class:'mut'},'Haz antes un Guardado General si quieres conservar una copia.'),
B('Borrar historial (sesiones, medidas y 1RM)',()=>wipe('hist'),'red'),
B('Borrar todo y empezar de cero',()=>wipe('all'),'red'));
V.data=()=>{const pb=phoneBox(S.cc,S.phone),n=h('input',{type:'text','aria-label':'Tu nombre',value:S.name,maxlength:40});
return h('div',{},h('h2',{},'General'),h('p',{class:'mut'},'Todo se guarda solo en este dispositivo.'),
dt('pers','Datos personales',lab('Tu nombre',n),pb.el,B('Guardar datos',async()=>{const v=n.value.trim();if(!v)return toast('Escribe tu nombre');const p=pb.get();if(!p)return;
try{S.name=v;S.cc=p.cc;S.phone=p.phone;await saveProfile();toast('Datos guardados')}catch(e){toast('Error: '+e.message)}},'alt')),
dt('upd','Actualizar la app',updBox()),
dt('cat','Creación y edición de catálogo',catBox()),
dt('code','Cambio de teléfono: guardar / cargar progreso',codeBox()),
dt('wipe','Borrar datos / empezar de cero',wipeBox()),
dt('save','Guardado General',h('p',{class:'mut'},'«Guardado General» descarga un archivo con todos tus datos (incluye tus días y la hidratación de cada sesión); TXT y PDF son para leer o compartir.'),
B('Guardado General',()=>exp('json'),'main'),
h('div',{class:'card'},h('b',{},'Historial completo'),h('p',{class:'mut'},'Todas las sesiones (con su hidratación) y medidas, para leer o compartir.'),h('div',{class:'row'},B('TXT',()=>exp('txt'),'alt g'),B('PDF',()=>exp('pdf'),'alt g')))))};

(async()=>{try{
const dl2=h('datalist',{id:'dl-r'});for(let i=6;i<=30;i++)dl2.append(h('option',{value:i}));document.body.append(dl2);
navigator.storage&&navigator.storage.persist&&navigator.storage.persist();
document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>go(b.dataset.v));
const on=()=>$('#on').textContent=navigator.onLine?'En línea':'Sin conexión';on();addEventListener('online',on);addEventListener('offline',on);
if('serviceWorker' in navigator){const had=!!navigator.serviceWorker.controller;let rl=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had&&!rl){rl=true;location.reload()}});navigator.serviceWorker.register('service-worker.js').catch(()=>{})}
go('main')}catch(e){$('#app').textContent='Error de base de datos: '+e.message}})();