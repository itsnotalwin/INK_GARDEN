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
S.open.ink=1;S.seen=S.seen||{};if(!BR[S.brush])S.brush='ink';
/* Seasons: palette, weather and leaf colour. Follows the calendar (flipped in the southern hemisphere) unless the player picks one. */
const SEA={
  spring:{zh:'春',p:'245,238,230',w:'112,106,104',t:'200,150,150',o:'181,64,44',oa:.05,or:.11,leaf:'106,128,72',fx:'petal'},
  summer:{zh:'夏',p:'242,240,224',w:'92,106,96',t:'140,170,100',o:'181,64,44',oa:.12,or:.15,leaf:'66,104,60',fx:'rain'},
  autumn:{zh:'秋',p:'246,236,216',w:'120,102,88',t:'190,140,70',o:'200,120,40',oa:.09,or:.12,leaf:'176,104,40',fx:'leaf'},
  winter:{zh:'冬',p:'237,239,240',w:'92,102,116',t:'150,170,200',o:'107,102,96',oa:.08,or:.1,leaf:'92,107,96',fx:'snow'}
};
const SOUTH=/^(Australia|Antarctica)\/|Johannesburg|Maseru|Mbabane|Windhoek|Gaborone|Harare|Lusaka|Maputo|Blantyre|Luanda|Auckland|Fiji|Sao_Paulo|Argentina|Santiago|Lima|La_Paz|Montevideo|Asuncion|Antananarivo|Mauritius|Reunion|Tahiti/;
function season(){
  if(SEA[S.season])return S.season;
  let i=Math.floor(((new Date().getMonth()+1)%12)/3);
  if(SOUTH.test(Intl.DateTimeFormat().resolvedOptions().timeZone||''))i=(i+2)%4;
  return['winter','spring','summer','autumn'][i];
}
let SE=SEA[season()],fx=[];
const cap=x=>x[0].toUpperCase()+x.slice(1);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const plen=p=>p.reduce((s,q,i)=>i?s+Math.hypot(q[0]-p[i-1][0],q[1]-p[i-1][1]):0,0);

/* Paper: mottled washi, an orb, and misty ridges in the season's colours, then speckle and fibres; seeded so it never shifts */
function paper(){
  const g=cx.paper,w=cv.paper.width,h=cv.paper.height,r=rng(7),M=Math.max(w,h),P=SE.p;
  g.setTransform(1,0,0,1,0,0);g.fillStyle=`rgb(${P})`;g.fillRect(0,0,w,h);
  for(let i=0;i<14;i++){
    const x=r()*w,y=r()*h,q=g.createRadialGradient(x,y,0,x,y,(.25+r()*.4)*M);
    q.addColorStop(0,`rgba(${r()<.5?SE.t:'255,255,250'},${(.03+r()*.04).toFixed(3)})`);q.addColorStop(1,`rgba(${P},0)`);
    g.fillStyle=q;g.fillRect(0,0,w,h);
  }
  g.beginPath();g.arc(w*.72,h*.2,Math.min(w,h)*SE.or,0,6.283);g.fillStyle=`rgba(${SE.o},${SE.oa})`;g.fill();g.strokeStyle=`rgba(${SE.o},${(SE.oa*1.7).toFixed(3)})`;g.lineWidth=D;g.stroke();
  for(let k=0;k<3;k++){
    const base=h*(.62+k*.07),amp=h*(.12-k*.025);
    g.fillStyle=`rgba(${SE.w},${[.09,.13,.18][k]})`;g.beginPath();g.moveTo(0,h);g.lineTo(0,base);
    for(let x=0;x<w;x+=w/8)g.quadraticCurveTo(x+w/16,base-amp*(.3+r()*.9),x+w/8,base-amp*r()*.4);
    g.lineTo(w,h);g.fill();
    const m=g.createLinearGradient(0,base-amp*.2,0,base+amp*.9);m.addColorStop(0,`rgba(${P},0)`);m.addColorStop(1,`rgba(${P},.88)`);
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
const tone=(r,m)=>[r()<m?1:0,+(.4+r()*.45).toFixed(2)];
const lc=a=>`rgba(${a[0]?SE.leaf:INK},${a[1]})`;
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
  m={tot,dots:[],nodes:[],leaves:[],twigs:[],clumps:[]};LAY.set(P,m);
  if(P.k==='plum'||P.k==='pine')for(let d=10;d<tot;d+=9+r()*14){const[q]=at(d),o=(r()-.5)*q[2]*1.3;m.dots.push([q[0]+o,q[1]+(r()-.5)*q[2],.8+r()*1.3,(.4+r()*.4).toFixed(2),d])}
  if(P.k==='bamboo')for(let d=34;d<tot;d+=34+r()*10){
    const[q,a]=at(d),w=q[2]*.8;
    m.nodes.push([q[0]+Math.cos(a+1.57)*w,q[1]+Math.sin(a+1.57)*w,q[0]+Math.cos(a-1.57)*w,q[1]+Math.sin(a-1.57)*w,d]);
    if(d>tot*.3)for(let k=0;k<3;k++)m.leaves.push([q[0],q[1],(k%2?Math.PI-.25-r()*.7:.25+r()*.7)+(k===2?(r()-.5)*.5:0),24+r()*26,tone(r,.5),r()*6.28,d]);
  }
  if(P.k==='plum')for(let d=tot*.12;d<tot;d+=22+r()*26){
    const[q,a]=at(d),sd=r()<.5?-1:1,ta=a+sd*(.5+r()*.7),tl=16+r()*28,mx=Math.cos(ta)*tl*.55,my=Math.sin(ta)*tl*.55;
    m.twigs.push({x:q[0],y:q[1],m:[mx,my],t:[mx+Math.cos(ta+sd*.5)*tl*.45,my+Math.sin(ta+sd*.5)*tl*.45],f:r()<.8?[5+r()*4,r()*6.28]:0,ph:r()*6.28,d});
  }
  if(P.k==='pine')for(let d=tot*.1;d<tot;d+=26+r()*24){
    const[q]=at(d);
    for(let c=0;c<2;c++){const x=q[0]+(r()-.5)*14,y=q[1]-4-r()*8,col=tone(r,.55),nd=[];for(let i=0;i<20;i++)nd.push([-Math.PI*(.04+.92*i/19)+(r()-.5)*.25,12+r()*14]);m.clumps.push({x,y,col,nd,ph:r()*6.28,d})}
  }
  return m;
}
function trunk(g,P,h,s=1){
  const m=lay(P),n=Math.min(P.p.length,Math.max(3,Math.ceil(P.p.length*s))),lim=s*m.tot+1;
  stem(g,P.p,h,n,P.b);
  for(const d of m.dots){if(d[4]>lim)continue;g.fillStyle=`rgba(${INK},${d[3]})`;g.beginPath();g.arc(d[0],d[1],d[2],0,6.283);g.fill()} /* moss dots on the bark */
  g.strokeStyle=`rgba(${INK},.8)`;g.lineWidth=2;g.beginPath();for(const q of m.nodes)if(q[4]<=lim){g.moveTo(q[0],q[1]);g.lineTo(q[2],q[3])}g.stroke();
  if(s<1&&P.k!=='ink'){g.save();g.setLineDash([2,9]);g.strokeStyle=`rgba(${INK},.2)`;g.lineWidth=1.5;g.beginPath();for(let i=n-1;i<P.p.length;i++)i===n-1?g.moveTo(P.p[i][0],P.p[i][1]):g.lineTo(P.p[i][0],P.p[i][1]);g.stroke();g.restore()} /* the path it will grow along */
}
const wavg=T=>.55+.45*Math.sin(T*.21)*Math.sin(T*.13+1);
/* e: how full the foliage is (0..1), s: how much of the stem has grown (0..1) */
function crown(g,P,e,T,A,s=1){
  const m=lay(P),lim=s*m.tot,th=thirsty(P),fe=Math.max(0,(e-.55)/.45),rp=d=>s>=1?1:Math.min(1,Math.max(0,(lim-d)/40));
  const sw=(x,ph,k)=>(A?Math.sin(T*1.3+x*.012+ph)*(.05+.09*wavg(T)+gust*.22)*k:0)+(th?.18*k:0);
  if(th)g.globalAlpha=.6;
  for(const l of m.leaves){const k=e*rp(l[6]);if(k>.02)leaf(g,l[0],l[1],l[2]+sw(l[0],l[5],1),l[3]*k,lc(l[4]))}
  if(m.twigs.length){
    g.strokeStyle=`rgba(${INK},.7)`;g.lineWidth=1.6;g.beginPath();const R=[];
    for(const t of m.twigs){
      const q=rp(t.d),k=e*q;if(k<=.02)continue;
      const d=sw(t.x,t.ph,.6),c=Math.cos(d),sn=Math.sin(d),f=v=>[(v[0]*c-v[1]*sn)*k,(v[0]*sn+v[1]*c)*k],a=f(t.m),b=f(t.t);
      g.moveTo(t.x,t.y);g.lineTo(t.x+a[0],t.y+a[1]);g.lineTo(t.x+b[0],t.y+b[1]);R.push([t.x+b[0],t.y+b[1],d,t.f,q]);
    }
    g.stroke();
    for(const r of R){if(r[3]&&fe>.05)flower(g,r[0],r[1],r[3][0]*fe*r[4],r[3][1]+r[2]);else{g.fillStyle=`rgb(${SEAL})`;g.beginPath();g.arc(r[0],r[1],2.2*e*r[4],0,6.283);g.fill()}}
  }
  for(const c of m.clumps){
    const k=e*rp(c.d);if(k<=.02)continue;
    g.strokeStyle=lc(c.col);g.lineWidth=1.1;g.beginPath();
    for(const n of c.nd){const a=n[0]+sw(c.x,c.ph,.5),l=n[1]*k;g.moveTo(c.x,c.y);g.lineTo(c.x+Math.cos(a)*l,c.y+Math.sin(a)*l)}
    g.stroke();
  }
  g.globalAlpha=1;
}
const bloom=(g,P,t)=>{const e=1-Math.pow(1-t,3);trunk(g,P,e,1);crown(g,P,e,0,0,1)};
const live30=()=>S.plants.filter(P=>P.k!=='ink').filter((P,i,a)=>prog(P)<1||(!(RM||S.calm)&&i>=a.length-30));
function redraw(){cx.ink.clearRect(0,0,W,H);S.plants.forEach(P=>{if(prog(P)<1)return;trunk(cx.ink,P,1,1);if(!alive.includes(P))crown(cx.ink,P,1,0,0,1)})}

/* Garden keeper: plants grow in real time (add ?fast=60 to the link to run a day in 24 minutes), tending speeds them up, visitors drop by */
const FAST=+new URLSearchParams(location.search).get('fast')||1,HR=3600e3,GROWH={bamboo:8,plum:20,pine:30};
const prog=P=>P.t0?Math.min(1,((Date.now()-P.t0)*FAST+(P.boost||0))/(GROWH[P.k]*HR)):1;
const vis=P=>{const g=prog(P);return{s:Math.min(1,.2+g*1.3),e:Math.min(1,.15+g*.85)}};
const thirsty=P=>P.t0&&(Date.now()-(P.care||P.t0))*FAST>36*HR;
let ripples=[],V=[];
const VIS={
  sparrow:{name:'Sparrow',gift:4,w:{spring:.5,summer:.4,autumn:.5,winter:1},ok:m=>m.bamboo||m.first},
  butterfly:{name:'Butterfly',gift:5,w:{spring:1,summer:.7,autumn:.1,winter:0},ok:m=>m.plum},
  crane:{name:'Crane',gift:9,w:{spring:.5,summer:.2,autumn:1,winter:1},ok:m=>m.pine&&m.space>=.5}
};
function metrics(){
  const m={bamboo:0,plum:0,pine:0,first:!S.seen.sparrow&&S.plants.some(P=>P.k==='bamboo')},cell=[],cw=W/8,ch=H/14;let care=0,n=0;
  for(const P of S.plants){
    if(P.k==='ink')continue;n++;if(!thirsty(P))care++;if(prog(P)>=.4)m[P.k]++;
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const q of P.p){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}
    for(let i=Math.max(0,Math.floor((x0-24)/cw));i<=Math.min(7,Math.floor((x1+24)/cw));i++)for(let j=Math.max(0,Math.floor((y0-24)/ch));j<=Math.min(13,Math.floor((y1+24)/ch));j++)cell[j*8+i]=1;
  }
  m.space=1-cell.filter(Boolean).length/112;m.care=n?care/n:1;return m;
}
function tend(P,x,y){
  const now=Date.now(),ok=!P.tend||(now-P.tend)*FAST>2*HR;
  ripples.push({x,y,t0:performance.now(),a:ok?.35:.14});kick();
  if(!ok)return say('Still damp, check back later');
  P.tend=P.care=now;if(P.t0)P.boost=(P.boost||0)+GROWH[P.k]*HR*.06;S.ess+=2;save();ui();say('+2 ✦ tended');drip();
}
function tap(x,y){
  let best=null,bd=40;
  for(const P of S.plants){if(P.k==='ink')continue;const n=P.t0?Math.ceil(P.p.length*vis(P).s):P.p.length;for(let i=0;i<n;i+=2){const d=Math.hypot(P.p[i][0]-x,P.p[i][1]-y);if(d<bd){bd=d;best=P}}}
  if(best)tend(best,x,y);else{ripples.push({x,y,t0:performance.now(),a:.12});kick()}
}
function mature(P){
  if(!P.t0||P.paid||prog(P)<1)return false;
  P.paid=1;S.ess+=10;save();ui();say(`Your ${P.k} is in full ${P.k==='plum'?'bloom':'leaf'} · +10 ✦`);if(P.k==='plum'&&!RM)fall(P,performance.now());return true;
}
function arrive(k,now){
  let x=W*(.2+.6*Math.random()),y=H*.8;
  if(k!=='crane'){
    const kind=k==='sparrow'?'bamboo':'plum',ps=S.plants.filter(P=>P.k===kind&&(prog(P)>=.4||(k==='sparrow'&&!S.seen.sparrow)));if(!ps.length)return false;
    const P=ps[Math.random()*ps.length|0],q=P.p[Math.max(0,Math.ceil(P.p.length*vis(P).s)-1)];x=q[0];y=q[1]-8;
  }
  V.push({k,x,y,t0:now,life:(k==='crane'?30:18)*1000,ph:Math.random()*6.28,dir:Math.random()<.5?-1:1});return true;
}
function visitCheck(now){
  if(V.length>=2||!S.plants.length)return;
  const m=metrics(),sn=season();
  for(const k in VIS){
    const v=VIS[k];if(V.some(x=>x.k===k)||!v.ok(m))continue;
    if((k==='sparrow'&&m.first)||Math.random()<v.w[sn]*(.4+.6*m.care)*.35){if(arrive(k,now)){kick();return}}
  }
}
function away(){
  const hrs=S.last?(Date.now()-S.last)*FAST/HR:0;if(hrs<1.5||!S.plants.length)return;
  const m=metrics(),sn=season(),got=[];
  for(const k in VIS){const v=VIS[k];if(got.length<2&&v.ok(m)&&Math.random()<Math.min(.9,v.w[sn]*(.4+.6*m.care)*hrs/6)){got.push(k);S.ess+=v.gift;S.seen[k]=(S.seen[k]||0)+1}}
  save();ui();say(got.length?`While you were away: ${got.map(k=>'a '+VIS[k].name.toLowerCase()).join(' and ')} visited`:'Your garden grew while you were away');
}
function drawV(g,v,T){
  const ink=a=>`rgba(${INK},${a})`;
  if(v.k==='sparrow'){
    const x=v.x,y=v.y+(Math.sin(T*1.8+v.ph)>.96?-3:0);
    g.fillStyle=ink(.82);g.beginPath();g.ellipse(x,y,7,5,-.25,0,6.283);g.fill();g.beginPath();g.arc(x+6,y-4,3.6,0,6.283);g.fill();
    g.beginPath();g.moveTo(x-6,y);g.lineTo(x-16,y+3);g.lineTo(x-5,y+3);g.fill();g.beginPath();g.moveTo(x+9,y-5);g.lineTo(x+13,y-4);g.lineTo(x+9,y-3);g.fill();
    g.fillStyle=ink(.4);g.beginPath();g.ellipse(x-1,y,4.5,2.8,-.3,0,6.283);g.fill();
  }else if(v.k==='butterfly'){
    const x=v.x+Math.cos(T*1.1+v.ph)*28,y=v.y+Math.sin(T*1.7+v.ph)*16-6,f=Math.abs(Math.sin(T*9));
    g.fillStyle=`rgba(${SEAL},.32)`;g.strokeStyle=`rgba(${SEAL},.7)`;g.lineWidth=.8;
    for(const sd of[-1,1]){g.beginPath();g.ellipse(x+sd*3.5*f,y,5*f+1,3.6,sd*.5,0,6.283);g.fill();g.stroke()}
    g.strokeStyle=ink(.8);g.lineWidth=1.4;g.beginPath();g.moveTo(x,y-3);g.lineTo(x,y+3);g.stroke();
  }else{
    const dip=Math.pow(Math.max(0,Math.sin(T*.7+v.ph)),6)*20;
    g.save();g.translate(v.x,v.y);g.scale(v.dir,1);g.lineCap='round';
    g.strokeStyle=ink(.7);g.lineWidth=1.3;g.beginPath();g.moveTo(-2,-34);g.lineTo(-3,0);g.moveTo(3,-34);g.lineTo(5,0);g.stroke();
    g.fillStyle=ink(.1);g.strokeStyle=ink(.5);g.lineWidth=1;g.beginPath();g.ellipse(0,-44,17,8,-.25,0,6.283);g.fill();g.stroke();
    g.fillStyle=ink(.85);g.beginPath();g.moveTo(-12,-46);g.lineTo(-27,-40);g.lineTo(-14,-39);g.fill();
    g.strokeStyle=ink(.85);g.lineWidth=3;g.beginPath();g.moveTo(12,-48);g.quadraticCurveTo(26,-60,20,-80+dip);g.stroke();
    g.beginPath();g.arc(20,-82+dip,3.2,0,6.283);g.fill();g.lineWidth=1.4;g.beginPath();g.moveTo(22,-82+dip);g.lineTo(36,-79+dip);g.stroke();
    g.fillStyle=`rgb(${SEAL})`;g.beginPath();g.arc(19,-85+dip,1.7,0,6.283);g.fill();g.restore();
  }
}
/* Render loop: runs while painting, growing, or anything is moving; throttled when idle */
function frame(now){
  const busy=cur||grow.length||ripples.length,still=RM||S.calm;
  if(!busy&&now-lastT<(still?1000:33)){run=requestAnimationFrame(frame);return}
  const dt=Math.min(.05,(now-lastT)/1000);lastT=now;gust*=.965;
  const T=now/1000,A=still?0:1,g=cx.live;g.clearRect(0,0,W,H);
  if(cur&&cur.length>1)stem(g,cur,0,cur.length,S.brush);
  grow=grow.filter(o=>{
    const P=o.P,t=RM?1:Math.min(1,(now-o.t0)/1600),e=1-Math.pow(1-t,3);
    if(o.settle){if(t>=1){trunk(cx.ink,P,1,1);return false}trunk(g,P,e,1);return true}
    if(!P.t0){if(t>=1){trunk(cx.ink,P,1,1);return false}trunk(g,P,e,1);return true}
    if(t>=1){
      alive.push(P);drip();
      if(alive.length>40){const i=alive.findIndex(x=>prog(x)>=1);if(i>=0)crown(cx.ink,alive.splice(i,1)[0],1,0,0,1)}
      return false;
    }
    const v=vis(P),sa=1-(1-v.s)*e;trunk(g,P,0,sa);crown(g,P,v.e*e,T,A,sa);return true;
  });
  for(const P of alive){
    if(P.t0&&prog(P)<1){const v=vis(P);trunk(g,P,0,v.s);crown(g,P,v.e,T,A,v.s)}
    else{crown(g,P,1,T,A,1);if(P.t0&&!P.paid&&mature(P))grow.push({P,t0:now,settle:1})}
  }
  ripples=ripples.filter(r=>{
    const a=(now-r.t0)/1100;if(a>=1)return false;
    g.strokeStyle=`rgba(${INK},${(r.a*(1-a)).toFixed(2)})`;g.lineWidth=1.4;
    for(let i=0;i<2;i++){g.beginPath();g.ellipse(r.x,r.y,(8+a*34)*(1+i*.5),(4+a*17)*(1+i*.5),0,0,6.283);g.stroke()}
    return true;
  });
  V=V.filter(v=>{
    const a=(now-v.t0)/v.life,info=VIS[v.k];
    if(a>=1){S.ess+=info.gift;S.seen[v.k]=(S.seen[v.k]||0)+1;save();ui();say(`${info.name} visited · +${info.gift} ✦`);return false}
    g.save();g.globalAlpha=Math.min(1,a*12,(1-a)*12);drawV(g,v,T);g.restore();return true;
  });
  const pl=alive.filter(x=>x.k==='plum'&&prog(x)>=.8);
  if(pl.length&&now>petalAt){
    petalAt=now+2000+Math.random()*2500;
    const tw=lay(pl[Math.random()*pl.length|0]).twigs,w=tw[Math.random()*tw.length|0];
    if(w)petals.push({x:w.x+w.t[0],y:w.y+w.t[1],dx:(Math.random()-.5)*60,dy:90+Math.random()*80,ph:Math.random()*6,life:2600+Math.random()*1400,t0:now});
  }
  petals=petals.filter(q=>{
    const a=(now-q.t0)/q.life;if(a>=1)return false;if(a<0)return true;
    const x=q.x+Math.sin(a*6+q.ph)*14+a*q.dx,y=q.y+a*q.dy;
    g.fillStyle=`rgba(${SEAL},${(.55*(1-a)).toFixed(2)})`;g.beginPath();g.ellipse(x,y,3.2,1.8,a*8+q.ph,0,6.283);g.fill();return true;
  });
  fxStep(g,dt,T);
  run=cur||grow.length||alive.length||petals.length||fx.length||V.length||ripples.length?requestAnimationFrame(frame):0;
}
function applyTheme(){
  SE=SEA[season()];const d=document.documentElement.style,m=document.querySelector('meta[name=theme-color]');
  d.setProperty('--paper',`rgb(${SE.p})`);d.setProperty('--pr',SE.p);if(m)m.content=`rgb(${SE.p})`;
  sbtn.textContent=SE.zh;sbtn.style.color=S.season?'var(--seal)':'';
}
/* Weather: a few cheap particles that fit the season; painting fast pushes them along */
const LEAFC=['176,104,40','150,70,36','108,86,52'];
function fxInit(){
  fx=[];if(RM||S.calm)return;
  const n={petal:22,leaf:16,snow:40,rain:46}[SE.fx];
  for(let i=0;i<n;i++)fx.push({x:Math.random()*W,y:Math.random()*H,r:Math.random(),ph:Math.random()*6.28});
}
function fxStep(g,dt,T){
  const k=SE.fx;
  for(const q of fx){
    const v=k==='rain'?480+q.r*160:k==='snow'?18+q.r*26:k==='leaf'?34+q.r*30:26+q.r*30;
    q.y+=v*dt;q.x+=((k==='rain'?-70:k==='leaf'?18:8)+(k==='rain'?0:Math.sin(T*(.8+q.r)+q.ph)*14)+gust*60)*dt;
    if(q.y>H+20||q.x<-40||q.x>W+40){q.y=-20-Math.random()*30;q.x=Math.random()*(W+60)-30}
    if(k==='rain'){const l=14+q.r*10;g.strokeStyle='rgba(70,80,90,.22)';g.lineWidth=1;g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q.x+l*.15,q.y-l);g.stroke()}
    else if(k==='snow'){g.fillStyle='rgba(120,130,150,.32)';g.beginPath();g.arc(q.x,q.y,1.2+q.r*1.8,0,6.283);g.fill()}
    else if(k==='leaf')leaf(g,q.x,q.y,T*1.6+q.ph,8+q.r*7,`rgba(${LEAFC[Math.floor(q.ph/6.29*3)]},.6)`);
    else{g.fillStyle='rgba(196,110,110,.4)';g.beginPath();g.ellipse(q.x,q.y,2.8+q.r*1.2,1.6,T+q.ph,0,6.283);g.fill()}
  }
}
/* Share: paper + ink + the swaying plants at rest + the red seal, as one image */
async function share(){
  const w=cv.paper.width,h=cv.paper.height,o=document.createElement('canvas'),t=document.createElement('canvas');
  o.width=t.width=w;o.height=t.height=h;
  const g=o.getContext('2d'),tg=t.getContext('2d');
  tg.setTransform(D,0,0,D,0,0);alive.forEach(P=>{const v=prog(P)<1?vis(P):{s:1,e:1};if(prog(P)<1)trunk(tg,P,0,v.s);crown(tg,P,v.e,0,0,v.s)});
  g.drawImage(cv.paper,0,0);g.globalCompositeOperation='multiply';g.drawImage(cv.ink,0,0);g.drawImage(t,0,0);g.globalCompositeOperation='source-over';
  g.save();g.translate(w-D*40,h-D*52);g.rotate(-.07);g.strokeStyle=g.fillStyle='#B5402C';g.lineWidth=D*2;
  g.strokeRect(-D*17,-D*34,D*34,D*68);g.font=`${D*19}px "Hiragino Mincho ProN","Noto Serif JP","Songti SC",serif`;g.textAlign='center';g.fillText('墨',0,-D*6);g.fillText('庭',0,D*18);g.restore();
  const b=await new Promise(res=>o.toBlob(res,'image/png'));if(!b)return say('Could not make the image');
  const f=new File([b],'ink-garden.png',{type:'image/png'});
  try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:'My Ink Garden'});return}}catch(e){if(e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='ink-garden.png';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);say('Saved as an image');
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
  if(p.length<3||plen(p)<14){if(p[0])tap(p[0][0],p[0][1]);kick();return}
  const len=plen(p),k=len<70?'ink':S.pick,P={k,p,s:Math.random()*1e9|0,b:S.brush};
  let msg='';
  if(k!=='ink'){P.t0=P.care=Date.now();S.ess+=2;msg=`${SPECIES[k].name} planted · +2 ✦`;const n=S.plants.length;if(n===0)msg+=' · tap it to tend';else if(n===2)msg+=' · tap the red seal to share'}
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
const seal=document.createElement('div');seal.id='seal';seal.textContent='墨庭';seal.setAttribute('role','button');seal.tabIndex=0;seal.setAttribute('aria-label','Share your garden');seal.onclick=share;seal.onkeydown=e=>{if(e.key==='Enter'||e.key===' ')share()};document.body.append(seal);
$('hint').textContent='Paint a stroke to plant bamboo';

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
calm.onclick=()=>{S.calm=!S.calm;calm.style.opacity=S.calm?.5:1;save();alive=live30();fxInit();redraw();kick()};
const mist=document.createElement('div');mist.id='mist';mist.innerHTML='<i></i><i></i>';cv.paper.after(mist);
const sbtn=document.createElement('button');sbtn.setAttribute('aria-label','Change season');$('undo').before(sbtn);
sbtn.onclick=()=>{const o=['','spring','summer','autumn','winter'];S.season=o[(o.indexOf(S.season||'')+1)%5];save();applyTheme();paper();redraw();fxInit();say(S.season?cap(season()):'Auto: '+cap(season()))};
if(S.plants.length)$('hint').classList.add('off');
alive=live30();applyTheme();ui();size();fxInit();
S.plants.forEach(P=>mature(P));away();S.last=Date.now();save();
setInterval(()=>{if(!document.hidden)visitCheck(performance.now())},15000);
addEventListener('visibilitychange',()=>{if(document.hidden){S.last=Date.now();save()}});
kick();
