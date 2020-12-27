<img src="lilac2logo.png" style="max-width: 180px">

# Lilac2

## What is Lilac2?
Lilac2 is a flexible and feature rich discord bot. The features per server can be customized via the toggling of Lilac2 **extensions**.

## Extensions, what are those?
Glad you asked! Think of extensions as "modules" for Lilac2. Each one contains some sort of feature, or features, following a theme. For example, the `standard` extension is full of the bots default commands. Or take the `moderation` extension, which gives access to mod tools like message purging, muting, and word filters. 

## Current Lilac2 Extensions
Here's a list of Lilac2 extensions that are currently available and their descriptions! If Lilac2 is in your server, you can view the list of extensions using `<prefix> extensions` and turn them on/off using `<prefix> toggle`.

* ### standard
    * This extension is full of all the essential commands for the bot! This extension is the only one enabled by default, and cannot be disabled. 
* ### moderation
    * This extension has the typical moderation tools in it. It allows you to kick/ban users, create a word filter, mute users, and more! 
* ### developer
    *  Hehe, sorry, but this extension is for developers only! If you're not a developer for Lilac2 then this extension is restricted for you to toggle! Sorry!
* ### greeter
    * This extension allows you to greet new members in your server with a cozy message you set! 
* ### DadJokes
    * Courtesy of [Codemonkey51](https://github.com/Codemonkey51), this extension gives you access to all the cheesy dad jokes we just *loved so much* as kids!

## Commands 
This is a list of commands from the **standard** extension! If you want a list for other extensions, please view them [here](https://lilac2.repl.co/commands) or use the Lilac2 command `<prefix> help <?extension>`! I'll be using the prefix `l?` as an example, but make sure you replace it with the prefix for your guild (`!lilac` by default)!

Note: Also, it's important to know that `l? <command>` and `l?<command>` are both valid and are recognized by the bot!

* `prefix <?new-prefix>`
    * This command lets you view or set the prefix for the bot in your server! If you simply type `l?prefix` the bot will respond with the server's current prefix. If you type `l?prefix .l`, the bot will update the prefix to `.l` for your server, for example!
* `help <?extension>`
    * This command gives you a list of commands available to use. Only commands you have permission to use will appear in the list, and only commands for extensions that are enabled in the guild. Without an argument and simply just `l?help`, the bot will respond will all commands for all enabled extensions that you can use. However, if you supply an extension name, for example `l?help moderation`, the bot will only respond with commands you can use from the extension you specified.
* `about`
    * This command gives you info about Lilac2, such as it's source link, the version, the developers, etc.
* `latency` 
    * This command allows you to find out how long it takes the bot respond to your messages. Anything over 500ms (0.5 seconds) is abnormally high for the bot. 
* `toggle <extension>` 
    * This command allows you to toggle extensions on and off for your server. For example, if the **greeter** extension is disabled and you want to turn it on, simply type `l?toggle greeter` and the extension will be enabled, or if it is already enabled, it will be disabled.
* `extensions` 
    * This command allows you to view available extensions and whether they are enabled/disabled for your guild.
* `say <channel> message` 
    * This is a silly command that lets you make the bot say things! For example, `l?say #general Hi, I'm a good bot!` will make the bot say "Hi, I'm a good bot!" in the channel #general. 

## Contact
If you come across a Lilac2 bug and would like to report it, or you have questions, please join the [Lilac2 Discord server](https://discord.gg/c2vdfJE7vz).
