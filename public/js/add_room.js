const form = document.getElementById("form");

const me = document.getElementById("me");

me.innerText = "호스트: 나)" + userInfo.name + " | 추천도: " + userDB[userInfo.email].recommend_count;

const btn = document.querySelector("button");

btn.addEventListener("click", (event)=>{
    
    const roomName = document.getElementById("roomName");
    const roomNote = document.getElementById("roomNote");
    if(roomName.value === "" || roomNote.value === ""){
        // event.preventDefault();
        event.preventDefault();
        alert("빈칸이 존재합니다.");
    }else{
        // event.submit();
    }
});

const host = document.getElementById("host");
const email = document.getElementById("email");
host.value = userInfo.name;
email.value = userInfo.email;