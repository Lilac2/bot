module.exports = function(context) {
    this.name = 'greeter'
    this.description = 'Greet new members!'

    async function greeterAddGuild(id) {
        await context.database.firestore.collection('extensionStorage')
            .doc('greeter')
            .collection('guilds')
            .doc(id)
            .set({
                greetingChannel: 0,
                greetingTitle: '[tag] joined!',
                greetingDescription: 'Lets give them a warm welcome!'
            })
    }

    /* the cache object for the greeter extension */
    const greeterCache = {
        _guilds: {},
        exists(id) {
            return this._guilds[id] ? true : false
        },
        fetch(id) {
            return this._guilds[id]
        },
        async updateGreeterCache(id = null) {
            if (id) {
                await context.database.firestore.collection('extensionStorage')
                    .doc('greeter')
                    .collection('guilds')
                    .doc(id)
                    .get()
                    .then(snapshot => {
                        this._guilds[id] = snapshot.data()
                    })
            } else {
                await context.database.firestore.collection('extensionStorage')
                    .doc('greeter')
                    .collection('guilds')
                    .get()
                    .then(snapshot => {
                        snapshot.docs.forEach(doc => this._guilds[doc.id] = doc.data())
                    })
            }
        }
    }

    context.botOn('guildMemberAdd', async member => {
        if (!context.database.cache.guild.isExtensionEnabled(member.guild.id, 'greeter')) return

        /* if extension is enabled but no entry in database for guild, add guild */
        if (!greeterCache.exists(member.guild.id)) {
            await greeterAddGuild(member.guild.id)
            await greeterCache.updateGreeterCache(member.guild.id)
        }

        const greeterGuildCache = greeterCache.fetch(member.guild.id)

        /* only send welcome message if there's a greeting channel set */
        if (greeterGuildCache.greetingChannel) {
            function replacePlaceholders(string) {
                return string
                    .replace('[tag]', member.user.tag)
                    .replace('[username]', member.user.username)
                    .replace('[server]', member.guild.name)
                    .replace('[membercount]', member.guild.memberCount)
                    .replace('[membercountnth]', `${member.guild.memberCount}${[,'st','nd','rd'][member.guild.memberCount/10%10^1&&member.guild.memberCount%10]||'th'}`)
            }

            const embedTitle = replacePlaceholders(greeterGuildCache.greetingTitle)
            const embedDescription = replacePlaceholders(greeterGuildCache.greetingDescription)


            member.guild.channels.get(greeterGuildCache.greetingChannel).send({
                embed: {
                    title: embedTitle,
                    description: embedDescription,
                    thumbnail: { url: member.user.displayAvatarURL }
                }
            })
        }
    })

    context.botOn('ready', async () => await greeterCache.updateGreeterCache())

    this.commands = {
        'set-greeting-channel': {
            description: 'Set a greeting channel for the greeting module!',
            minArgs: 1,
            maxArgs: 1,
            cooldown: 5000,
            requiredPerms: ['MANAGE_GUILD'],
            arguments: ['channel-id'],
            callback: async (message, arguments) => {
                let channelId = arguments['channel-id']
                if (message.mentions.channels.size > 0) channelId = message.mentions.channels.first().id


                if (!message.guild.channels.get(channelId)) {
                    await message.channel.send('channel does not exist error')
                    return
                }

                if (!greeterCache.exists(message.guild.id)) {
                    await greeterAddGuild(message.guild.id)
                    await greeterCache.updateGreeterCache()
                }

                if (channelId === greeterCache.fetch(message.guild.id).greetingChannel) {
                    await message.channel.send('channel is already set to that placeholder')
                    return
                }

                await context.database.firestore.collection('extensionStorage')
                    .doc('greeter')
                    .collection('guilds')
                    .doc(message.guild.id)
                    .update({
                        greetingChannel: channelId
                    })

                await greeterCache.updateGreeterCache(message.guild.id)
                await message.channel.send({
                    embed: {
                        title: 'Greeting Channel Set!',
                        description: `The greeting channel for this guild has been set to <#${channelId}>!`
                    }
                })
            }
        },
        'disable-greeting': {
            description: 'Disable greeting for the bot.',
            cooldown: 5000,
            requirePerms: ['MANAGE_GUILD'],
            callback: async message => {
                if (!greeterCache.exists(message.guild.id)) {
                    await greeterAddGuild(message.guild.id)
                    await greeterCache.updateGreeterCache()
                }

                if (greeterCache.fetch(message.guild.id).greetingChannel === 0) {
                    await message.channel.send('greeting already disabled error')
                    return
                }

                await context.database.firestore.collection('extensionStorage')
                    .doc('greeter')
                    .collection('guilds')
                    .doc(message.guild.id)
                    .update({
                        greetingChannel: 0
                    })

                await greeterCache.updateGreeterCache(message.guild.id)
                await message.channel.send('greeting disabled placeholder')
            }
        },
        'set-greeting-title': {
            description: 'Set the greeting title for the bot! Use `<prefix> greeter-placeholders` for info on those!',
            cooldown: 10000,
            requiredPerms: ['MANAGE_GUILD'],
            minArgs: 1,
            maxArgs: 1000,
            arguments: ['title'],
            callback: async (message, arguments) => {
                if (!greeterCache.exists(message.guild.id)) {
                    await greeterAddGuild(message.guild.id)
                    await greeterCache.updateGreeterCache()
                }

                let titleStringAry = arguments._leftoverArgs || [arguments['title']]
                if (arguments._leftoverArgs) titleStringAry.unshift(arguments['title'])
                
                let titleString = ''
                titleStringAry.forEach(str => {
                    if (str === '') {
                        titleString += ' '
                    } else {
                        titleString += str + ' '
                    }
                })

                await context.database.firestore.collection('extensionStorage')
                    .doc('greeter')
                    .collection('guilds')
                    .doc(message.guild.id)
                    .update({
                        greetingTitle: titleString
                    })

                await greeterCache.updateGreeterCache(message.guild.id)
                await message.channel.send({embed: {
                    title: 'Greeter title set!',
                    description: 'The title for your greeting has been set.'
                }})
            }
        },
        'set-greeting-description': {
            description: "Set the greeting description for the bot! Use `<prefix> greeter-placeholders` for info on those!",
            cooldown: 10000,
            requiredPerms: ['MANAGE_GUILD'],
            minArgs: 1,
            maxArgs: 1000,
            arguments: ['description'],
            callback: async (message, arguments) => {
                if (!greeterCache.exists(message.guild.id)) {
                    await greeterAddGuild(message.guild.id)
                    await greeterCache.updateGreeterCache()
                }

                let descriptionStringAry = arguments._leftoverArgs || [arguments['description']]
                if (arguments._leftoverArgs) descriptionStringAry.unshift(arguments['description'])
                
                let descriptionString = ''
                descriptionStringAry.forEach(str => {
                    if (str === '') {
                        descriptionString += ' '
                    } else {
                        descriptionString += str + ' '
                    }
                })

                await context.database.firestore.collection('extensionStorage')
                    .doc('greeter')
                    .collection('guilds')
                    .doc(message.guild.id)
                    .update({
                        greetingDescription: descriptionString
                    })

                await greeterCache.updateGreeterCache(message.guild.id)
                await message.channel.send({embed: {
                    title: 'Greeter description set!',
                    description: 'The description for your greeting has been set.'
                }})

            }
        },
        'greeter-placeholders': {
            description: 'View the placeholders for your greeting messages!',
            callback: message => {
                message.channel.send({embed: {
                    title: 'Greeter Placeholders',
                    description: "**What are greeter placeholders?**\nGreeter placeholders allow you to insert in specific information into your greeting title or description, such as the user's name, server name, etc. They're super easy to use, simply just add [placeholder-name] when setting your description, and when a user is greeted Lilac2 will automatically insert the info in!\n\n**Available Placeholders**\n[username] - the username of the user joining\n[tag] - the tag of the user joining\n[server] - the name of the server\n[membercount] - the number of members in the server\n[membercountnth] - the number of members plus suffixes like nd, th, etc"
                }})
            }
        }
    }
}