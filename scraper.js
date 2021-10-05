import puppeteer from 'puppeteer';

const acitivisionId = `Gehrke#235366452`.replace("#","%");

//const profileUrl = `https://cod.tracker.gg/warzone/profile/atvi/${acitivisionId}/overview`

export default scrapeProfile;

//module.exports.scrapeProfile = scrapeProfile;

async function scrapeProfile(url){
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url,{waitUntil: 'networkidle0'});

  console.log(acitivisionId)

  await page.waitForXPath('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[1]/div/div[1]');
  const [levelScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[1]/div/div[1]');
  const level = levelScrape.getProperty('textContent');
  const rawLevel = (await level).jsonValue();
  console.log(rawLevel);

  await page.waitForXPath('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[4]/div/div[2]/span[2]');
  const [kdScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[4]/div/div[2]/span[2]');
  const kd = kdScrape.getProperty('textContent');
  const rawKdTxt = (await kd).jsonValue();
  console.log("KD: ", rawKdTxt);
  
  await page.waitForXPath('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[2]/div/div[1]/div/div/div[1]/div[2]/div[2]/div[2]');
  const [weeklyScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[2]/div/div[1]/div/div/div[1]/div[2]/div[2]/div[2]');
  const weekKd = weeklyScrape.getProperty('textContent');
  const rawWeekKdTxt = (await weekKd).jsonValue();
  console.log("Weekly KD: ", rawWeekKdTxt);
  
  await page.waitForXPath('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[1]/div/div[2]/span[2]');
  const [winsScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[1]/div/div[2]/span[2]');
  const wins = winsScrape.getProperty('textContent');
  const rawWins = (await wins).jsonValue();
  console.log("Wins: ", rawWins);

  await page.waitForXPath('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[2]/div/div[2]/span[2]');
  const [winPercentScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[2]/div/div[2]/span[2]');
  const winPercent = winPercentScrape.getProperty('textContent');
  const rawWinPercent = (await winPercent).jsonValue();
  console.log("Win %: ", rawWinPercent);

  await page.waitForXPath('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[3]/div/div[2]/span[2]');
  const [killsScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[3]/div/div[2]/span[2]');
  const kills = killsScrape.getProperty('textContent');
  const rawKills = (await kills).jsonValue();
  console.log("Kills: ", rawKills);


  browser.close();
}


