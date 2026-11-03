(()=>{
  const gate=document.querySelector('#birthday-gate');
  const days=document.querySelector('#birthday-days');
  const hours=document.querySelector('#birthday-hours');
  const minutes=document.querySelector('#birthday-minutes');
  const seconds=document.querySelector('#birthday-seconds');
  const note=document.querySelector('#birthday-date-note');
  const viewport=document.querySelector('#viewport');
  const welcomeScreen=document.querySelector('#welcome-screen');
  const movementControls=document.querySelector('.controls');
  let timer=0,unlockTimeout=0;

  welcomeScreen.hidden=true;
  movementControls.hidden=true;

  function pad(value){return String(value).padStart(2,'0')}
  function revealGarden(){
    gate.hidden=true;
    viewport.inert=false;
    welcomeScreen.hidden=false;
    movementControls.hidden=false;
  }

  window.configureBirthdayGate=function(layout={}){
    clearInterval(timer);
    clearTimeout(unlockTimeout);
    gate.hidden=false;
    const target=Date.parse(layout.birthdayUnlockAt||'');
    if(!Number.isFinite(target)){
      days.textContent=hours.textContent=minutes.textContent=seconds.textContent='––';
      note.textContent='Arshad is setting the perfect moment for your surprise. Your garden will stay tucked away until then.';
      return;
    }

    note.textContent='A little more time, and our garden will be yours.';

    function update(){
      const remaining=target-Date.now();
      if(remaining<=0){
        days.textContent=hours.textContent=minutes.textContent=seconds.textContent='00';
        note.textContent="It's time, my love. Your little world is ready.";
        clearInterval(timer);
        timer=0;
        unlockTimeout=window.setTimeout(revealGarden,1200);
        return;
      }
      const totalSeconds=Math.floor(remaining/1000);
      days.textContent=pad(Math.floor(totalSeconds/86400));
      hours.textContent=pad(Math.floor(totalSeconds/3600)%24);
      minutes.textContent=pad(Math.floor(totalSeconds/60)%60);
      seconds.textContent=pad(totalSeconds%60);
    }
    update();
    if(target>Date.now())timer=window.setInterval(update,1000);
  };

  fetch(`./garden-layout.json?birthday=${Date.now()}`,{cache:'no-store'})
    .then(response=>{
      if(!response.ok)throw new Error('Birthday settings could not be loaded.');
      return response.json();
    })
    .then(layout=>window.configureBirthdayGate(layout))
    .catch(()=>{
      note.textContent='The birthday countdown could not load its special time. Please refresh the page.';
    });
})();
