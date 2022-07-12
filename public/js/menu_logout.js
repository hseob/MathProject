let logoutBtn = document.getElementById("logout");

logoutBtn.addEventListener("click", ()=>{
    if(confirm("로그인 화면으로 돌아갈까요?")){
        window.location.href = '/logout';
        return;
    }else{
        return;
    }
});