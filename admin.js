(async()=>{
  const status=document.querySelector('#save-status');
  const canvas=document.querySelector('#layout-map'),ctx=canvas.getContext('2d');
  const world={w:4200,h:2800};
  let layout,selected=null,dragging=null,width=0,height=0,dpr=1,scale=1,ox=0,oy=0;
  const xInput=document.querySelector('#position-x'),yInput=document.querySelector('#position-y'),sizeInput=document.querySelector('#object-size');
  const butterflyCountInput=document.querySelector('#butterfly-count');
  const rabbitCountInput=document.querySelector('#rabbit-count');
  const productNameInput=document.querySelector('#collectible-name'),productEmojiInput=document.querySelector('#collectible-emoji'),productWishInput=document.querySelector('#collectible-wish');
  const productNameRow=document.querySelector('#collectible-name-row'),productEmojiRow=document.querySelector('#collectible-emoji-row'),productWishRow=document.querySelector('#collectible-wish-row');
  const deleteButton=document.querySelector('#delete-object');
  const clone=data=>JSON.parse(JSON.stringify(data));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  try{
    const response=await fetch('./garden-layout.json');
    if(!response.ok)throw new Error('garden-layout.json could not be loaded. Start the local web server from the project folder.');
    layout=await response.json();
  }catch(error){status.textContent=error.message;status.classList.add('error');return}
  layout.butterflyCount=Math.max(0,Math.min(1000,Math.floor(Number(layout.butterflyCount??18))));
  butterflyCountInput.value=layout.butterflyCount;
  layout.rabbitCount=Math.max(0,Math.min(1000,Math.floor(Number(layout.rabbitCount??12))));
  rabbitCountInput.value=layout.rabbitCount;
  if(!Array.isArray(layout.collectibles))layout.collectibles=[];

  const spine=[{x:0,y:1400},{x:950,y:1320},{x:1700,y:1480},{x:2550,y:1320},{x:3300,y:1480},{x:4200,y:1400}];
  const branches=[
    [spine[1],{x:800,y:920},{x:1510,y:470},{x:1400,y:0}],
    [spine[2],{x:1810,y:1830},{x:1240,y:2350},{x:1400,y:2800}],
    [spine[3],{x:2730,y:930},{x:2500,y:460},{x:2800,y:0}],
    [spine[4],{x:3190,y:1840},{x:3000,y:2360},{x:2800,y:2800}]
  ];
  const topLink=[{x:1400,y:0},{x:1750,y:0},{x:2350,y:0},{x:2800,y:0}],bottomLink=[{x:1400,y:2800},{x:1750,y:2800},{x:2350,y:2800},{x:2800,y:2800}];
  function splineSamples(points,steps=32){
    const samples=[];
    for(let i=0;i<points.length-1;i++){
      const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
      const a={x:p1.x+(p2.x-p0.x)/6,y:p1.y+(p2.y-p0.y)/6},b={x:p2.x-(p3.x-p1.x)/6,y:p2.y-(p3.y-p1.y)/6};
      for(let j=0;j<steps;j++){const t=j/steps,u=1-t;samples.push({x:u*u*u*p1.x+3*u*u*t*a.x+3*u*t*t*b.x+t*t*t*p2.x,y:u*u*u*p1.y+3*u*u*t*a.y+3*u*t*t*b.y+t*t*t*p2.y})}
    }
    samples.push(points[points.length-1]);return samples;
  }
  const branchSamples=branches.map(points=>splineSamples(points));
  const gardenGates=[
    {cx:700,cy:650,branches:[0]},{cx:2100,cy:650,branches:[0,2]},
    {cx:3500,cy:650,branches:[2]},{cx:700,cy:2150,branches:[1]},
    {cx:2100,cy:2150,branches:[1,3]},{cx:3500,cy:2150,branches:[3]}
  ].map(g=>{
    const candidates=g.branches.flatMap(index=>branchSamples[index]);
    const edge=candidates.reduce((best,p)=>Math.hypot(p.x-g.cx,p.y-g.cy)<Math.hypot(best.x-g.cx,best.y-g.cy)?p:best,candidates[0]);
    const dx=g.cx-edge.x,dy=g.cy-edge.y,length=Math.hypot(dx,dy)||1;
    return{x:edge.x+dx/length*56,y:edge.y+dy/length*56,angle:Math.atan2(dy,dx)};
  });
  function trace(points){
    ctx.moveTo(points[0].x,points[0].y);
    for(let i=0;i<points.length-1;i++){
      const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
      ctx.bezierCurveTo(p1.x+(p2.x-p0.x)/6,p1.y+(p2.y-p0.y)/6,p2.x-(p3.x-p1.x)/6,p2.y-(p3.y-p1.y)/6,p2.x,p2.y);
    }
  }
  function roadLayer(color,lineWidth){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color;ctx.lineWidth=lineWidth;for(const pts of [spine,...branches,topLink,bottomLink]){ctx.beginPath();trace(pts);ctx.stroke()}ctx.restore()}
  function toScreen(x,y){return{x:ox+x*scale,y:oy+y*scale}}
  function toWorld(x,y){return{x:clamp((x-ox)/scale,0,world.w),y:clamp((y-oy)/scale,0,world.h)}}
  function draw(){
    ctx.clearRect(0,0,width,height);ctx.fillStyle='#a9ca83';ctx.fillRect(0,0,width,height);
    ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
    roadLayer('#76583e',148);roadLayer('#b99368',140);roadLayer('#d8c59d',124);roadLayer('#e9debd',110);roadLayer('#f1e8cf',94);
    ctx.restore();
    gardenGates.forEach(drawGate);
    for(const house of layout.houses)drawHouse(house);
    for(const bed of layout.flowerBeds||[])drawFlowerBed(bed);
    for(const tree of layout.trees)drawTree(tree);
    for(const item of layout.collectibles)drawCollectible(item);
    drawStart(layout.playerStart);
  }
  function isSelected(type,id){return selected&&selected.type===type&&selected.id===id}
  function drawHouse(house){
    const p=toScreen(house.x,house.y),is=isSelected('house',house.id),w=Math.max(35,142*scale),h=Math.max(28,112*scale);
    ctx.save();ctx.translate(p.x,p.y);
    ctx.fillStyle='#526d4966';ctx.beginPath();ctx.ellipse(2,7,w*.65,h*.55,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=is?'#f4c978':'#f1e2bd';ctx.strokeStyle=is?'#fff4bc':'#815743';ctx.lineWidth=is?3:2;
    ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,8);ctx.fill();ctx.stroke();
    ctx.fillStyle='#ae5548';ctx.beginPath();ctx.moveTo(-w*.46,-h*.12);ctx.lineTo(-w*.28,-h*.49);ctx.lineTo(w*.28,-h*.49);ctx.lineTo(w*.46,-h*.12);ctx.lineTo(0,h*.12);ctx.closePath();ctx.fill();
    ctx.fillStyle='#4c727b';ctx.beginPath();ctx.arc(0,-h*.14,Math.max(3,w*.1),0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  function drawGate(gate){
    const p=toScreen(gate.x,gate.y);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(gate.angle);
    ctx.fillStyle='#fff3d9';ctx.strokeStyle='#846344';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,0,16,11,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#b99a70';ctx.strokeStyle='#80694d';ctx.lineWidth=1.5;
    for(const side of [-1,1]){
      ctx.beginPath();ctx.roundRect(-5,side*9-4,10,8,2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#79583d';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,side*9);ctx.lineTo(8,side*15);ctx.stroke();
      ctx.strokeStyle='#80694d';ctx.lineWidth=1.5;
    }
    ctx.restore();
    ctx.fillStyle='#fff9e9';ctx.strokeStyle='#80694d';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  function drawTree(tree){
    const p=toScreen(tree.x,tree.y),r=Math.max(7,9*scale*tree.s+3),is=isSelected('tree',tree.id);
    ctx.save();ctx.fillStyle='#526d4966';ctx.beginPath();ctx.ellipse(p.x+1,p.y+3,r*1.25,r*.8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=is?'#ffd78a':'#739966';ctx.strokeStyle=is?'#fff4bc':'#496b4c';ctx.lineWidth=is?3:1.5;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#a8c987';ctx.beginPath();ctx.arc(p.x-r*.25,p.y-r*.25,r*.3,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  function drawCollectible(item){
    const p=toScreen(item.x,item.y),is=isSelected('collectible',item.id),r=Math.max(15,19*scale);
    ctx.save();ctx.fillStyle=is?'#fff0b8':'#fff9e8';ctx.strokeStyle=is?'#db8d79':'#bd9c69';ctx.lineWidth=is?3:2;
    ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.font=`${Math.max(15,23*scale)}px "Segoe UI Emoji",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(item.emoji||'🎁',p.x,p.y+1);
    ctx.restore();
  }
  function drawFlowerBed(bed){
    const p=toScreen(bed.x,bed.y),rx=Math.max(22,170*scale*bed.scale),ry=Math.max(14,82*scale*bed.scale),is=isSelected('flowerBed',bed.id);
    const palettes=[['#f3c8ce','#fff1d6','#e9aebc'],['#f4c7dc','#f2e7a6','#fff4dc'],['#e6c5e1','#fff4dc','#f5d3c9'],['#f0e79b','#f5d3c9','#d6dceb']],palette=palettes[bed.palette||0]||palettes[0];
    ctx.save();ctx.fillStyle='#688b5577';ctx.beginPath();ctx.ellipse(p.x,p.y+3,rx+3,ry+3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=is?'#a3bd7a':'#b6cc8c';ctx.strokeStyle=is?'#fff2b0':'#7e9a5e';ctx.lineWidth=is?3:2;
    ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    for(let row=-1;row<=1;row++)for(let col=-3;col<=3;col++){
      const fx=p.x+col*rx*.22+(row%2)*rx*.08,fy=p.y+row*ry*.43;
      if(((fx-p.x)/rx)**2+((fy-p.y)/ry)**2>.78)continue;
      ctx.fillStyle=palette[(row*3+col+8)%palette.length];ctx.beginPath();ctx.arc(fx,fy,Math.max(1.5,2.7*scale*bed.scale),0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function drawStart(start){
    const p=toScreen(start.x,start.y),is=selected&&selected.type==='start';
    ctx.save();ctx.fillStyle='#fff4bcaa';ctx.beginPath();ctx.arc(p.x,p.y,16,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=is?'#ffda87':'#d45482';ctx.strokeStyle='#fff8e8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff9e9';ctx.font='bold 11px system-ui,sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText('START',p.x+13,p.y);
    ctx.restore();
  }
  function resize(){
    const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    scale=Math.min((width-48)/world.w,(height-48)/world.h);ox=(width-world.w*scale)/2;oy=(height-world.h*scale)/2;draw();
  }
  function selectedObject(){
    if(!selected)return null;
    if(selected.type==='house')return layout.houses.find(h=>h.id===selected.id);
    if(selected.type==='tree')return layout.trees.find(t=>t.id===selected.id);
    if(selected.type==='flowerBed')return layout.flowerBeds.find(b=>b.id===selected.id);
    if(selected.type==='collectible')return layout.collectibles.find(item=>item.id===selected.id);
    return layout.playerStart;
  }
  function showSelection(){
    const obj=selectedObject(),name=document.querySelector('#selected-name'),sizeRow=document.querySelector('#object-size-row');
    const isCollectible=selected?.type==='collectible';
    productNameRow.hidden=productEmojiRow.hidden=productWishRow.hidden=!isCollectible;
    deleteButton.disabled=!selected||selected.type==='start';
    if(!obj){name.textContent='Nothing selected';xInput.value='';yInput.value='';xInput.disabled=yInput.disabled=sizeInput.disabled=true;sizeRow.hidden=true;productNameInput.value=productEmojiInput.value=productWishInput.value='';draw();return}
    name.textContent=selected.type==='house'?'House selected':selected.type==='tree'?'Tree selected':selected.type==='flowerBed'?'Flower bed selected':isCollectible?'Collectible selected':'Player starting position';
    xInput.disabled=yInput.disabled=false;xInput.value=Math.round(obj.x);yInput.value=Math.round(obj.y);
    const hasSize=selected.type==='tree'||selected.type==='flowerBed';sizeRow.hidden=!hasSize;sizeInput.disabled=!hasSize;
    if(selected.type==='tree')sizeInput.value=obj.s;if(selected.type==='flowerBed')sizeInput.value=obj.scale;
    productNameInput.value=isCollectible?obj.name||'':'';productEmojiInput.value=isCollectible?obj.emoji||'🎁':'';productWishInput.value=isCollectible?obj.wish||'':'';
    draw();
  }
  function markChanged(){status.textContent='Unsaved layout changes';status.classList.add('changed')}
  butterflyCountInput.addEventListener('input',()=>{
    const count=Math.max(0,Math.min(1000,Math.floor(Number(butterflyCountInput.value)||0)));
    layout.butterflyCount=count;markChanged();
  });
  rabbitCountInput.addEventListener('input',()=>{
    const count=Math.max(0,Math.min(1000,Math.floor(Number(rabbitCountInput.value)||0)));
    layout.rabbitCount=count;markChanged();
  });
  productNameInput.addEventListener('input',()=>{const item=selectedObject();if(selected?.type!=='collectible'||!item)return;item.name=productNameInput.value;markChanged()});
  productEmojiInput.addEventListener('input',()=>{const item=selectedObject();if(selected?.type!=='collectible'||!item)return;item.emoji=productEmojiInput.value||'🎁';draw();markChanged()});
  productWishInput.addEventListener('input',()=>{const item=selectedObject();if(selected?.type!=='collectible'||!item)return;item.wish=productWishInput.value;markChanged()});
  function setCoord(axis,value){const obj=selectedObject();if(!obj)return;obj[axis]=clamp(Number(value)||0,0,axis==='x'?world.w:world.h);draw();markChanged()}
  xInput.addEventListener('input',()=>setCoord('x',xInput.value));yInput.addEventListener('input',()=>setCoord('y',yInput.value));
  sizeInput.addEventListener('input',()=>{const obj=selectedObject();if(!obj||!['tree','flowerBed'].includes(selected?.type))return;const size=clamp(Number(sizeInput.value)||1,.5,2.5);if(selected.type==='tree')obj.s=size;else obj.scale=size;draw();markChanged()});

  function hitTest(sx,sy){
    const start=toScreen(layout.playerStart.x,layout.playerStart.y);if(Math.hypot(start.x-sx,start.y-sy)<22)return{type:'start',id:'start'};
    for(let i=layout.collectibles.length-1;i>=0;i--){const item=layout.collectibles[i],p=toScreen(item.x,item.y);if(Math.hypot(p.x-sx,p.y-sy)<Math.max(19,24*scale))return{type:'collectible',id:item.id}}
    for(let i=layout.flowerBeds.length-1;i>=0;i--){const b=layout.flowerBeds[i],p=toScreen(b.x,b.y),rx=Math.max(22,170*scale*b.scale),ry=Math.max(14,82*scale*b.scale);if(((sx-p.x)/rx)**2+((sy-p.y)/ry)**2<1.25)return{type:'flowerBed',id:b.id}}
    for(let i=layout.houses.length-1;i>=0;i--){const h=layout.houses[i],p=toScreen(h.x,h.y);if(Math.abs(p.x-sx)<Math.max(28,74*scale)&&Math.abs(p.y-sy)<Math.max(24,62*scale))return{type:'house',id:h.id}}
    for(let i=layout.trees.length-1;i>=0;i--){const t=layout.trees[i],p=toScreen(t.x,t.y);if(Math.hypot(p.x-sx,p.y-sy)<Math.max(12,16*scale))return{type:'tree',id:t.id}}
    return null;
  }
  canvas.addEventListener('pointerdown',event=>{
    const rect=canvas.getBoundingClientRect(),sx=event.clientX-rect.left,sy=event.clientY-rect.top;
    selected=hitTest(sx,sy);showSelection();dragging=selected;
    if(dragging){canvas.classList.add('dragging');canvas.setPointerCapture(event.pointerId)}
  });
  canvas.addEventListener('pointermove',event=>{
    if(!dragging)return;
    const rect=canvas.getBoundingClientRect(),pos=toWorld(event.clientX-rect.left,event.clientY-rect.top),obj=selectedObject();
    if(!obj)return;obj.x=Math.round(pos.x);obj.y=Math.round(pos.y);xInput.value=obj.x;yInput.value=obj.y;draw();markChanged();
  });
  function stopDrag(){dragging=null;canvas.classList.remove('dragging')}
  canvas.addEventListener('pointerup',stopDrag);canvas.addEventListener('pointercancel',stopDrag);canvas.addEventListener('lostpointercapture',stopDrag);

  document.querySelector('#add-tree').addEventListener('click',()=>{
    const id=Math.max(0,...layout.trees.map(tree=>Number(tree.id)||0))+1;
    const tree={id,x:Math.round(world.w/2),y:Math.round(world.h/2),s:.9};layout.trees.push(tree);selected={type:'tree',id};showSelection();markChanged();
  });
  document.querySelector('#add-house').addEventListener('click',()=>{
    const id=Math.max(0,...layout.houses.map(h=>Number(h.id)||0))+1;
    const house={id,x:Math.round(world.w/2),y:Math.round(world.h/2)};layout.houses.push(house);selected={type:'house',id};showSelection();markChanged();
  });
  document.querySelector('#add-flower-bed').addEventListener('click',()=>{
    if(!layout.flowerBeds)layout.flowerBeds=[];
    const id=Math.max(0,...layout.flowerBeds.map(b=>Number(b.id)||0))+1;
    const bed={id,x:Math.round(world.w/2),y:Math.round(world.h/2),scale:1.08,palette:id%4};layout.flowerBeds.push(bed);selected={type:'flowerBed',id};showSelection();markChanged();
  });
  document.querySelector('#add-collectible').addEventListener('click',()=>{
    const id=Math.max(0,...layout.collectibles.map(item=>Number(item.id)||0))+1;
    const item={id,x:Math.round(world.w/2),y:Math.round(world.h/2),emoji:'🎁',name:'New surprise',wish:'Add a birthday wish here.'};
    layout.collectibles.push(item);selected={type:'collectible',id};showSelection();markChanged();productNameInput.focus();
  });
  deleteButton.addEventListener('click',()=>{
    if(!selected||selected.type==='start')return;
    if(selected.type==='house')layout.houses=layout.houses.filter(h=>h.id!==selected.id);
    else if(selected.type==='tree')layout.trees=layout.trees.filter(t=>t.id!==selected.id);
    else if(selected.type==='flowerBed')layout.flowerBeds=layout.flowerBeds.filter(b=>b.id!==selected.id);
    else layout.collectibles=layout.collectibles.filter(item=>item.id!==selected.id);
    selected=null;showSelection();markChanged();
  });
  document.querySelector('#save-layout').addEventListener('click',async()=>{
    const json=JSON.stringify(layout,null,2)+'\n';
    try{
      if(window.showSaveFilePicker){
        const handle=await window.showSaveFilePicker({suggestedName:'garden-layout.json',types:[{description:'Garden layout JSON',accept:{'application/json':['.json']}}]});
        const writer=await handle.createWritable();await writer.write(json);await writer.close();
      }else{
        const url=URL.createObjectURL(new Blob([json],{type:'application/json'})),link=document.createElement('a');
        link.href=url;link.download='garden-layout.json';link.click();URL.revokeObjectURL(url);
      }
      status.textContent='Saved. Refresh the garden to see the new layout.';status.classList.remove('changed','error');
    }catch(error){if(error.name==='AbortError')status.textContent='Save cancelled.';else{status.textContent=`Could not save: ${error.message}`;status.classList.add('error')}}
  });
  new ResizeObserver(resize).observe(canvas);resize();
})();
