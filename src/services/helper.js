const { FirebaseDynamicLinks} = require('firebase-dynamic-links');
const firebaseDynamicLinks = new FirebaseDynamicLinks(
  process.env.firebaseWebAppKey
);

module.exports = {
    toUpperCase: (str) => {
        if (str.length > 0) {
            const newStr = str
                .toLowerCase()
                .replace(/([a-z])/, m => m.toUpperCase())
                .replace(/_/,"")
            return str.charAt(0).toUpperCase() + newStr.slice(1);
        }
        return "";
    },

    validationMessageKey: (apiTag, error) => {
        let key = module.exports.toUpperCase(error.details[0].context.key);
        let type = error.details[0].type.split(".");
        type = module.exports.toUpperCase(type[1]);
        key = apiTag + " " + key + " " + type;
        return key;
    },

    // pushNotification:(notification, firebaseToken) => {
    //     let message;
    //     if (Array.isArray(firebaseToken)) {
    //         message = {
    //             //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    //             registration_ids: firebaseToken,
    //             // collapse_key: 'your_collapse_key',

    //             notification: {
    //                 title: notification.title,
    //                 message : notification.message
    //             },

    //             data: {
    //                 channelKey: "high_importance_channel",
    //                 body: notification.body
    //             }
    //         };

    //     } else {
    //         message = {
    //             //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    //             to: firebaseToken,
    //             // collapse_key: 'your_collapse_key',

    //             notification: {
    //                 title: notification.title,
    //                 message : notification.message
    //             },

    //             data: {
    //                 channelKey: "high_importance_channel",
    //                 body: notification.body
    //             }
    //         };
    //     }

    //     if (message) {
    //         fcm.send(message, function(err, response) {
    //             if (err) {
    //                 console.log("Something has gone wrong!", err);
    //             } else {
    //                 console.log("Successfully sent with response: ", response);
    //             }
    //         });
    //     }
    // },

    createDynamicLink: async function(info) {
        // console.log( " :: process.env.domainUriPrefix :: ", process.env.domainUriPrefix);
        const { shortLink, previewLink } =
        await firebaseDynamicLinks.createLink({
            dynamicLinkInfo: {
                domainUriPrefix: process.env.domainUriPrefix,
                androidInfo: {
                    androidPackageName: process.env.androidPackageName,
                },
                link: info.link,
                iosInfo: {
                    iosBundleId: process.env.iosBundleId,
                },
                socialMetaTagInfo: {
                    socialTitle: info.name,
                    socialDescription: info.id,
                }
            },
    
        });
        return shortLink;
    },

    // createFlashMessege: (messege) => {
    //     sessionStorage.setItem('flashMessege',JSON.stringify(messege))
        
    //     return
    // },

    // getFlashMessege: () => {
    //    const messege = JSON.parse(sessionStorage.getItem('flashMessege'))
    //    sessionStorage.setItem('flashMessege','')
    //    return messege
    // }

}