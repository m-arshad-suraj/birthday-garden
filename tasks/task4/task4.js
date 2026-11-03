(function(){
  window.startDuaTask=function(host,options={}){
    const config=options.config||{};
    const duas=Array.isArray(config.duas)&&config.duas.length?config.duas.map(String):[
      'Ya Allah, fill our marriage with laughter, tenderness, patience, and happiness that brings us closer to You. Bless us with a loving bond and many beautiful years together.',
      'Ya Allah, grant us health, peace, and barakah in our home. Bless our efforts with halal provision and financial independence, and help us always support one another.',
      'Ya Allah, bless us with righteous, healthy children who are the coolness of our eyes and a source of goodness in this life and the next.',
      'Ya Allah, give us a healthy and beautiful life in this world, guide us through every test, and reunite us in Jannah with Your mercy.',
      'Ya Allah, make us each other’s comfort, closest friend, and safe home. Put affection and mercy between us, and grant us happiness in this life and everlasting joy in the Aakhira. Ameen.'
    ];
    let index=0;
    const root=document.createElement('main');root.className='dua-shell';root.setAttribute('aria-label','A sequence of duas');
    const ornament=document.createElement('span');ornament.className='dua-ornament';ornament.setAttribute('aria-hidden','true');ornament.textContent='☾';
    const title=document.createElement('h1');title.className='dua-title';title.textContent=config.name||'A Du’a for Us';
    const count=document.createElement('p');count.className='dua-count';count.setAttribute('aria-live','polite');
    const text=document.createElement('p');text.className='dua-text';text.lang='en';text.dir='ltr';text.setAttribute('aria-live','polite');
    const button=document.createElement('button');button.type='button';button.className='dua-ameen';button.textContent='Ameen';
    function render(){count.textContent=`Du'a ${index+1} of ${duas.length}`;text.textContent=duas[index]}
    button.addEventListener('click',()=>{index++;if(index>=duas.length){options.onComplete?.({taskName:config.name||'A Du\'a for Us',message:config.successMessage||'May Allah accept every du\'a. Ameen.'});return}render()});
    root.append(ornament,title,count,text,button);host.replaceChildren(root);render();
  };
})();
