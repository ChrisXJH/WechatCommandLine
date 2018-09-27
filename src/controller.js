module.exports = (function (wechatService, display) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const SUPPORTED_COMMANDS = ['contacts', 'switch', 'send'];
    const COMMAND_MAPPER = {
        'contacts': listContacts,
        'switch': switchToContact,
        'send': sendMessage
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
            || msg.isSendBySelf && msg.toUsername === currentContact.getUsername())) {
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

    function listContacts() {
        display.printContacts(contacts);
    }

    function validateCommand(input) {
        const command = tokenizeInput(input)[0];
        if (!SUPPORTED_COMMANDS.includes(command)) {
            throw `Invalid command "${command}"`;
        }
    }

    function tokenizeInput(input) {
        let tokens = input.split(' ');
        if (tokens[0] === 'send') {
            tokens = [tokens[0], input.match(/".*"/)[0].split('"')[1]];
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
            currentContact = contacts[args[0]];
            display.printConversation(wechatService.fetchConversationByUsername(currentContact.getUsername())
                , currentContact.getUserDisplayName());
        }
        else {
            throw `Invalid switch arguments. Usage: switch | switch <validIndex>`;
        }
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