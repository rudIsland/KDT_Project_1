import {GameObject, Ball, Paddle, Block, Vector2D} from "./object.js"

$(document).ready(function(){
    const canvas = document.getElementById("wall");
    const ctx = canvas.getContext("2d");
    canvas.width = 600;
    canvas.height = 800;

    /******************************오브젝트 관리**********************************/

    let ball = null; let dirVec = null; 
    let paddle = null; let blocks = null;
    let objects = []; //모든 오브젝트

    function initObject(){
        //공
        let ballRadius = 20;
        let x = canvas.width / 2;
        let y = canvas.height / 2;
        ball = new Ball(x,y,ballRadius,"#007bff");

        //공의 방향 및 속도 조절
        let dx = (Math.random() * 2 - 1) * 4;
        let dy = 4; 
        let velocity = 6.0; //속도 조절 상수
        //길이 1의 방향벡터로 만든 뒤 속도 조절 상수 곱
        dirVec = new Vector2D(dx,dy).normalize().mul(velocity); 
        
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
                let block = new Block(blockX, blockY, 75, 30,"#007bff");
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

    //충돌 감지 및 처리
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
        } else if (ball.point.y+dirVec.y-ball.radius < paddle.point.y ) { //받침대와 충돌여부
            if (ball.point.x > paddle.point.x && ball.point.x < paddle.point.x + paddle.width) {
                dirVec.y = -dirVec.y;
            } else { //만약 패들 밑 바닥에 부딪힐경우 이벤트
                console.log("Game Over");
                document.location.reload(); //initObject();
            }
        }

        //받침대가 벽을 넘지 않도록 조정
        let paddle_v = 7;
        if (rightPressed && paddle.point.x < canvas.width - paddle.width) {
            paddle.point = paddle.point.add(new Vector2D(paddle_v,0)); //paddleX += 7;
        } else if (leftPressed && paddle.point.x > 0) {
            paddle.point = paddle.point.add(new Vector2D(-paddle_v,0));
        }

        let brokenBlockIndex = null;
        //block 충돌
        for(let i=0;i<blocks.length;++i){
            let block = blocks[i];
            /* left_right 충돌 */
            if(ball.point.y<=block.point.y&&ball.point.y>=block.point.y-block.height){
                if(ball.point.x>=block.point.x-ball.radius
                    &&ball.point.x<=block.point.x+ball.radius)
                {
                    dirVec.x = -dirVec.x;
                    brokenBlockIndex = i;
                    break;
                };
            }else if(ball.point.x>=block.point.x&&ball.point.x<=block.point.x+block.width){
                /* top_bottom 충돌 */
                if(ball.point.y>=block.point.y-block.height-ball.radius 
                    &&ball.point.y<=block.point.y+ball.radius)
                {
                    dirVec.y = -dirVec.y;
                    brokenBlockIndex = i;
                    break;
                };
            }
        }
        if(brokenBlockIndex!=null){
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

        //임시 게임 종료
        if(blocks.length==0){
            console.log("Win");
            return;
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