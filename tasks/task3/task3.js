(function(){
  window.startHeartShotTask=function(host,options={}){
    const config=options.config||{},root=document.createElement('main');root.className='shot-shell';root.setAttribute('aria-label','Heart shot sling game');
    root.innerHTML='<header class="shot-header"><button type="button" class="shot-back"><span aria-hidden="true">&larr;</span> Garden</button><span class="shot-count">Hearts sent: <b>0</b></span></header><h1 class="shot-title">Love Finds a Way</h1><p class="shot-help"><strong>Drag the arrow to aim, then release to launch.</strong></p><div class="shot-board"><canvas class="shot-canvas" aria-label="Aim and shoot a heart through the garden to the boy avatar."></canvas></div><p class="shot-status" role="status" aria-live="polite"></p>';
    host.replaceChildren(root);root.querySelector('.shot-back').addEventListener('click',()=>{cancelAnimationFrame(raf);options.onBack?.()});
    const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),board=root.querySelector('.shot-board'),count=root.querySelector('.shot-count b'),status=root.querySelector('.shot-status');
    let w=0,h=0,dpr=1,raf=0,shots=0,won=false,heart=null,dragging=false,pull={x:70,y:0},aim={x:70,y:0},launchAngle=-Math.PI/4,target={x:0,y:0},obstacles=[],last=0;
    const resize=()=>{const r=canvas.getBoundingClientRect();dpr=Math.min(2,devicePixelRatio||1);w=r.width;h=r.height;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);aim.y=h-76;pull={x:aim.x-22,y:aim.y+22};target={x:w-62,y:54};obstacles=[{x:w*.28,y:h*.68,r:32},{x:w*.43,y:h*.43,r:27},{x:w*.60,y:h*.62,r:34},{x:w*.72,y:h*.34,r:25},{x:w*.84,y:h*.64,r:30},{x:w*.51,y:h*.84,r:22}];draw()};
    function draw(){ctx.clearRect(0,0,w,h);const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#b9dfe0');sky.addColorStop(.56,'#e7eee0');sky.addColorStop(1,'#f3e3d4');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);ctx.fillStyle='#ffffffaa';[[w*.16,h*.17],[w*.46,h*.28],[w*.82,h*.16]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,12,0,7);ctx.arc(x+13,y-5,16,0,7);ctx.arc(x+29,y,11,0,7);ctx.fill()});ctx.fillStyle='#a9cba455';ctx.beginPath();ctx.moveTo(0,h*.68);ctx.quadraticCurveTo(w*.22,h*.56,w*.43,h*.69);ctx.quadraticCurveTo(w*.71,h*.55,w,h*.67);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();ctx.fillStyle='#8fb77c44';ctx.beginPath();ctx.moveTo(0,h*.77);ctx.quadraticCurveTo(w*.21,h*.68,w*.48,h*.78);ctx.quadraticCurveTo(w*.78,h*.66,w,h*.77);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();for(let i=0;i<18;i++){const x=(i*79+23)%Math.max(1,w),y=h*.84+(i%3)*10;ctx.strokeStyle='#719c6b88';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y+4);ctx.lineTo(x-2,y-3);ctx.stroke();ctx.fillStyle=i%2?'#df9ba188':'#fff1d288';ctx.beginPath();ctx.arc(x-2,y-5,2.7,0,7);ctx.fill()}
      if(!heart){const dx=aim.x-pull.x,dy=aim.y-pull.y,distance=Math.hypot(dx,dy),unit=Math.max(distance,16),speed=Math.min(unit,105)*6.2,vx=dx/unit*speed,vy=dy/unit*speed;ctx.fillStyle='#d65f7c88';for(let i=1;i<=24;i++){const t=i*.045,x=aim.x+Math.cos(launchAngle)*25+vx*t,y=aim.y+Math.sin(launchAngle)*25+vy*t+260*t*t;if(x>w-10||y>h*.79)break;ctx.globalAlpha=.68-i*.018;ctx.beginPath();ctx.arc(x,y,Math.max(1.5,4-i*.08),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
      // Simple polished recurve bow, rotated with the aimed arrow.
      const bowAngle=-Math.PI/4;
      const wood=ctx.createLinearGradient(-13,0,13,0);wood.addColorStop(0,'#70452e');wood.addColorStop(.35,'#c28a50');wood.addColorStop(.55,'#f0ce8b');wood.addColorStop(1,'#75452c');
      ctx.save();ctx.translate(aim.x,aim.y);ctx.rotate(bowAngle);
      ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#70452f';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(0,-49);ctx.quadraticCurveTo(34,-29,25,0);ctx.quadraticCurveTo(34,29,0,49);ctx.stroke();
      ctx.strokeStyle=wood;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,-49);ctx.quadraticCurveTo(30,-27,21,0);ctx.quadraticCurveTo(30,27,0,49);ctx.stroke();
      ctx.strokeStyle='#f6dfaa';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-47);ctx.quadraticCurveTo(27,-26,18,0);ctx.quadraticCurveTo(27,26,0,47);ctx.stroke();
      ctx.strokeStyle='#72503a';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,-49);ctx.lineTo(dragging?pull.x-aim.x:-Math.cos(launchAngle)*22,dragging?pull.y-aim.y:-Math.sin(launchAngle)*22);ctx.lineTo(0,49);ctx.stroke();
      ctx.strokeStyle='#f1d294';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(8,-10);ctx.lineTo(15,10);ctx.stroke();ctx.restore();
      if(!heart){const dx=dragging?aim.x-pull.x:Math.cos(launchAngle),dy=dragging?aim.y-pull.y:Math.sin(launchAngle),mag=Math.hypot(dx,dy)||1,ux=dx/mag,uy=dy/mag,shaft=dragging?Math.min(75,mag+28):54,ex=aim.x+ux*shaft,ey=aim.y+uy*shaft;ctx.strokeStyle='#53694f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(aim.x,aim.y);ctx.lineTo(ex,ey);ctx.stroke();ctx.fillStyle='#53694f';ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex-ux*13-uy*6,ey-uy*13+ux*6);ctx.lineTo(ex-ux*13+uy*6,ey-uy*13-ux*6);ctx.fill();ctx.fillStyle='#d6868a';ctx.beginPath();ctx.moveTo(ex-ux*23-uy*6,ey-uy*23+ux*6);ctx.lineTo(ex-ux*23+uy*6,ey-uy*23-ux*6);ctx.lineTo(ex-ux*34,ey-uy*34);ctx.fill()}
      obstacles.forEach((o,i)=>{ctx.fillStyle=['#e8ab72','#8fb779','#d88ca0','#83b8b1'][i%4];ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff9e8';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#ffffff66';ctx.beginPath();ctx.arc(o.x-o.r*.3,o.y-o.r*.35,o.r*.23,0,Math.PI*2);ctx.fill()});
      drawBoy(target.x,target.y);if(heart)drawHeart(heart.x,heart.y,15);else drawHeart(aim.x,aim.y,15);
      ctx.fillStyle='#53694f';ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.fillText('♡',70,h-20);
    }
    function drawBoy(x,y){
      ctx.save();ctx.translate(x,y);
      const halo=ctx.createRadialGradient(0,0,12,0,0,49);halo.addColorStop(0,'#fff9eacc');halo.addColorStop(1,'#fff9e900');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,49,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#34433d55';ctx.beginPath();ctx.ellipse(0,45,22,6,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#45627a';ctx.beginPath();ctx.roundRect(-11,25,9,18,5);ctx.roundRect(2,25,9,18,5);ctx.fill();
      ctx.fillStyle='#f5eee0';ctx.beginPath();ctx.ellipse(-7,45,8,4,-.08,0,Math.PI*2);ctx.ellipse(8,45,8,4,.08,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#38546b';ctx.beginPath();ctx.roundRect(-16,7,32,27,10);ctx.fill();
      ctx.fillStyle='#f4c69f';ctx.lineCap='round';ctx.lineWidth=6;ctx.strokeStyle='#f4c69f';ctx.beginPath();ctx.moveTo(-12,13);ctx.lineTo(-20,27);ctx.moveTo(12,13);ctx.lineTo(19,24);ctx.stroke();ctx.beginPath();ctx.arc(-20,28,3.5,0,7);ctx.arc(19,25,3.5,0,7);ctx.fill();
      const coat=ctx.createLinearGradient(-15,7,16,34);coat.addColorStop(0,'#79a5a0');coat.addColorStop(.48,'#477b80');coat.addColorStop(1,'#315c6b');ctx.fillStyle=coat;ctx.beginPath();ctx.moveTo(-14,9);ctx.quadraticCurveTo(-17,11,-16,19);ctx.lineTo(-13,33);ctx.quadraticCurveTo(0,38,13,33);ctx.lineTo(16,18);ctx.quadraticCurveTo(17,10,13,9);ctx.lineTo(7,6);ctx.lineTo(-7,6);ctx.closePath();ctx.fill();
      ctx.fillStyle='#f7ead5';ctx.beginPath();ctx.moveTo(-7,7);ctx.lineTo(0,16);ctx.lineTo(7,7);ctx.lineTo(3,25);ctx.lineTo(0,22);ctx.lineTo(-3,25);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#d8eee2';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-3,13);ctx.lineTo(-2,19);ctx.moveTo(3,13);ctx.lineTo(2,19);ctx.stroke();ctx.fillStyle='#426e70';ctx.beginPath();ctx.roundRect(-6,23,12,7,3);ctx.fill();
      ctx.fillStyle='#eab991';ctx.beginPath();ctx.roundRect(-5,-1,10,12,4);ctx.fill();
      ctx.fillStyle='#f7ceb0';ctx.beginPath();ctx.ellipse(0,-13,18,21,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#d99678';ctx.beginPath();ctx.ellipse(-15,-12,3.5,5,0,0,Math.PI*2);ctx.ellipse(15,-12,3.5,5,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#3b302e';ctx.beginPath();ctx.moveTo(-17,-16);ctx.quadraticCurveTo(-19,-30,-5,-33);ctx.quadraticCurveTo(8,-35,16,-25);ctx.quadraticCurveTo(20,-20,17,-14);ctx.quadraticCurveTo(12,-19,8,-21);ctx.quadraticCurveTo(5,-14,0,-18);ctx.quadraticCurveTo(-5,-22,-10,-15);ctx.quadraticCurveTo(-13,-12,-17,-16);ctx.closePath();ctx.fill();
      ctx.fillStyle='#533c34';ctx.beginPath();ctx.ellipse(-5.5,-12,2.5,3.2,0,0,Math.PI*2);ctx.ellipse(5.5,-12,2.5,3.2,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-6.1,-13.2,.85,0,7);ctx.arc(4.9,-13.2,.85,0,7);ctx.fill();
      ctx.fillStyle='#d99b7d';ctx.beginPath();ctx.arc(0,-7,1.1,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#72504a';ctx.lineWidth=1;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-8,-17);ctx.quadraticCurveTo(-5,-18,-2,-17);ctx.moveTo(2,-17);ctx.quadraticCurveTo(5,-18,8,-17);ctx.stroke();
      ctx.strokeStyle='#b96e62';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-4,-3);ctx.quadraticCurveTo(0,2,4,-3);ctx.stroke();
      ctx.fillStyle='#e9908c44';ctx.beginPath();ctx.ellipse(-11,-5,3.7,2,0,0,7);ctx.ellipse(11,-5,3.7,2,0,0,7);ctx.fill();
      ctx.restore();
    }
    function drawHeart(x,y,size){ctx.save();ctx.translate(x,y);ctx.scale(size/16,size/16);ctx.fillStyle='#e65375';ctx.beginPath();ctx.moveTo(0,13);ctx.bezierCurveTo(-4,9,-14,2,-14,-5);ctx.bezierCurveTo(-14,-14,-3,-15,0,-7);ctx.bezierCurveTo(4,-15,14,-14,14,-5);ctx.bezierCurveTo(14,2,4,10,0,13);ctx.fill();ctx.restore()}
    function launch(){const distance=Math.hypot(aim.x-pull.x,aim.y-pull.y);if(won||heart||distance<9){pull={x:aim.x-Math.cos(launchAngle)*22,y:aim.y-Math.sin(launchAngle)*22};draw();return}shots++;count.textContent=shots;const power=Math.min(distance,105)*6.2,angle=launchAngle;heart={x:aim.x+Math.cos(angle)*25,y:aim.y+Math.sin(angle)*25,vx:Math.cos(angle)*power,vy:Math.sin(angle)*power,r:13};pull={x:aim.x-Math.cos(angle)*22,y:aim.y-Math.sin(angle)*22};status.textContent='A little bounce can change your direction—keep trying!';last=performance.now();tick(last)}
    function tick(now){if(!heart||won||!host.contains(root))return;const dt=Math.min(.025,(now-last)/1000);last=now;heart.vy+=520*dt;heart.x+=heart.vx*dt;heart.y+=heart.vy*dt;
      if(heart.x<heart.r){heart.x=heart.r;heart.vx=Math.abs(heart.vx)*.78}if(heart.y<heart.r){heart.y=heart.r;heart.vy=Math.abs(heart.vy)*.78}if(heart.y>h-heart.r-20){heart.y=h-heart.r-20;heart.vy=-Math.abs(heart.vy)*.72;heart.vx*=.84}
      obstacles.forEach(o=>{const dx=heart.x-o.x,dy=heart.y-o.y,dist=Math.hypot(dx,dy),min=o.r+heart.r;if(dist<min){const nx=dx/(dist||1),ny=dy/(dist||1),dot=heart.vx*nx+heart.vy*ny;if(dot<0){heart.vx=(heart.vx-2*dot*nx)*.84;heart.vy=(heart.vy-2*dot*ny)*.84}heart.x=o.x+nx*(min+1);heart.y=o.y+ny*(min+1)}});
      if(Math.hypot(heart.x-target.x,heart.y-(target.y+12))<30){won=true;heart=null;draw();status.textContent='Your heart made it through every turn!';options.onComplete?.({taskName:config.name||'A Heart Finds Its Way',message:config.successMessage});return}
      draw();if(heart.x>w+40||heart.y>h+40||Math.hypot(heart.vx,heart.vy)<32){heart=null;draw();status.textContent='That heart found another way around. Pull back and try again!';return}raf=requestAnimationFrame(tick)}
    function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
    canvas.addEventListener('pointerdown',e=>{if(won||heart)return;const p=point(e);if(Math.hypot(p.x-aim.x,p.y-aim.y)<72){dragging=true;pull=p;canvas.setPointerCapture(e.pointerId);draw()}});
    canvas.addEventListener('pointermove',e=>{if(!dragging)return;const p=point(e),dx=aim.x-p.x,dy=aim.y-p.y,d=Math.hypot(dx,dy),limit=110,scale=d>limit?limit/d:1;pull={x:aim.x-dx*scale,y:aim.y-dy*scale};if(d>9)launchAngle=Math.atan2(dy,dx);draw()});
    canvas.addEventListener('pointerup',()=>{if(!dragging)return;dragging=false;launch()});canvas.addEventListener('pointercancel',()=>{dragging=false;pull={x:aim.x-Math.cos(launchAngle)*22,y:aim.y-Math.sin(launchAngle)*22};draw()});
    const ro=new ResizeObserver(resize);ro.observe(board);resize();
  };
})();
