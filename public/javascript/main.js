/**
 * Created by jessietang on 2018/2/24.
 */
$(function(){
    // 初始化变量
    var $usernameInput = $('.usernameInput'); // 登录用户名输入框
    var $messageInput = $('.messageInput'); // 聊天消息发送框
    var $messages = $('.messages'); //聊天面板
    var $userList = $('.user-list'); // 用户列表

    var $loginPage = $('.login.page'); // the login page
    var $chatPage = $('.chat.page'); // the chatroom page

    var _username = null;
    var _touXiangUrl = null;
    var _to = null;

    var socket = io();

    let setUsername = function(){
        _username = $usernameInput.val().trim();
        _touXiangUrl = 'icon-yonghu'; // need to do...
        // 判断用户名是否存在
        if (_username) {
            // 如果用户名存在，就代表可以登录了，我们就触发登录事件，相当于告诉服务器我们要登录了
            socket.emit('login',{username: _username, touXiangUrl: _touXiangUrl});
        }
    };

    let beginChat = function(data){
        // 1.隐藏登录框，取消他绑定的事件  2.显示聊天面板
        $loginPage.hide('slow');
        $usernameInput.off('keyup');

        // 显示聊天界面，并显示是谁的聊天界面
        $(`<h2 style="text-align: center;">${_username}的聊天室</h2>`).insertBefore($messages);
        $chatPage.show('slow');

        // 用户列表渲染，首先清空用户列表，然后先添加自己，再从data中找到别人添加进去
        $userList.empty();
        $userList.append(`<li name="${data.username}">${data.username}</li>`);
        // 添加别人
        for(let _user of data.userGroup){
            if (_user.username !== _username){
                $userList.append(`<li name="${_user.username}">${_user.username}</li>`);
            }
        }
    };

    let sendMessage = function(){
        var _message = $messageInput.val();
        // 拿到输入框的聊天信息，如果不为空，就触发sendMessage,将信息和用户名发送过去
        if (_message) {
            socket.emit('sendMessage', {username: _username, message: _message, touXiangUrl: _touXiangUrl});
        }
    };

    let showMessage = function(data){
        //先判断这个消息是不是自己发出的，再以不同的样式显示
        if (data.username === _username) {
            $('.message-list-box').append(`<li class="msg-right">${data.username} : ${data.message}</li>`);
        }else{
            $('.message-list-box').append(`<li class="msg-left">${data.username} : ${data.message}</li>`);
        }
    };

    // flag: 1 好友上线  flag: -1好友下线   data:存储用户信息
    let comAndLeave = function(flag, data){
        // 上线显示警告框，用户列表添加一个
        if (flag === 1) {
            $('.alertMsg').text(`你的好友${data.username}上线了！`).show();
            setTimeout(() => {
                $('.alertMsg').hide();
            }, 1000);
            // 用户列表添加该用户
            $userList.append(`<li name="${data.username}">${data.username}</li>`);
        }else{
            // 下线显示警告框，用户列表删除一个
            $('.alertMsg').text(`你的好友${data.username}下线了！`).show();
            setTimeout(() => {
                $('.alertMsg').hide();
            }, 1000);
            // 用户列表添加该用户
            $userList.find(`li[name=${data.username}]`).remove();
        }
    };

    /**
    * 前端事件
    * */
    // 登录事件 监听用户名输入框的回车事件
    $usernameInput.on('keyup', function(e){
        var e = e || window.event;
        if (e.keyCode === 13) {
            setUsername();
        }
    });

    // 聊天事件
    $messageInput.on('keyup', function(e){
        var e = e || window.event;
        if (e.keyCode === 13) {
            sendMessage();
            $messageInput.val('');
        }
    });


    /***
     * socket.io部分逻辑
     * */
    socket.on('loginSuccess', (data) => {
        if (data.username === _username) {
            beginChat(data);
        }else{
            comAndLeave(1,data);
        }
    });

    socket.on('receiveMessage', (data) => {
        showMessage(data);
    });

    socket.on('usernameErr', (data) => {
        $('.alertMsg').text(`$(data.err)`).show();
        setTimeout(function(){
            $('.alertMsg').hide();
        }, 1000);
    });
});