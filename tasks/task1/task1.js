(function(){
  window.startPieceByPieceTask=async function(host,options={}){
    const config=options.config||{};
    const size=Math.max(2,Math.min(5,Math.floor(Number(config.gridSize)||3)));
    const cellCount=size*size;
    const emptyCell=Math.max(0,Math.min(cellCount-1,Math.floor(Number(config.emptyCell??size-1))));
    const imageUrl=config.image||'tasks/task1/afrin.jpeg';
    const root=document.createElement('main');root.className='task1-shell';root.setAttribute('aria-label',config.name||'Piece by Piece sliding puzzle');
    root.innerHTML=`
      <header class="task1-header">
        <button class="task1-back" type="button" aria-label="Back to garden"><span aria-hidden="true">←</span> Garden</button>
      </header>
      <section class="task1-content">
        <span class="task1-flower" aria-hidden="true">✿</span>
        <h1 class="task1-title"></h1>
        <p class="task1-instruction">Piece by piece, put the picture back together. Tap a tile beside the open space to slide it.</p>
        <div class="task1-puzzle-wrap">
          <div class="task1-puzzle" role="grid" aria-label="Sliding picture puzzle"></div>
        </div>
        <p class="task1-status" role="status" aria-live="polite">The open space is in the upper right.</p>
      </section>`;
    host.replaceChildren(root);
    root.querySelector('.task1-title').textContent=config.name||'Piece by Piece';
    root.querySelector('.task1-back').addEventListener('click',()=>options.onBack?.());
    const boardElement=root.querySelector('.task1-puzzle'),status=root.querySelector('.task1-status');
    boardElement.style.setProperty('--task1-size',String(size));
    const img=new Image();
    try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('The puzzle picture could not be loaded.'));img.src=imageUrl;if(img.complete&&img.naturalWidth)resolve()})}
    catch(error){status.textContent=error.message;return}
    if(!host.contains(root))return;

    const goalCells=Array.from({length:cellCount},(_,index)=>index).filter(index=>index!==emptyCell);
    let board=[];
    function inversionCount(values){let count=0;for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)if(values[i]>values[j])count++;return count}
    function shuffleBoard(){
      let pieces=goalCells.slice();
      for(let i=pieces.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pieces[i],pieces[j]]=[pieces[j],pieces[i]]}
      if(inversionCount(pieces)%2!==0)[pieces[0],pieces[1]]=[pieces[1],pieces[0]];
      if(pieces.every((piece,index)=>piece===goalCells[index]))[pieces[0],pieces[1]]=[pieces[1],pieces[0]];
      board=Array(cellCount).fill(null);goalCells.forEach((cell,index)=>board[cell]=pieces[index]);
    }
    function neighbors(index){
      const row=Math.floor(index/size),col=index%size,result=[];
      if(row>0)result.push(index-size);if(row<size-1)result.push(index+size);if(col>0)result.push(index-1);if(col<size-1)result.push(index+1);
      return result;
    }
    function isSolved(){return board.every((piece,index)=>index===emptyCell?piece===null:piece===index)}
    function drawBoard(){
      boardElement.replaceChildren();
      board.forEach((piece,index)=>{
        if(piece===null){const gap=document.createElement('div');gap.className='task1-empty';gap.setAttribute('role','gridcell');gap.setAttribute('aria-label','Empty space');boardElement.append(gap);return}
        const tile=document.createElement('button');tile.type='button';tile.className='task1-tile';tile.setAttribute('role','gridcell');tile.setAttribute('aria-label',`Slide picture piece ${piece+1}`);
        tile.style.backgroundImage=`url("${imageUrl}")`;
        tile.style.backgroundSize=`${size*100}% ${size*100}%`;
        const sourceRow=Math.floor(piece/size),sourceCol=piece%size;
        tile.style.backgroundPosition=`${size===1?0:sourceCol/(size-1)*100}% ${size===1?0:sourceRow/(size-1)*100}%`;
        tile.addEventListener('click',()=>moveTile(index));boardElement.append(tile);
      });
    }
    function moveTile(index){
      const empty=board.indexOf(null);
      if(!neighbors(empty).includes(index)){status.textContent='Choose a picture piece beside the open space.';boardElement.classList.remove('task1-nudge');void boardElement.offsetWidth;boardElement.classList.add('task1-nudge');return}
      [board[empty],board[index]]=[board[index],board[empty]];status.textContent='Lovely! Keep sliding the nearby pieces.';drawBoard();
      if(isSolved()){status.textContent='Every piece is right where it belongs.';root.classList.add('task1-solved');options.onComplete?.({taskName:config.name||'Piece by Piece',message:config.successMessage||'Piece by piece, we’ll build our life together. Every little moment with you is a piece I want to keep.'})}
    }
    shuffleBoard();drawBoard();
  };
})();
