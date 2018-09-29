module.exports = (function (wechatService, display) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const SUPPORTED_COMMANDS = ['contacts', 'switch', 'send', 'search', 'select'];
    const COMMAND_MAPPER = {
        'contacts': listActiveContacts,
        'switch': switchToContact,
        'send': sendMessage,
        'search': searchContact,
        'select': selectResult
    };

    class Contact {
        constructor(username, userDisplayName) {
            this.username = username;
            this.userDisplayName = userDisplayName;
        }

        getUsername() { return this.username; }

        getUserDisplayName() { return this.userDisplayName; }

        isSameContact(contact) { return contact.getUsername == this.username; }

    };

    let cache = {};

    let contacts = [];

    let currentContact;

    // Handle login event
    wechatService.Emitter.on('login', () => {
        console.log('Logged in successfully!');
        readInput();
    });

    // Handle logout event
    wechatService.Emitter.on('logout', () => {
        console.log('Logged in successfully!');
    });

    // QR Code ready event
    wechatService.Emitter.on('qrcode', url => {
        display.print('Scan the QR code using WeChat Mobile to log in:\n');
        display.printQRCodeFromUrl(url);
        display.print(`QR Code URL: ${url}`);
    });

    // Handling new message
    wechatService.Emitter.on('newMessage', msg => {
        if (currentContact && (msg.fromUsername === currentContact.getUsername()
            || (msg.isSendBySelf && msg.toUsername === currentContact.getUsername()))) {
            const conversation = wechatService.fetchConversationByUsername(msg.isSendBySelf ? msg.toUsername : msg.fromUsername);
            display.printConversation(conversation, currentContact.getUserDisplayName());
        }
        else if (!msg.isSendBySelf) {
            if (isNewContact(msg.fromUsername)) {
                contacts.push(new Contact(msg.fromUsername, msg.fromUserDisplayName));
            }
            display.printNotification(`New message from ${msg.fromUserDisplayName}.`);
        }
    });

    function isNewContact(username) {
        if (contacts.length <= 0) return true;
        for (let con of contacts) {
            if (con.getUsername() === username) {
                return false;
            }
        }
        return true;
    }

    function listActiveContacts() {
        display.printContacts(contacts);
        updateCache(contacts);
    }

    function updateCache(obj) {
        if (obj) cache = obj;
    }

    function getFromCache(key) {
        return cache != null ? cache[key] : null;
    }

    function validateCommand(input) {
        const command = tokenizeInput(input)[0];
        if (!SUPPORTED_COMMANDS.includes(command)) {
            throw `Invalid command "${command}"`;
        }
    }

    function tokenizeInput(input) {
        let tokens = input.split(' ');
        if (tokens[0] === 'send' || tokens[0] === 'search') {
            const param = input.match(/".*"/);
            tokens = [tokens[0], param ? param[0].split('"')[1] : param];
        }
        return tokens;
    }

    function mapInput(input) {
        const inputTokens = tokenizeInput(input);
        const mappedCommand = COMMAND_MAPPER[inputTokens[0]];
        if (mappedCommand != null) {
            try {
                mappedCommand(inputTokens.splice(1));
            } catch (e) {
                throw e;
            }
        }
        else {
            throw `Failed to map input "${input}"`;
        }
    }

    function sendMessage(args) {
        if (args.length <= 0 || args[0] == null) throw 'Invalid send command. Usage: send "<content>".';
        if (!currentContact) throw 'No conversation found.';
        wechatService.sendMessage(args[0], currentContact.getUsername());
    }

    function switchToContact(args) {
        if (args && args.length > 0 && contacts[args[0]]) {
           switchToContactAction(args[0]);
        }
        else {
            throw `Invalid switch arguments. Usage: switch | switch <validIndex>`;
        }
    }

    function switchToContactAction(index) {
        currentContact = contacts[index];
        display.printConversation(wechatService.fetchConversationByUsername(currentContact.getUsername())
            , currentContact.getUserDisplayName());
    }

    function searchContact(args) {
        if (args.length <= 0 || args[0] == null) throw 'Invalid search command. Usage: search "<content>".';
        const results = wechatService.searchContact(args[0]);
        if (results != null && results.length > 0) {
            let convertedContacts = [];
            for (let contact of results) {
                convertedContacts.push(new Contact(contact.username, contact.userDisplayName));
            }
            display.printContacts(convertedContacts);
            updateCache(convertedContacts);
        }
        else {
            display.print(`Could not find contact.`);
        }
    }

    function selectResult(args) {
        if (args.length <= 0 || args[0] == null) throw 'Invalid select command. Usage: select <index>.';
        contacts.push(getFromCache(args[0]));
        switchToContactAction(contacts.length - 1);
    }

    function readInput() {
        rl.addListener('line', input => {
            try {
                validateCommand(input);
                mapInput(input);
            }
            catch (e) {
                display.printError(e);
            }
        });
    }
});