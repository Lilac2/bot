module.exports = function (context) {
    this.name = 'moderation'
    this.description = 'An extension full of moderating tools.'
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
        }
    }
}