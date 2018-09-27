module.exports = (function () {
    const qrcode = require('qrcode-terminal');

    function printMessage(msg) {
        if (msg.isSendBySelf) {
            console.log(`[我] ${msg.content}`);
        }
        else {
            console.log(`[${msg.fromUserDisplayName}] ${msg.content}`);
        }
    }

    function printNotification(str) {
        console.log(`[NOTIFICATION] ${str}`);
    }

    function print(msg) {
        console.log(msg);
    }
    
    function printError(err) {
        console.error(err);
    }

    function printConversation(messages, withWhom) {
        if (withWhom) {
            print(`Conversation with "${withWhom}":`);
        }
        for (var msg of messages) {
            printMessage(msg);
        }
    }

    function printQRCodeFromUrl(url) {
        qrcode.generate(url, {
            small: true
        });
    }

    function printContacts(contacts) {
        for (let i = 0; i < contacts.length; i++) {
            print(`[${i}] ${contacts[i].getUserDisplayName()}`);
        }
    }

    function printList(list) {
        for (let i = 0; i < list.length; i++) {
            print(`[${i}] ${list[i]}`);
        }
    }

    return {
        "print": print,
        "printMessage": printMessage,
        "printNotification": printNotification,
        "printError": printError,
        "printConversation": printConversation,
        "printQRCodeFromUrl": printQRCodeFromUrl,
        "printContacts": printContacts
    };
})();