const socket = io();

// let student;
let myStream;
let gumStream;
let muted = false;
let myPeerConnection;
let myPeerConnection2;
let myDataChannel;

let studentInfo;
let userDB;

let twoPeopleHere = false;

const roomName = document.getElementById("roomName");
const division = document.getElementById("division");
const hostText = document.getElementById("host");
const roomNote = document.getElementById("roomNote");
const studentText = document.getElementById("student");

const myAudio = document.getElementById("audio");
const myScreen = document.getElementById("screen");
const remoteScreen = document.getElementById("opponentscreen")
const muteBtn = document.getElementById("mute");

const recommed = document.getElementById("recommend");
const screen_change = document.getElementById("screen_change");
const screen_off = document.getElementById("screen_off");
const exit = document.getElementById("exit");

const msg_text = document.getElementById("msg_text");
const msg_submit = document.getElementById("msg_submit");
const chat_parents = document.getElementById("li_tag");

// 새로고침 방지
function NotReload(){
    if( (event.ctrlKey == true && (event.keyCode == 78 || event.keyCode == 82)) || (event.keyCode == 116) ) {
        event.keyCode = 0;
        event.cancelBubble = true;
        event.returnValue = false;
    } 
}
document.onkeydown = NotReload;

// initCall();

// 서버의 소켓에 userInfo를 삽입;
socket.emit("sokcet_set_userInfo", userInfo, roomInfo);

socket.emit("get_userDB", (_userDB)=>{
    userDB = _userDB;
});

// 룸 입장
socket.emit("join_room", roomInfo, textEdit);


// 화면상의 글자를 모두 초기화 시켜주는 함수
function textEdit(type){
    switch(type){
        case "first_join_room":
            roomName.innerText = roomInfo.roomName;
            division.innerText = "분류: " + roomInfo.division;
            hostText.innerText = "호스트: " + roomInfo.host  + " | 추천도: " + userDB[roomInfo.email].recommend_count;
            roomNote.innerText = "비고: " + roomInfo.roomNote;
            section();
            break;
        case "section_host":
            hostText.innerText = "호스트: 나)" + userInfo.name + " | 추천도: " + userDB[userInfo.email].recommend_count;
            break;
        case "section_student":
            studentText.innerText = "학생: 나)" + userInfo.name + " | 추천도: " + userDB[userInfo.email].recommend_count;
            break;
        case "student_enter":
            studentText.innerText = "학생: " + studentInfo.name + " | 추천도: " + userDB[studentInfo.email].recommend_count;
    }
    
}

let ishost;
let isstudent;

// 호스트와 학생을 구분
function section(){
    if(roomInfo.host === userInfo.name){
        ishost = true;
        isstudent = false;
        textEdit("section_host");
    }else{
        ishost = false;
        isstudent = true;
        twoPeopleHere = true; // 학생이 입장하면 두명사람 true
        initCall(()=>{
            socket.emit("student_enter", roomInfo);
        });
        
        textEdit("section_student");
    }
}



//방장이 학생을 받을때 실행되는 코드
//학생이 입장할때,
socket.on("student", (_studentInfo)=>{
    
    twoPeopleHere = true;
    studentInfo = _studentInfo;
    textEdit("student_enter");
    const li = document.createElement("li");
    li.innerText = "학생 " + studentInfo.name + "님이 참여했습니다.";
    chat_parents.append(li);
    socket.emit("room_is_full", roomInfo);
    socket.emit("welcome"); // 방장만 실행되도록 설정하는 소켓전송
    socket.emit("get_userDB", (_userDB)=>{
        userDB = _userDB;
    });
});

// 학생이 입장하면 방장만 실행되는 코드
// 방장코드
socket.on("welcome", async()=>{
    initCall(async()=>{
        // alert("학생이 입장하였습니다");
        // gumStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, gumStream));
        // myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
        myDataChannel = myPeerConnection.createDataChannel("chat"); // dataChanel을 생성하여 넣어줌
        myDataChannel.addEventListener("message", (msg)=>{ // 메세지를 받았을때 실행
            const li = document.createElement("li");
            li.innerText = studentInfo.name + ": " + msg.data;
            chat_parents.append(li);
        });

        const offer = await myPeerConnection.createOffer();
        myPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomInfo); // offer을 생성하여 서버로 보냄
    });
    
})

// 학생코드
socket.on("offer", async(offer)=>{
    
    // myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
    myPeerConnection.addEventListener("datachannel", (event)=>{ // 방장으로 부터 데이터채널이 감지 된다면 실행
        myDataChannel = event.channel; // 채널 할당
        myDataChannel.addEventListener("message", (msg)=>{ // 메세지를 받았을때 실행
            const li = document.createElement("li");
            li.innerText = roomInfo.host + ": " + msg.data;
            chat_parents.append(li);
        });
    });
    myPeerConnection.setRemoteDescription(offer); // offer를 remote로 설정
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer); // answer 생성 후 로컬로 세팅
    socket.emit("answer", answer, roomInfo);
});

// 방장코드
//방장이 answer을 받기위해 생성됨
socket.on("answer", (answer)=>{
    myPeerConnection.setRemoteDescription(answer);
});

//모두가 ice를 받음
socket.on("ice", (ice)=>{
    console.log("take ice")
    myPeerConnection.addIceCandidate(ice); // ice 설정
});
async function getMedia(){
    try {
        myStream = await navigator.mediaDevices.getUserMedia({audio:true});
    } catch (error) {
        console.log(error);
    }
    
}

async function initCall(done){
    await getMedia();
    makeConnection();
    done();
}

let dataa;


function makeConnection(){
    myPeerConnection = new RTCPeerConnection({offerToReceiveAudio: true, offerToReceiveVideo: true});
    myPeerConnection.addEventListener("icecandidate", (data)=>{ // offer와 answer거래가 이어진 후 실행
        socket.emit("ice", data.candidate, roomInfo);
    });    
    myPeerConnection.ontrack = (data)=>{ // 연결이 완료되면 더 이상 호출되지 않는다?
        audiono = false;
        console.log("asdfsdfs");
        dataa = data;
        console.log(data);
        myAudio.srcObject = data.streams[0]; // 
    };
    console.log(isstudent,"학생이다");
    try {
        myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
    } catch (error) {
        alert("마이크인식 실패! 다시시도 해주세요");
    }
}

makeConnection2();

socket.on("welcome2", async()=>{
    const myDataChannel2 = myPeerConnection2.createDataChannel("chat");
    const offer = await myPeerConnection2.createOffer();
    myPeerConnection2.setLocalDescription(offer);
    socket.emit("offer2", offer, roomInfo);
});

socket.on("offer2", async(offer)=>{
    myPeerConnection2.setRemoteDescription(offer);
    const answer = await myPeerConnection2.createAnswer();
    myPeerConnection2.setLocalDescription(answer);
    socket.emit("answer2", answer, roomInfo);
})

socket.on("answer2", (answer)=>{
    myPeerConnection2.setRemoteDescription(answer);
});

socket.on("ice2", (ice)=>{
    myPeerConnection2.addIceCandidate(ice);
});

function makeConnection2(){
    myPeerConnection2 = new RTCPeerConnection();
    myPeerConnection2.addEventListener("icecandidate", (data)=>{ // offer와 answer거래가 이어진 후 실행
        socket.emit("ice2", data.candidate, roomInfo);
    });
    myPeerConnection2.ontrack = (data)=>{ // 연결이 완료되면 더 이상 호출되지 않는다?
        remoteScreen.srcObject = data.streams[0]; // 
    };
}

screen_off.style.visibility = "hidden";

let isScreenShare = false;
let isFirst = true;

//화면공유 버튼
screen_change.addEventListener("click", async()=>{
    const myscreenpanel = document.getElementById("myscreenpanel");
    if(!twoPeopleHere){
        alert("상대가 입장 후 화면을 공유해주세요!");
        return;
    }
    if(!isScreenShare){
        // 화공 시작
        isScreenShare = true;
        try {
            gumStream = await navigator.mediaDevices.getDisplayMedia({video:true});
        } catch (error) {
            isScreenShare = false;
            return;
        }
        
        if(isFirst){
            gumStream.getTracks().forEach((track) => myPeerConnection2.addTrack(track, gumStream));      
            socket.emit("welcome2"); // 연결시작
            isFirst = false;
        }else{
            const videoTrack = gumStream.getVideoTracks()[0];
            const videoSender = myPeerConnection2.getSenders().find(sender => sender.track.kind === "video");
            videoSender.replaceTrack(videoTrack);
            
        }     
        myscreenpanel.setAttribute("style", "display: block");
        screen_change.innerText = "화공변경";
        screen_off.style.visibility = "visible";   
        myScreen.srcObject = gumStream;
    }else{
        // 화공변경
        gumStream = await navigator.mediaDevices.getDisplayMedia({video:true});
        const videoTrack = gumStream.getVideoTracks()[0];
        const videoSender = myPeerConnection2.getSenders().find(sender => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
        myScreen.srcObject = gumStream;
    }
});



let screenmuted = false; // 스크린이 꺼졌는지 켜졌는지 판단하는 변수
screen_off.addEventListener("click", ()=>{
    gumStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    if(isScreenShare){
        screen_change.innerText = "화면공유";
        isScreenShare = false;
        myscreenpanel.setAttribute("style", "display: none");
        screen_off.style.visibility = "hidden";
    }
    
});

muteBtn.addEventListener("click", async()=>{
    if(!twoPeopleHere){
        alert("상대가 입장 후 조작가능합니다!");
        return;
    }
    try {
        myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled)
    } catch (error) {
        console.log(error);
    }
    
    if(!muted){
        muteBtn.innerText = "마이크꺼짐";
        muted = true;
    }else{
        muteBtn.innerText = "마이크켜짐";
        // myStream = await navigator.mediaDevices.getUserMedia({audio:true});
        // const audioTrack = myStream.getAudioTracks()[0];
        // const audioSender = myPeerConnection.getSenders().find(sender => sender.track.kind === "audio");
        // audioSender.replaceTrack(audioTrack);
        muted = false;
    }
}); 

// 나가기 버튼 기능
exit.addEventListener("click", ()=>{
    twoPeopleHere = false;
    socket.emit("out_the_room", roomInfo);
});

// 'room'을 성공적으로 나왔다.
socket.on("out_the_room_ok", ()=>{
    twoPeopleHere = false; // 나가는 거라 더 이상 무의미 해짐
    roomInfo = "";
    userInfo = "";
    window.location.href = '/roomList';
});

// 들어왔던 상대가 나가면 방은 파괴된다. 방에 혼자 있을 수 있는건 방을 만들고 학생을 기다릴 때 뿐이다.
// 누군가 나갔다
socket.on("how_is_out", ()=>{  // 내가 누군가 나간걸 아는 유일한 함수
    remoteScreen.srcObject = null
    twoPeopleHere = false;
    roomInfo = "";
    userInfo = "";
    const msg = document.createElement("li");
    msg.innerText = "상대가 수업을 떠났습니다. \n이제 당신은 혼자입니다. \n퇴장해 주세요.";
    chat_parents.append(msg);
    socket.emit("out_room", roomInfo); // 누군가 나갔다면 나도 룸에서 나간 처리 한다.
});

// 채팅 전송 함수
msg_submit.addEventListener("click", ()=>{
    const li = document.createElement("li");
    li.innerText = "나)" + userInfo.name + ": " + msg_text.value;
    chat_parents.append(li);
    if(twoPeopleHere){
        myDataChannel.send(msg_text.value);
    }
});

let isrecommend = false;

recommend.addEventListener("click", ()=>{
    if(!twoPeopleHere){
        alert("추천할 상대가 입장하지 않았습니다!");
        return;
    }
    if(!isrecommend){
        alert("상대를 추천했습니다!");
        isrecommend = true;
        socket.emit("recommend", roomInfo);
        return;
    }else{
        alert("추천은 한번만 가능합니다!");
    }
});

socket.on("recommend_user", ()=>{
    socket.emit("recommend_good", userInfo, roomInfo);
});

socket.on("recommend_bad", ()=>{
    isrecommend = false;
    alert("조작된 추천입니다!");
})

socket.on("recommend_wow", ()=>{
    alert("추천을 받았습니다!");
});

socket.onerror = (error) => {
    console.error('socket::error', error);
};

socket.onclose = () => {
    console.log('socket::close');
    stop();
};
