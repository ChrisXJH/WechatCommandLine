module.exports = (function () {

    function isGroup(contact) {
        return contact['MemberCount'] > 0;
    }

    function findContactByNickName(contacts, nickname) {
        for (let usrname in contacts) {
            let contact = contacts[usrname];
            if (contact['NickName'] === nickname) {
                return contact;
            }
        }
        return null;
    }

    function findContactByRemarkName(contacts, remarkname) {
        for (let usrname in contacts) {
            let contact = contacts[usrname];
            if (contact['RemarkName'] === remarkname) {
                return contact;
            }
        }
        return null;
    }

    function getRemarkNameByUsername(username) {
        return "";
    }

    // Determine if a username name is belong to a group chat by
    // checking if there's leading "@@"
    function isGroupUserName(username) {
        return username.match(/@@.*/g) != null;
    }


    return {
        findContactByNickName: findContactByNickName,
        findContactByRemarkName: findContactByRemarkName,
        isGroupUserName: isGroupUserName
    };

})();
