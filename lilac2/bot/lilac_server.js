const config = require('../config.js')

module.exports = lilac => {
    let lilacServer = {
        guild:    undefined,
        _channels: config.bot.server.channels,
        logToStream(content) {
            this.guild.channels.get(this._channels.botStream).send(content)
        },
        log(type, content) {
            let id
            switch (type) {
                case 'error': id = this._channels.errorLog; break
            }
            this.guild.channels.get(id).send(content)
        }
    }
    return lilacServer
} 
