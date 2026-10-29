 (async () => {
  const layout=await fetch('./garden-layout.json').then(response=>{if(!response.ok)throw new Error('Could not load garden-layout.json');return response.json()});
  const canvas = document.querySelector('#garden');
  let ctx = canvas.getContext('2d');
  const viewport = document.querySelector('#viewport');
  const world = { w: 4200, h: 2800, scale: .9 };
  const playerPositionStorageKey='birthday-garden-player-position-v1';
  let savedPlayerPosition=null;try{const saved=JSON.parse(localStorage.getItem(playerPositionStorageKey)||'null');if(Number.isFinite(Number(saved?.x))&&Number.isFinite(Number(saved?.y)))savedPlayerPosition={x:Math.max(35,Math.min(world.w-35,Number(saved.x))),y:Math.max(40,Math.min(world.h-20,Number(saved.y)))}}catch{}
  const player = { x: savedPlayerPosition?.x??Number(layout.playerStart.x), y: savedPlayerPosition?.y??Number(layout.playerStart.y), speed: 3.2, facing: 'right', step: 0 };
  const missionCircles=(Array.isArray(layout.missionCircles)?layout.missionCircles:layout.missionCircle?[{id:1,...layout.missionCircle}]:[]).map((marker,index)=>({id:Number(marker.id)||index+1,x:Number(marker.x)||0,y:Number(marker.y)||0,radius:Math.max(24,Number(marker.radius)||92),color:marker.color||'#50e890'}));
  const camera = { x: 0, y: 0 };
  const missionDefinitions=layout.missions||{},missionScreen=document.querySelector('#mission-screen');
  const missionStorageKey='birthday-garden-missions-v1';
  let activeMission=false;
  const missionInsideIds=new Set(),missionScriptLoads=new Map(),missionStyleLoads=new Map();
  let completedMissions=new Map();try{const saved=JSON.parse(localStorage.getItem(missionStorageKey)||'[]');if(Array.isArray(saved))for(const record of saved){const key=String(typeof record==='string'?record:record?.key??'');if(!key)continue;const config=missionDefinitions[key]||{};completedMissions.set(key,{key,name:typeof record==='object'&&record?.name||config.name||key,wish:typeof record==='object'&&record?.wish||config.successMessage||''})}}catch{}
  const dragToPan=layout.dragToPan===true;
  let cameraDragged=false,activePan=null;
  const held = new Set();
  const collectibles=(layout.collectibles||[]).map((item,index)=>({id:Number(item.id)||index+1,x:Number(item.x),y:Number(item.y),emoji:item.emoji||'🎁',name:item.name||'Garden surprise',wish:item.wish||'A little birthday wish, just for you.'}));
  const itemPrompt=document.querySelector('#item-prompt'),foundItemName=document.querySelector('#found-item-name'),collectItemButton=document.querySelector('#collect-item');
  const collectionToggle=document.querySelector('#collection-toggle'),collectionCount=document.querySelector('#collection-count'),wishesToggle=document.querySelector('#wishes-toggle'),wishesCount=document.querySelector('#wishes-count');
  const surpriseModal=document.querySelector('#surprise-modal'),surpriseContent=document.querySelector('#surprise-content');
  const collectionStorageKey='birthday-garden-collection-v1';
  const welcomeStorageKey='birthday-garden-welcome-seen-v1';
  const welcomeScreen=document.querySelector('#welcome-screen'),welcomeLoading=document.querySelector('#welcome-loading'),welcomeExplore=document.querySelector('#welcome-explore'),welcomeContinue=document.querySelector('#welcome-continue'),welcomeRestart=document.querySelector('#welcome-restart');
  let gameStarted=false;
  let hasVisited=!!savedPlayerPosition;try{hasVisited=hasVisited||localStorage.getItem(welcomeStorageKey)==='true'||localStorage.getItem(collectionStorageKey)!==null}catch{}
  welcomeExplore.hidden=hasVisited;welcomeContinue.hidden=welcomeRestart.hidden=!hasVisited;
  welcomeLoading.hidden=true;
  let collectedIds=new Set(),nearbyCollectible=null;
  try{const saved=JSON.parse(localStorage.getItem(collectionStorageKey)||'[]');if(Array.isArray(saved))collectedIds=new Set(saved.map(String))}catch{}
  function savePlayerPosition(){
    savedPlayerPosition={x:player.x,y:player.y};
    try{localStorage.setItem(playerPositionStorageKey,JSON.stringify(savedPlayerPosition))}catch{}
  }
  let width = 0, height = 0, dpr = 1, lastTime = 0, moved = false;
  const rand = (seed) => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  const colors = ['#fff4dc','#f5d3c9','#f0e79b','#d9e8bf','#fff9ed','#d6dceb'];
  const butterflyCount=Math.max(0,Math.floor(Number(layout.butterflyCount??18)));
  const butterflyColumns=Math.max(1,Math.ceil(Math.sqrt(butterflyCount*world.w/world.h)));
  const butterflyRows=Math.max(1,Math.ceil(butterflyCount/butterflyColumns));
  const butterflyCellW=world.w/butterflyColumns,butterflyCellH=world.h/butterflyRows;
  const rabbitCount=Math.max(0,Math.floor(Number(layout.rabbitCount??12)));
  const rabbitColumns=Math.max(1,Math.ceil(Math.sqrt(rabbitCount*world.w/world.h)));
  const rabbitRows=Math.max(1,Math.ceil(rabbitCount/rabbitColumns));
  const rabbitCellW=world.w/rabbitColumns,rabbitCellH=world.h/rabbitRows;
  const trees=layout.trees.map((t,index)=>({id:Number(t.id)||index+1,x:Number(t.x),y:Number(t.y),s:Number(t.s)}));
  const bench={x:1850,y:1490};

  function resize(){const r=viewport.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
  function ellipse(x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
  function traceSpline(c,points){
    c.moveTo(points[0].x,points[0].y);
    for(let i=0;i<points.length-1;i++){
      const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
      c.bezierCurveTo(p1.x+(p2.x-p0.x)/6,p1.y+(p2.y-p0.y)/6,p2.x-(p3.x-p1.x)/6,p2.y-(p3.y-p1.y)/6,p2.x,p2.y);
    }
  }
  function makeSpline(points,steps=32){
    const sampled=[];
    for(let i=0;i<points.length-1;i++){
      const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
      const a={x:p1.x+(p2.x-p0.x)/6,y:p1.y+(p2.y-p0.y)/6},b={x:p2.x-(p3.x-p1.x)/6,y:p2.y-(p3.y-p1.y)/6};
      for(let j=0;j<steps;j++){const t=j/steps,u=1-t;sampled.push({x:u*u*u*p1.x+3*u*u*t*a.x+3*u*t*t*b.x+t*t*t*p2.x,y:u*u*u*p1.y+3*u*u*t*a.y+3*u*t*t*b.y+t*t*t*p2.y})}
    }
    sampled.push(points[points.length-1]);return sampled;
  }
  function sampleBezier(p0,p1,p2,p3,steps=64){const out=[];for(let i=0;i<=steps;i++){const t=i/steps,u=1-t;out.push({x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y})}return out}
  const spinePoints=[{x:0,y:1400},{x:950,y:1320},{x:1700,y:1480},{x:2550,y:1320},{x:3300,y:1480},{x:4200,y:1400}];
  const spineSamples=makeSpline(spinePoints);
  const branchDefs=[
    {side:'top',node:1,end:{x:1400,y:0},bends:[{x:800,y:920},{x:1510,y:470}]},
    {side:'bottom',node:2,end:{x:1400,y:2800},bends:[{x:1810,y:1830},{x:1240,y:2350}]},
    {side:'top',node:3,end:{x:2800,y:0},bends:[{x:2730,y:930},{x:2500,y:460}]},
    {side:'bottom',node:4,end:{x:2800,y:2800},bends:[{x:3190,y:1840},{x:3000,y:2360}]}
  ];
  for(const b of branchDefs){b.points=[spinePoints[b.node],...b.bends,b.end];b.samples=makeSpline(b.points)}
  const spineAtNode=[0];for(let i=1;i<spinePoints.length;i++)spineAtNode.push(i*32);
  const spineSegment=(startIndex,endIndex)=>{
    const lo=Math.min(startIndex,endIndex),hi=Math.max(startIndex,endIndex),pts=spineSamples.slice(spineAtNode[lo],spineAtNode[hi]+1);
    return startIndex<=endIndex?pts:pts.reverse();
  };
  const topBranches=branchDefs.filter(b=>b.side==='top'),bottomBranches=branchDefs.filter(b=>b.side==='bottom');
  const topLinkPoints=[topBranches[0].end,{x:1750,y:0},{x:2350,y:0},topBranches[1].end],bottomLinkPoints=[bottomBranches[0].end,{x:1750,y:2800},{x:2350,y:2800},bottomBranches[1].end];
  const topLinkSamples=makeSpline(topLinkPoints),bottomLinkSamples=makeSpline(bottomLinkPoints);
  const sections=[
    {name:'A',cx:700,cy:650,phase:.2,points:[{x:0,y:0},{x:1400,y:0},...topBranches[0].samples.slice().reverse(),...spineSegment(1,0).slice(1),{x:0,y:0}]},
    {name:'B',cx:2100,cy:650,phase:1.1,points:[topBranches[0].end,...topLinkSamples.slice(1),...topBranches[1].samples.slice().reverse(),...spineSegment(3,1).slice(1),...topBranches[0].samples.slice(1)]},
    {name:'C',cx:3500,cy:650,phase:2.2,points:[{x:2800,y:0},...topBranches[1].samples.slice().reverse(),...spineSegment(3,5).slice(1),{x:4200,y:0},{x:2800,y:0}]},
    {name:'D',cx:700,cy:2150,phase:.7,points:[{x:0,y:2800},{x:1400,y:2800},...bottomBranches[0].samples.slice().reverse(),...spineSegment(2,0).slice(1),{x:0,y:2800}]},
    {name:'E',cx:2100,cy:2150,phase:1.8,points:[bottomBranches[0].end,...bottomLinkSamples.slice(1),...bottomBranches[1].samples.slice().reverse(),...spineSegment(4,2).slice(1),...bottomBranches[0].samples.slice(1)]},
    {name:'F',cx:3500,cy:2150,phase:2.6,points:[{x:2800,y:2800},...bottomBranches[1].samples.slice().reverse(),...spineSegment(4,5).slice(1),{x:4200,y:2800},{x:2800,y:2800}]}
  ];
  const houses=layout.houses.map((h,index)=>({id:Number(h.id)||index+1,x:Number(h.x),y:Number(h.y)}));
  // Put one open village gate on a branch road beside each garden.
  const gateBranches=[[0],[0,2],[2],[1],[1,3],[3]];
  for(let i=0;i<sections.length;i++){
    const s=sections[i],candidates=gateBranches[i].flatMap(index=>branchDefs[index].samples);
    const roadEdge=candidates.reduce((best,p)=>Math.hypot(p.x-s.cx,p.y-s.cy)<Math.hypot(best.x-s.cx,best.y-s.cy)?p:best,candidates[0]);
    const dx=s.cx-roadEdge.x,dy=s.cy-roadEdge.y,len=Math.hypot(dx,dy)||1;
    s.gate={x:roadEdge.x+dx/len*56,y:roadEdge.y+dy/len*56};
  }
  const roadTraces=[
    // One winding main road reaches both side edges; four branches reach the top and bottom edges.
    c=>traceSpline(c,spinePoints),
    ...branchDefs.map(b=>c=>traceSpline(c,b.points)),
    c=>traceSpline(c,topLinkPoints),c=>traceSpline(c,bottomLinkPoints)
  ];
  function strokeRoads(target,color,lineWidth){target.save();target.lineCap='round';target.lineJoin='round';target.strokeStyle=color;target.lineWidth=lineWidth;for(const trace of roadTraces){target.beginPath();trace(target);target.stroke()}target.restore()}
  const roadCanvas=document.createElement('canvas');roadCanvas.width=world.w;roadCanvas.height=world.h;const roadCtx=roadCanvas.getContext('2d');strokeRoads(roadCtx,'#fff',112);let roadData=roadCtx.getImageData(0,0,world.w,world.h).data;const roadPixels=new Uint8Array(world.w*world.h);for(let i=0;i<roadPixels.length;i++)roadPixels[i]=roadData[i*4+3];roadData=null;roadCanvas.width=roadCanvas.height=1;
  function onRoad(x,y){const ix=Math.round(x),iy=Math.round(y);return ix>=0&&iy>=0&&ix<world.w&&iy<world.h&&roadPixels[iy*world.w+ix]>0}
  let enteredSection=onRoad(player.x,player.y)?-1:sections.findIndex(s=>inSection(player.x,player.y,s));
  function inSection(x,y,s){let inside=false;for(let i=0,j=s.points.length-1;i<s.points.length;j=i++){const a=s.points[i],b=s.points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside}return inside}
  function canWalk(ax,ay,bx,by){
    if(houses.some(h=>Math.abs(bx-h.x)<154&&by>h.y-154&&by<h.y+142))return false;
    if(enteredSection>=0){
      const s=sections[enteredSection],nearGate=Math.hypot(ax-s.gate.x,ay-s.gate.y)<38||Math.hypot(bx-s.gate.x,by-s.gate.y)<38;
      if(onRoad(bx,by)){if(nearGate){enteredSection=-1;return true}return false}
      if(inSection(bx,by,s))return true;
      return false;
    }
    if(onRoad(bx,by))return true;
    for(const s of sections){
      if(!inSection(bx,by,s))continue;
      if(onRoad(ax,ay)&&Math.hypot(bx-s.gate.x,by-s.gate.y)<34){enteredSection=sections.indexOf(s);return true}
    }
    return false;
  }
  function treeClear(x,y){return !onRoad(x,y)&&!onRoad(x+38,y)&&!onRoad(x-38,y)&&!onRoad(x,y+38)&&!onRoad(x,y-38)}
  const flowerPalettes=[['#f3c8ce','#fff1d6','#e9aebc'],['#f4c7dc','#f2e7a6','#fff4dc'],['#e6c5e1','#fff4dc','#f5d3c9'],['#f0e79b','#f5d3c9','#d6dceb']];
  function drawFlowerBed(x,y,scale,palette){const rx=170*scale,ry=82*scale;ellipse(x,y+6,rx+12,ry+10,'#688b5566');ellipse(x,y,rx+4,ry+4,'#7e9a5e');ellipse(x,y,rx,ry,'#b6cc8c');for(let r=0;r<5;r++)for(let c=0;c<11;c++){const px=x-rx*.77+c*rx*.154+(r%2)*5,py=y-ry*.63+r*ry*.315;if(((px-x)/rx)**2+((py-y)/ry)**2>.9)continue;const color=palette[(r*3+c)%palette.length];ellipse(px,py,5.5*scale,5.5*scale,color);ellipse(px-1.4*scale,py-1.6*scale,2.2*scale,2.2*scale,'#fff9e399');ellipse(px,py,1.5*scale,1.5*scale,'#e4b76e')}}
  function drawGardenSections(){const greens=['#c3d996aa','#bad18c99','#c9d899aa','#bdd39099','#c5d89899','#b7d18a99'];for(let i=0;i<sections.length;i++){const s=sections[i];ctx.beginPath();s.points.forEach((p,j)=>j===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fillStyle=greens[i];ctx.fill()}for(const bed of layout.flowerBeds||[])drawFlowerBed(Number(bed.x),Number(bed.y),Number(bed.scale)||1.08,flowerPalettes[Number(bed.palette)||0])}
  function drawGardenGates(){
    for(const s of sections){
      const {x,y}=s.gate,dx=s.cx-x,dy=s.cy-y,len=Math.hypot(dx,dy)||1,nx=dx/len,ny=dy/len,tx=-ny,ty=nx;
      ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
      // A pale threshold masks the thick brown road rim at the garden-side entrance.
      ctx.translate(x,y);ctx.rotate(Math.atan2(ny,nx));
      ctx.fillStyle='#d8c59d';ctx.beginPath();ctx.ellipse(0,0,49,29,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e9debd';ctx.beginPath();ctx.ellipse(0,0,43,23,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#f1e8cf';ctx.beginPath();ctx.ellipse(0,0,37,17,0,0,Math.PI*2);ctx.fill();
      ctx.rotate(-Math.atan2(ny,nx));ctx.translate(-x,-y);
      // Small stone posts mark a broad, open passage from road into the garden.
      for(const side of [-1,1]){
        const px=x+tx*side*43,py=y+ty*side*43;
        ellipse(px,py+5,13,6,'#624c3766');
        ctx.fillStyle='#b99a70';ctx.strokeStyle='#80694d';ctx.lineWidth=2;
        ctx.beginPath();ctx.roundRect(px-7,py-15,14,20,4);ctx.fill();ctx.stroke();
        ellipse(px,py-15,8,5,'#d8c39a');ellipse(px,py-16,4,2.5,'#f0dfb9');
        // Gate leaves are swung open along the entrance path, leaving the middle clear.
        ctx.strokeStyle='#77553a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(px,py-4);ctx.lineTo(px+nx*48+tx*side*9,py+ny*48+ty*side*9);ctx.stroke();
        ctx.strokeStyle='#c29a68';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px+nx*15,py+ny*15);ctx.lineTo(px+nx*43+tx*side*9,py+ny*43+ty*side*9);ctx.stroke();
      }
      ctx.restore();
    }
  }
  function drawHouses(){
    for(let i=0;i<houses.length;i++){
      const {x,y}=houses[i];
      const roofs=['#bd5749','#aa6048','#a94c5b','#b66b48','#a94c46','#9e5360'];
      const roof=roofs[i%roofs.length],edge='#68453d',gold='#f4cf78';
      // Grand village town hall: stone foundation, warm plaster, and a broad courtyard stair.
      ellipse(x+7,y+46,176,122,'#526d4966');
      ctx.fillStyle='#82604b';ctx.beginPath();ctx.roundRect(x-143,y-83,286,220,20);ctx.fill();
      ctx.fillStyle='#d9c49b';ctx.beginPath();ctx.roundRect(x-137,y-91,274,216,19);ctx.fill();
      ctx.fillStyle='#f3e6c8';ctx.beginPath();ctx.roundRect(x-126,y-84,252,194,16);ctx.fill();
      ctx.strokeStyle='#fff3d4';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x-120,y-79,240,184,13);ctx.stroke();
      // Repeated sandstone blocks make the foundation read as carved masonry.
      ctx.strokeStyle='#b79a71';ctx.lineWidth=2;
      for(let row=0;row<3;row++)for(let col=0;col<6;col++){
        const bx=x-128+col*43+(row%2)*10,by=y+69+row*14;
        ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+34,by);ctx.stroke();
      }
      // Wide front stairs and an arched, welcoming entry.
      ctx.fillStyle='#9b7656';ctx.beginPath();ctx.roundRect(x-72,y+104,144,39,9);ctx.fill();
      ctx.fillStyle='#dfc49a';ctx.beginPath();ctx.roundRect(x-65,y+104,130,31,7);ctx.fill();
      ctx.strokeStyle='#b48f64';ctx.lineWidth=2;for(let n=0;n<4;n++){ctx.beginPath();ctx.moveTo(x-55,y+109+n*7);ctx.lineTo(x+55,y+109+n*7);ctx.stroke()}
      // Main hall roof, layered like a colorful strategy-game town hall.
      function roofShape(cx,cy,w,h,color){
        ctx.fillStyle=edge;ctx.beginPath();ctx.moveTo(cx-w/2,cy-h*.25);ctx.lineTo(cx-w*.28,cy-h/2);ctx.lineTo(cx+w*.28,cy-h/2);ctx.lineTo(cx+w/2,cy-h*.25);ctx.lineTo(cx+w/2,cy+h*.34);ctx.lineTo(cx,cy+h/2);ctx.lineTo(cx-w/2,cy+h*.34);ctx.closePath();ctx.fill();
        ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(cx-w/2+7,cy-h*.25);ctx.lineTo(cx-w*.28,cy-h/2+8);ctx.lineTo(cx,cy-h*.36);ctx.lineTo(cx,cy+h/2-8);ctx.lineTo(cx-w/2+7,cy+h*.3);ctx.closePath();ctx.fill();
        ctx.fillStyle=i%2?'#cf7954':'#d37d55';ctx.beginPath();ctx.moveTo(cx,cy-h*.36);ctx.lineTo(cx+w*.28,cy-h/2+8);ctx.lineTo(cx+w/2-7,cy-h*.25);ctx.lineTo(cx+w/2-7,cy+h*.3);ctx.lineTo(cx,cy+h/2-8);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#f2b574';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx,cy-h*.34);ctx.lineTo(cx,cy+h/2-11);ctx.stroke();
        ctx.strokeStyle='#7e493e88';ctx.lineWidth=2;for(let n=1;n<4;n++){const yy=cy-h*.25+n*h*.14;ctx.beginPath();ctx.moveTo(cx-w*.38,yy);ctx.lineTo(cx,yy+h*.09);ctx.moveTo(cx,yy+h*.09);ctx.lineTo(cx+w*.38,yy);ctx.stroke()}
        // Fine tile lines and golden eaves make the layered roof catch the light.
        ctx.strokeStyle='#f4c28b99';ctx.lineWidth=1.4;
        for(let row=0;row<5;row++){
          const yy=cy-h*.2+row*h*.105,half=w*(.39-row*.025);
          for(let col=-2;col<=2;col++){
            const xx=cx+col*half*.32+(row%2)*7;
            ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+8,yy+8);ctx.stroke();
          }
        }
        ctx.strokeStyle=gold;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx-w*.46,cy+h*.33);ctx.lineTo(cx,cy+h*.49);ctx.lineTo(cx+w*.46,cy+h*.33);ctx.stroke();
      }
      roofShape(x,y-22,232,154,roof);
      roofShape(x-91,y+4,105,104,'#916248');roofShape(x+91,y+4,105,104,'#916248');
      // Tall central keep with a blue tiled crown and gold finial.
      ctx.fillStyle='#aa8260';ctx.beginPath();ctx.roundRect(x-43,y-105,86,112,12);ctx.fill();
      ctx.fillStyle='#f1dfbb';ctx.beginPath();ctx.roundRect(x-36,y-99,72,103,10);ctx.fill();
      ctx.fillStyle='#d8c095';ctx.fillRect(x-31,y-3,62,8);
      // Twin arched stained-glass windows glow on the upper keep.
      for(const side of [-1,1]){
        ctx.fillStyle='#76503d';ctx.beginPath();ctx.roundRect(x+side*18-8,y-68,16,29,8);ctx.fill();
        const glow=ctx.createLinearGradient(x,y-68,x,y-39);glow.addColorStop(0,'#fff2a2');glow.addColorStop(1,'#ec8c61');
        ctx.fillStyle=glow;ctx.beginPath();ctx.roundRect(x+side*18-5,y-64,10,21,6);ctx.fill();
        ctx.strokeStyle='#f6d07a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+side*18,y-63);ctx.lineTo(x+side*18,y-43);ctx.stroke();
      }
      ctx.fillStyle='#476c78';ctx.beginPath();ctx.moveTo(x-53,y-91);ctx.lineTo(x-29,y-135);ctx.lineTo(x+29,y-135);ctx.lineTo(x+53,y-91);ctx.lineTo(x+42,y-79);ctx.lineTo(x-42,y-79);ctx.closePath();ctx.fill();
      ctx.fillStyle='#6b91a0';ctx.beginPath();ctx.moveTo(x-45,y-91);ctx.lineTo(x-26,y-128);ctx.lineTo(x,y-112);ctx.lineTo(x,y-82);ctx.closePath();ctx.fill();
      ctx.fillStyle='#7ca4aa';ctx.beginPath();ctx.moveTo(x,y-112);ctx.lineTo(x+26,y-128);ctx.lineTo(x+45,y-91);ctx.lineTo(x,y-82);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#b8d2c0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-111);ctx.lineTo(x,y-84);ctx.stroke();
      ctx.fillStyle=gold;ctx.beginPath();ctx.arc(x,y-139,5,0,Math.PI*2);ctx.fill();ctx.fillRect(x-1.5,y-151,3,13);
      ctx.fillStyle='#fff0b3';ctx.beginPath();ctx.arc(x-1.5,y-140.5,1.5,0,Math.PI*2);ctx.fill();
      // Smaller corner turrets, crenellated caps, and bright windows add a grand silhouette.
      for(const side of [-1,1])for(const front of [-1,1]){
        const tx=x+side*104,ty=y+front*31;
        ctx.fillStyle='#87604c';ctx.beginPath();ctx.roundRect(tx-22,ty-28,44,58,8);ctx.fill();
        ctx.fillStyle='#f0dfbe';ctx.beginPath();ctx.roundRect(tx-17,ty-24,34,49,6);ctx.fill();
        ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(tx-27,ty-18);ctx.lineTo(tx-15,ty-40);ctx.lineTo(tx+15,ty-40);ctx.lineTo(tx+27,ty-18);ctx.closePath();ctx.fill();
        ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx-18,ty-18);ctx.lineTo(tx+18,ty-18);ctx.stroke();
        ctx.fillStyle='#8ec2c2';ctx.beginPath();ctx.roundRect(tx-5,ty-3,10,15,5);ctx.fill();
        ctx.fillStyle=gold;ctx.beginPath();ctx.arc(tx,ty-39,3,0,Math.PI*2);ctx.fill();
      }
      // Arched door, golden trim, and small garden banners.
      ctx.fillStyle='#614337';ctx.beginPath();ctx.roundRect(x-20,y+65,40,48,12);ctx.fill();
      ctx.fillStyle='#a87550';ctx.beginPath();ctx.roundRect(x-14,y+72,28,40,9);ctx.fill();
      ctx.fillStyle=gold;ctx.beginPath();ctx.arc(x+7,y+91,2.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-29,y+65);ctx.quadraticCurveTo(x,y+47,x+29,y+65);ctx.stroke();
      // Warm lanterns and flowering pots frame the front steps.
      for(const side of [-1,1]){
        const fx=x+side*144,fy=y+10;
        ctx.fillStyle='#795944';ctx.fillRect(fx-2,fy-28,4,48);
        ctx.fillStyle=i%2?'#d99865':'#bd5264';ctx.beginPath();ctx.moveTo(fx,fy-26);ctx.lineTo(fx+side*20,fy-20);ctx.lineTo(fx+side*17,fy-5);ctx.lineTo(fx,fy-11);ctx.closePath();ctx.fill();
        ellipse(fx,fy+24,12,8,'#6f8e5c');ellipse(fx-3,fy+19,8,7,'#afc17e');
        ctx.fillStyle='#806147';ctx.beginPath();ctx.roundRect(x+side*87-7,y+108,14,15,3);ctx.fill();
        ellipse(x+side*87,y+106,9,8,'#89a968');
        ellipse(x+side*87-3,y+104,3,3,i%2?'#f6c5ca':'#f4d77e');ellipse(x+side*87+3,y+106,3,3,'#fff1d5');
        ellipse(x+side*76,y+69,5,5,'#ffe7a0');ellipse(x+side*76,y+69,2,2,'#fff8d5');
      }
    }
  }
  function drawGround(){ctx.fillStyle='#a9ca83';ctx.fillRect(0,0,world.w,world.h);
    // Soft patches of clover green and sunlit grass.
    for(let i=0;i<150;i++){const x=rand(i+31)*world.w,y=rand(i+91)*world.h;ellipse(x,y,55+rand(i+12)*85,32+rand(i+71)*55,i%3===0?'#a2c57c55':i%3===1?'#c3d79a55':'#9bbd7650')}
    // Six broad garden regions are shaped by winding roads and the edges of the map.
    drawGardenSections();
    // Every trail reaches a map edge; four spaced branches meet the main road.
    strokeRoads(ctx,'#76583e',148);strokeRoads(ctx,'#b99368',140);strokeRoads(ctx,'#d8c59d',124);strokeRoads(ctx,'#e9debd',110);strokeRoads(ctx,'#f1e8cf',94);
    // tiny grass flecks
    for(let i=0;i<520;i++){const x=rand(i+900)*world.w,y=rand(i+1200)*world.h;ctx.strokeStyle=i%2?'#7ea76666':'#e0e8ae80';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y+3);ctx.lineTo(x-2,y-2);ctx.moveTo(x+3,y+2);ctx.lineTo(x+5,y-2);ctx.stroke()}
  }
  function drawTree(t){
    const {x,y,s}=t;
    ellipse(x,y+12*s,39*s,12*s,'#688d5866');ctx.fillStyle='#917b59';ctx.fillRect(x-5*s,y-42*s,10*s,48*s);
    ellipse(x-16*s,y-50*s,25*s,28*s,'#65885b');ellipse(x+15*s,y-53*s,26*s,29*s,'#739966');ellipse(x,y-72*s,30*s,33*s,'#7fa66d');ellipse(x-11*s,y-77*s,9*s,11*s,'#95b47b');
  }
  function drawFlowers(){for(let i=0;i<700;i++){let x=rand(i+2200)*world.w,y=rand(i+2700)*world.h;if(onRoad(x,y))continue;let c=colors[Math.floor(rand(i+3000)*colors.length)],r=2.5+rand(i+3300)*2.4;ellipse(x,y,r,r,c);ellipse(x-2,y-2,r*.75,r*.75,'#ffffff88');ellipse(x,y,r*.35,r*.35,'#e3b56a')}}
  function drawBench(){const{x,y}=bench;ellipse(x,y+11,38,9,'#63865470');ctx.fillStyle='#a27755';ctx.fillRect(x-29,y-9,58,7);ctx.fillRect(x-26,y-19,52,7);ctx.fillRect(x-23,y-29,46,7);ctx.fillStyle='#755b43';ctx.fillRect(x-22,y-2,5,15);ctx.fillRect(x+17,y-2,5,15)}
  function drawButterflies(time){
    const wings=['#f5c6d8','#f6dc96','#c9d7f3','#ead0f0','#ffd4a5'];
    for(let n=0;n<butterflyCount;n++){
      const col=n%butterflyColumns,row=Math.floor(n/butterflyColumns),seed=n+1;
      const homeX=(col+.5+(rand(seed*17)-.5)*.55)*butterflyCellW,homeY=(row+.5+(rand(seed*29)-.5)*.55)*butterflyCellH;
      const phase=time*.0003+seed*2.4;
      const x=Math.max(18,Math.min(world.w-18,homeX+Math.sin(phase)*140+Math.sin(phase*.47)*48));
      const y=Math.max(18,Math.min(world.h-18,homeY+Math.cos(phase*.81)*110+Math.sin(phase*.39)*38));
      const flap=1.5+Math.abs(Math.sin(time*.012+seed))*3.5;
      ctx.fillStyle=wings[n%wings.length];ctx.beginPath();
      ctx.ellipse(x-5,y-1,5.5,flap,-.45,0,Math.PI*2);ctx.ellipse(x+5,y-1,5.5,flap,.45,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#574a50';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x,y+4);ctx.stroke();
    }
  }
  function drawCollectibles(time){
    for(const item of collectibles){
      if(collectedIds.has(String(item.id)))continue;
      const pulse=1+Math.sin(time*.004+item.id)*.06;
      ellipse(item.x,item.y+17,18,5,'#526e4d55');
      ctx.save();ctx.translate(item.x,item.y+Math.sin(time*.003+item.id)*2);ctx.scale(pulse,pulse);
      ctx.fillStyle='#fff8e8';ctx.strokeStyle='#c79e69';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#f2dfb3';ctx.beginPath();ctx.arc(-11,-12,3,0,Math.PI*2);ctx.fill();
      ctx.font='25px "Segoe UI Emoji",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(item.emoji,0,1);
      ctx.restore();
    }
  }
  function showSurpriseModal(){surpriseModal.hidden=false;held.clear();document.querySelector('#confirm-surprise').focus()}
  function closeSurpriseModal(){surpriseModal.hidden=true}
  function showWish(item){
    surpriseContent.replaceChildren();
    const emoji=document.createElement('span');emoji.className='wish-emoji';emoji.textContent=item.emoji;
    const wish=document.createElement('p');wish.className='wish-copy';wish.textContent=item.wish;
    surpriseContent.append(emoji,wish);showSurpriseModal();
  }
  function showCollection(){
    surpriseContent.replaceChildren();
    const items=collectibles.filter(item=>collectedIds.has(String(item.id)));
    const title=document.createElement('h2');title.className='collection-heading';title.id='surprise-title';title.textContent='Your collection';
    const subtitle=document.createElement('p');subtitle.className='collection-subtitle';subtitle.textContent=`${items.length} of ${collectibles.length} garden surprises found`;
    const list=document.createElement('div');list.className='collection-items';
    for(const item of items){
      const entry=document.createElement('article');entry.className='collection-entry';
      const emoji=document.createElement('span');emoji.className='collection-entry-emoji';emoji.textContent=item.emoji;
      const name=document.createElement('strong');name.textContent=item.name;
      const wish=document.createElement('p');wish.textContent=item.wish;
      entry.append(emoji,name,wish);list.append(entry);
    }
    surpriseContent.append(title,subtitle,list);showSurpriseModal();
  }
  function showWishes(){
    surpriseContent.replaceChildren();
    const wishes=[...completedMissions.values()];
    const title=document.createElement('h2');title.className='collection-heading';title.id='surprise-title';title.textContent='Wishes';
    const subtitle=document.createElement('p');subtitle.className='collection-subtitle';subtitle.textContent=`${wishes.length} little promise${wishes.length===1?'':'s'} to keep`;
    const list=document.createElement('div');list.className='collection-items';
    for(const wish of wishes){
      const entry=document.createElement('article');entry.className='collection-entry';
      const emoji=document.createElement('span');emoji.className='collection-entry-emoji';emoji.textContent='💌';
      const name=document.createElement('strong');name.textContent=wish.name;
      const message=document.createElement('p');message.textContent=wish.wish;
      entry.append(emoji,name,message);list.append(entry);
    }
    surpriseContent.append(title,subtitle,list);showSurpriseModal();
  }
  function updateCollectionToggle(){
    const count=collectibles.filter(item=>collectedIds.has(String(item.id))).length;
    collectionToggle.hidden=!gameStarted||activeMission||count===0;collectionCount.textContent=`${count}/${collectibles.length}`;
    const missionKeys=Object.keys(missionDefinitions),wishCount=missionKeys.filter(key=>completedMissions.has(key)).length,totalMissions=missionKeys.length;wishesToggle.hidden=!gameStarted||activeMission||wishCount===0;wishesCount.textContent=`${wishCount}/${totalMissions}`;
  }
  function beginGame(fromScratch=false){
    if(fromScratch){
      try{for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key!==welcomeStorageKey)localStorage.removeItem(key)}}catch{}
      collectedIds.clear();completedMissions.clear();missionInsideIds.clear();
      player.x=Number(layout.playerStart.x);player.y=Number(layout.playerStart.y);savedPlayerPosition=null;
    }
    try{localStorage.setItem(welcomeStorageKey,'true')}catch{}
    gameStarted=true;welcomeScreen.hidden=true;cameraDragged=false;updateCollectionToggle();updateCollectiblePrompt();
  }
  welcomeExplore.addEventListener('click',()=>beginGame());
  welcomeContinue.addEventListener('click',()=>beginGame());
  welcomeRestart.addEventListener('click',()=>beginGame(true));
  function loadMissionStyle(file){
    if(!file)return Promise.resolve();
    if(missionStyleLoads.has(file))return missionStyleLoads.get(file);
    const promise=new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href=file;link.dataset.missionStyle=file;link.onload=resolve;link.onerror=()=>reject(new Error(`Could not load mission styles: ${file}`));document.head.append(link)});
    missionStyleLoads.set(file,promise);return promise;
  }
  function loadMissionScript(file){
    if(missionScriptLoads.has(file))return missionScriptLoads.get(file);
    const promise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=file;script.dataset.missionCode=file;script.onload=resolve;script.onerror=()=>reject(new Error(`Could not load mission code: ${file}`));document.body.append(script)});
    missionScriptLoads.set(file,promise);return promise;
  }
  function leaveMission(){activeMission=false;missionScreen.hidden=true;missionScreen.replaceChildren();held.clear();updateCollectionToggle();updateCollectiblePrompt()}
  function showMissionSuccess(mission,result){
    surpriseContent.replaceChildren();
    const emoji=document.createElement('span');emoji.className='wish-emoji';emoji.textContent='💞';
    const kicker=document.createElement('p');kicker.className='wish-kicker';kicker.textContent='PIECE BY PIECE';
    const title=document.createElement('h2');title.className='wish-title';title.textContent=mission.name||result.taskName||'A life together';
    const message=document.createElement('p');message.className='wish-copy';message.textContent=result.message||mission.successMessage||'Piece by piece, we’ll build our life together. Every little moment with you is a piece I want to keep.';
    surpriseContent.append(emoji,kicker,title,message);showSurpriseModal();
  }
  function showMissionLoading(mission){
    const panel=document.createElement('section');panel.className='mission-loading';
    const title=document.createElement('h1');title.textContent=mission.name||'Your mission';
    const text=document.createElement('p');text.textContent='Getting your little puzzle ready…';
    const back=document.createElement('button');back.type='button';back.className='mission-loading-back';back.textContent='← Back to garden';back.addEventListener('click',leaveMission);
    panel.append(back,title,text);missionScreen.replaceChildren(panel);
  }
  async function launchMission(taskKey,mission){
    if(activeMission||completedMissions.has(String(taskKey)))return;
    activeMission=true;held.clear();itemPrompt.hidden=true;updateCollectionToggle();missionScreen.hidden=false;showMissionLoading(mission);
    try{
      await Promise.all([loadMissionStyle(mission.styleFile),loadMissionScript(mission.codeFile)]);
      if(!activeMission)return;
      const startTask=window[mission.functionName];if(typeof startTask!=='function')throw new Error(`Mission function not found: ${mission.functionName}`);
      await startTask(missionScreen,{config:mission,onBack:leaveMission,onComplete:result=>{
        completedMissions.set(String(taskKey),{key:String(taskKey),name:mission.name||result?.taskName||String(taskKey),wish:result?.message||mission.successMessage||''});try{localStorage.setItem(missionStorageKey,JSON.stringify([...completedMissions.values()]))}catch{}savePlayerPosition();
        leaveMission();showMissionSuccess(mission,result||{});
      }});
    }catch(error){
      if(!activeMission)return;
      const panel=document.createElement('section');panel.className='mission-loading';
      const title=document.createElement('h1');title.textContent='This mission needs a moment';
      const text=document.createElement('p');text.textContent=error.message;
      const back=document.createElement('button');back.type='button';back.className='mission-loading-back';back.textContent='← Back to garden';back.addEventListener('click',leaveMission);
      panel.append(back,title,text);missionScreen.replaceChildren(panel);
    }
  }
  function updateMissionTriggers(){
    if(!gameStarted||activeMission||!surpriseModal.hidden)return;
    const nowInside=new Set();
    for(const marker of missionCircles){
      const inside=((player.x-marker.x)/marker.radius)**2+((player.y-marker.y)/(marker.radius*.55))**2<=1;
      if(!inside)continue;
      nowInside.add(marker.id);
      if(missionInsideIds.has(marker.id))continue;
      const entry=Object.entries(missionDefinitions).find(([,mission])=>Number(mission.missionCircleId)===marker.id);
      if(entry&&!completedMissions.has(String(entry[0]))){launchMission(entry[0],entry[1]);break}
    }
    missionInsideIds.clear();for(const id of nowInside)missionInsideIds.add(id);
  }
  function missionCircleComplete(circleId){
    const linked=Object.entries(missionDefinitions).filter(([,mission])=>Number(mission.missionCircleId)===circleId);
    return linked.length>0&&linked.every(([key])=>completedMissions.has(String(key)));
  }
  function updateCollectiblePrompt(){
    if(!gameStarted||activeMission){itemPrompt.hidden=true;return}
    if(!surpriseModal.hidden){itemPrompt.hidden=true;return}
    let closest=null,distance=86;
    for(const item of collectibles){
      if(collectedIds.has(String(item.id)))continue;
      const d=Math.hypot(player.x-item.x,player.y-item.y);
      if(d<distance){distance=d;closest=item}
    }
    nearbyCollectible=closest;
    if(!closest){itemPrompt.hidden=true;return}
    const sx=(closest.x-camera.x)*world.scale,sy=(closest.y-camera.y)*world.scale;
    if(sx<0||sx>width||sy<0||sy>height){itemPrompt.hidden=true;return}
    const halfWidth=Math.min(140,width/2-10);
    itemPrompt.style.left=`${Math.max(halfWidth,Math.min(width-halfWidth,sx))}px`;
    itemPrompt.style.top=`${Math.max(95,Math.min(height-18,sy-28))}px`;
    foundItemName.textContent=closest.name;itemPrompt.hidden=false;
  }
  collectItemButton.addEventListener('click',()=>{
    if(!nearbyCollectible)return;
    const item=nearbyCollectible;collectedIds.add(String(item.id));
    try{localStorage.setItem(collectionStorageKey,JSON.stringify([...collectedIds]))}catch{}
    savePlayerPosition();
    itemPrompt.hidden=true;nearbyCollectible=null;updateCollectionToggle();showWish(item);
  });
  collectionToggle.addEventListener('click',showCollection);
  wishesToggle.addEventListener('click',showWishes);
  document.querySelector('#confirm-surprise').addEventListener('click',closeSurpriseModal);
  updateCollectionToggle();
  function rabbitPositionAt(homeX,homeY,step,seed){
    const travel=step*.72+seed*.13;
    return{x:Math.max(28,Math.min(world.w-28,homeX+Math.sin(travel)*88+Math.sin(travel*.48+seed)*24)),y:Math.max(45,Math.min(world.h-30,homeY+Math.cos(travel*.77+seed)*68+Math.sin(travel*.53)*20))};
  }
  function drawRabbits(time){
    const coats=['#fff4e4','#e8d6bd','#f4eee4','#d9d1c8','#f3dfd3'];
    for(let n=0;n<rabbitCount;n++){
      const col=n%rabbitColumns,row=Math.floor(n/rabbitColumns),seed=n+51;
      const homeX=(col+.5+(rand(seed*17)-.5)*.45)*rabbitCellW,homeY=(row+.5+(rand(seed*29)-.5)*.45)*rabbitCellH;
      const elapsed=time/1000+rand(seed*41)*2,period=1.45+rand(seed*47)*.4,hopIndex=Math.floor(elapsed/period),cycle=elapsed%period,hopDuration=.36;
      const airborne=cycle<hopDuration,hopProgress=airborne?cycle/hopDuration:1,ease=hopProgress*hopProgress*(3-2*hopProgress);
      const from=rabbitPositionAt(homeX,homeY,hopIndex,seed),to=rabbitPositionAt(homeX,homeY,hopIndex+1,seed),next=rabbitPositionAt(homeX,homeY,hopIndex+2,seed);
      const x=airborne?from.x+(to.x-from.x)*ease:to.x,y=airborne?from.y+(to.y-from.y)*ease:to.y;
      const hop=airborne?Math.sin(Math.PI*hopProgress)*15:0;
      const landed=cycle>=hopDuration&&cycle<hopDuration+.11?1-(cycle-hopDuration)/.11:0;
      const facingDelta=airborne?to.x-from.x:next.x-to.x,dir=facingDelta>=0?1:-1,coat=coats[n%coats.length];
      const stretchX=airborne?1-.08*Math.sin(Math.PI*hopProgress):1+.12*landed;
      const stretchY=airborne?1+.14*Math.sin(Math.PI*hopProgress):1-.08*landed;
      ctx.save();
      ellipse(x,y+2,11+hop*.04,2.6-hop*.025,`rgba(67,91,59,${.34-hop*.008})`);
      ctx.translate(x,y-hop);ctx.scale(dir*stretchX*.72,stretchY*.72);
      ctx.fillStyle=coat;ctx.strokeStyle='#9b8570';ctx.lineWidth=1.25;
      // Long ears with soft pink centers.
      ctx.beginPath();ctx.moveTo(5,-23);ctx.quadraticCurveTo(0,-38,4,-48);ctx.quadraticCurveTo(10,-51,11,-43);ctx.lineTo(12,-24);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(11,-24);ctx.quadraticCurveTo(13,-41,20,-45);ctx.quadraticCurveTo(25,-44,21,-35);ctx.lineTo(17,-22);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#e9a8b0';ctx.beginPath();ctx.moveTo(5,-27);ctx.quadraticCurveTo(3,-39,6,-45);ctx.quadraticCurveTo(9,-44,9,-38);ctx.lineTo(11,-27);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(13,-27);ctx.quadraticCurveTo(16,-39,20,-41);ctx.quadraticCurveTo(22,-40,18,-32);ctx.lineTo(16,-26);ctx.closePath();ctx.fill();
      // Plump body, round head, fluffy tail, and little hopping paws.
      ctx.fillStyle=coat;ctx.strokeStyle='#9b8570';ctx.lineWidth=1.25;
      ctx.beginPath();ctx.ellipse(-3,-12,14,9,-.08,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.ellipse(9,-20,10,9,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#fffdf6';ctx.strokeStyle='#cdbdac';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(-18,-12,2.8,0,Math.PI*2);ctx.arc(-15,-14,3.1,0,Math.PI*2);ctx.arc(-13,-11,2.7,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.ellipse(-9,-4,6,2.3,-.1,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.ellipse(6,-3,5.5,2.1,.08,0,Math.PI*2);ctx.fill();ctx.stroke();
      // Sweet face, blush, nose, and fine whiskers.
      ellipse(13,-22,1.45,1.8,'#453b36');ellipse(13.4,-22.5,.45,.55,'#fffdf6');
      ellipse(17,-18,2.1,1.35,'#efb3b6');ellipse(20,-21,1.45,1.1,'#ca7889');
      ctx.strokeStyle='#795c55';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(19,-20);ctx.quadraticCurveTo(18,-17,16,-17);ctx.moveTo(19,-19);ctx.quadraticCurveTo(21,-16,23,-18);ctx.moveTo(20,-19);ctx.lineTo(25,-20);ctx.moveTo(20,-17);ctx.lineTo(24,-16);ctx.stroke();
      ctx.restore();
    }
  }
  // Draw the detailed, unchanging garden once; only the character, butterflies, and rabbits animate.
  const screenCtx=ctx;
  const worldArt=document.createElement('canvas');worldArt.width=world.w;worldArt.height=world.h;
  ctx=worldArt.getContext('2d');drawGround();drawGardenGates();drawFlowers();drawHouses();drawBench();ctx=screenCtx;
  function drawPlayer(){
    const {x,y}=player;
    const side=player.facing==='left'?-1:player.facing==='right'?1:0;
    const bob=player.step?Math.sin(player.step*Math.PI/4)*1.2:0;
    ctx.save();ctx.translate(x,y);ctx.scale(1.02,1.34);ctx.translate(-x,-y);
    ellipse(x,y+2,14,4.5,'#526e4d66');
    // Loose, light shalwar gathers softly at the ankles.
    ctx.fillStyle='#f4ead9';ctx.strokeStyle='#c8b79d';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x-6,y-20+bob);ctx.quadraticCurveTo(x,y-23,x+6,y-20-bob);ctx.lineTo(x+7,y-4-bob);ctx.quadraticCurveTo(x+4,y-2,x+1,y-7);ctx.quadraticCurveTo(x-2,y-2,x-7,y-4+bob);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#c49c81';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(x-4,y-16+bob);ctx.lineTo(x-4,y-7);ctx.moveTo(x+4,y-16-bob);ctx.lineTo(x+4,y-7);ctx.stroke();
    ellipse(x-5-(player.step?1:0),y,3.5,1.8,'#785d4d');ellipse(x+5+(player.step?1:0),y,3.5,1.8,'#785d4d');
    ellipse(x-5-(player.step?1:0),y-.5,2.8,1.45,'#f1e7d8');ellipse(x+5+(player.step?1:0),y-.5,2.8,1.45,'#f1e7d8');
    // Maroon kurta sleeves and hands.
    ctx.fillStyle='#7787aa';ctx.strokeStyle='#4f5d7d';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x-6,y-36);ctx.quadraticCurveTo(x-10,y-35,x-11,y-29+bob);ctx.lineTo(x-12,y-17+bob);ctx.quadraticCurveTo(x-11,y-15+bob,x-9,y-16+bob);ctx.lineTo(x-7,y-28);ctx.closePath();ctx.moveTo(x+6,y-36);ctx.quadraticCurveTo(x+10,y-35,x+11,y-29-bob);ctx.lineTo(x+12,y-17-bob);ctx.quadraticCurveTo(x+11,y-15-bob,x+9,y-16-bob);ctx.lineTo(x+7,y-28);ctx.closePath();ctx.fill();ctx.stroke();
    ellipse(x-10.5,y-15+bob,1.7,2,'#f2d9c4');ellipse(x+10.5,y-15-bob,1.7,2,'#f2d9c4');
    // Long maroon kurta with fine warm-gold embroidery.
    ctx.fillStyle='#7787aa';ctx.strokeStyle='#4f5d7d';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-7,y-36);ctx.quadraticCurveTo(x,y-39,x+7,y-36);ctx.lineTo(x+9,y-7);ctx.quadraticCurveTo(x,y-5,x-9,y-7);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#a9b5ce';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x-6,y-11);ctx.quadraticCurveTo(x-3,y-14,x-5,y-17);ctx.moveTo(x+4,y-10);ctx.quadraticCurveTo(x+2,y-14,x+5,y-17);ctx.stroke();
    ellipse(x-5,y-14,1,1,'#aab6ce');ellipse(x-4,y-17,1,1,'#aab6ce');ellipse(x+4,y-13,1,1,'#aab6ce');
    // Fine floral embroidery on the muted blue kurta.
    ctx.strokeStyle='#e7c98f';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x,y-34);ctx.lineTo(x,y-24);ctx.moveTo(x-2,y-31);ctx.lineTo(x,y-33);ctx.lineTo(x+2,y-31);ctx.moveTo(x-2,y-28);ctx.lineTo(x,y-30);ctx.lineTo(x+2,y-28);ctx.stroke();
    ellipse(x,y-25,.65,.65,'#f0d69e');
    // A close-fitting hijab frames her face, then folds over her shoulders.
    const hijab=ctx.createLinearGradient(x-8,y-43,x+9,y-17);hijab.addColorStop(0,'#c65d85');hijab.addColorStop(.48,'#ad4d83');hijab.addColorStop(1,'#853f76');
    ctx.fillStyle=hijab;ctx.strokeStyle='#785d87';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x-5.5,y-38);ctx.quadraticCurveTo(x,y-46,x+5.5,y-38);ctx.quadraticCurveTo(x+9.5,y-33,x+8.5,y-27);ctx.quadraticCurveTo(x+8,y-21,x+5,y-20);ctx.quadraticCurveTo(x,y-18,x-5,y-20);ctx.quadraticCurveTo(x-8.5,y-23,x-8.5,y-29);ctx.quadraticCurveTo(x-9.5,y-34,x-5.5,y-38);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#e89bb5';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x-5,y-36);ctx.quadraticCurveTo(x-1,y-33,x-2.5,y-26);ctx.stroke();
    if(player.facing!=='up'){
      ctx.save();ctx.translate(x,y-31);ctx.scale(.9,.9);ctx.translate(-x,-(y-31));
      const skin=ctx.createRadialGradient(x-2,y-35,.6,x,y-30,9);skin.addColorStop(0,'#fff0df');skin.addColorStop(.68,'#f7d8c5');skin.addColorStop(1,'#efc4b4');
      ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(x,y-31,5.4,7,0,0,Math.PI*2);ctx.fill();
      // Warm, bright eyes, soft blush, and a little smile give her a kinder anime expression.
      ellipse(x-2+side*.35,y-31,1.55,1.95,'#fffaf1');ellipse(x+2+side*.35,y-31,1.55,1.95,'#fffaf1');
      ellipse(x-2+side*.45,y-30.8,1.1,1.6,'#805847');ellipse(x+2+side*.45,y-30.8,1.1,1.6,'#805847');
      ellipse(x-2+side*.45,y-30.5,.76,1.2,'#342d35');ellipse(x+2+side*.45,y-30.5,.76,1.2,'#342d35');
      ellipse(x-2.25+side*.45,y-31.35,.43,.5,'#fffdf5');ellipse(x+1.75+side*.45,y-31.35,.43,.5,'#fffdf5');
      ellipse(x-1.6+side*.45,y-29.7,.2,.24,'#f6b5a9');ellipse(x+2.4+side*.45,y-29.7,.2,.24,'#f6b5a9');
      ctx.strokeStyle='#503d3a';ctx.lineWidth=.62;ctx.beginPath();ctx.moveTo(x-3.7+side*.3,y-32);ctx.quadraticCurveTo(x-2+side*.3,y-33.5,x-.35+side*.3,y-32.2);ctx.moveTo(x+.35+side*.3,y-32.2);ctx.quadraticCurveTo(x+2+side*.3,y-33.5,x+3.7+side*.3,y-32);ctx.stroke();
      ctx.strokeStyle='#503d3a';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(x-3.3,y-32);ctx.lineTo(x-3.9,y-32.6);ctx.moveTo(x-2.8,y-32.2);ctx.lineTo(x-3.1,y-32.9);ctx.moveTo(x+3.3,y-32);ctx.lineTo(x+3.9,y-32.6);ctx.moveTo(x+2.8,y-32.2);ctx.lineTo(x+3.1,y-32.9);ctx.stroke();
      const blush=ctx.createRadialGradient(x-4,y-29,0,x-4,y-29,1.8);blush.addColorStop(0,'#e9879d99');blush.addColorStop(1,'#e9879d00');ctx.fillStyle=blush;ctx.beginPath();ctx.ellipse(x-4,y-29,1.5,.8,0,0,Math.PI*2);ctx.fill();
      const blushRight=ctx.createRadialGradient(x+4,y-29,0,x+4,y-29,1.8);blushRight.addColorStop(0,'#e9879d99');blushRight.addColorStop(1,'#e9879d00');ctx.fillStyle=blushRight;ctx.beginPath();ctx.ellipse(x+4,y-29,1.5,.8,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#d18d80';ctx.beginPath();ctx.moveTo(x,y-30);ctx.lineTo(x-.38,y-28.7);ctx.lineTo(x+.4,y-28.7);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#c63850';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(x-1.25,y-27.2);ctx.quadraticCurveTo(x,y-26.25,x+1.25,y-27.2);ctx.stroke();
      ctx.restore();
    }
    // Folded scarf layers tuck neatly under the chin and fall over the jacket.
    const wrap=ctx.createLinearGradient(x-7,y-25,x+7,y-17);wrap.addColorStop(0,'#bc5680');wrap.addColorStop(1,'#934273');
    ctx.fillStyle=wrap;ctx.strokeStyle='#785d87';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-6.5,y-25);ctx.quadraticCurveTo(x,y-21,x+6.5,y-25);ctx.quadraticCurveTo(x+8.5,y-22,x+5.5,y-19);ctx.quadraticCurveTo(x,y-16,x-5.5,y-19);ctx.quadraticCurveTo(x-8.5,y-22,x-6.5,y-25);ctx.closePath();ctx.fill();ctx.stroke();
    const tail=ctx.createLinearGradient(x+1,y-21,x+9,y-7);tail.addColorStop(0,'#a64779');tail.addColorStop(1,'#cf6489');
    ctx.fillStyle=tail;ctx.beginPath();ctx.moveTo(x+4.5,y-21);ctx.quadraticCurveTo(x+9,y-19,x+7.5,y-13);ctx.lineTo(x+6,y-7);ctx.quadraticCurveTo(x+3.5,y-6,x+3,y-9);ctx.quadraticCurveTo(x+4.5,y-16,x+1,y-19);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#e89bb5';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x-5.5,y-23);ctx.quadraticCurveTo(x,y-20,x+5,y-23);ctx.moveTo(x+6,y-18);ctx.quadraticCurveTo(x+4.5,y-14,x+5.5,y-10);ctx.stroke();
    if(player.facing==='up')ellipse(x,y-32,1.6,1.6,'#f0d294');
    ctx.restore();
  }
  function drawMissionCircle(marker,time){
    const {x,y,radius:r}=marker,pulse=(Math.sin(time*.003+marker.id)+1)/2;
    ctx.save();ctx.translate(x,y);
    // GTA-like ground marker: a luminous disc, segmented ring, and floating mission tag.
    ctx.globalAlpha=.12+pulse*.08;ctx.fillStyle=marker.color;ctx.beginPath();ctx.ellipse(0,0,r*.9,r*.48,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.globalAlpha=.72+pulse*.25;ctx.strokeStyle=marker.color;ctx.lineWidth=5;ctx.setLineDash([18,10]);ctx.lineDashOffset=-time*.018;ctx.beginPath();ctx.ellipse(0,0,r,r*.55,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=.22+pulse*.18;ctx.strokeStyle=marker.color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r*(.72+pulse*.08),r*(.4+pulse*.045),0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    ctx.restore();
  }
  function render(time=0){
    const dt=Math.min((time-lastTime)/16.67||1,2);lastTime=time;
    let dx=0,dy=0;if(gameStarted&&!activeMission&&surpriseModal.hidden){if(held.has('left'))dx--;if(held.has('right'))dx++;if(held.has('up'))dy--;if(held.has('down'))dy++}
    let walked=false;
    if(dx||dy){const length=Math.hypot(dx,dy),stepX=dx/length*player.speed*dt,stepY=dy/length*player.speed*dt;
      if(canWalk(player.x,player.y,player.x+stepX,player.y)){player.x+=stepX;walked=true}
      if(canWalk(player.x,player.y,player.x,player.y+stepY)){player.y+=stepY;walked=true}
      player.facing=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');player.step=walked?(player.step+dt)%8:0;
    }else player.step=0;
    player.x=Math.max(35,Math.min(world.w-35,player.x));player.y=Math.max(40,Math.min(world.h-20,player.y));
    if(!cameraDragged){camera.x=Math.max(0,Math.min(world.w-width/world.scale,player.x-width/(2*world.scale)));camera.y=Math.max(0,Math.min(world.h-height/world.scale,player.y-height/(2*world.scale)))}
    else{camera.x=Math.max(0,Math.min(world.w-width/world.scale,camera.x));camera.y=Math.max(0,Math.min(world.h-height/world.scale,camera.y))}
    updateMissionTriggers();updateCollectiblePrompt();
    ctx.clearRect(0,0,width,height);ctx.save();ctx.scale(world.scale,world.scale);ctx.translate(-camera.x,-camera.y);ctx.drawImage(worldArt,0,0);
    missionCircles.filter(marker=>!missionCircleComplete(marker.id)).forEach(marker=>drawMissionCircle(marker,time));trees.filter(t=>t.y<player.y&&treeClear(t.x,t.y)).forEach(drawTree);drawCollectibles(time);drawButterflies(time);drawRabbits(time);drawPlayer();
    trees.filter(t=>t.y>=player.y&&treeClear(t.x,t.y)).forEach(drawTree);ctx.restore();requestAnimationFrame(render)
  }
  const keyMap={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right',W:'up',S:'down',A:'left',D:'right'};
  window.addEventListener('keydown',e=>{const dir=keyMap[e.key];if(dir){e.preventDefault();if(gameStarted&&!activeMission&&surpriseModal.hidden){cameraDragged=false;held.add(dir)}}});window.addEventListener('keyup',e=>{const dir=keyMap[e.key];if(dir)held.delete(dir)});window.addEventListener('blur',()=>held.clear());
  if(dragToPan){
    canvas.style.cursor='grab';
    canvas.addEventListener('pointerdown',e=>{e.preventDefault();activePan={id:e.pointerId,x:e.clientX,y:e.clientY,cameraX:camera.x,cameraY:camera.y};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing'});
    canvas.addEventListener('pointermove',e=>{if(!activePan||activePan.id!==e.pointerId)return;cameraDragged=true;camera.x=activePan.cameraX-(e.clientX-activePan.x)/world.scale;camera.y=activePan.cameraY-(e.clientY-activePan.y)/world.scale});
    const stopPan=e=>{if(activePan&&activePan.id===e.pointerId){activePan=null;canvas.style.cursor='grab'}};
    canvas.addEventListener('pointerup',stopPan);canvas.addEventListener('pointercancel',stopPan);canvas.addEventListener('lostpointercapture',stopPan);
  }
  document.querySelectorAll('.move').forEach(btn=>{const dir=btn.dataset.dir;const release=()=>{held.delete(dir);btn.classList.remove('pressed')};btn.addEventListener('pointerdown',e=>{e.preventDefault();if(!gameStarted||activeMission||!surpriseModal.hidden)return;cameraDragged=false;held.add(dir);btn.classList.add('pressed');btn.setPointerCapture(e.pointerId)});btn.addEventListener('pointerup',release);btn.addEventListener('pointercancel',release);btn.addEventListener('lostpointercapture',release);btn.addEventListener('contextmenu',e=>e.preventDefault())});
  new ResizeObserver(resize).observe(viewport);resize();requestAnimationFrame(render);
})();
