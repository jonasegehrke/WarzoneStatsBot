import DiscordJS, { Intents, MessageAttachment, MessageEmbed } from 'discord.js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'


dotenv.config();

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

client.on('ready', () => {
    console.log("Bot is ready")
})

client.on('messageCreate', (message) => {
    let splitMsg = message.content.split(" ");
    if (splitMsg[0] == '!stats') {

        const sentId = splitMsg[1].replace("#","%23");
        scrapeProfile(`https://cod.tracker.gg/warzone/profile/atvi/${sentId}/overview`).then(data => {

            console.log("Inside messagecontent")

            console.log(data)

            console.log("End messagecontent")


            const exampleEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(splitMsg[1])
            .setImage("https://upload.wikimedia.org/wikipedia/commons/e/e6/Call_of_Duty_Warzone_Logo.png")
            .addFields(
                { name: 'Level', value: data[0].replace("Level ", ""), inline: true },
                { name: 'K/D', value: data[1], inline: true},
                { name: 'Weekly K/D', value: data[2], inline: true},
                { name: 'Wins', value: data[3], inline: true},
                { name: 'Win%', value: data[4], inline: true},
                { name: 'Kills', value: data[5], inline: true},
            )
            .setTimestamp()
            .setFooter('WarzoneStats');
    
            message.reply({ embeds: [exampleEmbed] });

        });
    }
})

client.login(process.env.TOKEN)













/*--------------------------------------*/
/*                                      */
/*                                      */
/*              ---SCRAPER---           */
/*                                      */
/*                                      */
/*--------------------------------------*/
import puppeteer from 'puppeteer-extra';
import pluginStealth from 'puppeteer-extra-plugin-stealth';
puppeteer.use(pluginStealth());

async function scrapeProfile(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url,{waitUntil: 'networkidle0'});

    const [levelScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[1]/div/div[1]');
    const level = levelScrape.getProperty('textContent');
    const rawLevel = (await level).jsonValue();
    
    let [kdScrape] = [];
    try {
        [kdScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[4]/div/div[2]/span[2]');
    } catch (err) {
        console.log(err.message)
    }
    try {
        [kdScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[4]/div/div[1]/span[2]');
    } catch (err) {
        console.log(err.message)
    }
    const kd = kdScrape.getProperty('textContent');
    let rawKd = (await kd).jsonValue();
    
    let [weeklyScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[2]/div/div[1]/div/div/div[1]/div[2]/div[2]/div[2]');
    const weekKd = weeklyScrape.getProperty('textContent');
    const rawWeekKd = (await weekKd).jsonValue();

    const [winsScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[1]/div/div[2]/span[2]');
    const wins = winsScrape.getProperty('textContent');
    let rawWins = (await wins).jsonValue();
    
    const [winPercentScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[2]/div/div[2]/span[2]');
    const winPercent = winPercentScrape.getProperty('textContent');
    const rawWinPercent = (await winPercent).jsonValue();
    
    const [killsScrape] = await page.$x('//*[@id="app"]/div[2]/div[2]/div/main/div[2]/div[3]/div[2]/div/div/div[1]/div[2]/div[1]/div[3]/div/div[2]/span[2]');
    const kills = killsScrape.getProperty('textContent');
    const rawKills = (await kills).jsonValue();
    

    browser.close();



    let levelPromise = new Promise(function (myResolve, myReject) {
        setTimeout(() => {
            myResolve(rawLevel)
          }, 100)
           
    })

    let kdPromise = new Promise(function (myResolve, myReject) {
        setTimeout(() => {
            myResolve(rawKd)
          }, 200)
           
    })

    let weeklyPromise = new Promise(function (myResolve, myReject) {
        setTimeout(() => {
            myResolve(rawWeekKd)
          }, 200)
           
    })

    let winsPromise = new Promise(function (myResolve, myReject) {
        setTimeout(() => {
            myResolve(rawWins)
          }, 200)
           
    })

    let percentPromise = new Promise(function (myResolve, myReject) {
        setTimeout(() => {
            myResolve(rawWinPercent)
          }, 200)
           
    })

    let killsPromise = new Promise(function (myResolve, myReject) {
        setTimeout(() => {
            myResolve(rawKills)
          }, 200)
           
    })
    

    let arr = [levelPromise, kdPromise, weeklyPromise, winsPromise, percentPromise, killsPromise];

    return Promise.all(arr).then(value =>{
        console.log(JSON.stringify(arr));
        console.log(JSON.stringify(value));
        return value;
    })
    
}

