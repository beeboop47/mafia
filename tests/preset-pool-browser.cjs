const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('C:/Users/gerar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844}});
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://**/*',route=>route.abort());
    await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
    await page.locator('#offlineContinueBtn').click();
    const source=page.locator('#presetSource');
    await source.selectOption('pool');
    assert.equal(await page.locator('#presetControls').isVisible(),false);
    assert.equal(await page.locator('#presetPoolControls').isVisible(),true);
    assert.equal(await page.locator('#blindSetup, #surpriseRoundChance').count(),0);

    await page.locator('#presetPool input[value="builtin:classic"]').check();
    assert.match(await page.locator('#presetPoolStatus').innerText(),/1 of 1/);
    await page.locator('#saveConfigBtn').click();
    await source.selectOption('preset');
    await page.locator('#presetSelect').selectOption('builtin:colonised_town');
    await page.locator('#loadConfigBtn').click();
    assert.equal(await source.inputValue(),'pool');
    assert.equal(await page.locator('#presetPool input[value="builtin:classic"]').isChecked(),true);
    await page.locator('#startBtn').click();
    assert.equal(await page.evaluate(()=>state.activePreset.key),'builtin:classic');
    for(let i=0;i<4;i++){
      await page.locator('#revealRoleBtn').click();
      await page.locator('#handoffNextBtn').click();
    }
    assert.equal(await page.evaluate(()=>state.phase),'day');
    assert.deepEqual(await page.evaluate(()=>state.players.map(p=>p.roleId).sort()),['citizen','citizen','detective','godfather']);

    // Exercise the online start entry point against an in-memory room.
    await page.evaluate(async()=>{
      state.phase='setup';renderSetup();
      state.presetSource='preset';state.selectedPreset='builtin:colonised_town';
      online.mode='host';online.isHost=true;online.roomStatus='lobby';online.roomCode='TEST';
      online.uid='player0';online.db={};
      online.playersCache=Object.fromEntries([0,1,2].map(i=>['player'+i,{uid:'player'+i,name:'Player '+i,seatId:i,host:i===0}]));
      online.api={dbMod:{
        ref:(_db,value)=>value, runTransaction:async()=>({committed:true}),
        update:async()=>{}, set:async()=>{},
      }};
      await startOnlineGameAsHost();
      if(state.phase!=='day' || state.activeTrickRound?.id!=='colonised_town')throw new Error('Online special preset did not start');
    });
    assert.deepEqual(errors,[]);
    console.log('Preset pool, saved preferences, and offline and online starts passed.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
