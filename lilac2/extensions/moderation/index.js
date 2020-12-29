module.exports = function (context) {
    this.name = 'moderation'
    this.description = 'An extension full of moderating tools.'

    const moderationDatabase = require('./database')(context.database.admin, context.database.firestore)

    context.botOn('ready', async () => await moderationDatabase.cache.updateCache())
    context.client.setInterval(async () => {
        for (const guildId in moderationDatabase.cache._guilds) {
            if (!context.cache.guild.isExtensionEnabled(guildId, 'moderation')) return

            const guild = await context.client.guilds.get(guildId)
            const guildCache = moderationDatabase.cache._guilds[guildId]

            guildCache.muted.forEach(async (mute, index) => {
                mute.duration -= 1
                if (mute.duration <= 0) {
                    const member = await guild.members.get(mute.id)

                    await member.removeRole(await guild.roles.get(guildCache.muteRole))
                    /*
                    mute.roles.forEach(async role => {
                        if (!await guild.roles.find(r => r.id === role.id)) return
                        await member.addRole(guild.roles.get(role))
                    })
                    */

                    moderationDatabase.cache._guilds[guildId].muted.splice(index, 1)
                    await moderationDatabase.unmuteUser(guildId, index, guildCache.muted)
                    await moderationDatabase.cache.updateCache(guildId)
                }
            })
        }

    }, 60000)

    context.client.setInterval(async () => {
        for (const guildId in moderationDatabase.cache._guilds) {
            if (!context.cache.guild.isExtensionEnabled(guildId, 'moderation')) return
            const guildCache = moderationDatabase.cache._guilds[guildId]
    
            for (const mute of guildCache.muted) mute.duration -= 30
           
            await context.database.firestore.collection('extensionStorage')
                .doc('moderation')
                .collection('guilds')
                .doc(guildId)
                .update({
                    muted: guildCache.muted
                })
            moderationDatabase.cache.updateCache(guildId)
        }

    }, 1800000) // 30 minutes = 1800000 ms

    context.botOn('guildMemberAdd', member => {
        if (!context.cache.guild.isExtensionEnabled(member.guild.id, 'moderation')) return
        if (!moderationDatabase.cache.exists(member.guild.id)) return

        const guildCache = moderationDatabase.cache.fetch(member.guild.id)

        if (!guildCache.muteRole) return

        guildCache.muted.forEach(mute => {
            if (mute.id === member.user.id) member.addRole(guildCache.muteRole)
        })
    })

    this.commands = {
        purge: {
            description: 'Purge an amount of messages from the channel this command is used in.',
            requiredPerms: ['MANAGE_CHANNELS'],
            minArgs: 1,
            maxArgs: 1,
            cooldown: 5000,
            arguments: ['amount'],
            callback: (message, arguments) => {
                if (isNaN(arguments.amount)) {
                    message.channel.send({
                        embed: {
                            title: "The `amount` argument must be a number from 1-100.",
                            color: context.embedColors.error
                        }
                    })
                    return
                }

                if (Number(arguments.amount) > 100 || Number(arguments.amount) < 1) {
                    message.channel.send({
                        embed: {
                            title: "The `amount` argument must be a number from 1-100.",
                            color: context.embedColors.error
                        }
                    })
                    return
                }

                message.channel.bulkDelete(Number(arguments.amount))
                    .then(() => {
                        message.channel.send('deleted messages placeholder')
                    })
            }
        },
        mute: {
            description: 'Mute a member for a certain amount of time, 5 minutes by default.',
            requiredPerms: ['MANAGE_MESSAGES'],
            minArgs: 1,
            maxArgs: 2,
            cooldown: 5000,
            arguments: ['user', '?time'],
            callback: async (message, arguments) => {
                /* NOTE: DURATION IS STORED AS MINUTES */
                if (!moderationDatabase.cache.exists(message.guild.id)) {
                    await moderationDatabase.addGuild(message.guild.id)
                    await moderationDatabase.cache.updateCache(message.guild.id)
                }

                const guildModCache = moderationDatabase.cache.fetch(message.guild.id)
                if (!guildModCache.muteRole) {
                    await message.channel.send({embed: {
                        color: context.embedColors.error,
                        title: 'No Mute Role Set',
                        description: "Hey, I cant mute anyone until you set a mute role!"
                    }})
                    return
                }

                if (!message.mentions.users.size) {
                    await message.channel.send({embed: {
                        color: context.embedColors.error,
                        title: "Can't Find User",
                        description: `I've looked everywhere, and I can't find anyone named "${arguments.user}" around here to mute.`
                    }})
                    return
                }

                if (message.mentions.users.first().id === context.client.user.id) {
                    await message.channel.send({embed: {
                        color: context.embedColors.error,
                        title: "I'm not gonna mute myself!",
                        description: 'Silly, did you really think I would mute myself?'
                    }})
                    return
                }

                const memberToMute = await message.guild.members.get(message.mentions.users.first().id)
                if (memberToMute.roles.some(role => role.id === guildModCache.muteRole)) {
                    await message.channel.send({embed: {
                        color: context.embedColors.error,
                        title: 'User Already Muted',
                        description: 'Looks like this user has already been muted for breaking the law around here. Or from an abusive moderator...'
                    }})
                    return
                }

                let duration = 5
                if (arguments['?time']) {
                    const timeString = arguments['?time']
                    const splitTimeString = timeString.split('')
                    const durationTime = splitTimeString.slice(0, -1).join('')

                    if (!isNaN(durationTime)) {
                        switch (splitTimeString[splitTimeString.length-1]) {
                            case 'm':
                                duration = Number(durationTime)
                                break
                            case 'h':
                                duration = Number(durationTime) * 60
                                break
                            case 'd':
                                duration = Number(durationTime) * 60 * 24
                                break
                            default:
                                await message.channel.send({embed: {
                                    color: context.embedColors.error,
                                    title: 'Invalid Time',
                                    description: `Looks like the argument for time, "${arguments['?time']}", is invalid. Valid times would include things like: **10m**, **2h**, or **1d**.`
                                }})
                                return
                        }

                        if (duration >= 525960) {
                            await message.channel.send({embed: {
                                color: context.embedColors.error,
                                title: "Can't Mute User That Long",
                                description: "As funny as it might be, I'm not able to mute users longer than 1 year. May I suggest a ban?"
                            }})
                            return
                        }
                    } else {
                        await message.channel.send({embed: {
                            color: context.embedColors.error,
                            title: 'Invalid Time',
                            description: `Looks like the argument for time, "${arguments['?time']}", is invalid. Valid times would include things like: **10m**, **2h**, or **1d**.`
                        }})
                        return
                    }
                }

                const muteRole = await message.guild.roles.get(guildModCache.muteRole)

                await memberToMute.roles.forEach(async role => await memberToMute.removeRole(role.id).catch(() => 0))

                memberToMute.addRole(muteRole).then(async () => {
                    let memberRoles = []
                    await memberToMute.roles.forEach(role => { 
                        if (role.name !== '@everyone') memberRoles.push(role.id) 
                    })

                    await moderationDatabase.muteUser(message.guild.id, {
                        id: memberToMute.id,
                        duration: duration,
                        roles: memberRoles
                    })
                    await moderationDatabase.cache.updateCache(message.guild.id)
                    await message.channel.send({embed: {
                        color: context.embedColors.success,
                        title: `Muted ${memberToMute.displayName}!`,
                        description: `They have been muted for **${duration}** minutes!`
                    }})
                }).catch(async err => {
                    console.log(err)
                    await message.channel.send({embed: {
                        color: context.embedColors.error,
                        title: "Couldn't Mute User",
                        description: "Hmm... looks like I couldn't mute the user. The mute role was probably deleted or the user has higher permissions than me!"
                    }})
                })

            }
        },
        unmute: {
            description: 'Unmute a member.',
            requiredPerms: ['MANAGE_MESSAGES'],
            minArgs: 1,
            maxArgs: 1,
            cooldown: 5000,
            arguments: ['user'],
            callback: async (message, arguments) => {
                if (!moderationDatabase.cache.exists(message.guild.id)) {
                    await moderationDatabase.addGuild(message.guild.id)
                    await moderationDatabase.cache.updateCache(message.guild.id)
                }

                if (!message.mentions.users.size) {
                    await message.channel.send('not a valid user placeholder error')
                    return
                }

                const guildModCache = moderationDatabase.cache.fetch(message.guild.id)
                if (!guildModCache.muteRole) {
                    await message.channel.send('mute role not set placeholder error')
                    return
                }

                const memberToUnmute = await message.guild.members.get(message.mentions.users.first().id)
                if (!memberToUnmute.roles.some(role => role.id === guildModCache.muteRole)) {
                    await message.channel.send('member is not muted error')
                    return
                }


                const muteRole = await message.guild.roles.get(guildModCache.muteRole)
                
                memberToUnmute.removeRole(muteRole).then(async () => {
                    guildModCache.muted.forEach(async (mute, index) => {
                        if (mute.id === memberToUnmute.user.id) {
                            await moderationDatabase.unmuteUser(message.guild.id, index, guildModCache.muted)
                            /*
                            mute.roles.forEach(role => {
                                if (role !== guildModCache.muteRole) memberToUnmute.addRole(message.guild.roles.get(role))
                            })
                            */
                        }
                    })

                    await moderationDatabase.cache.updateCache(message.guild.id)
                    await message.channel.send('user unmuted')
                }).catch(() => {})
            }

        },
        'set-mute-role': {
            description: 'Set a role to give a user when they are muted.',
            requiredPerms: ['MANAGE_GUILD'],
            minArgs: 1,
            maxArgs: 1,
            cooldown: 5000,
            arguments: ['role'],
            callback: async (message, arguments) => {
                if (!moderationDatabase.cache.exists(message.guild.id)) {
                    await moderationDatabase.addGuild(message.guild.id)
                    await moderationDatabase.cache.updateCache(message.guild.id)
                }

                if (message.mentions.roles.size) {
                    await moderationDatabase.setMuteRole(message.guild.id, message.mentions.roles.first().id)
                    await moderationDatabase.cache.updateCache(message.guild.id)
                    await message.channel.send('mute role set placeholder')
                } else {
                    await message.channel.send('not a valid role placeholder error')
                }
            }
        }
    }
}