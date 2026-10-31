'use strict';
const SPECIES={
  bamboo:{zh:'竹',name:'Bamboo',cost:0,how:'tall'},
  plum:{zh:'梅',name:'Plum',cost:20,how:'slanted'},
  pine:{zh:'松',name:'Pine',cost:60,how:'wide'}
};
const BR={
  ink:{name:'Ink',cost:0,wm:1,halo:1,dry:0,a:1},
  wet:{name:'Wet',cost:40,wm:1.5,halo:1.5,dry:-1,a:.45,edge:1},
  dry:{name:'Dry',cost:90,wm:1.1,halo:0,dry:1,a:1}
};
const KEY='inkgarden.v1',INK='30,27,24',MOSS='rgba(92,107,76,.8)',SEAL='181,64,44';
const $=id=>document.getElementById(id);
const cv={paper:$('paper'),ink:$('ink'),live:$('live')},cx={};
for(const k in cv)cx[k]=cv[k].getContext('2d');
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
let petals=[],alive=[],gust=0,lastT=0,petalAt=0,W=0,H=0,D=1,BASE=12,cur=null,grow=[],run=0,lt=0,tt,rt,on=false,ac,ng;
let S={ess:0,open:{bamboo:1},pick:'bamboo',plants:[]};
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
S.open.ink=1;if(!BR[S.brush])S.brush='ink';
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
/* Strokes are drawn as one smooth ribbon per layer, so overlaps never bead or double up */
const vn=(t,k)=>{const i=Math.floor(t),f=t-i,u=f*f*(3-2*f);return hs(i,k)*(1-u)+hs(i+1,k)*u};
function geom(p,n){
  const q=[],nx=[],ny=[];
  for(let i=0;i<n;i++){const a=p[Math.max(0,i-1)],b=p[i],c=p[Math.min(n-1,i+1)];q.push([(a[0]+2*b[0]+c[0])/4,(a[1]+2*b[1]+c[1])/4,(a[2]+2*b[2]+c[2])/4])}
  for(let i=0;i<n;i++){const a=q[Math.max(0,i-1)],c=q[Math.min(n-1,i+1)],dx=c[0]-a[0],dy=c[1]-a[1],d=Math.hypot(dx,dy)||1;nx.push(-dy/d);ny.push(dx/d)}
  return{q,nx,ny};
}
function ribbon(g,q,nx,ny,wf,sc,col,edge){
  const n=q.length,L=[],R=[];
  for(let i=0;i<n;i++){const h=wf(i)*sc/2;L.push([q[i][0]+nx[i]*h,q[i][1]+ny[i]*h]);R.push([q[i][0]-nx[i]*h,q[i][1]-ny[i]*h])}
  const e=n-1,he=wf(e)*sc/2,h0=wf(0)*sc/2;
  g.beginPath();g.moveTo(L[0][0],L[0][1]);
  for(let i=1;i<n;i++)g.quadraticCurveTo(L[i-1][0],L[i-1][1],(L[i-1][0]+L[i][0])/2,(L[i-1][1]+L[i][1])/2);
  g.lineTo(L[e][0],L[e][1]);
  g.quadraticCurveTo(q[e][0]+ny[e]*he*1.4,q[e][1]-nx[e]*he*1.4,R[e][0],R[e][1]);
  for(let i=e-1;i>=0;i--)g.quadraticCurveTo(R[i+1][0],R[i+1][1],(R[i+1][0]+R[i][0])/2,(R[i+1][1]+R[i][1])/2);
  g.lineTo(R[0][0],R[0][1]);
  g.quadraticCurveTo(q[0][0]-ny[0]*h0*1.4,q[0][1]+nx[0]*h0*1.4,L[0][0],L[0][1]);
  g.closePath();g.fillStyle=col;g.fill();
  if(edge){g.strokeStyle=`rgba(${INK},.3)`;g.lineWidth=1.2;g.lineJoin='round';g.stroke()}
}
function bristles(g,q,nx,ny,wf,B){
  const n=q.length;g.lineCap=g.lineJoin='round';
  for(let k=0;k<14;k++){
    const off=k/13-.5;g.lineWidth=Math.max(1,BASE*(.1+.08*hs(k,3))*B.wm);g.strokeStyle=`rgba(${INK},${(.45+hs(k,5)*.5).toFixed(2)})`;
    let on=false;g.beginPath();
    for(let i=0;i<n;i++){
      if(vn(i/7,k)<.3){on=false;continue}
      const w=wf(i)*off,x=q[i][0]+nx[i]*w,y=q[i][1]+ny[i]*w;
      if(on)g.lineTo(x,y);else{g.moveTo(x,y);on=true}
    }
    g.stroke();
  }
}
/* Ink bleed is one soft shadow pass that widens as the stroke dries */
function stem(g,p,h,n,bk){
  if(n<2)return;
  const B=BR[bk]||BR.ink,{q,nx,ny}=geom(p,n);
  const wf=i=>q[i][2]*Math.min(1,.35+i*.13)*Math.min(1,.2+(n-1-i)*.14)*(.88+.24*vn(i/6,1));
  if(B.dry>0){ribbon(g,q,nx,ny,wf,.85,`rgba(${INK},.26)`);bristles(g,q,nx,ny,wf,B);return}
  if(h>0&&B.halo){g.shadowColor=`rgba(${INK},.6)`;g.shadowBlur=(3+16*h*B.halo)*D}
  let col=`rgba(${INK},${(.78*B.a).toFixed(2)})`;
  if(B.edge){const e=n-1,gr=g.createLinearGradient(q[0][0],q[0][1],q[e][0],q[e][1]);gr.addColorStop(0,`rgba(${INK},.62)`);gr.addColorStop(1,`rgba(${INK},.2)`);col=gr} /* wet wash fades as the brush empties */
  ribbon(g,q,nx,ny,wf,1,col,B.edge);
  g.shadowColor='transparent';g.shadowBlur=0;
  if(!B.edge)ribbon(g,q,nx,ny,wf,.55,`rgba(${INK},${(.38*B.a).toFixed(2)})`);
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
/* A plant is {k, p:[[x,y,w]...], s:seed, b:brush}. lay() fixes every leaf, needle and blossom from the seed once;
   trunk() is the static ink and crown() is the part that sways in the wind. */
const LAY=new WeakMap();
function lay(P){
  let m=LAY.get(P);if(m)return m;
  const p=P.p,r=rng(P.s),L=[0];
  for(let i=1;i<p.length;i++)L[i]=L[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);
  const tot=L[L.length-1],at=d=>{let i=1;while(i<p.length-1&&L[i]<d)i++;return[p[i],Math.atan2(p[i][1]-p[i-1][1],p[i][0]-p[i-1][0])]};
  m={dots:[],nodes:[],leaves:[],twigs:[],clumps:[]};LAY.set(P,m);
  if(P.k==='plum'||P.k==='pine')for(let d=10;d<tot;d+=9+r()*14){const[q]=at(d),o=(r()-.5)*q[2]*1.3;m.dots.push([q[0]+o,q[1]+(r()-.5)*q[2],.8+r()*1.3,(.4+r()*.4).toFixed(2)])}
  if(P.k==='bamboo')for(let d=34;d<tot;d+=34+r()*10){
    const[q,a]=at(d),w=q[2]*.8;
    m.nodes.push([q[0]+Math.cos(a+1.57)*w,q[1]+Math.sin(a+1.57)*w,q[0]+Math.cos(a-1.57)*w,q[1]+Math.sin(a-1.57)*w]);
    if(d>tot*.3)for(let k=0;k<3;k++)m.leaves.push([q[0],q[1],(k%2?Math.PI-.25-r()*.7:.25+r()*.7)+(k===2?(r()-.5)*.5:0),24+r()*26,tone(r,.5),r()*6.28]);
  }
  if(P.k==='plum')for(let d=tot*.12;d<tot;d+=22+r()*26){
    const[q,a]=at(d),sd=r()<.5?-1:1,ta=a+sd*(.5+r()*.7),tl=16+r()*28,mx=Math.cos(ta)*tl*.55,my=Math.sin(ta)*tl*.55;
    m.twigs.push({x:q[0],y:q[1],m:[mx,my],t:[mx+Math.cos(ta+sd*.5)*tl*.45,my+Math.sin(ta+sd*.5)*tl*.45],f:r()<.8?[5+r()*4,r()*6.28]:0,ph:r()*6.28});
  }
  if(P.k==='pine')for(let d=tot*.1;d<tot;d+=26+r()*24){
    const[q]=at(d);
    for(let c=0;c<2;c++){const x=q[0]+(r()-.5)*14,y=q[1]-4-r()*8,col=tone(r,.55),nd=[];for(let i=0;i<20;i++)nd.push([-Math.PI*(.04+.92*i/19)+(r()-.5)*.25,12+r()*14]);m.clumps.push({x,y,col,nd,ph:r()*6.28})}
  }
  return m;
}
function trunk(g,P,h){
  const m=lay(P);stem(g,P.p,h,P.p.length,P.b);
  for(const d of m.dots){g.fillStyle=`rgba(${INK},${d[3]})`;g.beginPath();g.arc(d[0],d[1],d[2],0,6.283);g.fill()} /* moss dots on the bark */
  if(m.nodes.length){g.strokeStyle=`rgba(${INK},.8)`;g.lineWidth=2;g.beginPath();for(const n of m.nodes){g.moveTo(n[0],n[1]);g.lineTo(n[2],n[3])}g.stroke()}
}
const wavg=T=>.55+.45*Math.sin(T*.21)*Math.sin(T*.13+1);
function crown(g,P,e,T,A){
  const m=lay(P),sw=(x,ph,k)=>A?Math.sin(T*1.3+x*.012+ph)*(.05+.09*wavg(T)+gust*.22)*k:0;
  for(const l of m.leaves)leaf(g,l[0],l[1],l[2]+sw(l[0],l[5],1),l[3]*e,l[4]);
  if(m.twigs.length){
    g.strokeStyle=`rgba(${INK},.7)`;g.lineWidth=1.6;g.beginPath();
    const R=m.twigs.map(t=>{const d=sw(t.x,t.ph,.6),c=Math.cos(d),s=Math.sin(d),f=v=>[(v[0]*c-v[1]*s)*e,(v[0]*s+v[1]*c)*e],a=f(t.m),b=f(t.t);g.moveTo(t.x,t.y);g.lineTo(t.x+a[0],t.y+a[1]);g.lineTo(t.x+b[0],t.y+b[1]);return[t.x+b[0],t.y+b[1],d,t.f]});
    g.stroke();
    for(const r of R){if(r[3])flower(g,r[0],r[1],r[3][0]*e,r[3][1]+r[2]);else{g.fillStyle=`rgb(${SEAL})`;g.beginPath();g.arc(r[0],r[1],2.2*e,0,6.283);g.fill()}}
  }
  for(const c of m.clumps){
    g.strokeStyle=c.col;g.lineWidth=1.1;g.beginPath();
    for(const n of c.nd){const a=n[0]+sw(c.x,c.ph,.5),l=n[1]*e;g.moveTo(c.x,c.y);g.lineTo(c.x+Math.cos(a)*l,c.y+Math.sin(a)*l)}
    g.stroke();
  }
}
const bloom=(g,P,t)=>{const e=1-Math.pow(1-t,3);trunk(g,P,e);crown(g,P,e,0,0)};
const live30=()=>RM||S.calm?[]:S.plants.filter(P=>P.k!=='ink').slice(-30);
function redraw(){cx.ink.clearRect(0,0,W,H);S.plants.forEach(P=>{trunk(cx.ink,P,1);if(!alive.includes(P))crown(cx.ink,P,1,0,0)})}

/* Render loop: runs only while painting or blooming */
function frame(now){
  const busy=cur||grow.length;
  if(!busy&&now-lastT<33){run=requestAnimationFrame(frame);return}
  lastT=now;gust*=.965;
  const T=now/1000,g=cx.live;g.clearRect(0,0,W,H);
  if(cur&&cur.length>1)stem(g,cur,0,cur.length,S.brush);
  grow=grow.filter(o=>{
    const P=o.P,t=RM?1:Math.min(1,(now-o.t0)/1600);
    if(t>=1){
      trunk(cx.ink,P,1);
      if(RM||S.calm||P.k==='ink')crown(cx.ink,P,1,0,0);else{alive.push(P);if(alive.length>30)crown(cx.ink,alive.shift(),1,0,0)}
      if(P.k!=='ink')drip();if(P.k==='plum'&&!RM)fall(P,now);return false;
    }
    const e=1-Math.pow(1-t,3);trunk(g,P,e);crown(g,P,e,T,1);return true;
  });
  for(const P of alive)crown(g,P,1,T,1);
  if(alive.length&&now>petalAt){
    petalAt=now+2000+Math.random()*2500;
    const tw=lay(alive[Math.random()*alive.length|0]).twigs,w=tw[Math.random()*tw.length|0];
    if(w)petals.push({x:w.x+w.t[0],y:w.y+w.t[1],dx:(Math.random()-.5)*60,dy:90+Math.random()*80,ph:Math.random()*6,life:2600+Math.random()*1400,t0:now});
  }
  petals=petals.filter(q=>{
    const a=(now-q.t0)/q.life;if(a>=1)return false;if(a<0)return true;
    const x=q.x+Math.sin(a*6+q.ph)*14+a*q.dx,y=q.y+a*q.dy;
    g.fillStyle=`rgba(${SEAL},${(.55*(1-a)).toFixed(2)})`;g.beginPath();g.ellipse(x,y,3.2,1.8,a*8+q.ph,0,6.283);g.fill();return true;
  });
  run=cur||grow.length||alive.length||petals.length?requestAnimationFrame(frame):0;
}
function fall(P,now){for(let i=0;i<7;i++){const q=P.p[Math.floor(Math.random()*P.p.length)];petals.push({x:q[0],y:q[1],dx:(Math.random()-.5)*60,dy:90+Math.random()*80,ph:Math.random()*6,life:2600+Math.random()*1400,t0:now+Math.random()*600})}}
const kick=()=>{if(!run)run=requestAnimationFrame(frame)};

/* Input */
function add(e){
  const x=e.clientX,y=e.clientY,q=cur[cur.length-1],d=q?Math.hypot(x-q[0],y-q[1]):0;
  if(q&&d<3)return;
  const v=q?d/Math.max(1,e.timeStamp-lt):0,pr=e.pointerType==='pen'?Math.max(.35,e.pressure*1.6):1;
  const bw=BASE*BR[S.brush].wm,target=bw*(1.15-Math.min(v,2)/2*.7)*pr,w=q?q[2]*.7+target*.3:bw*.5;
  cur.push([Math.round(x),Math.round(y),+w.toFixed(1)]);lt=e.timeStamp;swish(v);gust=Math.min(1,gust+v*.04);
}
function end(){
  if(!cur)return;
  const p=cur;cur=null;swish(0);
  if(p.length<3){kick();return}
  const len=plen(p),f=p[0],l=p[p.length-1],chord=Math.hypot(f[0]-l[0],f[1]-l[1]);
  const k=len<70?'ink':S.pick;let msg='';
  if(k!=='ink'){const n=3+Math.round(chord/len*4)+Math.min(5,Math.round(len/100));S.ess+=n;msg=`+${n} ✦ ${SPECIES[k].name}`}
  const P={k,p,s:Math.random()*1e9|0,b:S.brush};
  S.plants.push(P);grow.push({P,t0:performance.now()});save();ui();say(msg);kick();
}
const c=cv.live;
c.onpointerdown=e=>{if(!e.isPrimary)return;c.setPointerCapture(e.pointerId);cur=[];lt=e.timeStamp;$('hint').classList.add('off');add(e);kick()};
c.onpointermove=e=>{if(!cur)return;const l=e.getCoalescedEvents&&e.getCoalescedEvents();(l&&l.length?l:[e]).forEach(add)};
c.onpointerup=c.onpointercancel=end;

/* UI */
function say(m){if(!m)return;const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2200)}
const chip=(k,s,on,br)=>`<button data-${br?'b':'k'}="${k}" class="${S.open[k]?'':'lock'}${on?' on':''}">${br?'':`<b>${s.zh}</b>`}${s.name}${S.open[k]?'':`<em>✦${s.cost}</em>`}</button>`;
function ui(){
  $('ess').textContent='✦ '+S.ess;
  $('seal').classList.toggle('on',S.plants.length>0);
  $('species').innerHTML='<div class="br">'+Object.entries(BR).map(([k,s])=>chip(k,s,S.brush===k,1)).join('')+'</div>'+Object.entries(SPECIES).map(([k,s])=>chip(k,s,S.pick===k)).join('');
}
$('species').onclick=e=>{
  const x=e.target.closest('button');if(!x)return;
  const b=x.dataset.b,k=b||x.dataset.k,s=b?BR[b]:SPECIES[k];
  if(!S.open[k]){
    if(S.ess<s.cost)return say(`${s.cost-S.ess} more ✦ to unlock ${s.name}`);
    S.ess-=s.cost;S.open[k]=1;
  }
  S[b?'brush':'pick']=k;save();ui();say(`${s.name} selected`);
};
$('undo').onclick=()=>{const P=S.plants.pop();if(!P)return;grow=grow.filter(o=>o.P!==P);alive=alive.filter(x=>x!==P);redraw();save();ui()};
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
const calm=document.createElement('button');calm.textContent='〰';calm.setAttribute('aria-label','Toggle wind');calm.style.opacity=S.calm?.5:1;$('snd').before(calm);
calm.onclick=()=>{S.calm=!S.calm;calm.style.opacity=S.calm?.5:1;save();alive=live30();redraw();kick()};
const mist=document.createElement('div');mist.id='mist';mist.innerHTML='<i></i><i></i>';cv.paper.after(mist);
if(S.plants.length)$('hint').classList.add('off');
alive=live30();ui();size();kick();
