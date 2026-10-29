(function(){
  window.startTwoOfUsTask=async function(host,options={}){
    const config=options.config||{},femaleName=String(config.femaleName||'Her'),maleName=String(config.maleName||'Him'),durationSeconds=Math.max(1,Math.floor(Number(config.durationSeconds)||60)),root=document.createElement('main');root.className='two-shell';root.setAttribute('aria-label','Two of Us cooperative survival game');
    root.innerHTML=`<header class="two-header"><button class="two-back" type="button">← Garden</button><div class="two-clock" role="timer" aria-live="off"><span class="clock-face">◷</span><span class="two-time">04:00</span></div></header><h1 class="two-title"></h1><p class="two-help">Stay together and catch the good moments. Move with ← → or the buttons below.</p><section class="two-health"><div class="health-card"><span>Her health</span><strong class="health-number">100%</strong><div class="health-track"><i></i></div></div><div class="health-card"><span>His health</span><strong class="health-number">100%</strong><div class="health-track"><i></i></div></div></section><div class="two-arena" tabindex="0" aria-label="Game arena. Use left and right arrow keys to move together"><div class="two-stars" aria-hidden="true">✦　·　✧　　 ·　✦</div><div class="two-objects"></div><div class="two-couple"><div class="two-person girl"><span class="scarf"></span><span class="face">☺</span><span class="body">✿</span><span class="legs"></span><small>HER</small></div><div class="two-person boy"><span class="hair"></span><span class="face">☺</span><span class="body">♥</span><span class="legs"></span><small>HIM</small></div><div class="hands">♡</div></div></div><div class="two-controls"><button class="two-move" data-step="-1" aria-label="Move left">←</button><span>Move together</span><button class="two-move" data-step="1" aria-label="Move right">→</button></div><p class="two-status" role="status" aria-live="polite">Every second, you both lose 1% health. Catch good moments to restore it!</p>`;
    host.replaceChildren(root);root.querySelector('.two-title').textContent=config.name||'Two of Us 🫶';root.querySelector('.two-back').addEventListener('click',()=>{window.removeEventListener('keydown',keydown);cancelAnimationFrame(raf);options.onBack?.()});
    const arena=root.querySelector('.two-arena'),couple=root.querySelector('.two-couple'),objectsLayer=root.querySelector('.two-objects'),timeText=root.querySelector('.two-time'),healthCards=[...root.querySelectorAll('.health-card')],status=root.querySelector('.two-status');
    const laneGuide=document.createElement('div');laneGuide.className='lane-guide';laneGuide.setAttribute('aria-hidden','true');laneGuide.innerHTML='<span></span><span></span><span></span>';arena.prepend(laneGuide);
    root.querySelector('.two-help').textContent='Use the arrow buttons or the left and right keyboard arrows to switch positions.';
    const moveButtons=[...root.querySelectorAll('.two-move')];moveButtons[0].textContent='←';moveButtons[0].setAttribute('aria-label','Move to the left lane pair');moveButtons[1].textContent='→';moveButtons[1].setAttribute('aria-label','Move to the right lane pair');root.querySelector('.two-controls span').remove();
    healthCards.forEach((card,index)=>{card.innerHTML='<span class="health-heart" aria-hidden="true">❤️</span><strong class="health-number">100%</strong><div class="health-track"><i></i></div><small class="health-label">'+(index===0?femaleName:maleName)+'</small>'});
    const characterLabels=couple.querySelectorAll('small');characterLabels[0].textContent=femaleName;characterLabels[1].textContent=maleName;
    let health=[100,100],position=0,seconds=durationSeconds,ended=false,started=false,last=performance.now(),wave=[],pairResolved=false,raf=0;timeText.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');status.textContent='Good moments recharge energy; difficult moments drain it by the amount shown.';
    const defaultGood=[{name:'Love',emoji:'🫶',weight:20},{name:'Happiness',emoji:'😊',weight:20},{name:'Career growth',emoji:'📈',weight:10},{name:'Financial independence',emoji:'💰',weight:30}],defaultBad=[{name:'Depression',emoji:'🌧️',weight:20},{name:'Financial struggles',emoji:'💸',weight:20},{name:'Family responsibilities',emoji:'🏡',weight:10},{name:'Illness',emoji:'🤒',weight:30}];
    const normalizeSituations=(items,fallback)=>Array.isArray(items)&&items.length?items.map(item=>({name:String(item.name||'Situation'),emoji:String(item.emoji||'✨'),weight:Math.abs(Number(item.weight))||20})):fallback;
    const good=normalizeSituations(config.goodSituations,defaultGood),bad=normalizeSituations(config.badSituations,defaultBad);
    function setPosition(next){position=next;const laneWidth=arena.clientWidth/3,actorWidth=(couple.children[0].offsetWidth+couple.children[1].offsetWidth)/2;couple.style.gap=Math.max(4,laneWidth-actorWidth)+'px';couple.style.left=(position===0?100/3:200/3)+'%';moveButtons.forEach((button,index)=>button.classList.toggle('selected',index===position))}
    function move(step){setPosition(step>0?1:0)}
    moveButtons.forEach(button=>{button.addEventListener('click',()=>setPosition(Number(button.dataset.step)>0?1:0));button.addEventListener('pointerdown',()=>button.classList.add('pressed'));['pointerup','pointercancel','pointerleave'].forEach(event=>button.addEventListener(event,()=>button.classList.remove('pressed')))});
    const keydown=e=>{if(started&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();move(e.key==='ArrowLeft'?-1:1)}};window.addEventListener('keydown',keydown);setPosition(0);
    function updateHealth(){healthCards.forEach((card,i)=>{const value=Math.max(0,Math.ceil(health[i])),fill=card.querySelector('.health-track i');card.querySelector('.health-number').textContent=value+'%';fill.style.height=value+'%';card.classList.toggle('low',health[i]<=25)})}
    function finish(won){if(ended)return;ended=true;cancelAnimationFrame(raf);window.removeEventListener('keydown',keydown);root.classList.add(won?'two-won':'two-lost');status.textContent=won?'You made it through every storm together.':'One of you ran out of strength.';if(won){options.onComplete?.({taskName:config.name||'Two of Us 🫶',message:config.successMessage});return}const lostIndex=health[0]<=0?0:1,lostName=lostIndex===0?femaleName:maleName,savedName=lostIndex===0?maleName:femaleName,screen=document.createElement('section');screen.className='two-loss-screen';screen.setAttribute('role','dialog');screen.setAttribute('aria-modal','true');screen.setAttribute('aria-labelledby','two-loss-title');const card=document.createElement('div');card.className='two-loss-card';const title=document.createElement('h2');title.id='two-loss-title';title.textContent='You both lost this round';const message=document.createElement('p');message.textContent=`${lostName}’s energy reached 0%. You lost ${lostName} while trying to save ${savedName}.`;const ok=document.createElement('button');ok.type='button';ok.className='two-loss-ok';ok.textContent='OK';ok.addEventListener('click',()=>options.onBack?.());card.append(title,message,ok);screen.append(card);root.append(screen);ok.focus()}
    function launchWave(){
      let pattern;
      if(health[0]===health[1])pattern=Math.random()<.5?['good','bad','good']:['bad','good','bad'];
      else{const lowPlayer=health[0]<health[1]?0:1,targetLane=(position===0?0:1)+lowPlayer;pattern=targetLane===1?['good','bad','good']:['bad','good','bad']}
      const laneXs=[100/6,50,500/6];wave=[];pairResolved=false;
      pattern.forEach((kind,lane)=>{
        const item=document.createElement('div');item.className='falling '+kind;
        const choices=kind==='good'?good:bad,choice=choices[Math.floor(Math.random()*choices.length)],{emoji,weight}=choice;
        item.innerHTML='<b></b><span class=drop-emoji></span><span class=drop-label></span>';
        item.querySelector('b').textContent=(kind==='good'?'+':'−')+weight+'%';
        item.querySelector('.drop-emoji').textContent=emoji;item.querySelector('.drop-label').textContent=choice.name;
        item.style.left=laneXs[lane]+'%';objectsLayer.append(item);wave.push({el:item,x:laneXs[lane],y:-14,kind,lane,weight});
      });
    }
    function tick(now){
      if(ended||!started||!host.contains(root))return;
      const dt=Math.min(.05,(now-last)/1000);last=now;seconds=Math.max(0,seconds-dt);
      timeText.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(Math.floor(seconds%60)).padStart(2,'0');
      root.querySelector('.two-clock').classList.toggle('tick',Math.floor(seconds*2)%2===0);
      if(!wave.length)launchWave();
      wave.forEach(item=>{item.y+=dt*31;item.el.style.top=item.y+'%'});
      const lanes=position===0?[0,1]:[1,2],pair=lanes.map(lane=>wave.find(item=>item.lane===lane));
      if(!pairResolved&&pair.length===2&&pair.every(item=>item&&item.y>61)){
        pairResolved=true;
        pair.forEach((item,index)=>{health[index]=Math.max(0,Math.min(100,health[index]+(item.kind==='good'?item.weight:-item.weight)));item.el.remove()});
        wave=wave.filter(item=>!pair.includes(item));updateHealth();status.textContent='You caught one each—good moments lift you; hard ones test you.';
        if(health.some(value=>value<=0)){finish(false);return}
      }
      wave=wave.filter(item=>{if(item.y>108){item.el.remove();return false}return true});
      if(seconds<=0){finish(true);return}
      raf=requestAnimationFrame(tick);
    }
    const durationLabel=durationSeconds%60===0?`${durationSeconds/60} minute${durationSeconds===60?'':'s'}`:`${durationSeconds} seconds`;
    const instructions=document.createElement('section');instructions.className='two-instructions';instructions.setAttribute('role','dialog');instructions.setAttribute('aria-modal','true');instructions.setAttribute('aria-labelledby','two-rules-title');
    const instructionCard=document.createElement('div');instructionCard.className='two-instructions-card';
    const instructionTitle=document.createElement('h2');instructionTitle.id='two-rules-title';instructionTitle.textContent='Before you begin';
    const instructionIntro=document.createElement('p');instructionIntro.textContent='Two of Us is a little reminder of how life works: happy moments and hard days arrive, and we face them better together.';
    const rules=document.createElement('ul');
    [`Help both of you survive for ${durationLabel}. If either energy bar reaches 0%, you both lose.`,`Good situations recharge energy by the amount shown; difficult situations drain that amount.`,`When your partner’s energy is low, use the arrows to guide them toward a good moment and support them.`,`Understanding, compromise and sacrifice help you keep choosing each other through every storm.`].forEach(rule=>{const item=document.createElement('li');item.textContent=rule;rules.append(item)});
    const startButton=document.createElement('button');startButton.type='button';startButton.className='two-instructions-start';startButton.textContent='OK, let’s begin';
    instructionCard.append(instructionTitle,instructionIntro,rules,startButton);instructions.append(instructionCard);arena.append(instructions);
    updateHealth();startButton.addEventListener('click',()=>{started=true;last=performance.now();instructions.remove();raf=requestAnimationFrame(tick)});
  };
})();
