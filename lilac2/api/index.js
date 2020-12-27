module.exports = context => {
    const http = require('http')

        const server = http.createServer((req, res) => {
            res.end('yes')
        })

        server.listen(context.config.api.port, () => console.log(`API server started and listening on port ${context.config.api.port}!`))

}