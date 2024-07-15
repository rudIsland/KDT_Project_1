import {GameObject, Ball, Paddle, Block, Vector2D} from "./object.js"

$(document).ready(function(){
    const canvas = document.getElementById("wall");
    const ctx = canvas.getContext("2d");
    canvas.width = 600;
    canvas.height = 800;

    /******************************게임 설정 데이터**********************************/
    let maxLife = null; let life = null; 
    let score = null; let scoreGap = null;
    let level = 1;

    function addScore(){
        score += scoreGap;
        $("#score").text(score);
    }

    function cutLife(){
        life -= 1;
        $("#life").text(life);
    }

    function initDataSetting(){
        maxLife = 3;
        $("#max_life").text(maxLife);
        
        life = maxLife;
        $("#life").text(life);
        
        score = 0;
        $("#score").text(score);
        
        scoreGap = 1;
    }
    initDataSetting();    

    /******************************오브젝트 관리**********************************/

    let ball = null; let dirVec = null; 
    let paddle = null; let blocks = null;
    let objects = []; //모든 오브젝트

    //공의 위치 초기화
    function initBallPosition(){
        //공
        let ballRadius = 20;
        let x = canvas.width / 2;
        let y = canvas.height / 2;
        if(ball==null){
            ball = new Ball(x,y,ballRadius,"#007bff");
        }
        else{
            ball.point=new Vector2D(x,y);
        }
        //공의 방향 및 속도 조절
        let dx = (Math.random() * 2 - 1) * 4;
        let dy = 4; 
        let velocity = 6.0; //속도 조절 상수
        //길이 1의 방향벡터로 만든 뒤 속도 조절 상수 곱
        dirVec = new Vector2D(dx,dy).normalize().mul(velocity); 
    }

    function initObject(){
        //공
        initBallPosition();
        
        //받침대
        let paddleHeight = 20;
        let paddleWidth = 100;
        let paddleX = (canvas.width - paddleWidth) / 2;
        let paddleY = paddleHeight + 10;
        paddle = new Paddle(paddleX, paddleY, paddleWidth, paddleHeight,"#007bff");

        //벽돌
        blocks = new Array();
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 7; col++) {
                let blockX = col * (75 + 5) + 30;
                let blockY = canvas.height - (row * (30 + 5) + 30);
                let block = new Block(blockX, blockY, 75, 30, level); //벽돌생성
                blocks.push(block);
            }
        }

        //오브젝트 관리용 배열
        objects = new Array();
        objects.push(ball);
        objects.push(paddle);    
        blocks.forEach((block)=>{ //2~
            objects.push(block);
        });
    }
    initObject();
    
    /******************************이벤트 관리**********************************/

    //키보드 이벤트
    let rightPressed = false;
    let leftPressed = false;

    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);

    function keyDownHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") {
            rightPressed = true;
        }
        else if (e.key === "Left" || e.key === "ArrowLeft") {
            leftPressed = true;
        }
    }

    function keyUpHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") {
            rightPressed = false;
        }
        else if (e.key === "Left" || e.key === "ArrowLeft") {
            leftPressed = false;
        }
    }

    //벽돌과 공의 충돌 감지
    function detectCollideWithBlock(ball,block){
        // 벽돌 영역의 경계
        let blockLeft = block.point.x;
        let blockRight = block.point.x+block.width;
        let blockTop = block.point.y;
        let blockBottom = block.point.y-block.height;

        //공의 중점과 영역 사이의 가까운 거리 구하기
        let nearX = Math.max(blockLeft,Math.min(ball.point.x,blockRight));
        let nearY = Math.max(blockBottom,Math.min(ball.point.y,blockTop));

        //공의 중심과 벽돌 사이의 거리
        let distX = ball.point.x - nearX; //경계 사이에 존재하면 0
        let distY = ball.point.y - nearY;
        //상하좌우 영역 및 각 모서리와의 거리
        let dist = Math.sqrt(Math.pow(distX,2)+Math.pow(distY,2));

        if(dist<=ball.radius){ //충돌 판정

            //공의 이동 방향
            let movedLeft = Math.abs(ball.point.x - ball.radius - blockRight);
            let movedRight = Math.abs(ball.point.x + ball.radius - blockLeft);
            let movedBottom = Math.abs(ball.point.y - ball.radius - blockTop );
            let movedTop = Math.abs(ball.point.y + ball.radius - blockBottom);
            let movedMin = Math.min(movedLeft, movedRight, movedTop, movedBottom);
            //충돌된 곳과 최소가 되는 방향 => 공의 이동방향
            
            //좌우 충돌 감지
            if (movedMin == movedLeft || movedMin == movedRight) 
                return "collide_lr"; 
            //상하 충돌 감지
            else if((movedMin == movedBottom || movedMin == movedTop)) 
                return "collide_tb"; 
            //모서리 충돌 감지
            else
                return "collide_corn";
        }
        else
            false;
    }

    //충돌 처리
    function detectCollision(){ 
        //공이 왼쪽 또는 오른쪽 벽에 부딪히면 반대로 가도록 설정
        if (ball.point.x + dirVec.x > canvas.width - ball.radius 
            || ball.point.x + dirVec.x < ball.radius) 
        {
            dirVec.x = -dirVec.x; //dx = -dx
        }
        //위쪽 벽
        if (canvas.height - ball.radius < ball.point.y + dirVec.y) {
            dirVec.y = -dirVec.y; //dy = -dy
        } 
        //아래쪽 벽
        else if (ball.point.y+dirVec.y-ball.radius +25< paddle.point.y ) { //받침대와 충돌여부
            if (ball.point.x > paddle.point.x && ball.point.x < paddle.point.x + paddle.width +35) {
                dirVec.y = -dirVec.y;
            } else { //만약 패들 밑 바닥에 부딪힐경우 이벤트
                cutLife();
                if(life==0){
                    initDataSetting(); //게임 데이터 초기화
                    initObject(); //오브젝트 초기화
                }
                else
                    initBallPosition(); //공의 위치
            }
        }

        //받침대가 벽을 넘지 않도록 조정
        let paddle_v = 7;
        if (rightPressed && paddle.point.x < canvas.width - paddle.width) {
            paddle.point = paddle.point.add(new Vector2D(paddle_v,0)); //paddleX += 7;
        } else if (leftPressed && paddle.point.x > 0) {
            paddle.point = paddle.point.add(new Vector2D(-paddle_v,0));
        }

        //block 충돌
        let brokenBlockIndex = null;
        for(let i=0;i<blocks.length;++i){
            let block = blocks[i];

            let collision = detectCollideWithBlock(ball,block);
            if(collision){
                if(collision == "collide_lr"){ //좌우 충돌
                    dirVec.x = -dirVec.x;
                }
                else if("collide_tb"){ //상하 충돌
                    dirVec.y = -dirVec.y;
                }
                else{ //모서리 충돌
                    dirVec.x = -dirVec.x;
                    dirVec.y = -dirVec.y;
                }
                block.life--; // 벽돌 생명력 감소
                if(block.life <= 0) { //벽돌의 생명이 다할경우
                    brokenBlockIndex = i;
                }
                break;
            }
        }
        if(brokenBlockIndex!=null){
            addScore(); //점수추가
            blocks.splice(brokenBlockIndex,1);
            objects.splice(2+brokenBlockIndex,1); //오브젝트에서 제거
        }
    }
    /******************************canvas 그리기**********************************/

    //draw -> update 수정
    function update(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        //그리기 위한 모든 오브젝트를 canvas 좌표계로 변환 
        GameObject.mapCoordLB2CanvasFromList(canvas,objects);
        objects.forEach((object)=>{ 
            object.draw(ctx);
        });

        //블럭을 모두 부셨을때 로직
        if(blocks.length==0){
            level++;
            initObject();
            console.log("Win");
        }
        
        //값의 변경을 위해 LB 좌표계로 변환
        GameObject.mapCoordCanvas2LBFromList(canvas,objects);

        //충돌 처리
        detectCollision(); 

        //방향 변경
        ball.point = ball.point.add(dirVec);
        requestAnimationFrame(update);
    }
    update();
});