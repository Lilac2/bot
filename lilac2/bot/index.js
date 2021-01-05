const Discord = require('discord.js'),
      config  = require('../config.js')
      os      = require('os')

const lilac = new Discord.Client(),
      db    = require('../database/index.js')


let lilacServer = require('./lilac_server.js')(lilac),
    context     = require('./context.js')(lilac, db, lilacServer)



/* calls all the hooks for a given discord.js event type */
function callHooks(hookName, ...args) {
    context.hooks[hookName].forEach(hook => {
        hook(...args)
    })
}



lilac.on('message', async message => {
    /* bot ignore message cases */
    if (message.author.bot)                                                                  return   // ignore messages from bots 
    if (!message.guild)                                                                      return   // ignore messages in dms        
    if (lilac.user.presence.status === 'dnd' && !context.isUserDeveloper(message.author.id)) return   // ignore messages in dnd unless from bot developer
    if (context.database.cache.blacklist.isUserBlacklisted(message.author.id))                             return   // ignores messages from blacklisted users
    if (context.database.cache.blacklist.isGuildBlacklisted(message.guild.id)) { message.guild.leave();    return } // ignores messages from blacklisted guilds, and also leaves the guild
    

    /* get cache for guild, if it isn't stored in cache, update cache */
    let guildCache
    if (!context.database.cache.guild.exists(message.guild.id)) await context.database.cache.guild.updateGuildCache(message.guild.id)
    if (!context.database.cache.guild.exists(message.guild.id)) await context.database.guild.add(message.guild) // if still not in cache, add guild to database
    guildCache = context.database.cache.guild.fetch(message.guild.id)
    

    /* if the bot is pinged, reply with this message including prefix for guild */
    if (message.isMentioned(lilac.user)) {
        message.channel.send({embed: {
            title: 'Hiya!',
            description: `Hey there, my prefix is \`${guildCache.prefix}\`! Try running \`${guildCache.prefix} help\`!`,
            color: context.embedColors.lilac
        }})
     }


    /* cleans the message by replace special characters that might break the bot */
    const cleanMessageContent = message.content.replace([
        0x202E
    ], '') 
    

    if (cleanMessageContent.startsWith(guildCache.prefix)) {
        const splitMessage = cleanMessageContent.split(' ') // split the message by single spaces
        let   commandName  = cleanMessageContent.split(guildCache.prefix)[1].split(/(\s+)/)[0]
        
        if (commandName === '') commandName = splitMessage[1]


        const cooldown = context.commandCooldown[commandName] 
        if (cooldown) {
            if (cooldown[message.author.id]) {
                message.channel.send({embed: {
                    color:       context.embedColors.error                                     ,     
                    title:       "You're still on cooldown for this command!"                  ,
                    description: `**${cooldown[message.author.id] / 1000} seconds** remaining.`
                }})
                return 
            }
        }


        if (context.commands[commandName]) {
            const command   = context.commands[commandName] ? context.commands[commandName] : context.commands[splitMessage[1]]
            let arguments

            /* this mysterious tidbit of code works when it technically it shouldn't? */
            if (commandName !== splitMessage[1]) {
                const prefixIndex = cleanMessageContent.indexOf(guildCache.prefix)
                const withoutPrefix = cleanMessageContent.slice(0, prefixIndex) + cleanMessageContent.slice(prefixIndex + guildCache.prefix.length)  
                arguments = withoutPrefix.split(' ').slice(1)
            } else {
                arguments = splitMessage.slice(2, splitMessage.length)
            }


            if (!context.database.cache.guild.isExtensionEnabled(message.guild.id, command.extensionFrom)) return // extension command is in disabled for guild, ignore

            /* command is developer only and user is not developer */
            if (command.developerOnly && !context.isUserDeveloper(message.author.id)) {
                message.channel.send({embed: {
                    color: context.embedColors.error,
                    title: 'Developer Only',
                    description: 'Sorry, this command is reserved for Lilac2 developers.'
                }})
                return
            }
            
            if ((command.requiredPerms)) {
                if (!message.member.hasPermission(command.requiredPerms)) {
                    message.channel.send({embed: {
                        color: context.embedColors.error                                ,
                        title:       'Missing Permission'                             ,
                        description: `This command requires: ${command.requiredPerms}`
                    }})
                    return
                }
            }

            const maxArgs = command.maxArgs || 0
                  minArgs = command.minArgs || 0

            if ((arguments.length < minArgs) || (arguments.length > maxArgs)) {   
                let argAry = []
                if (command.arguments) {
                    argAry = command.arguments.map(arg => `\`<${arg}>\``)
                }   

                message.channel.send({embed: {
                    color:       context.embedColors.error                                                                                                             ,
                    title:       'Wrong Number of Arguments'                                                                                                           ,
                    description: `The command \`${commandName}\` takes **${minArgs}** to **${maxArgs}** arguments: ${argAry}`
                }})
                return 
            }

            let argumentObject = {}
            if (command.arguments) {
                if (arguments.length > 0) {
                    let argPos = 0
                    command.arguments.forEach(argument => {
                        argumentObject[argument] = arguments[argPos]
                        argPos++
                    })
                    if (argPos < arguments.length) {
                        argumentObject._leftoverArgs = []
                        while (argPos < arguments.length) { 
                            argumentObject._leftoverArgs.push(arguments[argPos])
                            argPos++
                        }
                    }
                }
            }

            if (cooldown) context.commandCooldown[commandName][message.author.id] = command.cooldown // add user to command's cooldown if it has one

            if (config.bot.setTyping === true) await message.channel.startTyping()

            try {
                const possiblePromise = command.callback(message, argumentObject)
                if (possiblePromise) {
                    possiblePromise.then(() => {
                        if (config.bot.setTyping === true) message.channel.stopTyping()
                    })
                } else {
                    if (config.bot.setTyping === true) message.channel.stopTyping()
                }
            } catch(err) {
                // TODO - thorough error logging
            }
            
        } 
        
    }

    callHooks('message', message)
})

lilac.on('guildCreate', guild => {
    if (context.database.cache.blacklist.isGuildBlacklisted(guild.id)) { guild.leave(); return } // leave the server if the guild is blacklisted and don't add to database
    
    context.database.guild.add(guild)
        .then(() => {
            lilacServer.logToStream({embed: {
                color: context.embedColors.lilac,
                title: 'Joined Server!',
                description: `I'm in ${Object.keys(context.database.cache.guild._guilds).length} servers now!`
            }})

            callHooks('guildCreate', guild)
        })
})

lilac.on('guildDelete', guild => {
    context.database.guild.remove(guild.id)
        .then(() => {
            lilacServer.logToStream({embed: {
                title: 'Left Server'
            }})

            callHooks('guildDelete', guild)
        })
})

lilac.on('error', error => {
    lilacServer.log('error', {embed: {
        title: 'error',
        description: `\`\`\`\n${error}\n\`\`\``
    }})
    callHooks('error', error)
})

lilac.on('ready', () => {
    /* initially build cache from database */
    console.log('Building cache from database...')
    context.database.cache.updateEntireCache() 
        .then(() => {
            console.log('Cache built!')

            lilacServer.guild = lilac.guilds.get(config.bot.server.id)

            /* start the bots api */
            if (!context.apiInitiated) {
                console.log('Starting API server...')
                require('../api/index.js')(context)
                context.apiInitiated = true
            }
  
            console.log('Bot is ready and listening!')
            callHooks('ready') // call hooks for ready event
        })

    /* changes presence every x seconds */
    let presenceCount = 0
    lilac.setInterval(() => {
        const lilacPresences = [
            {   
                game: {
                    type: 'WATCHING',
                    name: `for pings!`
                }
            },
            {
                game: {
                    type: 'LISTENING',
                    name: `${lilac.guilds.size} servers!`
                }
            },
            {
                game: {
                    type: 'PLAYING', 
                    name: `with ${Math.round((os.totalmem() - os.freemem()) / 10000000)}/${Math.round(os.totalmem() / 10000000)}mb of ram!`
                }
            }
        ]

        if (presenceCount === lilacPresences.length) presenceCount = 0
        lilac.user.setPresence(lilacPresences[presenceCount])
        presenceCount++
    }, 5000)
})



/* load bot extensions */ 
require('./loader.js')(context) 




/* dynamically create client.on events for hooks */

const hookIgnoreList = [
    'message', 
    'guildCreate', 
    'guildDelete', 
    'error', 
    'ready'
] // the hooks for the hook creator to ignore, these need to be manually defined

for (let hook in context.hooks) {
    if (!hookIgnoreList.includes(hook)) {
        lilac.on(hook, (...args) => {
            callHooks(hook, ...args)
        })
    }
}



/* cooldown for bot */
for (let command in context.commands) {
    if (context.commands[command].cooldown) context.commandCooldown[command] = { /*<user-id>: timeRemaining*/ }
}

/*
    if user cooldown timer is less than or equal to 0, remove them from cooldown
    if not, subtract 1000 ms
*/
lilac.setInterval(() => {
    for (let command in context.commandCooldown) {
        for (let user in context.commandCooldown[command]) {
            if (context.commandCooldown[command][user] <= 0) {
                delete context.commandCooldown[command][user]
            } else {
                context.commandCooldown[command][user] -= 1000
            }
        }
    }
}, 1000)


lilac.login(config.bot.token) // login to the lilac client