module.exports = (function (wechatService, display) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const SUPPORTED_COMMANDS = ['switch', 'send'];
    const COMMAND_MAPPER = {
        'switch': switchToContact,
        'send': sendMessage
    };
    let currentContactIndex;

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
        if (msg.contactIndex === currentContactIndex) {
            const dialog = wechatService.fetchDialogByUsername(msg.isSendBySelf ? msg.toUsername : msg.fromUsername);
            display.printDialog(dialog);
        }
        else if (!msg.isSendBySelf) {
            display.printNotification(`New message from ${msg.fromUserDisplayName}(${msg.contactIndex}).`);
        }
    });

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
        const username = wechatService.getUsernameByIndex(currentContactIndex);
        wechatService.sendMessage(args[0], username);
    }

    function switchToContact(args) {
        let contacts = wechatService.getActiveContacts();
        if (args == null || args.length <= 0) {
            display.displayContactsWithIndex(contacts);
        }
        else if (contacts[args[0]] != null) {
            currentContactIndex = args[0] - 0;
            const contact = contacts[currentContactIndex];
            display.printDialogName(contact.displayName);
            display.printDialog(wechatService.fetchDialogByUsername(contact.username));
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