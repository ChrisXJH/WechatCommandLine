let wechatService = require('./services/wechatService.js');
const display = require('./display.js');
let controller = require('./controller.js')(wechatService, display);

wechatService.start();
controller.readInput();
