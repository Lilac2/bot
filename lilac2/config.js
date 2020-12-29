module.exports = {
    appDir: __dirname, // absolute path for lilac2 directory
    bot: {
        defaultPrefix: '!lilac'       ,
        version:       '0.0.0'        ,
        token:   process.env.BOT_TOKEN,
        server: {
            id: '787037113191104533',
            channels: {
                botStream: '787038848160759848',
                errorLog:  '788035398663536641'
            }
        },
        owner: '525396913294671953',
        setTyping: true
    }, 
    api: {
        port: 6969
    },
    developers: [
        '525396913294671953', // Zavexeon#5295
        '688889174912401417', // CoderMan51#8112
        '660229063142539306'  // JDOG787#4689
    ]
}