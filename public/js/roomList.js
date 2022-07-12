const socket = io();

socket.emit("get_roomList");

socket.on("take_roomList", (roomDB, userDB)=>{
    Object.keys(roomDB).forEach(function(v){
        console.log(roomDB[v].host);
    });
    const roomCounter = document.getElementById("roomCounter");
    roomCounter.innerText = "방: " + Object.keys(roomDB).length + "개";

    const roomContainer = document.getElementById("roomContainer");
    while (roomContainer.hasChildNodes()) {
        roomContainer.removeChild(roomContainer.firstChild);
    }

    Object.keys(roomDB).forEach(function(v){
        const div = document.createElement("div");
        div.setAttribute("class", "room");
        const h2 = document.createElement("h2");
        h2.innerText = roomDB[v].roomName;
        const p1 = document.createElement("p");
        const p2 = document.createElement("p");
        p1.innerText = "분류: " + roomDB[v].division;

        console.log(userDB[roomDB[v].email].recommend_count);

        p2.innerHTML = "호스트: " + roomDB[v].host + " | 추천도: " + userDB[roomDB[v].email].recommend_count;

        const p3 = document.createElement("p");
        p3.innerText = "비고: " + roomDB[v].roomNote;
        const button = document.createElement("button");
        button.innerText = "참여";
        // const p4 = document.createElement("p");
        // p4.innerText = "정원: 1/2";
        // p4.setAttribute("id", "personnel");
        const form = document.createElement("form");
        form.setAttribute("action", "/room");
        form.setAttribute("method", "POST");
        const input = document.createElement("input");
        input.setAttribute("type", "hidden");
        input.setAttribute("name", "roomInfo");
        input.setAttribute("value", JSON.stringify(roomDB[v]));

        roomContainer.append(div);
        div.append(h2);
        div.append(p1);
        div.append(p2);
        div.append(p3);
        // div.append(p4);
        div.append(form);
        form.append(input);
        form.append(button);
    });
});
