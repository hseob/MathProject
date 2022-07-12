const btn = document.getElementById("btn");

btn.addEventListener("click", (event)=>{
    
    const who = document.getElementById("who");
    const why = document.getElementById("why");
    if(who.value === "" || why.value === ""){
        // event.preventDefault();
        event.preventDefault();
        alert("빈칸이 존재합니다.");
    }else{
        alert("신고를 접수합니다");
    }
});