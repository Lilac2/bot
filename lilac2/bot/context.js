const config = require('../config.js')

module.exports = (client, database, lilacServer) => {
    return {
        client:          client     ,
        database:        database   ,
        lilacServer:     lilacServer,
        commands:        {}         ,
        extensions:      {}         ,
        commandCooldown: {}         ,
        config:          config     ,
        apiInitiated:    false      ,
        uptime:          0          ,

        cache: database.cache,

        hooks: {
            message:                        [],
            messageDelete:                  [],
            messageDeleteBulk:              [],
            messageReactionAdd:             [],
            messageReactionRemove:          [],
            messageReactionRemoveAll:       [],
            messageUpdate:                  [],
            channelCreate:                  [],
            channelDelete:                  [],
            channelPinsUpdate:              [],
            channelUpdate:                  [],
            clientUserGuildSettingsUpdate:  [],
            clientUserSettingsUpdate:       [],
            debug:                          [],
            disconnect:                     [],
            emojiCreate:                    [],
            emojiDelete:                    [],
            emojiUpdate:                    [],
            error:                          [],
            guildBanAdd:                    [],
            guildBanRemove:                 [],
            guildCreate:                    [],
            guildDelete:                    [],
            guildMemberAdd:                 [],
            guildMemberAvailable:           [],
            guildMemberRemove:              [],
            guildMembersChunk:              [],
            guildMemberSpeaking:            [],
            guildUnavailable:               [],
            guildUpdate:                    [],
            presenceUpdate:                 [],
            ready:                          [],
            reconnecting:                   [],
            resume:                         [],
            roleCreate:                     [],
            roleDelete:                     [],
            roleUpdate:                     [],
            typingStart:                    [],
            typingStop:                     [],
            userNoteUpdate:                 [],
            userUpdate:                     [],
            voiceStateUpdate:               [],
            warn:                           []

        },
        embedColors: {
            error:   16721221,
            lilac:   13148872,
            success: 6941046
        },
        botOn(type, callback) {
            if (typeof type     !== 'string'  ) throw 'invalid type for botOn hook, expected string'
            if (typeof callback !== 'function') throw 'expected a function as second argument in botOn'

            if (this.hooks[type]) {
                this.hooks[type].push(callback)
            } else {
                throw 'invalid type for botOn hook, must be a discord.js event'
            }
            return this // return context to allow chaining of botOn commands
        },
        isUserDeveloper(id) {
            return this.config.developers.includes(id)
        },
        /* returns array of keys (alphabetically sorted) of command names the member has perms to use */
        filterCommandsForMember(member) {
            let commandList = []
            for (const key in this.commands) {
                const command = this.commands[key]

                if (member.hasPermission(command.requiredPerms || [])) {
                    if (!(command.developerOnly && !this.isUserDeveloper(member.id))) {
                        commandList.push(key)
                    } 
                }
            }
            commandList.sort()
            return commandList
        }
    }
}