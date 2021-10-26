import DiscordJS, { Intents, MessageAttachment, MessageEmbed } from 'discord.js'
import dotenv from 'dotenv'
import fetch from "node-fetch";
import builders, { userMention } from "@discordjs/builders";


dotenv.config();

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
})

client.on('ready', () => {
    console.log("Bot is ready")
    client.user.setPresence({ activities: [{ name: '!statscommands' }], status: 'online' });
})

client.on('messageCreate', (message) => {
    let splitMsg = message.content.split(" ");

    if (message.content === "!statscommands") {
        message.reply("`!stats **activisionID**` receive current stats on profile \n`!sub **activisionID**` subscribe to live feed with changes in K/D and Wins");
    }

    if (message.content === "!leaderboard") {

        getLeaderboard().then(data => {
            const attachment = new DiscordJS.MessageAttachment('./images/trophy.png')


            const exampleEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle("PR Leaderboard")
                .setThumbnail('attachment://trophy.png')
                .setTimestamp()
                .setFooter('WarzoneStats');

            for (let i = 0; i < data.length; i++) {
                if (i == 0) {
                    data[i].name = data[i].name + ":first_place:"
                } else if (i == 1) {
                    data[i].name = data[i].name + ":second_place:"
                } else if (i == 2) {
                    data[i].name = data[i].name + ":third_place:"
                }
                exampleEmbed.addField(String(data[i].name), String(data[i].pr) + " kills")
            }

            message.reply({ embeds: [exampleEmbed], files: [attachment] });
        });
    }


    if (splitMsg[0] == '!stats' && message.content.length > 6) {

        const sentId = splitMsg[1].replace("#", "%23");


        getProfile(`https://api.tracker.gg/api/v2/warzone/standard/profile/atvi/${sentId}?type=wz`).then(data => {

            const attachment = new DiscordJS.MessageAttachment('./images/warzonelogo.png')


            const exampleEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(splitMsg[1])
                .setImage('attachment://warzonelogo.png')
                .addFields(
                    { name: 'K/D', value: String(data.kd), inline: true },
                    { name: 'Kills', value: String(data.kills), inline: true },
                    { name: 'Deaths', value: String(data.deaths), inline: true },
                    { name: 'Wins', value: String(data.wins), inline: true },
                    { name: 'Games Played', value: String(data.gamesPlayed), inline: true },
                    { name: 'Time Played', value: String(data.hoursPlayed) + " hours", inline: true }
                )
                .setTimestamp()
                .setFooter('WarzoneStats');

            message.reply({ embeds: [exampleEmbed], files: [attachment] });

        });
    }



    if (splitMsg[0] == '!sub' && message.content.length > 4) {

        saveProfile(splitMsg[1], message).then(data => {
        })
    }

})

client.login(process.env.TOKEN)













/*--------------------------------------*/
/*                                      */
/*                                      */
/*              ---!stats---            */
/*                                      */
/*                                      */
/*--------------------------------------*/

async function getProfile(url) {
    const resp = await fetch(url,
        {
            "method": "GET",
            "origin": "cors"
        })
    const respData = await resp.json()

    const profileData = {
        kd: respData.data.segments[1].stats.kdRatio.value,
        wins: respData.data.segments[1].stats.wins.value,
        kills: respData.data.segments[1].stats.kills.value,
        deaths: respData.data.segments[1].stats.deaths.value,
        gamesPlayed: respData.data.segments[1].stats.gamesPlayed.value,
        hoursPlayed: Math.floor(respData.data.segments[1].stats.timePlayed.value / 3600)
    }
    if(respData.data === undefined){
        message.reply("Failed to fetch profile. This could be a glitch in cod.tracker.gg. \nPlease wait 5 minutes and try again. If problems persists contact Gehrke#9749" + id);
        return;
    }
    return profileData;
}





/*--------------------------------------*/
/*                                      */
/*                                      */
/*         ---!sub schedule---          */
/*                                      */
/*                                      */
/*--------------------------------------*/



const azureAPI = `https://warzonestatswebapp.azurewebsites.net`
//const azureAPI = `http://localhost:8080`

async function saveProfile(id, message) {
    const url = `https://api.tracker.gg/api/v2/warzone/standard/profile/atvi/${id.replace("#", "%23")}?type=wz`

    //Get Profile FROM API
    const respProfile = await fetch(url,
        {
            "method": "GET",
            "origin": "cors"
        })
    const respProfileData = await respProfile.json()
    //Get PR from profile API

    const respPR = await fetch(`https://api.tracker.gg/api/v2/warzone/standard/profile/atvi/${id.replace("#", "%23")}/segments/best-matches?`,
        {
            "method": "GET",
            "origin": "cors"
        })

    const respPRData = await respPR.json()

    if(respProfileData.data === undefined || respPRData.data === undefined){
        message.reply("Failed to fetch profile. This could be a glitch in cod.tracker.gg. \nPlease wait 5 minutes and try again. If problems persists contact Gehrke#9749" + id);
        return;
    }

    let pr = null;

    for (let i = 0; i < respPRData.data.length; i++) {
        if (respPRData.data[i].metadata.modeName.indexOf('Resurgence') >= 0) {
            continue;
        }if(respPRData.data[i].attributes.id == "8964578853856064999"){
            continue;
        }else if(respPRData.data[i].attributes.id == "17102972019680790249"){
            continue;
        }
        pr = respPRData.data[i].stats.kills.value;
        break;
    }


    const profileData = {
        kd: respProfileData.data.segments[1].stats.kdRatio.value,
        wins: respProfileData.data.segments[1].stats.wins.value,
        pr: pr
    }


    let splitId = id.split("#");

    let data = {
        activisionId: splitId[1],
        name: splitId[0],
        kd: profileData.kd,
        wins: profileData.wins,
        pr: profileData.pr,
        discord: message.author.id.toString()
    }


    await fetch(azureAPI + `/profile`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })


    message.reply("You will now recieve live updates in <#894931912446050396> on K/D, PR and Wins from " + id);
}



async function getProfiles() {
    const resp = await fetch(azureAPI + `/profiles`);
    const respData = await resp.json();

    return respData;
}

async function updateProfile(profile) {
    await fetch(azureAPI + `/profile/update`, {
        method: "PUT",
        body: JSON.stringify(profile),
        headers: { "Content-type": "application/json; charset=UTF-8" }
    })
}



async function scheduledUpdate() {

    let profiles = [{}]
    profiles = await getProfiles();


    for (let i = 0; i < profiles.length; i++) {
        let id = profiles[i].name + "#" + profiles[i].activisionId;


        const url = `https://api.tracker.gg/api/v2/warzone/standard/profile/atvi/${id.replace("#", "%23")}?type=wz`

        //Get Profile FROM API
        const respProfile = await fetch(url,
            {
                "method": "GET",
                "origin": "cors"
            })
        const respProfileData = await respProfile.json()
        //Get PR from profile API

        const respPR = await fetch(`https://api.tracker.gg/api/v2/warzone/standard/profile/atvi/${id.replace("#", "%23")}/segments/best-matches?`,
            {
                "method": "GET",
                "origin": "cors"
            })

        const respPRData = await respPR.json()

        let pr = null;

        if(respPRData.data === undefined || respProfileData.data === undefined){ // may need work
            continue;
        }

        for (let i = 0; i < respPRData.data.length; i++) {
            if (respPRData.data[i].metadata.modeName.indexOf('Resurgence') >= 0) {
                continue;
            }
            if(respPRData.data[i].attributes.id == "8964578853856064999"){
                continue;
            }else if(respPRData.data[i].attributes.id == "17102972019680790249"){
                continue;
            }
            pr = respPRData.data[i].stats.kills.value;
            break;
        }


        const profileData = {
            kd: respProfileData.data.segments[1].stats.kdRatio.value,
            wins: respProfileData.data.segments[1].stats.wins.value,
            pr: pr
        }



        let channel = client.channels.cache.get("894931912446050396") //change to channel id



        if (profiles[i].kd != profileData.kd) { //IF old kd is not new kd 
            let data = {
                activisionId: profiles[i].activisionId,
                name: profiles[i].name,
                kd: profileData.kd,
                wins: profileData.wins,
                pr: profileData.pr,
                discord: profiles[i].discord
            }
            const discordUser = userMention(profiles[i].discord);

 
            updateProfile(data)

            if (profiles[i].kd < profileData.kd) { //IF old kd is lower than new kd
                //positive
                const attachment = new DiscordJS.MessageAttachment('./images/upwardarrow.png')

                const exampleEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(id)
                    .setThumbnail('attachment://upwardarrow.png')
                    .addFields(
                        { name: 'Progress!', value: id + " now has " + String(profileData.kd) + " K/D", inline: true },
                    )
                    .setTimestamp()
                    .setFooter('WarzoneStats');
                channel.send({ content: discordUser, embeds: [exampleEmbed], files: [attachment] });

            }
            if (profiles[i].kd > profileData.kd) { //IF old kd is higher than new KD
                //negative
                const attachment = new DiscordJS.MessageAttachment('./images/downarrow.png')

                const exampleEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(id)
                    .setThumbnail('attachment://downarrow.png')
                    .addFields(
                        { name: 'Snap out of it!', value: id + " now has " + String(profileData.kd) + " K/D", inline: true },
                    )
                    .setTimestamp()
                    .setFooter('WarzoneStats');
                channel.send({ content: discordUser, embeds: [exampleEmbed], files: [attachment] });
            }

        }

        if (profiles[i].wins < profileData.wins) { //IF old wins is lower than new wins
            let data = {
                activisionId: profiles[i].activisionId,
                name: profiles[i].name,
                kd: profileData.kd,
                wins: profileData.wins,
                pr: profileData.pr,
                discord: profiles[i].discord
            }

            const discordUser = userMention(profiles[i].discord);

  
            updateProfile(data)
            //embed with discord.js if changes made
            const attachment = new DiscordJS.MessageAttachment('./images/upwardarrow.png')

            const exampleEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(id)
                .setThumbnail('attachment://upwardarrow.png')
                .addFields(
                    { name: 'Victory!', value: id + " now has " + String(profileData.wins) + " wins!", inline: true },
                )
                .setTimestamp()
                .setFooter('WarzoneStats');

            channel.send({ content: discordUser, embeds: [exampleEmbed], files: [attachment] });

        }

        if (profiles[i].pr < profileData.pr) { //IF old pr is lower than new pr
            let data = {
                activisionId: profiles[i].activisionId,
                name: profiles[i].name,
                kd: profileData.kd,
                wins: profileData.wins,
                pr: profileData.pr,
                discord: profiles[i].discord
            }

            const discordUser = userMention(profiles[i].discord);

  
            updateProfile(data)
            //embed with discord.js if changes made
            const attachment = new DiscordJS.MessageAttachment('./images/upwardarrow.png')

            const exampleEmbed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(id)
                .setThumbnail('attachment://upwardarrow.png')
                .addFields(
                    { name: 'New PR!', value: id + " now has a " + String(profileData.pr) + " kill PR game!", inline: true },
                )
                .setTimestamp()
                .setFooter('WarzoneStats');

            channel.send({ content: discordUser, embeds: [exampleEmbed], files: [attachment] });
        }
    }

}

async function getLeaderboard() {

    let profiles = [{}]
    profiles = await getProfiles();

    let leaderboard = []

    for (let i = 0; i < profiles.length; i++) {
        leaderboard.push({
            name: profiles[i].name,
            pr: profiles[i].pr
        })

   
    }
    leaderboard.sort(compare);
 

    return leaderboard;


}

function compare(a, b) {
    if (a.pr < b.pr) {
        return 1;
    }
    if (a.pr > b.pr) {
        return -1;
    }
    return 0;
}

setInterval(function () {
    console.log("Running update")
    scheduledUpdate();
}, 300000);

scheduledUpdate();