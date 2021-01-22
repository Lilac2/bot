const vm =   require('vm'),
      util = require('util')

module.exports = function(context) {
    this.name = 'developer'
    this.description = 'Tools for developers of Lilac2.'
    this.hidden = true

    this.commands = {
        cache: {
            description: 'Dumps the cache for this guild.',
            developerOnly: true,
            callback: message => {
                let prettyString = JSON.stringify(context.database.cache.guild.fetch(message.guild.id), null, '\t')

                message.channel.send({
                    embed: {
                        title: `${message.guild.name} Cache`,
                        description: `\`\`\`json\n${prettyString}\n\`\`\``
                    }
                })
            }
        },
        'toggle-dev-mode': {
            description: 'Toggles whether the bot is in developer mode, where it ignores messages from non-developers.',
            developerOnly: true,
            callback: message => {
                let embed = {
                    title: "Toggled Dev Mode",
                    description: null
                }
                if (context.client.user.presence.status !== 'dnd') {
                    context.client.user.setPresence({ status: 'dnd' })
                    embed.description = "Dev mode is now `enabled`."
                } else {
                    context.client.user.setPresence({ status: 'online' })
                    embed.description = "Dev mode is now `disabled`."
                }
                message.channel.send({ embed: embed })
            }
        },
        eval: {
            description: 'Evaluate JS in a Node enviroment.',
            developerOnly: true,
            minArgs: 1,
            maxArgs: 1000,
            arguments: ['eval-string'],
            callback: (message, arguments) => {
                if (message.author.id !== context.config.bot.owner) {
                    message.channel.send({ embed: { title: "No!", description: "<@!" + context.config.bot.owner + "> hates ppl other than them using eval" } })
                    return
                }

                let evalStringAry = arguments._leftoverArgs || [arguments['eval-string']]
                if (arguments._leftoverArgs) evalStringAry.unshift(arguments['eval-string'])

                let evalString = ''
                evalStringAry.forEach(str => {
                    if (str === '') {
                        evalString += ' '
                    } else {
                        evalString += str + ' '
                    }
                })

                try {
                    const result = eval(`${evalString}`)
                    message.channel.send({
                        embed: {
                            title: 'Eval Result',
                            description: `\`\`\`js\n${result}\n\`\`\``
                        }
                    })
                } catch (err) {
                    message.channel.send({
                        embed: {
                            title: 'Eval Result',
                            description: `\`\`\`js\n${err}\n\`\`\``
                        }
                    })
                }
            }
        },
        'safe-eval': {
            description: 'Safely evaluate JS without global scope.',
            minArgs: 1,
            maxArgs: 1000,
            developerOnly: true,
            arguments: ['eval-string'],
            callback: (message, arguments) => {
                let evalStringAry = arguments._leftoverArgs || [arguments['eval-string']]
                if (arguments._leftoverArgs) evalStringAry.unshift(arguments['eval-string'])

                let evalString = ''
                evalStringAry.forEach(str => {
                    if (str === '') {
                        evalString += ' '
                    } else {
                        evalString += str + ' '
                    }
                })

                try {
                    const result = vm.runInNewContext(evalString)
                    message.channel.send({
                        embed: {
                            title: 'Eval Result',
                            description: `\`\`\`js\n${result}\n\`\`\``
                        }
                    })
                } catch (err) {
                    message.channel.send({
                        embed: {
                            title: 'Eval Result',
                            description: `\`\`\`js\n${err}\n\`\`\``
                        }
                    })
                }
            }
        },
        restart: {
            description: 'Restarts bot.',
            developerOnly: true,
            callback: async  message => {
                let resetMessage = await message.channel.send({
                    embed: {
                        title: 'Restarting bot...',
                        description: 'The bot is restarting...'
                    }
                })
                await context.client.destroy()
                //await context.database.cache.updateEntireCache()
                await context.client.login(context.config.bot.token)
                await message.channel.send({
                    embed: {
                        title: 'Bot restarted!',
                        description: `Bot reset in **${(Date.now() - resetMessage.createdTimestamp) / 1000} seconds**.`
                    }
                })
            }
        },
        kill: {
            description: 'Kill the bot.',
            developerOnly: true,
            callback: () => process.exit()
        },
        blacklist: {
            description: 'Blacklist a guild or user.',
            developerOnly: true,
            minArgs: 2,
            maxArgs: 2,
            arguments: ['user|guild', 'user-id|guild-id'],
            callback: async (message, arguments) => {
                switch (arguments['user|guild']) {
                    case 'user':
                        await context.database.blacklist.user.add(arguments['user-id|guild-id'])
                        await message.channel.send('user blacklisted message placeholder')
                        break
                    case 'guild':
                        await context.database.blacklist.guild.add(arguments['user-id|guild-id'])
                        await message.channel.send('guild blacklisted message placeholder')
                        break
                    default:
                        await message.channel.send('argument 1 must be "user" or "guild" placeholder error')
                        return
                        break
                }
                await context.database.cache.blacklist.updateBlacklistCache()
            }
        },
        unblacklist: {
            description: 'Unblacklist a guild or user.',
            developerOnly: true,
            minArgs: 2,
            maxArgs: 2,
            arguments: ['user|guild', 'user-id|guild-id'],
            callback: async (message, arguments) => {
                switch (arguments['user|guild']) {
                    case 'user':
                        await context.database.blacklist.user.remove(arguments['user-id|guild-id'])
                        await message.channel.send('user unblacklisted message placeholder')
                        break
                    case 'guild':
                        await context.database.blacklist.guild.remove(arguments['user-id|guild-id'])
                        await message.channel.send('guild unblacklisted message placeholder')
                        break
                    default:
                        await message.channel.send('argument 1 must be "user" or "guild" placeholder error')
                        return
                        break
                }
                await context.database.cache.blacklist.updateBlacklistCache()
            }
        },
        rebuildcache: {
            description: 'Forces the bot to rebuild cache from database',
            developerOnly: true,
            callback: async message => {
                const rebuildMessage = await message.channel.send({
                    embed: {
                        title: 'Rebuilding Cache for Lilac2',
                        description: 'The cache for all guilds is being rebuilt from the database...'
                    }
                })
                await context.database.cache.updateEntireCache()
                await message.channel.send({
                    embed: {
                        title: 'Cache Rebuilt',
                        description: `Rebuilt the cache for **${Object.keys(context.database.cache.guild._guilds).length} guilds** in **${(Date.now() - rebuildMessage.createdTimestamp) / 1000} seconds**.`
                    }
                })
            }
        }
    }
}