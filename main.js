'use strict';
const SPECIES={
  bamboo:{zh:'竹',name:'Bamboo',cost:0,how:'tall'},
  plum:{zh:'梅',name:'Plum',cost:25,how:'slanted'},
  pine:{zh:'松',name:'Pine',cost:60,how:'wide'}
};
const KEY='inkgarden.v1',INK='30,27,24',MOSS='rgba(92,107,76,.8)',SEAL='181,64,44';
const $=id=>document.getElementById(id);
const cv={paper:$('paper'),ink:$('ink'),live:$('live')},cx={};
for(const k in cv)cx[k]=cv[k].getContext('2d');
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
let W=0,H=0,D=1,BASE=12,cur=null,grow=[],run=0,lt=0,tt,rt,on=false,ac,ng;
let S={ess:0,open:{bamboo:1},plants:[]};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const plen=p=>p.reduce((s,q,i)=>i?s+Math.hypot(q[0]-p[i-1][0],q[1]-p[i-1][1]):0,0);

/* Paper: seeded speckle and fibres, drawn once per resize */
function paper(){
  const g=cx.paper,w=cv.paper.width,h=cv.paper.height,r=rng(7);
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#F3EDE2';g.fillRect(0,0,w,h);
  for(let i=0;i<w*h/180;i++){g.fillStyle=`rgba(90,70,40,${r()*.05})`;g.fillRect(r()*w,r()*h,1+r()*2*D,1+r()*2*D)}
  g.lineWidth=.6*D;
  for(let i=0;i<w*h/2500;i++){const x=r()*w,y=r()*h,a=r()*6.28,l=(6+r()*18)*D;g.strokeStyle=`rgba(120,100,70,${.04+r()*.06})`;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
}

/* Ink: stem is the stroke as painted; h (0..1) is how far the wet edge has bled */
function stem(g,p,h,n){
  g.lineCap=g.lineJoin='round';
  for(let i=1;i<n;i++){
    const a=p[i-1],b=p[i],w=b[2]*Math.min(1,.4+i*.12);
    g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);
    if(h>0){g.lineWidth=w*(1.2+1.1*h);g.strokeStyle=`rgba(${INK},.06)`;g.stroke()}
    g.lineWidth=w;g.strokeStyle=`rgba(${INK},.88)`;g.stroke();
  }
}
function leaf(g,x,y,a,l){
  const ex=x+Math.cos(a)*l,ey=y+Math.sin(a)*l,mx=(x+ex)/2,my=(y+ey)/2,nx=-Math.sin(a)*l*.16,ny=Math.cos(a)*l*.16;
  g.fillStyle=MOSS;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(mx+nx,my+ny,ex,ey);g.quadraticCurveTo(mx-nx,my-ny,x,y);g.fill();
}
function flower(g,x,y,s,o){
  g.fillStyle=`rgba(${SEAL},.2)`;g.strokeStyle=`rgba(${SEAL},.6)`;g.lineWidth=1;
  for(let i=0;i<5;i++){const a=o+i*1.2566;g.beginPath();g.arc(x+Math.cos(a)*s,y+Math.sin(a)*s,s*.8,0,6.283);g.fill();g.stroke()}
  g.fillStyle=`rgb(${SEAL})`;g.beginPath();g.arc(x,y,s*.3,0,6.283);g.fill();
}
/* A plant is {k, p:[[x,y,w]...], s:seed}. Same seed => same plant, so saves replay exactly. */
function bloom(g,P,t){
  const p=P.p,r=rng(P.s),e=1-Math.pow(1-t,3),L=[0];
  for(let i=1;i<p.length;i++)L[i]=L[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);
  const tot=L[L.length-1];
  const at=d=>{let i=1;while(i<p.length-1&&L[i]<d)i++;return[p[i],Math.atan2(p[i][1]-p[i-1][1],p[i][0]-p[i-1][0])]};
  stem(g,p,e,p.length);
  if(P.k==='bamboo'){
    for(let d=34;d<tot;d+=34+r()*10){
      const [q,a]=at(d),w=q[2]*.8;
      g.strokeStyle=`rgba(${INK},.8)`;g.lineWidth=2;g.beginPath();
      g.moveTo(q[0]+Math.cos(a+1.57)*w,q[1]+Math.sin(a+1.57)*w);g.lineTo(q[0]+Math.cos(a-1.57)*w,q[1]+Math.sin(a-1.57)*w);g.stroke();
      if(d>tot*.3){leaf(g,q[0],q[1],.3+r()*.6,(22+r()*22)*e);leaf(g,q[0],q[1],Math.PI-.3-r()*.6,(22+r()*22)*e)}
    }
  }else if(P.k==='plum'){
    for(let d=tot*.15;d<tot;d+=24+r()*28){
      const [q,a]=at(d),ta=a+(r()<.5?-1:1)*(.6+r()*.6),tl=(18+r()*30)*e,x=q[0]+Math.cos(ta)*tl,y=q[1]+Math.sin(ta)*tl;
      g.strokeStyle=`rgba(${INK},.75)`;g.lineWidth=1.6;g.beginPath();g.moveTo(q[0],q[1]);g.lineTo(x,y);g.stroke();
      flower(g,x,y,(5+r()*3)*e,r()*6.28);
    }
  }else if(P.k==='pine'){
    for(let d=tot*.12;d<tot;d+=30+r()*26){
      const [q]=at(d);g.strokeStyle=MOSS;g.lineWidth=1.1;g.beginPath();
      for(let i=0;i<16;i++){const a=-Math.PI*(.05+.9*i/15)+(r()-.5)*.25,l=(14+r()*12)*e;g.moveTo(q[0],q[1]);g.lineTo(q[0]+Math.cos(a)*l,q[1]+Math.sin(a)*l)}
      g.stroke();
    }
  }
}
function redraw(){cx.ink.clearRect(0,0,W,H);S.plants.forEach(P=>bloom(cx.ink,P,1))}

/* Render loop: runs only while painting or blooming */
function frame(now){
  const g=cx.live;g.clearRect(0,0,W,H);
  if(cur&&cur.length>1)stem(g,cur,0,cur.length);
  grow=grow.filter(o=>{
    const t=RM?1:Math.min(1,(now-o.t0)/1600);
    if(t>=1){bloom(cx.ink,o.P,1);if(o.P.k!=='ink')drip();return false}
    bloom(g,o.P,t);return true;
  });
  run=cur||grow.length?requestAnimationFrame(frame):0;
}
const kick=()=>{if(!run)run=requestAnimationFrame(frame)};

/* Input */
function add(e){
  const x=e.clientX,y=e.clientY,q=cur[cur.length-1],d=q?Math.hypot(x-q[0],y-q[1]):0;
  if(q&&d<3)return;
  const v=q?d/Math.max(1,e.timeStamp-lt):0,pr=e.pointerType==='pen'?Math.max(.35,e.pressure*1.6):1;
  const target=BASE*(1.15-Math.min(v,2)/2*.7)*pr,w=q?q[2]*.7+target*.3:BASE*.5;
  cur.push([Math.round(x),Math.round(y),+w.toFixed(1)]);lt=e.timeStamp;swish(v);
}
function kind(p,len){
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(const q of p){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}
  const w=x1-x0,h=y1-y0;
  return len<70?'ink':h>1.4*w?'bamboo':w>1.4*h?'pine':'plum';
}
function end(){
  if(!cur)return;
  const p=cur;cur=null;swish(0);
  if(p.length<3){kick();return}
  [.35,.6,.85].forEach((m,i)=>{const q=p[p.length-1-i];if(q)q[2]=+(q[2]*m).toFixed(1)});
  const len=plen(p),f=p[0],l=p[p.length-1],chord=Math.hypot(f[0]-l[0],f[1]-l[1]);
  let k=kind(p,len),msg='';
  if(k!=='ink'&&!S.open[k]){msg=`${SPECIES[k].name} unlocks at ✦${SPECIES[k].cost}`;k='ink'}
  if(k!=='ink'){const n=2+Math.round(chord/len*4)+Math.min(4,Math.round(len/120));S.ess+=n;msg=`+${n} ✦ ${SPECIES[k].name}`}
  const P={k,p,s:Math.random()*1e9|0};
  S.plants.push(P);grow.push({P,t0:performance.now()});save();ui();say(msg);kick();
}
const c=cv.live;
c.onpointerdown=e=>{if(!e.isPrimary)return;c.setPointerCapture(e.pointerId);cur=[];lt=e.timeStamp;$('hint').classList.add('off');add(e);kick()};
c.onpointermove=e=>{if(!cur)return;const l=e.getCoalescedEvents&&e.getCoalescedEvents();(l&&l.length?l:[e]).forEach(add)};
c.onpointerup=c.onpointercancel=end;

/* UI */
function say(m){if(!m)return;const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2200)}
function ui(){
  $('ess').textContent='✦ '+S.ess;
  $('species').innerHTML=Object.entries(SPECIES).map(([k,s])=>`<button data-k="${k}" class="${S.open[k]?'':'lock'}"><b>${s.zh}</b>${s.name}${S.open[k]?'':`<em>✦${s.cost}</em>`}</button>`).join('');
}
$('species').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  const k=b.dataset.k,s=SPECIES[k];
  if(S.open[k])return say(`Paint a ${s.how} stroke`);
  if(S.ess<s.cost)return say(`${s.cost-S.ess} more ✦ to unlock ${s.name}`);
  S.ess-=s.cost;S.open[k]=1;save();ui();say(`${s.name} unlocked`);
};
$('undo').onclick=()=>{const P=S.plants.pop();if(!P)return;grow=grow.filter(o=>o.P!==P);redraw();save()};
$('snd').onclick=e=>{on=!on;if(on){audioInit();ac.resume()}else if(ng)ng.gain.value=0;e.currentTarget.style.opacity=on?1:.5};

/* Sound: muted until the player taps the note button */
function audioInit(){
  if(ac)return;
  ac=new(window.AudioContext||window.webkitAudioContext)();
  const b=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const s=ac.createBufferSource(),f=ac.createBiquadFilter();
  s.buffer=b;s.loop=true;f.type='bandpass';f.frequency.value=1800;ng=ac.createGain();ng.gain.value=0;
  s.connect(f);f.connect(ng);ng.connect(ac.destination);s.start();
}
function swish(v){if(on&&ng)ng.gain.setTargetAtTime(Math.min(.1,v*.07),ac.currentTime,.03)}
function drip(){
  if(!on||!ac)return;
  const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;
  o.frequency.setValueAtTime(900,t);o.frequency.exponentialRampToValueAtTime(300,t+.18);
  g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);
  o.connect(g);g.connect(ac.destination);o.start();o.stop(t+.3);
}

/* Boot */
function size(){
  D=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;BASE=Math.max(10,Math.min(W,H)*.03);
  for(const k in cv){cv[k].width=W*D;cv[k].height=H*D;cx[k].setTransform(D,0,0,D,0,0)}
  paper();redraw();
}
addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(size,150)});
$('snd').style.opacity=.5;
if(S.plants.length)$('hint').classList.add('off');
ui();size();
