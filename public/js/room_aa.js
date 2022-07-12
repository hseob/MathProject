// import { restart } from "nodemon";

const socket = io();

const section_roomList = document.getElementById("section_roomList");
const section_room = document.getElementById("section_room");

let student_user;

function changeMode(type){
    if(type === "roomList"){
        section_roomList.style.display='';
        section_room.style.display='none';
    
        let roomDB;
    
        socket.emit("give_roomList");
        socket.on("take_roomList", (_roomDB)=>{
            roomDB = _roomDB;
            
            const roomCounter = document.getElementById("roomCounter");
            roomCounter.innerText = "방: " + Object.keys(roomDB).length + "개";

            const roomContainer = document.getElementById("roomContainer");
            while (roomContainer.hasChildNodes()) {
                roomContainer.removeChild(roomContainer.firstChild);
            }
    
            Object.keys(roomDB).forEach((v)=>{    
                const room = document.createElement("div");
                room.setAttribute("class", "room");
                const form = document.createElement("form");
                form.setAttribute("method", "POST");
                const input = document.createElement("input");
                input.setAttribute("type", "hidden");
                input.setAttribute("value", roomDB[v].roomId);
                const h2_roomName = document.createElement("h2");
                const p1_division = document.createElement("p");
                const p2_host = document.createElement("p");
                const p3_roomNote = document.createElement("p");
                const button = document.createElement("button");
                button.innerText="참여"
                h2_roomName.innerText = roomDB[v].roomName;
                p1_division.innerText = "분류: "+roomDB[v].division;
                p2_host.innerText = "호스트: "+roomDB[v].host;
                p3_roomNote.innerText = "비고: "+roomDB[v].roomNote;
    
                button.addEventListener("click", (event)=>{
                    event.preventDefault();
                    socket.emit("enter_room", roomDB[v].roomId, ()=>{
                        _roomName = roomDB[v].roomName;
                        _division = roomDB[v].division;
                        _host = roomDB[v].host;
                        _roomNote = roomDB[v].roomNote;
                        changeMode("room");
                        console.log(host);
                        student_user = host;
                    });
                });
    
                roomContainer.append(room);
                room.append(form);
                form.append(input);
                form.append(h2_roomName);
                form.append(p1_division);
                form.append(p2_host);
                form.append(p3_roomNote);
                form.append(button);
            });
        });
    
    }else if(type === "room"){
        section_roomList.style.display='none';
        section_room.style.display='';
    
        const roomName = document.getElementById("roomName");
        const division = document.getElementById("division");
        const host = document.getElementById("host");
        const roomNote = document.getElementById("roomNote");
    
        roomName.innerText = _roomName;
        division.innerText = "분류: " + _division;
        host.innerText = "호스트: " + _host;
        roomNote.innerText = "비고: " + _roomNote;
        
        const student = document.getElementById("student");
        student.innerText = "학생: " + student_user;

        //방장이 방을 생성할때 한번 실행되는 코드 실행되는 코드
        if(_type === "room"){
            student.innerText = "학생: 입장안함";
            socket.emit("make_room", _roomId, _roomName, _host, _division, _roomNote, ()=>{
                console.log("방이 생성되었습니다!"); // callback
            });
        }   
    }
}


changeMode(_type);