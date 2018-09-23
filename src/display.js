module.exports = (function () {
    function printMessage(msg) {
        if (msg.isSendBySelf) {
            console.log(`[我] ${msg.content}`);
        }
        else {
            console.log(`[${msg.fromUserDisplayName}] ${msg.content}`);
        }
    }

    function printDialogName(str) {
        console.log(`DIALOG WITH: "${str}"`);
    }

    function printNotification(str) {
        console.log(`[NOTIFICATION] ${str}`);
    }
    
    function printError(err) {
        console.error(err);
    }

    function displayContactsWithIndex(contacts) {
        console.log('CONTACTS');
        for (var i = 0; i < contacts.length; i++) {
            console.log(`[${i}] ${contacts[i].displayName}`);
        }
    }

    function printDialog(messages) {
        for (var msg of messages) {
            printMessage(msg);
        }
    }

    return {
        "printMessage": printMessage,
        "printDialogName": printDialogName,
        "printNotification": printNotification,
        "printError": printError,
        "displayContactsWithIndex": displayContactsWithIndex,
        "printDialog": printDialog
    };
})();