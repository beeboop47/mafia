// Two real browser pages with an in-memory room transport; no live room writes.
const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/gerar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try {
    const pages=[await browser.newPage(),await browser.newPage({hasTouch:true,isMobile:true})];
    const commands=[],updates={},errors=[];
    for(let i=0;i<pages.length;i++){
      const page=pages[i];page.on('pageerror',error=>errors.push(error.message));
      await page.route('https://**/*',route=>route.abort());
      await page.exposeFunction('mockSet',(_ref,value)=>{commands.push(value);});
      await page.exposeFunction('mockUpdate',values=>{Object.assign(updates,values);});
      await page.goto('file:///C:/Users/gerar/Downloads/Websites/Mafia/index.html',{waitUntil:'load'});
      await page.evaluate(i=>{
        window.mockSequence=0;
        online.mode='online';online.uid=i?'attacker':'target';online.seatId=i;online.isHost=i===0;
        online.roomCode='TEST';online.roomStatus='started';online.db={};
        online.api={dbMod:{ref:(_db,path)=>({path}),push:ref=>({...ref,key:online.uid+'-'+(++window.mockSequence)}),
          set:(ref,value)=>window.mockSet(ref,value),update:(_ref,values)=>window.mockUpdate(values)}};
        online.playersCache={target:{uid:'target',seatId:0},attacker:{uid:'attacker',seatId:1},other:{uid:'other',seatId:2}};
        state.narratorMode=false;state.round=1;state.phase='night';state.onlineVersion=1;
        state.players=['joker','samurai','citizen'].map((roleId,id)=>({...createPlayer(id,['Target','Attacker','Other'][id]),roleId,uid:['target','attacker','other'][id]}));
        state.night={round:2,index:0,reactionQueue:[state.players[0]],round1Players:state.players.slice(),reactionCompleted:[],
          pendingAttacks:[{attackerId:1,targetId:0,sourceAction:'kill'}],onlineResults:{},protectedIds:[],reactionFollowups:{},onlineAckNeeded:false};
        hide('setupScreen');show('onlineGame','onlineActionCard');
      },i);
    }
    async function flush(){
      for(let i=0;i<pages.length;i++)await pages[i].evaluate(({pub,priv})=>{
        online.public=pub;online.private=priv;renderOnlinePublic();renderOnlinePrivate();
      },{pub:updates['rooms/TEST/public'],priv:updates['rooms/TEST/private/'+(i?'attacker':'target')]});
    }
    async function drain(){
      while(commands.length){
        const command=commands.shift();
        await pages[0].evaluate(async command=>{await handleOnlineCommand(command,command.uid+'-'+command.createdAt+'-'+JSON.stringify(command.payload.value));},command);
      }
      await flush();
    }
    await pages[0].evaluate(()=>publishOnlineRoom());await flush();
    for(let round=0;round<2;round++){
      await pages[0].getByRole('button',{name:'Rock',exact:true}).click();await drain();
      assert.match(await pages[0].locator('#onlineActionArea').innerText(),/Choice locked/);
      await pages[1].getByRole('button',{name:'Scissors',exact:true}).click();await drain();
    }
    assert.equal(await pages[0].evaluate(()=>state.players[0].alive),true);
    assert.match(await pages[1].locator('#onlineActionResult').innerText(),/survived/);
    await pages[0].evaluate(()=>{
      state.players[0].roleId='escapist';state.night.onlineAckNeeded=false;
      state.night.pendingAttacks=[{attackerId:1,targetId:0,sourceAction:'kill'}];state.night.onlineResults={};
      bumpOnlineVersion();return publishOnlineRoom();
    });await flush();
    await pages[0].getByRole('button',{name:'Ready',exact:true}).click();await drain();
    await pages[1].getByRole('button',{name:'Ready',exact:true}).click();await drain();
    await pages[0].waitForTimeout(3200);
    for(let i=0;i<8;i++)await pages[0].getByRole('button',{name:'TAP / CLICK',exact:true}).click();
    for(let i=0;i<3;i++)await pages[1].getByRole('button',{name:'TAP / CLICK',exact:true}).tap();
    await pages[0].waitForTimeout(400);await drain();
    const endAt=await pages[0].evaluate(()=>state.night.onlineDuel.endAt);
    await pages[0].waitForTimeout(Math.max(0,endAt-Date.now()+300));await drain();
    await pages[0].waitForTimeout(1600);await flush();
    assert.equal(await pages[0].evaluate(()=>state.players[0].escaped),true);
    assert.match(await pages[1].locator('#onlineActionResult').innerText(),/8 taps.*3 taps/);
    assert.deepEqual(errors,[]);
    console.log('Two-device browser checks passed: secret RPS choices, best-of-three resolution, desktop clicks, mobile touch taps and timed escape result.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
