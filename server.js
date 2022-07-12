import { count } from "console";
import { createSocket } from "dgram";
import {Server} from "socket.io";

const express = require("express");
const http = require("http");
const session = require("express-session");
const passport = require('passport');
const path = require("path");
const bodyParser = require("body-parser");

const hostname = "127.0.0.1";
const port = 3000;

const app = express();

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.use(express.static(__dirname + "/public"));

app.use(passport.initialize());
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'SECRET'
}));
app.use(passport.session());

function checkLogin(req,res,done){
    if(req.user){
        done();
    }else{
        res.redirect("/");
    }
}

function checkLogin_login(req,res,done){
    if(!req.user){
        done();
    }else{
        res.redirect("/roomList");
    }
}

app.get("/", (req,res) => {
    res.redirect("/login");
});

app.get("/login", (req,res) => {
    checkLogin_login(req,res,()=>{
        res.render("login");
    });
});

app.get("/roomList",(req,res)=>{
    checkLogin(req,res,()=>{
        // 접속한 모든 유저 칭찬도 저장
        if(userDB[req.user._json.email] == undefined){
            userDB[req.user._json.email] = req.user._json;
            userDB[req.user._json.email].recommend_count = 0;
        }
        res.render("roomList");
    });    
});

// 잘못된 접근방식
app.get("/room", (req,res)=>{
    checkLogin(req,res,()=>{
        res.render("room");
    });
});

app.post("/room", (req,res)=>{
    checkLogin(req,res,()=>{
        res.render("room", {roomInfo: JSON.stringify(req.body), userInfo: JSON.stringify(req.user._json)});
    });
});

app.get("/test", (req,res)=>{
    checkLogin(req,res,()=>{
        res.render("test", {type: "roomList", roomName: null, roomNote: null, division: null, host: req.body.userName, roomId: null});
    });
})

app.get("/add_room", (req,res)=>{
    checkLogin(req,res,()=>{
        res.render("add_room", {userInfo: JSON.stringify(req.user._json), _userDB: JSON.stringify(userDB)});
    });
})

app.get("/report", (req,res)=>{
    checkLogin(req,res,()=>{
        res.render("report");
    });
});

app.get("/logout", (req,res)=>{
    req.logout();
    req.session.save(function(){
        res.redirect('/login');
    })
})

app.get('/error', (req, res) =>{
    res.send("error logging in");
});

let reportindex = 0;
let reporter = {}; // 임시

app.post("/reported", (req,res)=>{
    checkLogin(req,res,()=>{
        reporter[++reportindex] = req.body
        console.log(reporter);
        res.redirect("/report");
    });
});

// 사용자 정보 세션에 저장하는 함수
passport.serializeUser(function(user, cb) {
    cb(null, user);
});

// 페이지 접근시 마다 사용자 정보를 세션에서 읽음
passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GOOGLE_CLIENT_ID = '61123760536-o2eldi3fcr39qbatcoivp7ott0i9vv4c.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

var userProfile;

//2
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
}, function(accessToken, refreshToken, profile, cd) {
    userProfile=profile; // 이거 할당으로 로그인 구별함
    return cd(null, profile);
}));

// 1
app.get('/auth/google', 
    passport.authenticate('google', { scope : ['profile', 'email'], prompt:"select_account" }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/error' }),
    function(req, res) {
        // Successful authentication, redirect success.
        res.redirect('/roomList'); // 성공시 이동하는 곳
    }
);


const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});

function publicRooms(){
    const {sockets: {adapter: {sids, rooms}}} = wsServer;
    // const sids = wsServer.sockets.adapter.sids;
    // const rooms = wsServer.sockets.adapter.rooms;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined){
            publicRooms.push(key);
        }
    });

    return publicRooms;
}

let roomDB = {};
let showRoomDB;
let userDB = {};

// 공개룸의 존재여부를 확인하여 갱신한다.
function updateDB(){
    //roomDB
    Object.keys(roomDB).forEach(function(v){
        let isroom = false;
        publicRooms().forEach((element)=>{
            if(roomDB[v].email === element){
                isroom = true;
            }
        });
        if(!isroom){
            delete roomDB[v];
        }
    });
}

function updateShowRoomDB(){
    updateDB();
    showRoomDB = {};
    Object.keys(roomDB).forEach(function(v){
        if(countRoom(roomDB[v].email) === 1){
            showRoomDB[roomDB[v].email] = roomDB[v];
        }
    })
}

function getuserDB(){ // 이렇게 안하면 socket.on은 한번실행하고 초기화(?)되어서 userDB의 초기값만 보낼 수 있다.??????
    return userDB;
}

function countRoom(roomId){
    return wsServer.sockets.adapter.rooms.get(roomId)?.size;
}

//이미 생성된 방도 확인해야함
wsServer.on("connection", socket=>{
    socket["userInfo"] = "Anon";

    // UserInfo를 삽입
    socket.on("sokcet_set_userInfo", (userInfo, roomInfo)=>{
        socket["userInfo"] = userInfo;
        socket["roomInfo"] = roomInfo.email;
    });

    socket.on("get_userDB", (done)=>{
        done(userDB);
    })

    socket.on("join_room", (roomInfo, done)=>{
        const roomId = roomInfo.email;
        socket.join(roomId);
        roomDB[roomId] = roomInfo;
        updateDB();
        updateShowRoomDB();
        wsServer.emit("take_roomList", showRoomDB, getuserDB());
        done("first_join_room");
    });

    socket.on("student_enter", (roomInfo)=>{
        const roomId = roomInfo.email;
        socket.to(roomId).emit("student", socket.userInfo);
        updateDB();
        updateShowRoomDB();
        wsServer.emit("take_roomList", showRoomDB, getuserDB());
    });

    socket.on("out_the_room", (roomInfo)=>{
        const roomId = roomInfo.email;
        socket.to(roomId).emit("how_is_out");
        // socket.leave(roomInfo.host);
        socket.in(roomId).socketsLeave(roomId);
        socket["roomInfo"] = "";
        socket.emit("out_the_room_ok");
        updateDB();
        updateShowRoomDB();
        wsServer.emit("take_roomList", showRoomDB, getuserDB());
    });

    socket.on("out_room", (roomInfo)=>{
        const roomId = roomInfo.email;
        // socket.leave(roomInfo.host);
        socket.in(roomId).socketsLeave(roomId);
        socket["roomInfo"] = "";
        updateDB();
        updateShowRoomDB();
        // console.log(roomDB);
        // console.log(showRoomDB);
        wsServer.emit("take_roomList", showRoomDB, getuserDB());
    });

    socket.on("disconnect",()=>{
        socket.to(socket.roomInfo).emit("how_is_out");
        socket.in(socket.roomInfo).socketsLeave(socket.roomInfo);
        socket["roomInfo"] = "";
        updateDB();
        updateShowRoomDB();
        wsServer.emit("take_roomList", showRoomDB, getuserDB());
    });

    socket.on("welcome", ()=>{
        socket.emit("welcome");
    });

    socket.on("offer", (offer, roomInfo)=>{
        const roomId = roomInfo.email;
        socket.to(roomId).emit("offer", offer); //offer를 요청자가 아닌 사람들에게 offer를 보냄
    });

    socket.on("answer", (answer, roomInfo)=>{
        const roomId = roomInfo.email;
        socket.to(roomId).emit("answer", answer);
    }); 

    socket.on("ice", (ice, roomInfo)=>{
        const roomId = roomInfo.email;
        socket.to(roomId).emit("ice", ice);
    });

    socket.on("get_roomList", ()=>{
        updateDB();
        updateShowRoomDB();
        socket.emit("take_roomList", showRoomDB, getuserDB());
    });

    socket.on("welcome2", ()=>{
        socket.emit("welcome2");
    });

    socket.on("offer2", (offer, roomInfo)=>{
        const roomId = roomInfo.email;
        socket.to(roomId).emit("offer2", offer);
    });
    
    socket.on("answer2", (answer, roomInfo)=>{
        const roomId = roomInfo.email;
        socket.to(roomId).emit("answer2", answer);
    });

    socket.on("ice2", (ice, roomInfo)=>{
        const roomId = roomInfo.email;
        socket.to(roomId).emit("ice2", ice);
    });

    socket.on("disconnecting", ()=>{
    });

    socket.on("recommend", (roomInfo)=>{
        const roomId = roomInfo.email;
        socket.to(roomId).emit("recommend_user");
    })
    socket.on("recommend_good", (userInfo, roomInfo)=>{
        const roomId = roomInfo.email;
        if(socket.userInfo === userInfo){
            socket.emit("recommend_bad");
            return;
        }
        userDB[userInfo.email].recommend_count += 1; 
        socket.emit("recommend_wow");
        return;
    })
})







httpServer.listen(port, hostname, ()=>{
    console.log(`Server running at http://${hostname}:${port}/`);
})