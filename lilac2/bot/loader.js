const fs    = require('fs'),
      color = require('../color.js')

module.exports = context => {
    const extensionsDir  = context.config.appDir + '/extensions/',
          extensionCount = fs.readdirSync(extensionsDir).filter(file => {
              if (file[0] !== '_') return file
          }).length


    console.log('Loading extensions...')
    console.log(
        'Found'                  , 
        color.cyan + color.bright,
        extensionCount           , 
        color.reset              ,  
        'extensions!'
    )


    let loadedCount      = 0
    const extensionFiles = fs.readdirSync(extensionsDir)

    extensionFiles.forEach(file => {
        if (file[0] === '_') return // ignores files starting with "_"
        try {
            const Extension = require(extensionsDir + file)
            const extension = new Extension(context)

            if (typeof extension !== 'object')            throw 'extension must return object with at least properties name and description'
            if (!extension.name)                          throw 'extension return object must have name property'
            if (!extension.description)                   throw 'extension return object must have description property'
            if (new RegExp("\\s+").test(extension.name))  throw 'extension name must not include any whitespace'

            context.extensions[extension.name] = {
                description: extension.description,
                hidden: extension.hidden || false
            }

            if (extension.commands) {
                for (const command in extension.commands) {
                    const description = extension.commands[command].description
                    if (!description || description === '' || typeof description !== 'string' ) throw `command "${command}" in must have description property that is a string 1 character or more`
                    if (context.commands[command])                                              throw `there is already a command under the name ${command}`
                    
                    if (!command.disabled) {
                        context.commands[command]               = extension.commands[command]
                        context.commands[command].extensionFrom = extension.name
                    }
                }
            }

            /* logs loaded extension to console */
            loadedCount++
            console.log(
                `\t[${color.bright}${color.cyan}${loadedCount}/${extensionCount}${color.reset}]`,
                `Loaded extension from:`                                                        ,
                color.bright                                                                    ,
                file                                                                            ,
                color.reset
            )
        } catch (err) {
            throw err
        }
        console.log('Successfully loaded extensions!')
    })
}