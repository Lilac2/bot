module.exports = function (context) {
    this.name = 'standard'
    this.description = 'The standard commands for Lilac2.'
    this.commands = {
        help: {
            description: 'Get a list of commands for the bot.',
            maxArgs: 1,
            arguments: ['extension'],
            callback: (message, arguments) => {
                const guildId = message.guild.id
                if (arguments.extension) {
                    if (!context.extensions[arguments.extension]) { 
                        message.channel.send({embed: {
                            color: context.embedColors.error,
                            title: 'Extension Not Found',
                            description: `Sorry, I can't find an extension named "${arguments.extension}" so I can't give you the commands for it!`
                        }})   
                        return
                    }
                    if (!context.cache.guild.isExtensionEnabled(guildId, arguments.extension)) { 
                        message.channel.send({embed: {
                            color: context.embedColors.error,
                            title: 'Extension Not Enabled',
                            description: 'If you would like to see the commands for this extension, please enable it using `toggle`.'
                        }})
                        return 
                    }
                }   


                const usableCommands     = context.filterCommandsForMember(message.member)
                const usableForExtension = usableCommands.filter(command => {
                    if (context.cache.guild.isExtensionEnabled(guildId, context.commands[command].extensionFrom)) {
                        if (arguments.extension) {
                            if (context.commands[command].extensionFrom === arguments.extension) return command
                        } else { 
                            return command
                        }
                    } 
                })
                usableForExtension.sort()

                
                const totalPages = Math.ceil(usableForExtension.length / 9)
                function createEmbedFields(startingIndex=0) {
                    let columns = [
                        [],
                        [],
                        []
                    ]
                    let columnToWorkOn = 0
                    for (let index = startingIndex; index < usableForExtension.length; index++) {
                        if (columnToWorkOn > 2) break
                        if (columns[columnToWorkOn].length === 3) columnToWorkOn++
                        if (columns[2].length === 3) break
                        
                        columns[columnToWorkOn].push(usableForExtension[index])
                    }

                    let embedFields = []
                    columns.forEach((column, index) => {
                        column.forEach(commandName => {
                            if (context.commands[commandName]) {
                                embedFields.push({
                                    name: commandName,
                                    value: context.commands[commandName].description,
                                    inline: true
                                })
                            }
                        })
                        /*
                        if (index !== 2) embedFields.push({
                            name: '\u200b',
                            value: '\u200b',
                            inline: false
                        })
                        */
                    })

                    return embedFields
                }

                message.channel.send({embed: {
                    color: context.embedColors.lilac,
                    title: arguments.extension ? `Commands [${arguments.extension}]` : 'Commands',
                    fields: createEmbedFields(),
                    footer: {
                        text: totalPages > 1 ? `Page 1/${totalPages}` : '',
                        icon_url: message.author.avatarURL
                    }
                }}).then(msg => {
                    if (usableForExtension.length > 9) msg.react('◀️').then(() => msg.react('▶️'))

                    const filter = (reaction, user) => ['◀️', '▶️'].includes(reaction.emoji.name) && user.id === message.author.id
                    const collector = msg.createReactionCollector(filter, {time: 60000})
                    
                    let index = 0
                    let page = 1
                    collector.on('collect', reaction => {
                        reaction.remove(message.author.id)

                        if (reaction.emoji.name === '▶️') {
                            index += 9
                            page++
                        }

                        if (reaction.emoji.name === '◀️') {
                            index -= 9
                            page--
                        }

                        if (index >= usableForExtension.length) index = 0   , page = 1
                        if (index < 0) index = usableForExtension.length - 5, page = totalPages

                        msg.edit({embed: {
                            color: context.embedColors.lilac,
                            title: arguments.extension ? `Commands [${arguments.extension}]` : 'Commands',
                            fields: createEmbedFields(index),
                            footer: {
                                text: `Page ${page}/${totalPages}`,
                                icon_url: message.author.avatarURL
                            }
                        }})
                    })

                    collector.on('end', () => msg.clearReactions())
                })
            }
        },
        prefix: {
            description: 'View or change the prefix for the bot.',
            requiredPerms: ['MANAGE_GUILD'],
            cooldown: 5000,
            maxArgs: 1,
            arguments: ['prefix'],
            callback: (message, arguments) => {
                const guildId = message.guild.id,
                    oldPrefix = context.cache.guild.fetch(guildId).prefix

                if (!arguments.prefix) {
                    message.channel.send({
                        embed: {
                            color: context.embedColors.lilac,
                            title: `The prefix is \`${oldPrefix}\`!`,
                            description: `Give it a whirl, try out \`${oldPrefix} help\`!`
                        }
                    })
                    return
                }

                if (arguments.prefix === oldPrefix) {
                    message.channel.send({
                        embed: {
                            color: context.embedColors.error,
                            title: `Prefix is already \`${oldPrefix}\`!`,
                            description: "You can't change it to the same thing, silly!"
                        }
                    })
                    return
                }

                context.database.guild.changePrefix(guildId, arguments.prefix).then(() => {
                    context.cache.guild.updateGuildCache(guildId).then(() => {
                        message.channel.send({embed: {
                            color: context.embedColors.success,
                            title: 'Prefix updated!',
                            description: `The prefix has been updated from \`${oldPrefix}\` to \`${arguments.prefix}\`!`
                        }})
                    })
                })
            }
        },
        latency: {
            description: 'Test the latency of the bot.',
            callback: message => {
                message.channel.send({
                    embed: {
                        color: context.embedColors.lilac,
                        title: 'Latency',
                        description: `${Date.now() - message.createdTimestamp} milliseconds`
                    }
                })
            }
        },
        toggle: {
            description: 'Toggle an extension on or off for this guild.',
            requiredPerms: ['MANAGE_GUILD'],
            cooldown: 5000,
            minArgs: 1,
            maxArgs: 1,
            arguments: ['extension'],
            callback: async (message, arguments) => {
                if (arguments.extension === 'standard') {
                    await message.channel.send({
                        embed: {
                            color: context.embedColors.error,
                            title: "You can't disable the **standard** extension, silly!",
                            description: 'If you did, the bot would be useless!'
                        }
                    })
                    return
                }

                if (arguments.extension === 'developer') {
                    if (!context.isUserDeveloper(message.author.id)) {
                        await message.channel.send({
                            embed: {
                                color: context.embedColors.error,
                                title: 'Developer Only',
                                description: 'The `developer` extension is limited to Lilac2 developers, sorry!'
                            }
                        })
                        return
                    }
                }

                if (arguments.extension in context.extensions) {
                    const guildId = message.guild.id
                    let toggleStatus

                    if (context.cache.guild.isExtensionEnabled(guildId, arguments.extension)) {
                        await context.database.guild.disableExtension(guildId, arguments.extension)
                        toggleStatus = 'disabled'
                    } else {
                        await context.database.guild.enableExtension(guildId, arguments.extension)
                        toggleStatus = 'enabled'
                    }

                    await context.cache.guild.updateGuildCache(guildId)
                    await message.channel.send({
                        embed: {
                            color: context.embedColors.success,
                            title: `Extension ${toggleStatus}! :thumbsup:`,
                            description: `The extension **${arguments.extension}** has been **${toggleStatus}**!`
                        }
                    })
                } else {
                    await message.channel.send({embed: {
                        color: context.embedColors.error,
                        title: 'Extension Not Found',
                        description: `Uh oh, looks like there's no extension named "${arguments.extension}". Sorry!`
                    }})
                }
            }
        },
        about: {
            description: 'About the Lilac2 bot.',
            callback: async message => {
                let developersField = {
                    name: 'Developers',
                    value: ''
                }

                for (let developer of context.config.developers) {
                    const developerUser = await context.client.fetchUser(developer)
                    developersField.value += `\n${developerUser.tag}`
                }

                let messageEmbed = {
                    title: 'About Lilac2',
                    thumbnail: { url: context.client.user.avatarURL },
                    fields: [
                        {
                            name: 'Version',
                            value: context.config.bot.version,
                        },
                        {
                            name: 'Github',
                            value: '[Lilac\'s source here!](https://github.com/Lilac2/bot)',
                            inline: true
                        },
                        {
                            name: 'Server',
                            value: '[Join here!](https://discord.gg/c2vdfJE7vz)',
                            inline: true
                        },
                        developersField
                    ]
                }

                await message.channel.send({ embed: messageEmbed })
            }
        },
        extensions: {
            description: 'View the available extensions and if they are enabled or disabled',
            callback: message => {
                let messageEmbed = {
                    color: context.embedColors.lilac,
                    title: 'Extensions',
                    fields: []
                }

                for (extension in context.extensions) {
                    let toggleStatus = '*disabled*'
                    const extensionObject = context.extensions[extension]

                    if (context.cache.guild.isExtensionEnabled(message.guild.id, extension)) toggleStatus = '***enabled***'

                    messageEmbed.fields.push({
                        name: `**${extension}**: ${toggleStatus}`,
                        value: extensionObject.description
                    })
                }

                message.channel.send({ embed: messageEmbed })
            }
        },
        say: {
            description: 'Make the bot say something!',
            requiredPerms: ['MANAGE_MESSAGES'],
            arguments: ['channel-id', 'to-say'],
            minArgs: 2,
            maxArgs: 1000,
            callback: (message, arguments) => {
                let channelId = arguments['channel-id']
                if (message.mentions.channels.size > 0) {
                    channelId = message.mentions.channels.first().id
                }

                const channel = message.guild.channels.get(channelId)

                if (!channel) {
                    message.channel.send('channel not found error')
                    return
                }

                let toSayAry = arguments._leftoverArgs || [arguments['to-say']]
                if (arguments._leftoverArgs) toSayAry.unshift(arguments['to-say'])

                let toSay = ''
                toSayAry.forEach(str => {
                    if (str === '') {
                        toSay += ' '
                    } else {
                        toSay += str + ' '
                    }
                })

                channel.startTyping()
                context.client.setTimeout(() => {
                    channel.stopTyping()
                    channel.send(toSay)
                }, toSay.length * 120)

                message.delete()
            }
        },
        permissions: {
            description: 'Lists the permissions the bot has in this server, useful for troubleshooting!',
            callback: message => {
                let permString = ''
                message.guild.me.permissions.toArray().forEach(perm => permString += `${perm}\n`)

                message.channel.send({embed: {
                    color: context.embedColors.lilac,
                    title: `Lilac2's Permissions in ${message.guild.name}`,
                    description: permString
                }})
            }
        },
        'inspect-command': {
            description: "This gives you detailed info about a command, use it if you're unsure how a command works!",
            minArgs: 1,
            maxArgs: 1,
            arguments: ['command-name'],
            callback: (message, arguments) => {
                if (!context.commands[arguments['command-name']]) {
                    message.channel.send('command not found placeholder error')
                    return
                }

                const command = context.commands[arguments['command-name']]

                let argumentString = ''
                if (command.arguments) command.arguments.forEach(argument => {
                    argumentString += ` \`${argument}\``
                })
                
                let usageArgumentString = ''
                if (command.arguments) command.arguments.forEach(argument => {
                    usageArgumentString += ` <${argument}>`
                })


                const messageEmbed = {
                    title: `Command: ${arguments['command-name']}`,
                    description: `*${command.description}*`,
                    fields: [
                        {
                            name: 'Usage',
                            value: `\`${context.database.cache.guild.fetch(message.guild.id).prefix} ${arguments['command-name']}${usageArgumentString}\``
                        },
                        {
                            name: 'Min. Arguments',
                            value: command.minArgs || 0,
                            inline: true 
                        },
                        {
                            name: 'Max. Arguments',
                            value: command.maxArgs || 0,
                            inline: true
                        },
                        {
                            name: 'Arguments',
                            value: command.arguments ?  argumentString : 'N/A'
                        },
                        {
                            name: 'In Extension',
                            value: command.extensionFrom,
                            inline: true
                        },
                        {
                            name: 'Requires Elevated Permissions?',
                            value: command.permissions ? 'true' : false,
                            inline: true
                        },
                        {
                            name: 'Developer Only?',
                            value: command.developerOnly ? `${command.developerOnly}` : 'false'
                        },
                        {
                            name: 'Cooldown?',
                            value: command.cooldown ? 'true' : 'false',
                            inline: true
                        },
                        {
                            name: 'Cooldown Duration',
                            value: command.cooldown ? `${command.cooldown / 1000} seconds` : 'N/A',
                            inline: true
                        }
                    ]
                }

                message.channel.send({embed: messageEmbed})
            }
        }
    }
}
