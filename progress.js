(async()=>{
  const collectionKey='birthday-garden-collection-v1';
  const missionsKey='birthday-garden-missions-v1';
  const endingKey='birthday-garden-ending-seen-v1';
  const status=document.querySelector('#status');
  const collectiblesList=document.querySelector('#collectibles-list');
  const missionsList=document.querySelector('#missions-list');
  const readArray=key=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch{return[]}};
  let layout;
  try{
    const response=await fetch('./garden-layout.json');
    if(!response.ok)throw new Error('Could not load garden-layout.json. Start the local web server in the project folder.');
    layout=await response.json();
  }catch(error){status.textContent=error.message;status.classList.add('error');return}

  let found=new Set(readArray(collectionKey).map(String));
  let complete=new Map(readArray(missionsKey).map(record=>{
    const key=String(typeof record==='string'?record:record?.key??'');
    return [key,record];
  }).filter(([key])=>key));
  const save=()=>{
    localStorage.setItem(collectionKey,JSON.stringify([...found]));
    localStorage.setItem(missionsKey,JSON.stringify([...complete.values()]));
    status.textContent=`Saved: ${found.size}/${layout.collectibles.length} collectibles and ${complete.size}/${Object.keys(layout.missions||{}).length} missions complete. Refresh the garden to apply.`;
  };
  function addCheckbox(container,label,emoji,checked,onChange){
    const row=document.createElement('label');row.className='check-row';
    const input=document.createElement('input');input.type='checkbox';input.checked=checked;input.addEventListener('change',()=>onChange(input.checked));
    const icon=document.createElement('span');icon.className='emoji';icon.textContent=emoji||'✨';
    const text=document.createElement('span');text.textContent=label;
    row.append(input,icon,text);container.append(row);
  }
  function render(){
    collectiblesList.replaceChildren();missionsList.replaceChildren();
    for(const [index,item] of (layout.collectibles||[]).entries()){
      const id=String(item.id??index+1);
      addCheckbox(collectiblesList,item.name||`Garden surprise ${id}`,item.emoji,found.has(id),checked=>{checked?found.add(id):found.delete(id);save()});
    }
    for(const [key,mission] of Object.entries(layout.missions||{})){
      addCheckbox(missionsList,mission.name||key,'💌',complete.has(key),checked=>{
        if(checked)complete.set(key,{key,name:mission.name||key,wish:mission.successMessage||''});else complete.delete(key);
        save();
      });
    }
    save();
  }
  document.querySelector('#mark-all').addEventListener('click',()=>{
    found=new Set((layout.collectibles||[]).map((item,index)=>String(item.id??index+1)));
    complete=new Map(Object.entries(layout.missions||{}).map(([key,mission])=>[key,{key,name:mission.name||key,wish:mission.successMessage||''}]));
    localStorage.removeItem(endingKey);render();status.textContent='Everything marked complete. Refresh the garden to see the birthday ending.';
  });
  document.querySelector('#clear-all').addEventListener('click',()=>{
    found.clear();complete.clear();localStorage.removeItem(endingKey);render();status.textContent='Progress cleared. Refresh the garden to apply.';
  });
  render();
})();
