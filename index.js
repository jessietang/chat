/**
 * Created by jessietang on 2018/2/24.
 */
var express = require('express');
var app = express(); // express官网就是这么写的就是用来创建一个express程序，赋值给app。如果不理解就当公式记住
var server = require('http').Server(app);
var path = require('path');  // 这是node的路径处理模块，可以格式化路径
var io = require('socket.io')(server); //将socket的监听加到app设置的模块里。
var port = process.env.PORT || 3000;

var users = []; // 用来保存所有的用户信息
var usersNum = 0;
var _sockets = []; // 将socket和用户名匹配

// 监听3000端口，然后执行回调函数在控制台输出。
server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

/**
 * __dirname表示当前文件所在的绝对路径，所以我们使用path.join将index.js的绝对路径和public加起来就得到了public的绝对路径。
 * 用path.join是为了避免出现 ././public 这种奇怪的路径
 * express.static就帮我们托管了public文件夹中的静态资源。
 * 只要有 127.0.0.1：3000/XXX 的路径都会去public文件夹下找XXX文件然后发送给浏览器。
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * app.get(): express中的一个中间件，用于匹配get请求，所谓中间件就是在该轮http请求中依次执行的一系列函数。
 * '/': 它匹配get请求的根路由 '/'也就是 127.0.0.1:3000/就匹配到他了
 * req带表浏览器的请求对象，res代表服务器的返回对象
 */
app.get('/',(req, res) => {
    res.redirect('/chat.html'); // express的重定向函数。如果浏览器请求了根路由'/',浏览器就给他重定向到 '127.0.0.1:3000/chat.html'路由中
});


/*socket*/
// 监听客户端的连接事件
io.on('connection', (socket) => {
    // 所有有关socket事件的逻辑都写在这里
    usersNum++;
    console.log(`当前有${usersNum}个用户连接上服务器了`);
    socket.on('login', (data) => {
        /**
         * 先保存在socket中
         * 循环数组判断用户名是否重复,如果重复，则触发usernameErr事件
         * 将用户名删除，之后的事件要判断用户名是否存在
         */
        socket.username = data.username;
        for (let user of users) {
            if (user.username == data.username) {
                socket.emit('usernameErr', {err: '用户名重复'});
                socket.username = null;
                break;
            }
        }
        //如果用户名跟已在线用户名字不重复，将该用户的信息存进数组中
        if (socket.username) {
            users.push({
                username: data.username,
                message: [],
                dataUrl: [],
                touXiangUrl: data.touXiangUrl
            });
            // 保存socket
            _sockets[socket.username] = socket;
            // 然后触发loginSuccess事件告诉浏览器登陆成功了，广播形式触发
            console.log(users);
            data.userGroup = users;  // 将所有用户数组传过去
            io.emit('loginSuccess',data); // 将data原封不动的再发给该浏览器
        }
    });

    /***
     * 监听sendMessage事件，我们得到客户端传递过来的data里面的message,并保存起来
     * */
    socket.on('sendMessage', (data) => {
        for (let _user of users) {
            if (_user.username === data.username) {
                _user.message.push(data.message);
                // 信息存储之后触发receiveMessage将信息发给所有浏览器
                io.emit('receiveMessage', data);
                break;
            }
        }
    });

    // 断开连接后做的事情
    // 注意： 该事件不需要自定义触发器，系统会自动调用
    socket.on('disconnect', () => {
        usersNum--;
        console.log(`当前有${usersNum}个用户连接上服务器了`);

        // 触发用户离开的监听
        socket.broadcast.emit('oneLeave',{username: socket.username});

        // 删除用户
        users.forEach(function(user, index){
            if (user.username == socket.username) {
                users.splice(user,1); //删除该用户
            }
        });
    });
});




