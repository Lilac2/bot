module.exports = function (context) {
    this.name = 'DadJokes'
    this.description = 'Who hates dad jokes??'

    this.commands = {
        im: {
            description: 'Hello I\'m...',
            minArgs: 1,
            maxArgs: 9999999e99999,
            arguments: ['name'],
            callback: (message, arguments) => {
                var name = arguments.name

                for (i in arguments._leftoverArgs) {
                    name += " " + i
                }

                message.channel.send({ embed: { title: "Hello " + name + " I'm dad!" } })
            }
        }
    }
}

