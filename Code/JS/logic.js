import {GameObject, Ball, Paddle, Block, Line, Vector2D} from "./object.js"

$(document).ready(function(){
    const canvas = document.getElementById("wall");
    const ctx = canvas.getContext("2d");
    canvas.width = 400; //css와 비율 맞춤
    canvas.height = 420;

    /******************************게임 설정 데이터**********************************/
    let maxLife = null; let life = null; 
    let score = null; let scoreGap = null;
    let level = 1; let velocity = 5.0;

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
    const maxRadius = 99999999;

    //공의 위치 초기화
    function initBallPosition(){
        //공
        let ballRadius = 10%(maxRadius+1);
        let x = canvas.width / 2;
        let y = canvas.height / 2 - 150;
        if(ball==null){
            ball = new Ball(x,y,ballRadius,"#007bff");
        }
        else{
            ball.point=new Vector2D(x,y);
        }
        //초기 공의 방향 0
        dirVec = new Vector2D(0,0); 
    }

    function initObject(){
        //공
        initBallPosition();
        
        //받침대
        let paddleHeight = 15;
        let paddleWidth = 80;
        let paddleX = (canvas.width - paddleWidth) / 2;
        let paddleY = paddleHeight + 10;
        paddle = new Paddle(paddleX, paddleY, paddleWidth, paddleHeight,"#007bff");

        //벽돌
        blocks = new Array();
        let max_row = 3;
        let max_col = 7;
        //max_col+1개의 gap : canvas_width*0.1
        let gap = canvas.width*0.0123; 
        let width = (canvas.width-(gap*(max_col+1)))/max_col;
        let height = canvas.height*0.05;
        for (let row = 0; row < max_row; row++) {
            for (let col = 0; col < max_col; col++) {
                let blockX = col * (width + gap) + gap;
                let blockY = canvas.height - (row * (height + gap) + gap);
                let block = new Block(blockX, blockY,width, height, level); //벽돌생성
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

    //마우스 이벤트
    let pressedMouse = false;
    let pressedPoint = null;
    let lineDir = null; //선의 방향

    function getMousePoint(x,y){
        let mp = new Ball(0,0,1,"#ffffff"); //기본 0,0
        mp.mapCoordLB2Canvas(canvas); //canvas로 변환
        mp.point = new Vector2D(x,y); //canvas 좌표넣기
        mp.mapCoordCanvas2LB(canvas); //좌표계 변환
        return mp.point.copy();
    }

    canvas.addEventListener("mousedown",(e)=>{
        pressedPoint = getMousePoint(e.offsetX,e.offsetY);
        //마우스 좌표와 원의 중심과의 거리
        let dist=Math.sqrt(Math.pow(ball.point.x-pressedPoint.x,2)
            +Math.pow(ball.point.y-pressedPoint.y,2));
        //방향이 0이고 원의 내부에 마우스가 들어오면
        if(dist<=ball.radius&&dirVec.x==0&&dirVec.y==0){
            pressedMouse = true;
        }
    },false);

    canvas.addEventListener("mousemove",(e)=>{ //마우스가 움직일 때마다 선을 계산
        if(pressedMouse){
            ball.mapCoordCanvas2LB(canvas);
            pressedPoint = getMousePoint(e.offsetX,e.offsetY);
            let lineLength = 150;
            //공에서 마우스까지의 방향을 구합니다.
            let dir = ball.point.mul(-1).add(pressedPoint).normalize().mul(lineLength);
            //공에서 마우스까지의 역방향을 구합니다.
            let invDir = ball.point.add(dir.rotate(180));
            //마우스 역방향으로 선 생성
            lineDir = new Line(ball.point.x,ball.point.y,invDir.x,invDir.y,"#ff0000");
            lineDir.mapCoordLB2Canvas(canvas);
        }
    },false);

    canvas.addEventListener("mouseup",(e)=>{  //벡터 결정
        if(pressedMouse){
            lineDir.mapCoordCanvas2LB(canvas);
            //공의 방향 계산
            dirVec=lineDir.start.mul(-1).add(lineDir.end).normalize().mul(velocity);
            pressedMouse = false;
            pressedPoint=null;
            lineDir = null;
        }
    },false);

    /******************************충돌 관리**********************************/
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
        //상하좌우 영역 거리
        let dist = Math.sqrt(Math.pow(distX,2)+Math.pow(distY,2));
        
        //각 모서리와의 거리 지정
        
        const maxVal = maxRadius+1;
        let tl = (ball.point.x<=blockLeft&&ball.point.y>=blockTop)
            ?Math.sqrt(Math.pow(ball.point.x - blockLeft, 2) + Math.pow(ball.point.y - blockTop, 2)):maxVal;
        let tr = (ball.point.x>=blockRight&&ball.point.y>=blockTop)
            ?Math.sqrt(Math.pow(ball.point.x - blockRight, 2) + Math.pow(ball.point.y - blockTop, 2)):maxVal;
        let bl = (ball.point.x<=blockLeft&&ball.point.y<=blockBottom)
            ?Math.sqrt(Math.pow(ball.point.x - blockLeft, 2) + Math.pow(ball.point.y - blockBottom, 2)):maxVal;
        let br = (ball.point.x>=blockRight&&ball.point.y<=blockBottom)
            ?Math.sqrt(Math.pow(ball.point.x - blockRight, 2) + Math.pow(ball.point.y - blockBottom, 2)):maxVal;
        
            //모서리 지점과의 거리
        let cornerDist = [ tl,tr,bl,br ];
        let isCornerCollision = cornerDist.some((cdist)=> cdist <= ball.radius);
        
        //충돌 판정 : 상하좌우 충돌 | 모서리 충돌
        if(dist<=ball.radius || isCornerCollision ){ 
            //모서리 충돌 처리코드
            if(isCornerCollision){
                return "collide_corn";
            }

            //공의 이동 방향
            let movedLeft = ball.point.x - blockLeft;
            let movedRight = blockRight - ball.point.x;
            let movedBottom = ball.point.y - blockBottom;
            let movedTop = blockTop - ball.point.y;
            let movedMin = Math.min(movedLeft, movedRight,movedTop,movedBottom);
            
            //좌우 충돌 감지
            if (movedMin == movedLeft || movedMin == movedRight) 
                return "collide_lr"; 
            //상하 충돌 감지
            else if(movedMin == movedTop || movedMin == movedBottom) 
                return "collide_tb"; 
        }
        else
            false;
    }

    //충돌 처리
    function detectCollision(){ 
        let error = 35; /* 판정 오차 값 */
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
        else if (ball.point.y+dirVec.y-ball.radius + error*0.5< paddle.point.y ) { //받침대와 충돌여부
            if (ball.point.x > paddle.point.x-error && ball.point.x < paddle.point.x + paddle.width +error) {
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
            let block=blocks.splice(brokenBlockIndex,1)[0];
            brokenBlockIndex=objects.indexOf(block);
            objects.splice(brokenBlockIndex,1);
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

        if(lineDir){ //방향선
            lineDir.draw(ctx);
        }
        
        //값의 변경을 위해 LB 좌표계로 변환
        GameObject.mapCoordCanvas2LBFromList(canvas,objects);
        
        //블럭을 모두 부셨을때 로직
        if(blocks.length==0){
            level++;
            initObject();
            console.log("Win");
        }

        //충돌 처리
        detectCollision(); 
        
        //방향 변경
        ball.point = ball.point.add(dirVec);
        requestAnimationFrame(update);
    }
    update();
});