const wchat4u = require('wechat4u');
const qrcode = require('qrcode-terminal');
let Wechat = new wchat4u();
const controller = require('./controller.js')(Wechat);

// Wechat.start();

Wechat.on('uuid', uuid => {
    qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {
        small: true
    });
    console.log('QR Code URL: ', 'https://login.weixin.qq.com/qrcode/' + uuid);
});

Wechat.on('login', () => {
    console.log('Logged in successfully!');
    controller.readInput();
});

Wechat.on('logout', () => {
    console.log('Logged out successfully!');
});

controller.readInput();
