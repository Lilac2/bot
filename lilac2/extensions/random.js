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
            description: 'Roll a dice. Rolls a single six sided die by default, but can accept an argument like 2d6 and such!',
            minArgs: 0,
            maxArgs: 1,
            arguments: ['dice-type'],
            callback: (message, arguments) => {
                
            }
        }
    }
}