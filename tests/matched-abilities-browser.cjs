const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/gerar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.on('pageerror',error=>errors.push(error.message));await page.route('https://**/*',route=>route.abort());
  await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);
  for(const id of ['fakeVisit','bestowAbility','secureInformation','surviveOnce'])assert.equal(await page.locator(`#roleNightAction option[value="${id}"]`).count(),1);
  await page.evaluate(()=>{
   online.mode='offline';state.mode='manual';state.phase='night';state.round=2;state.roles=structuredClone(DEFAULT_ROLES);
   state.roles.push({id:'test',title:'Fabricator',orientation:'evil',nightAction:'fabricateAction',nightReaction:'none'});
   state.players=['test','mafia','citizen','citizen','judge'].map((roleId,id)=>({...createPlayer(id,`Player ${id}`),roleId}));
   state.night={round:1,blockedIds:[],protectedIds:[],actionRecords:{}};initializeExtraNight();
   hide('setupScreen','handoffCard','dayCard');show('gameScreen','nightCard');
   window.showForm=(action='fabricateAction',choices=extraChoices(playerOf(0),action))=>{
    $('nightActionArea').innerHTML='';renderExtraForm($('nightActionArea'),action,choices,value=>{window.submission=parseExtraChoice(playerOf(0),action,value);});
   };showForm();
  });
  const selects=page.locator('#nightActionArea select');assert.equal(await selects.count(),3);
  await selects.nth(0).selectOption('1');await selects.nth(1).selectOption('kill');assert.equal(await selects.nth(2).isVisible(),true);
  assert.equal(await selects.nth(2).locator('option[value="4"]').count(),0);
  await selects.nth(2).selectOption('2');await page.locator('#nightActionArea button[type="submit"]').click();
  assert.deepEqual(await page.evaluate(()=>window.submission),{targetId:1,second:'kill',destinationId:2,text:''});
  await selects.nth(1).selectOption('seer');assert.equal(await selects.nth(2).isVisible(),false);
  await page.locator('#nightActionArea button[type="submit"]').click();assert.equal(await page.evaluate(()=>window.submission.destinationId),null);
  // Online forms receive JSON-serialized choices from the host.
  await page.evaluate(()=>showForm('fabricateAction',JSON.parse(JSON.stringify(extraChoices(playerOf(0),'fabricateAction')))));
  await selects.nth(0).selectOption('1');await selects.nth(1).selectOption('protect');await selects.nth(2).selectOption('2');
  await page.locator('#nightActionArea button[type="submit"]').click();assert.equal(await page.evaluate(()=>window.submission.destinationId),2);
  await page.evaluate(()=>{
   playerOf(0).hostSetup={abilitySchedule:{2:{action:'fabricateAction',value:'1',second:'kill',destinationId:'2'}}};
   const value=hostAssignedValue(playerOf(0));if(JSON.parse(value).destinationId!==2)throw new Error('Host destination was lost');
  });
  await page.evaluate(()=>showForm('signedBroadcast'));assert.equal(await selects.count(),0);
  await page.locator('#nightActionArea textarea').fill('Hello town');await page.locator('#nightActionArea button[type="submit"]').click();
  assert.equal(await page.evaluate(()=>window.submission.text),'Hello town');assert.deepEqual(errors,[]);
  console.log('Matched ability menus, mobile forms, online form data and host assignments passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
