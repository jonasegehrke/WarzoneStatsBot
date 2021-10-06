import DiscordJS, { Intents, MessageAttachment, MessageEmbed } from 'discord.js'
import dotenv from 'dotenv'
import fetch from "node-fetch";
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
    if (splitMsg[0] == '!stats' && message.content.length > 6) {

        const sentId = splitMsg[1].replace("#","%2523");
   
        scrapeProfile(`https://wzstats.gg/profile/${sentId}/platform/battle`).then(data => {
            


            const exampleEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(splitMsg[1])
            .setImage("https://upload.wikimedia.org/wikipedia/commons/e/e6/Call_of_Duty_Warzone_Logo.png")
            .addFields(
                { name: 'K/D', value: data[0], inline: true},
                { name: 'Weekly K/D', value: data[1], inline: true},
                { name: 'Wins', value: data[2], inline: true},
                { name: 'Win%', value: data[3] + "%", inline: true},
                { name: 'Kills', value: data[4], inline: true},
                { name: 'Kills/Game', value: data[5].replace("Level ", ""), inline: true }
            )
            .setTimestamp()
            .setFooter('WarzoneStats');
    
            message.reply({ embeds: [exampleEmbed] });

        });
    }
    if (message.content === '!test') {
        scheduledUpdate().then(data =>{
        })
    }


    if (splitMsg[0] == '!sub' && message.content.length > 4) {

        saveProfile(splitMsg[1]).then(data =>{
        })
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
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser'
      });
    const page = await browser.newPage();
    await page.goto(url,{waitUntil: 'networkidle0'});

    const [button] = await page.$x('//*[@id="content-wrap"]/app-profile/div/app-shared-profile/div/div/div[1]/div[2]/app-stats-profile/div[2]/a[2]');
    if(button){
        await button.click();
    }
    
    let [kdScrape] = await page.$x('//*[@id="content-wrap"]/app-profile/div/app-shared-profile/div/div/div[1]/div[2]/app-stats-profile/div[1]/div[1]/div/div[2]');
    const kd = kdScrape.getProperty('textContent');
    let rawKd = (await kd).jsonValue();
    
    let [weeklyScrape] = await page.$x('//*[@id="content-wrap"]/app-profile/div/app-shared-profile/div/div/div[1]/div[2]/app-stats-profile/div[3]/div/div[1]/div[1]/div/div/div[1]');
    const weekKd = weeklyScrape.getProperty('textContent');
    const rawWeekKd = (await weekKd).jsonValue();

    const [winsScrape] = await page.$x('//*[@id="content-wrap"]/app-profile/div/app-shared-profile/div/div/div[1]/div[2]/app-stats-profile/div[1]/div[2]/div[1]/div/div[2]');
    const wins = winsScrape.getProperty('textContent');
    let rawWins = (await wins).jsonValue();
    
    const [winPercentScrape] = await page.$x('//*[@id="content-wrap"]/app-profile/div/app-shared-profile/div/div/div[1]/div[2]/app-stats-profile/div[1]/div[2]/div[3]/div/div[2]');
    const winPercent = winPercentScrape.getProperty('textContent');
    const rawWinPercent = (await winPercent).jsonValue();
    
    const [killsScrape] = await page.$x('//*[@id="content-wrap"]/app-profile/div/app-shared-profile/div/div/div[1]/div[2]/app-stats-profile/div[1]/div[2]/div[2]/div/div[2]');
    const kills = killsScrape.getProperty('textContent');
    const rawKills = (await kills).jsonValue();

    const [killsGameScrape] = await page.$x('//*[@id="content-wrap"]/app-profile/div/app-shared-profile/div/div/div[1]/div[2]/app-stats-profile/div[1]/div[2]/div[4]/div/div[2]');
    const killsGame = killsGameScrape.getProperty('textContent');
    const rawKillsGame = (await killsGame).jsonValue();
    

    browser.close();

    
    let kdPromise = new Promise(function (myResolve, myReject) {
        setTimeout(() => {
            myResolve(rawKd)
          }, 100)
           
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

    let killsGamePromise = new Promise(function (myResolve, myReject) {
        setTimeout(() => {
            myResolve(rawKillsGame)
          }, 100)
           
    })
    

    let arr = [kdPromise, weeklyPromise, winsPromise, percentPromise, killsPromise, killsGamePromise];

    return Promise.all(arr).then(value =>{
        console.log("Values:");
        console.log(JSON.stringify(value));
        return value;
    })
    
}





/*--------------------------------------*/
/*                                      */
/*                                      */
/*     ---TimedScraper & Azure---       */
/*                                      */
/*                                      */
/*--------------------------------------*/

/*  Template for sql data
let data = {
        activisionId: 5366452,
        name: "Gehrke",
        kd: 2.50,
        wins: 24
    }
*/

const azureAPI = `https://warzonestatswebapp.azurewebsites.net`


async function saveProfile(id){
    const url = `https://wzstats.gg/profile/${id.replace("#","%2523")}/platform/battle`
        
        //DO SCRAPE FOR KD & WINS and resolve

        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser'
          });
        const page = await browser.newPage();
        await page.goto(url,{waitUntil: 'networkidle0'});

        let rawKd = {}
        let rawWins = {}
        try {
            const [kdScrape] = await page.$x('//*[@id="content-wrap"]/app-profile/div/app-shared-profile/div/div/div[1]/div[2]/app-stats-profile/div[1]/div[1]/div/div[2]');
            const kd = kdScrape.getProperty('textContent');
            rawKd = (await kd).jsonValue();
    
            const [winsScrape] = await page.$x('//*[@id="content-wrap"]/app-profile/div/app-shared-profile/div/div/div[1]/div[2]/app-stats-profile/div[1]/div[2]/div[1]/div/div[2]');
            const wins = winsScrape.getProperty('textContent');
            rawWins = (await wins).jsonValue();
            
        } catch (error) {
            console.log(error)
        }

        browser.close();

        let kdPromise = new Promise(function (myResolve, myReject) {
            setTimeout(() => {
                myResolve(rawKd)
              }, 100)
               
        })

        let winsPromise = new Promise(function (myResolve, myReject) {
            setTimeout(() => {
                myResolve(rawWins)
              }, 200)
               
        })

        let arr = [kdPromise, winsPromise];

        

        let data = await Promise.all(arr).then(value =>{
            console.log("Values:");
            console.log(JSON.stringify(value));


            let splitId = id.split("#");

            let data = {
                activisionId: splitId[1],
                name: splitId[0],
                kd: value[0],
                wins: value[1]
            }

            return data;
        })

      
      

        await fetch (azureAPI + `/profile`,{
            method: "POST",
            body: JSON.stringify(data),
            headers: {"Content-type": "application/json; charset=UTF-8"}
        })

    //Scrape data on profile, resolve, send to REST

    
    
}

async function getProfiles(){
    const resp = await fetch(azureAPI + `/profiles`);
    const respData = await resp.json();

    return respData;
}

async function getProfile(id){
    const resp = await fetch(azureAPI + `/profile/` + id);
    const respData = await resp.json();

    return respData;
}

async function updateProfile(profile){
    
    

    await fetch (azureAPI + `/profile/update`,{
        method: "PUT",
        body: JSON.stringify(profile),
        headers: {"Content-type": "application/json; charset=UTF-8"}
    })
}

async function scheduledUpdate(){

    let profiles = [{}]
    profiles = await getProfiles();


    for(let i = 0; i < profiles.length ;i++){
        let id  = profiles[i].name + "#" + profiles[i].activisionId; //CHANGE TO "id" in backend
        
        const url = `https://wzstats.gg/profile/${id.replace("#","%2523")}/platform/battle`
        

        //DO SCRAPE FOR KD & WINS and resolve

        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser'
          });
        const page = await browser.newPage();
        await page.goto(url,{waitUntil: 'networkidle0'});

        let rawKd = {}
        let rawWins = {}
        try {
            const [kdScrape] = await page.$x('//*[@id="content-wrap"]/app-profile/div/app-shared-profile/div/div/div[1]/div[2]/app-stats-profile/div[1]/div[1]/div/div[2]');
            const kd = kdScrape.getProperty('textContent');
            rawKd = (await kd).jsonValue();
    
            const [winsScrape] = await page.$x('//*[@id="content-wrap"]/app-profile/div/app-shared-profile/div/div/div[1]/div[2]/app-stats-profile/div[1]/div[2]/div[1]/div/div[2]');
            const wins = winsScrape.getProperty('textContent');
            rawWins = (await wins).jsonValue();
            
        } catch (error) {
            console.log(error)
        }
        

        browser.close();

        let kdPromise = new Promise(function (myResolve, myReject) {
            setTimeout(() => {
                myResolve(rawKd)
              }, 100)
               
        })

        let winsPromise = new Promise(function (myResolve, myReject) {
            setTimeout(() => {
                myResolve(rawWins)
              }, 200)
               
        })

        let arr = [kdPromise, winsPromise];

        Promise.all(arr).then(value =>{
            console.log("Values:");
            console.log(JSON.stringify(value));

        
            
            let channel = client.channels.cache.get("754003644789293180") //change to channel id
            
            if(profiles[i].kd != value[0]){
                let data = {
                    activisionId: profiles[i].activisionId,
                    name: profiles[i].name,
                    kd: value[0],
                    wins: profiles[i].wins
                }

                console.log(JSON.stringify(data))
                updateProfile(data)
                //embed with discord.js if changes made

                if(profiles[i].kd < value[0]){
                    //positive
                    const exampleEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(id)
                    .setThumbnail("https://img-premium.flaticon.com/png/512/2268/premium/2268143.png?token=exp=1633545155~hmac=039e8a1942810cb3b978e2456fab3f7b")
                    .addFields(
                        { name: 'Progress!', value: id + " now has " + value[0] + " K/D", inline: true},
                    )
                    .setTimestamp()
                    .setFooter('WarzoneStats');
                    channel.send({ embeds: [exampleEmbed] });

                }
                if(profiles[i].kd > value[0]){
                    //negative
                    const exampleEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(id)
                    .setThumbnail("https://img-premium.flaticon.com/png/512/2268/premium/2268142.png?token=exp=1633545788~hmac=5eb707878f12d1edaaa9ff55ed341415")
                    .addFields(
                        { name: 'Snap out of it!', value: id + " now has " + value[0] + " K/D", inline: true},
                    )
                    .setTimestamp()
                    .setFooter('WarzoneStats');
                    channel.send({ embeds: [exampleEmbed] });
                }

            }

            if(profiles[i].wins < value[1]){
                let data = {
                    activisionId: profiles[i].activisionId,
                    name: profiles[i].name,
                    kd: profiles[i].kd,
                    wins: value[1]
                }
                
                console.log(JSON.stringify(data))
                updateProfile(data)
                //embed with discord.js if changes made

                const exampleEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(id)
                .setThumbnail("https://img-premium.flaticon.com/png/512/2268/premium/2268143.png?token=exp=1633545155~hmac=039e8a1942810cb3b978e2456fab3f7b")
                .addFields(
                    { name: 'Victory!', value: id+ " now has " + value[1] + " wins!", inline: true},
                )
                .setTimestamp()
                .setFooter('WarzoneStats');
    
                channel.send({ embeds: [exampleEmbed] });

            }
        });
    }

}

setInterval(function(){ 
    console.log("Running update")
    scheduledUpdate();
}, 300000);

