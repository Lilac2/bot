module.exports = function(context) {
    this.name        = 'random'
    this.description = 'Does things like flips coins, rolls dice, etc.'

    this.commands = {
        cointoss: {
            description: 'Toss a coin for heads or tails.',
            callback: message => {
                const result = ['heads', 'tails'][Math.round(Math.random())]
                message.channel.send({embed: {
                    color: context.embedColors.lilac,
                    title: 'You tossed a coin...',
                    description: `And it came up **${result}**!`
                }})
            }
        },
        roll: {
            description: 'Roll a dice.',
            callback: message => {

            }
        }
    }
}