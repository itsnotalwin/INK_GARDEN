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
let petals=[],W=0,H=0,D=1,BASE=12,cur=null,grow=[],run=0,lt=0,tt,rt,on=false,ac,ng;
let S={ess:0,open:{bamboo:1},pick:'bamboo',plants:[]};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const plen=p=>p.reduce((s,q,i)=>i?s+Math.hypot(q[0]-p[i-1][0],q[1]-p[i-1][1]):0,0);

/* Paper: mottled washi, a faint moon and misty ridges, then speckle and fibres; seeded so it never shifts */
function paper(){
  const g=cx.paper,w=cv.paper.width,h=cv.paper.height,r=rng(7),M=Math.max(w,h);
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#F3EDE2';g.fillRect(0,0,w,h);
  for(let i=0;i<14;i++){
    const x=r()*w,y=r()*h,q=g.createRadialGradient(x,y,0,x,y,(.25+r()*.4)*M);
    q.addColorStop(0,`rgba(${r()<.5?'150,120,70':'255,255,250'},${(.03+r()*.04).toFixed(3)})`);q.addColorStop(1,'rgba(243,237,226,0)');
    g.fillStyle=q;g.fillRect(0,0,w,h);
  }
  g.beginPath();g.arc(w*.72,h*.2,Math.min(w,h)*.11,0,6.283);g.fillStyle='rgba(107,102,96,.07)';g.fill();g.strokeStyle='rgba(107,102,96,.12)';g.lineWidth=D;g.stroke();
  for(let k=0;k<3;k++){
    const base=h*(.62+k*.07),amp=h*(.12-k*.025);
    g.fillStyle=`rgba(107,102,96,${[.09,.13,.18][k]})`;g.beginPath();g.moveTo(0,h);g.lineTo(0,base);
    for(let x=0;x<w;x+=w/8)g.quadraticCurveTo(x+w/16,base-amp*(.3+r()*.9),x+w/8,base-amp*r()*.4);
    g.lineTo(w,h);g.fill();
    const m=g.createLinearGradient(0,base-amp*.2,0,base+amp*.9);m.addColorStop(0,'rgba(243,237,226,0)');m.addColorStop(1,'rgba(243,237,226,.88)');
    g.fillStyle=m;g.fillRect(0,base-amp,w,h);
  }
  for(let i=0;i<w*h/180;i++){g.fillStyle=`rgba(90,70,40,${r()*.05})`;g.fillRect(r()*w,r()*h,1+r()*2*D,1+r()*2*D)}
  g.lineWidth=.6*D;
  for(let i=0;i<w*h/2500;i++){const x=r()*w,y=r()*h,a=r()*6.28,l=(6+r()*18)*D;g.strokeStyle=`rgba(120,100,70,${.04+r()*.06})`;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}
  const v=g.createRadialGradient(w/2,h/2,Math.min(w,h)*.5,w/2,h/2,M*.8);v.addColorStop(0,'rgba(90,70,40,0)');v.addColorStop(1,'rgba(90,70,40,.1)');
  g.fillStyle=v;g.fillRect(0,0,w,h);
}

/* Ink: stem is the stroke as painted; h (0..1) is how far the wet edge has bled */
const hs=(i,j)=>{const x=Math.sin(i*12.9898+j*78.233)*43758.5453;return x-Math.floor(x)};
const tone=(r,m)=>`rgba(${r()<m?'92,107,76':INK},${(.4+r()*.45).toFixed(2)})`;
function stem(g,p,h,n){
  g.lineCap=g.lineJoin='round';
  for(let i=1;i<n;i++){
    const a=p[i-1],b=p[i],w=b[2]*Math.min(1,.4+i*.12),dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;
    if(h>0)for(const m of[1.15,1.45,1.9]){g.lineWidth=w*(1+(m-1)*h);g.strokeStyle=`rgba(${INK},.035)`;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke()}
    if(i>3&&b[2]<BASE*.62){ /* fast and thin: dry-brush bristles */
      for(let j=-1;j<=1;j++){
        if(hs(i,j+9)<.25)continue;
        const o=j*w*.34;g.lineWidth=w*.4;g.strokeStyle=`rgba(${INK},${(.5+hs(i,j)*.4).toFixed(2)})`;
        g.beginPath();g.moveTo(a[0]+nx*o,a[1]+ny*o);g.lineTo(b[0]+nx*o,b[1]+ny*o);g.stroke();
      }
    }else{
      g.lineWidth=w;g.strokeStyle=`rgba(${INK},${(.8+hs(i,0)*.12).toFixed(2)})`;
      g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();
    }
  }
  const f=p[0];g.fillStyle=`rgba(${INK},.3)`;g.beginPath();g.arc(f[0],f[1],f[2]*.9,0,6.283);g.fill(); /* ink pools where the brush lands */
}
function leaf(g,x,y,a,l,c){
  const ex=x+Math.cos(a)*l,ey=y+Math.sin(a)*l,mx=(x+ex)/2,my=(y+ey)/2,nx=-Math.sin(a)*l*.11,ny=Math.cos(a)*l*.11;
  g.fillStyle=c;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(mx+nx,my+ny,ex,ey);g.quadraticCurveTo(mx-nx*.4,my-ny*.4,x,y);g.fill();
}
function flower(g,x,y,s,o){
  g.fillStyle=`rgba(${SEAL},.16)`;g.strokeStyle=`rgba(${SEAL},.6)`;g.lineWidth=1;
  for(let i=0;i<5;i++){const a=o+i*1.2566;g.beginPath();g.arc(x+Math.cos(a)*s,y+Math.sin(a)*s,s*.8,0,6.283);g.fill();g.stroke()}
  g.strokeStyle=`rgba(${INK},.7)`;g.lineWidth=.7;g.beginPath();
  for(let i=0;i<6;i++){const a=o+i*1.047+.5;g.moveTo(x,y);g.lineTo(x+Math.cos(a)*s*.9,y+Math.sin(a)*s*.9)}
  g.stroke();g.fillStyle=`rgb(${SEAL})`;g.beginPath();g.arc(x,y,s*.28,0,6.283);g.fill();
}
/* A plant is {k, p:[[x,y,w]...], s:seed}. Same seed => same plant, so saves replay exactly. */
function bloom(g,P,t){
  const p=P.p,r=rng(P.s),e=1-Math.pow(1-t,3),L=[0];
  for(let i=1;i<p.length;i++)L[i]=L[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);
  const tot=L[L.length-1];
  const at=d=>{let i=1;while(i<p.length-1&&L[i]<d)i++;return[p[i],Math.atan2(p[i][1]-p[i-1][1],p[i][0]-p[i-1][0])]};
  stem(g,p,e,p.length);
  if(P.k==='plum'||P.k==='pine')for(let d=10;d<tot;d+=9+r()*14){const [q]=at(d),o=(r()-.5)*q[2]*1.3;g.fillStyle=`rgba(${INK},${(.4+r()*.4).toFixed(2)})`;g.beginPath();g.arc(q[0]+o,q[1]+(r()-.5)*q[2],.8+r()*1.3,0,6.283);g.fill()} /* moss dots on the bark */
  if(P.k==='bamboo'){
    for(let d=34;d<tot;d+=34+r()*10){
      const [q,a]=at(d),w=q[2]*.8;
      g.strokeStyle=`rgba(${INK},.8)`;g.lineWidth=2;g.beginPath();
      g.moveTo(q[0]+Math.cos(a+1.57)*w,q[1]+Math.sin(a+1.57)*w);g.lineTo(q[0]+Math.cos(a-1.57)*w,q[1]+Math.sin(a-1.57)*w);g.stroke();
      if(d>tot*.3)for(let k=0;k<3;k++)leaf(g,q[0],q[1],(k%2?Math.PI-.25-r()*.7:.25+r()*.7)+(k===2?(r()-.5)*.5:0),(24+r()*26)*e,tone(r,.5));
    }
  }else if(P.k==='plum'){
    for(let d=tot*.12;d<tot;d+=22+r()*26){
      const [q,a]=at(d),sd=r()<.5?-1:1,ta=a+sd*(.5+r()*.7),tl=(16+r()*28)*e;
      const mx=q[0]+Math.cos(ta)*tl*.55,my=q[1]+Math.sin(ta)*tl*.55,x=mx+Math.cos(ta+sd*.5)*tl*.45,y=my+Math.sin(ta+sd*.5)*tl*.45;
      g.strokeStyle=`rgba(${INK},.7)`;g.lineWidth=1.6;g.beginPath();g.moveTo(q[0],q[1]);g.lineTo(mx,my);g.lineTo(x,y);g.stroke();
      if(r()<.8)flower(g,x,y,(5+r()*4)*e,r()*6.28);
      else{g.fillStyle=`rgb(${SEAL})`;g.beginPath();g.arc(x,y,2.2*e,0,6.283);g.fill()} /* bud */
    }
  }else if(P.k==='pine'){
    for(let d=tot*.1;d<tot;d+=26+r()*24){
      const [q]=at(d);
      for(let c=0;c<2;c++){
        const ox=(r()-.5)*14,oy=-4-r()*8;g.strokeStyle=tone(r,.55);g.lineWidth=1.1;g.beginPath();
        for(let i=0;i<20;i++){const a=-Math.PI*(.04+.92*i/19)+(r()-.5)*.25,l=(12+r()*14)*e;g.moveTo(q[0]+ox,q[1]+oy);g.lineTo(q[0]+ox+Math.cos(a)*l,q[1]+oy+Math.sin(a)*l)}
        g.stroke();
      }
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
    if(t>=1){bloom(cx.ink,o.P,1);if(o.P.k!=='ink')drip();if(o.P.k==='plum'&&!RM)fall(o.P,now);return false}
    bloom(g,o.P,t);return true;
  });
  petals=petals.filter(q=>{
    const a=(now-q.t0)/q.life;if(a>=1)return false;if(a<0)return true;
    const x=q.x+Math.sin(a*6+q.ph)*14+a*q.dx,y=q.y+a*q.dy;
    g.fillStyle=`rgba(${SEAL},${(.55*(1-a)).toFixed(2)})`;g.beginPath();g.ellipse(x,y,3.2,1.8,a*8+q.ph,0,6.283);g.fill();return true;
  });
  run=cur||grow.length||petals.length?requestAnimationFrame(frame):0;
}
function fall(P,now){for(let i=0;i<7;i++){const q=P.p[Math.floor(Math.random()*P.p.length)];petals.push({x:q[0],y:q[1],dx:(Math.random()-.5)*60,dy:90+Math.random()*80,ph:Math.random()*6,life:2600+Math.random()*1400,t0:now+Math.random()*600})}}
const kick=()=>{if(!run)run=requestAnimationFrame(frame)};

/* Input */
function add(e){
  const x=e.clientX,y=e.clientY,q=cur[cur.length-1],d=q?Math.hypot(x-q[0],y-q[1]):0;
  if(q&&d<3)return;
  const v=q?d/Math.max(1,e.timeStamp-lt):0,pr=e.pointerType==='pen'?Math.max(.35,e.pressure*1.6):1;
  const target=BASE*(1.15-Math.min(v,2)/2*.7)*pr,w=q?q[2]*.7+target*.3:BASE*.5;
  cur.push([Math.round(x),Math.round(y),+w.toFixed(1)]);lt=e.timeStamp;swish(v);
}
function end(){
  if(!cur)return;
  const p=cur;cur=null;swish(0);
  if(p.length<3){kick();return}
  [.35,.6,.85].forEach((m,i)=>{const q=p[p.length-1-i];if(q)q[2]=+(q[2]*m).toFixed(1)});
  const len=plen(p),f=p[0],l=p[p.length-1],chord=Math.hypot(f[0]-l[0],f[1]-l[1]);
  const k=len<70?'ink':S.pick;let msg='';
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
  $('seal').classList.toggle('on',S.plants.length>0);
  $('species').innerHTML=Object.entries(SPECIES).map(([k,s])=>`<button data-k="${k}" class="${S.open[k]?'':'lock'}${S.pick===k?' on':''}"><b>${s.zh}</b>${s.name}${S.open[k]?'':`<em>✦${s.cost}</em>`}</button>`).join('');
}
$('species').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  const k=b.dataset.k,s=SPECIES[k];
  if(!S.open[k]){
    if(S.ess<s.cost)return say(`${s.cost-S.ess} more ✦ to unlock ${s.name}`);
    S.ess-=s.cost;S.open[k]=1;
  }
  S.pick=k;save();ui();say(`${s.name} selected`);
};
$('undo').onclick=()=>{const P=S.plants.pop();if(!P)return;grow=grow.filter(o=>o.P!==P);redraw();save();ui()};
$('snd').onclick=e=>{on=!on;if(on){audioInit();ac.resume()}else if(ng)ng.gain.value=0;e.currentTarget.style.opacity=on?1:.5};
const seal=document.createElement('div');seal.id='seal';seal.textContent='墨庭';document.body.append(seal);
$('hint').textContent='Paint a stroke to grow bamboo';

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
