module.exports = (admin, firestore) => {
    let modDb = {
        async addGuild(id) {
            await firestore.collection('extensionStorage')
                .doc('moderation')
                .collection('guilds')
                .doc(id)
                .set({
                    muteRole: 0,
                    filterEnabled: false,
                    bannedWords: {},
                    muted: [
                        /*
                        {
                            id: userid
                            timeLeft: timeLeft
                            roles: []
                        }
                        */
                    ]
                })
        },
        async setMuteRole(id, role) {
            await firestore.collection('extensionStorage')
                .doc('moderation')
                .collection('guilds')
                .doc(id)
                .update({
                    muteRole: role
                })
        },
        async muteUser(guildId, muteInfo) {
            await firestore.collection('extensionStorage')
                .doc('moderation')
                .collection('guilds')
                .doc(guildId)
                .update({
                    muted: admin.firestore.FieldValue.arrayUnion(muteInfo)
                })
        },
        async unmuteUser(guildId, unmuteIndex, muted) {
            await firestore.collection('extensionStorage')
                .doc('moderation')
                .collection('guilds')
                .doc(guildId)
                .update({
                    muted: muted.filter((mute, index) => index !== unmuteIndex)
                })
        },
        cache: {
            _guilds: [],
            exists(id) {
                return this._guilds[id] ? true : false
            },
            fetch(id) {
                return this._guilds[id]
            },
            async updateCache(id = null) {
                if (id) {
                    await firestore.collection('extensionStorage')
                        .doc('moderation')
                        .collection('guilds')
                        .doc(id)
                        .get()
                        .then(snapshot => {
                            this._guilds[id] = snapshot.data()
                        })
                } else {
                    await firestore.collection('extensionStorage')
                        .doc('moderation')
                        .collection('guilds')
                        .get()
                        .then(snapshot => {
                            snapshot.docs.forEach(doc => this._guilds[doc.id] = doc.data())
                        })
                }
            }   
        }
    }

    return modDb
}