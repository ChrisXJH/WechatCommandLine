module.exports = (function () {
    const EventEmitter = require('events');
    const wchat4u = require('wechat4u');
    class WechatServiceEmitter extends EventEmitter { }

    let Wechat = new wchat4u();
    let Emitter = new WechatServiceEmitter();

    let serviceReady = false;

    /**
     * Message Cache
     * <username, List<messages>>
     */
    let conversationCache = {};

    function addListeners() {
        Wechat.on('uuid', uuid => {
            Emitter.emit('qrcode', 'https://login.weixin.qq.com/l/' + uuid);
        });

        Wechat.on('login', () => {
            serviceReady = true;
            Emitter.emit("login", null);
        });

        Wechat.on('logout', () => {
            Emitter.emit('logout', null);
        });

        Wechat.on('message', (msg) => {
            handleNewMessage(msg);
        });
    }

    function cacheNewMessage(msgObj) {
        let username = msgObj.isSendBySelf ? msgObj.toUsername : msgObj.fromUsername;
        if (conversationCache[username] == null) {
            conversationCache[username] = [];
        }
        conversationCache[username].push(msgObj);
    }

    function handleNewMessage(newMsg) {
        const fromUserName = newMsg.FromUserName;
        let msgObj;
        switch (newMsg.MsgType) {
            case Wechat.CONF.MSGTYPE_TEXT: {
                msgObj = {
                    "fromUsername": fromUserName,
                    "fromUserDisplayName": getUserDisplayNameByUsername(fromUserName),
                    "toUsername": newMsg.ToUserName,
                    "toUserDisplayName": getUserDisplayNameByUsername(newMsg.ToUserName),
                    "content": newMsg.Content,
                    "isSendBySelf": newMsg.isSendBySelf
                }
                break;
            }
        }
        if (msgObj) {
            cacheNewMessage(msgObj);
            Emitter.emit('newMessage', msgObj);
        }
    }

    function isOwnUsername(username) {
        return Wechat.user.UserName == username;
    }

    function getUserContactByUsername(username) {
        return Wechat.contacts[username];
    }

    function getUserDisplayNameByUsername(username) {
        if (!isOwnUsername(username)) {
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

    function fetchConversationByUsername(username) {
        return conversationCache[username] ? conversationCache[username] : [];
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
        "Emitter": Emitter,
        "fetchConversationByUsername": fetchConversationByUsername,
        "sendMessage": sendMessage
    };
})();