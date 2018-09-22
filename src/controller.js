module.exports = (function (Wechat) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const logger = console;

    const SUPPORTED_COMMANDS = ['get', 'switch'];
    const COMMAND_MAPPER = {
        'get': getMessages
    };

    function validateCommand(input) {
        const command = tokenizeInput(input)[0];
        if (!SUPPORTED_COMMANDS.includes(command)) {
            throw `Invalid command "${command}"`;
        }
    }

    function getMessages(args) {
        console.log('getMessage: ', args);
    }

    function tokenizeInput(input) {
        return input.split(' ');
    }

    function mapInput(input) {
        const inputTokens = tokenizeInput(input);
        const mappedCommand = COMMAND_MAPPER[inputTokens[0]];
        if (mappedCommand != null) {
            mappedCommand(inputTokens.splice(1));
        }
        else {
            throw `Failed to map input "${input}"`;
        }
    }

    function readInput() {
        rl.addListener('line', input => {
            try {
                validateCommand(input);
                mapInput(input);
                console.log(input);
            }
            catch (e) {
                logger.error(e);
            }
        });
    }

    return {
        "readInput": readInput
    };
});