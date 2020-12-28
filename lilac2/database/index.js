const config = require('../config.js')


/* initialize firestore */
const admin = require('firebase-admin')
admin.initializeApp({
    credential: admin.credential.cert(require('./key.js'))
})
const firestore = admin.firestore() 



module.exports = { 
    firestore: firestore,
    admin: admin,
    
    /* methods for database relating to guilds */
    guild: {
        /* add a guild to the database, argument is a discord.js Guild class */
        async add(guildObject) {
            await firestore.collection('guilds').doc(guildObject.id)
                .set({
                    prefix:            config.bot.defaultPrefix,
                    enabledExtensions: ['standard']
                })
        },
        /* remove a guild from the database */
        async remove(id) {
            await firestore.collection('guilds').doc(id).delete()
        },
        /* get a guild from the database, returns object for guild */
        async fetch(id) {
            return await firestore.collection('guilds').doc(id).get().data()
        },
        /* adds an extension to the enabled extensions array */
        async enableExtension(id, name) {
            await firestore.collection('guilds').doc(id)
                .update({
                    enabledExtensions: admin.firestore.FieldValue.arrayUnion(name)
                })
        }, 
        /* removes an extension from the enabled extensions array */
        async disableExtension(id, name) {
            await firestore.collection('guilds').doc(id)
                .update({
                    enabledExtensions: admin.firestore.FieldValue.arrayRemove(name)
                })
        },
        /* changes the prefix for a guild */
        async changePrefix(id, prefix) {
            await firestore.collection('guilds').doc(id)
                .update({
                    prefix: prefix
                })
        }
    },

    /* methods for database relating to bot blacklist */
    blacklist: {
        user: {
            async add(id) {
                await firestore.collection('bot').doc('blacklist')
                    .update({
                        users: admin.firestore.FieldValue.arrayUnion(id)
                    })
            },
            async remove(id) {
                await firestore.collection('bot').doc('blacklist')
                    .update({
                        users: admin.firestore.FieldValue.arrayRemove(id)
                    })
            }
        },
        guild: {
            async add(id) {
                await firestore.collection('bot').doc('blacklist')
                    .update({
                        guilds: admin.firestore.FieldValue.arrayUnion(id)
                    })
            },
            async remove(id) {
                await firestore.collection('bot').doc('blacklist')
                    .update({
                        guilds: admin.firestore.FieldValue.arrayRemove(id)
                    })
            }
        }
    },

    /* cache object for caching */
    cache: { 
        guild: {
            _guilds: {},  // stores the guilds like {<guild-id>: guildDataObject}
            /* check if a guild is in the cache, true or false*/
            exists(id) {
               this._guilds[id] ? true : false 
            },
            /* get a guild from the cache, returns object with data about the guild */
            fetch(id) {
                return this._guilds[id]
            },
            isExtensionEnabled(id, name) {
                return this._guilds[id].enabledExtensions.includes(name)
            },
            /* 
                update the guild cache from database
                if id is left null, the cache for all guild is updated 
                if id is a string of guild id, the cache for only that guild is updated
            */
            async updateGuildCache(id=null) {
                if (id) {
                    await firestore.collection('guilds').doc(id).get()
                        .then(snapshot => this._guilds[id] = snapshot.data())
                } else {
                    await firestore.collection('guilds').get()
                        .then(snapshot => {
                            snapshot.docs.forEach(doc => this._guilds[doc.id] = doc.data())
                        })

                }
            }
        },

        blacklist: {
            _guildBlacklist: [],
            _userBlacklist:  [],

            /* check if a guild is blacklisted */
            isGuildBlacklisted(id) {
                return this._guildBlacklist.includes(id)
            },
            /* check if a user is blacklisted, true or false */ 
            isUserBlacklisted(id) { 
                return this._userBlacklist.includes(id)
            },
            /* update blacklist cache from database */
            async updateBlacklistCache() {
                let blacklistObject = this
                await firestore.collection('bot')
                        .doc('blacklist')
                        .get()
                        .then(snapshot => {
                            const data = snapshot.data()
                            blacklistObject._guildBlacklist = data.guilds 
                            blacklistObject._userBlacklist  = data.users
                        })
            }            
        },

        async updateEntireCache() {
            await this.blacklist.updateBlacklistCache()
            await this.guild.updateGuildCache()
        }
    }
}