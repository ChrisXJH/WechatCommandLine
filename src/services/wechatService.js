module.exports = (function () {
    const EventEmitter = require('events');
    const qrcode = require('qrcode-terminal');
    const wchat4u = require('wechat4u');
    class WechatServiceEmitter extends EventEmitter { }

    let Wechat = new wchat4u();
    let Emitter = new WechatServiceEmitter();

    let serviceReady = false;

    /**
     * Message Cache
     * <username, List<messages>>
     */
    let messageCache = {};

    /**
     * Username Cache
     */
    let usernameCache = [];

    /**
     * Username to Cache Index Mapper
     * <index, username>
     */
    let usernameToCacheIndexMapper = {};

    function getUserIndexByUsername(username) {
        return usernameToCacheIndexMapper[username];
    }

    function updateUsernameIndexing(username) {
        if (!usernameCache.includes(username)) {
            const newIndex = usernameCache.length;
            usernameCache.push(username);
            usernameToCacheIndexMapper[username] = newIndex;
            return newIndex;
        }
        else {
            return getUserIndexByUsername(username);
        }
    }

    function addListeners() {
        Wechat.on('uuid', uuid => {
            qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {
                small: true
            });
            console.log('QR Code URL: ', 'https://login.weixin.qq.com/qrcode/' + uuid);
        });

        Wechat.on('login', () => {
            serviceReady = true;
            console.log('Logged in successfully!');
        });

        Wechat.on('logout', () => {
            console.log('Logged out successfully!');
        });

        Wechat.on('message', (msg) => {
            handleNewMessage(msg);
        });
    }

    function cacheNewMessage(msgObj) {
        let username = msgObj.isSendBySelf ? msgObj.toUsername : msgObj.fromUsername;
        if (messageCache[username] == null) {
            messageCache[username] = [];
        }
        messageCache[username].push(msgObj);
    }

    function handleNewMessage(newMsg) {
        const fromUserName = newMsg.FromUserName;
        let msgObj;
        switch (newMsg.MsgType) {
            case Wechat.CONF.MSGTYPE_TEXT: {
                const contactIndex = newMsg.isSendBySelf ? updateUsernameIndexing(newMsg.ToUserName) : updateUsernameIndexing(fromUserName);
                msgObj = {
                    "fromUsername": fromUserName,
                    "fromUserDisplayName": getUserDisplayNameByUsername(fromUserName),
                    "toUsername": newMsg.ToUserName,
                    "toUserDisplayName": getUserDisplayNameByUsername(newMsg.ToUserName),
                    "content": newMsg.Content,
                    "isSendBySelf": newMsg.isSendBySelf,
                    "contactIndex": contactIndex
                }
                break;
            }
        }
        if (msgObj) {
            cacheNewMessage(msgObj);
            Emitter.emit('newMessage', msgObj);
        }
    }

    function isSelfUsername(username) {
        return Wechat.user.UserName == username;
    }

    function getUserContactByUsername(username) {
        return Wechat.contacts[username];
    }

    function getContactDisplayNameByIndex(index) {
        return getUserDisplayNameByUsername(usernameCache[index]);
    }

    function getUserDisplayNameByUsername(username) {
        if (!isSelfUsername(username)) {
            const contact = getUserContactByUsername(username);
            if (contact.OriginalRemarkName != null && contact.OriginalRemarkName != '') {
                return contact.OriginalRemarkName;
            }
            return contact.OriginalNickName;
        }
        else {
            return Wechat.user.NickName;
        }
    }

    function startWechat() {
        Wechat.start();
        addListeners();
    }

    function isServiceReady() {
        return serviceReady;
    }

    function getActiveContacts() {
        let contacts = [];
        for (var i = 0; i < usernameCache.length; i++) {
            contacts[i] = {
                "username": usernameCache[i],
                "displayName": getUserDisplayNameByUsername(usernameCache[i])
            };
        }
        return contacts;
    }

    function fetchDialogByUsername(username) {
        return messageCache[username] ? messageCache[username] : [];
    }

    function getUsernameByIndex(index) {
        return usernameCache[index];
    }

    function sendMessage(msg, toUsername) {
        Wechat.sendMsg(msg, toUsername);
        handleNewMessage({
            "FromUserName": Wechat.user.UserName,
            "ToUserName": toUsername,
            "isSendBySelf": true,
            "MsgType": Wechat.CONF.MSGTYPE_TEXT,
            "Content": msg
        });
    }

    return {
        "start": startWechat,
        "isServiceReady": isServiceReady,
        "Emitter": Emitter,
        "getContactDisplayNameByIndex": getContactDisplayNameByIndex,
        "getActiveContacts": getActiveContacts,
        "fetchDialogByUsername": fetchDialogByUsername,
        "getUsernameByIndex": getUsernameByIndex,
        "sendMessage": sendMessage
    };
})();