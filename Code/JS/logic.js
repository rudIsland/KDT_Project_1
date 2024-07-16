import {GameObject, Ball, Paddle, Block, Line, Vector2D} from "./object.js"

$(document).ready(function(){
    const canvas = document.getElementById("wall");
    const ctx = canvas.getContext("2d");
    canvas.width = 420; //css와 비율 맞춤
    canvas.height = 420;
    
    /******************************게임 실행 관련 이벤트**********************************/

    //인트로 -> 플레이화면 전환
    const playBtn = document.querySelector('#btnPlay');
    const introDiv = document.querySelector('.intro');
    const playDiv = document.querySelector('.play');
    playBtn.addEventListener("click",playClick);
    function playClick() {
        if (introDiv.style.display === 'block' && playDiv.style.display === 'none') {
            introDiv.style.display = 'none';
            playDiv.style.display = 'block';
        } else {
            introDiv.style.display = 'block';
            playDiv.style.display = 'none';
        }
    }

    //다음 단계 이동
    function nextGame(){
        level = (level+1<=maxStage)?level+1:level;
        initDataSetting(level,score,scoreGap,life,maxLife); //다음 게임 설정
        initObject();
        $(".stage").text(level);
        introDiv.style.display = 'block';
        playDiv.style.display = 'none';
    }

    //게임오버화면
    
    //일시정지
    const pauseBtn = document.querySelector('#btnPause');
    pauseBtn.addEventListener("click",gamePause);
    function gamePause(){
        pause = pause?false:true;
        if(!pause){ update(); pauseBtn.innerText="Pause"; }
        else pauseBtn.innerText="Resume";
    }

    //다시시작
    const replayBtn = document.querySelector('#btnReplay');
    replayBtn.addEventListener("click",replayClick);
    function replayClick(){
        location.reload(); //페이지 새로고침
    }
    
    /******************************게임 설정 데이터**********************************/
    let maxLife = null; let life = null; 
    let score = null; let scoreGap = null;
    let level = null; const maxStage=Block.color.length; //최대 스테이지 수
    let pause = false;

    function addScore(){
        score += scoreGap;
        $("#score").text(score);
    }

    function cutLife(){
        life -= 1;
        $("#life").text(life);
    }

    function initDataSetting(iLevel=1,iScore=0,iScoreGap=1,iLife=8,iMaxLife=8){
        maxLife = iMaxLife;
        $("#max_life").text(maxLife);
        
        life = iLife;
        $("#life").text(life);
        
        score = iScore
        $("#score").text(score);
        scoreGap = iScoreGap;

        level = iLevel;
        $("#stage").text(level);
        $(".stage").text(level);
    }
    initDataSetting();    

    /******************************오브젝트 관리**********************************/

    let ball = null; let dirVec = null; 
    let paddle = null; let blocks = null;
    let objects = []; //모든 오브젝트 
    const maxRadius = 99999999; 
    let velocity = 5.0;

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
        //max_col+1개의 gap
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

     //게임 종료
    function GameEnd() {
        document.getElementById("finalScore").textContent = score;
        console.log("모달오픈")
        //$("#gameOverModal").show();
        $("#gameOverModal").modal('show');
    }

    // 모달 닫기 이벤트
    $('#gameOverModal').on('hidden.bs.modal', function () {
        // 게임 상태 초기화
        initDataSetting(); // 게임 데이터 초기화
        initObject(); // 오브젝트 초기화
        update();
        introDiv.style.display = 'block';
        playDiv.style.display = 'none';
    });

    
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
    //두 점 사이 거리 구하기
    function getDistAtoB(sx,sy,ex,ey){
        let result = Math.sqrt(Math.pow(sx-ex,2)+Math.pow(sy-ey,2));
        return result;
    }

    //벽돌과 공의 충돌 감지
    function detectCollideWithBlock(ball,block){
        // 벽돌 영역의 경계
        let blockLeft = block.point.x;
        let blockRight = block.point.x+block.width;
        let blockTop = block.point.y;
        let blockBottom = block.point.y-block.height;

        //상하좌우 영역 충돌 조건
        //Bottom
        if(blockLeft<=ball.point.x&&ball.point.x<=blockRight&&
            blockBottom-ball.radius<=ball.point.y&&ball.point.y<=blockBottom)
            return "collide_tb"; 
        //Left
        else if(blockLeft-ball.radius<=ball.point.x&&ball.point.x<=blockLeft&&
            blockBottom<=ball.point.y&&ball.point.y<=blockTop)
            return "collide_lr";
        //Right
        else if(blockRight<=ball.point.x&&ball.point.x<=blockRight+ball.radius&&
            blockBottom<=ball.point.y&&ball.point.y<=blockTop)
                return "collide_lr";
        //Top
        else if(blockLeft<=ball.point.x&&ball.point.x<=blockRight&&
            blockTop<=ball.point.y&&ball.point.y<=blockTop+ball.radius)
                return "collide_tb";

        //모서리 영역 충돌 조건
        //LT,RT,LB,RB
        let distLT = getDistAtoB(ball.point.x,ball.point.y,blockLeft,blockTop);
        let distRT = getDistAtoB(ball.point.x,ball.point.y,blockRight,blockTop);
        let distLB = getDistAtoB(ball.point.x,ball.point.y,blockLeft,blockBottom);
        let distRB = getDistAtoB(ball.point.x,ball.point.y,blockRight,blockBottom);
        let judgment = ball.radius;
        if(distLT <= judgment)
            return "collide_lt"; 
        else if(distRT <= judgment)
            return "collide_rt"; 
        else if(distLB <= judgment)
            return "collide_lb"
        else if(distRB <= judgment)
            return "collide_rb"
        return false;
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
                else if(collision=="collide_tb"){ //상하 충돌
                    dirVec.y = -dirVec.y;
                }
                else{ //모서리 충돌 시 방향 지정
                    if(collision == "collide_lt")
                    {
                        if(dirVec.x<0&&dirVec.y<0)
                            dirVec.y = -dirVec.y;
                        else if(dirVec.x>=0&&dirVec.y>=0)
                            dirVec.x = -dirVec.x;
                        else{
                            dirVec.x = -dirVec.x;
                            dirVec.y = -dirVec.y;
                        }
                    }
                    else if(collision == "collide_rt")
                    {
                        if(dirVec.x>=0&&dirVec.y<0)
                            dirVec.y = -dirVec.y;
                        else if(dirVec.x<0&&dirVec.y>=0)
                            dirVec.x = -dirVec.x;
                        else{
                            dirVec.x = -dirVec.x;
                            dirVec.y = -dirVec.y;
                        }
                    }
                    else if(collision == "collide_lb")
                    {
                        if(dirVec.x<0&&dirVec.y>=0)
                            dirVec.y = -dirVec.y;
                        else if(dirVec.x>=0&&dirVec.y<0)
                            dirVec.x = -dirVec.x;
                        else{
                            dirVec.x = -dirVec.x;
                            dirVec.y = -dirVec.y;
                        }
                    }
                    else if(collision == "collide_rb")
                    {
                        if(dirVec.x>=0&&dirVec.y>=0)
                            dirVec.y = -dirVec.y;
                        else if(dirVec.x<0&&dirVec.y<0)
                            dirVec.x = -dirVec.x;
                        else{
                            dirVec.x = -dirVec.x;
                            dirVec.y = -dirVec.y;
                        }
                    }
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

    function update(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        //그리기 위한 모든 오브젝트를 canvas 좌표계로 변환 
        GameObject.mapCoordLB2CanvasFromList(canvas,objects);
        objects.forEach((object)=>{ 
            object.draw(ctx);
        });

        if(lineDir) //방향선
            lineDir.draw(ctx);
        
        //값의 변경을 위해 LB 좌표계로 변환
        GameObject.mapCoordCanvas2LBFromList(canvas,objects);
        
        //블럭을 모두 부셨을때 로직
        if(blocks.length==0){
            if(level==maxStage){
                console.log("게임 종료");
                GameEnd();
                return;
            }
            else{
                console.log("Clear");
                nextGame();   
            }
        }

        //충돌 처리
        detectCollision(); 
        
        //방향 변경
        ball.point = ball.point.add(dirVec);
        if(!pause)
            requestAnimationFrame(update);
    }
    update();
});
