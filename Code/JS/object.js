import { Vector2D } from "./vector.js"
export { GameObject, Ball, Paddle, Block, Vector2D };

class GameObject{
    constructor(x,y){
        this.point = new Vector2D(x,y);
        this.coordinate = "LeftBottom origin";
    }
    draw(ctx){
        console.log("Object"); /* 오버라이드 => 자식 클래스에 적용 */
    }

    //==> 캔버스 매퍼
    mapCoordLB2Canvas(canvas){ 
        let vec = this.point;
        if(this.coordinate =="LeftBottom origin"&&typeof canvas == "object"){
            let height = canvas.height;
            vec.y = height - vec.y;
            this.coordinate = "Canvas origin";
        }
    }//change origin LeftBottom to Canvas

    mapCoordCanvas2LB(canvas){
        let vec = this.point;
        if(this.coordinate=="Canvas origin"&&typeof canvas == "object"){
            let height = canvas.height;
            vec.y = (vec.y - height)*-1;
            this.coordinate = "LeftBottom origin";
        }
    }//change origin Canvas to LeftBottom

    static mapCoordLB2CanvasAll(canvas,...objs){
        objs.forEach((object)=>{
            object.mapCoordLB2Canvas(canvas);
        });
    } //여러 벡터를 한 번에 좌표계 변경

    static mapCoordLB2CanvasFromList(canvas,objs){
        objs.forEach((object)=>{
            object.mapCoordLB2Canvas(canvas);
        });
    } //배열로 인자 받는 경우

    static mapCoordCanvas2LBAll(canvas,...objs){
        objs.forEach((object)=>{
            object.mapCoordCanvas2LB(canvas);
        });
    } //여러 벡터를 한 번에 좌표계 변경

    static mapCoordCanvas2LBFromList(canvas,objs){
        objs.forEach((object)=>{
            object.mapCoordCanvas2LB(canvas);
        });
    } //배열로 인자 받는 경우
}

/* 공 */
class Ball extends GameObject{
    constructor(x,y,r,color){
        super(x,y);
        this.radius = r;
        this.color = color
    }

    draw(ctx){
        ctx.beginPath();
        ctx.arc(this.point.x, this.point.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

/* 받침대 */
class Paddle extends GameObject{
    constructor(x,y,width,height,color){
        super(x,y);
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx){
        ctx.beginPath();
        ctx.rect(this.point.x, this.point.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

/* 벽돌 */
class Block extends GameObject{
    constructor(x,y,width,height,life){
        super(x,y);
        this.width = width;
        this.height = height;
        this.life = life;
    }
    //생명 종속
    static color = ["#007bff","#8ed973","#fdff9f","#ff9393","#78206e"];

    setLife(value){
        this.life=value;
    }

    draw(ctx){
        ctx.beginPath();
        ctx.rect(this.point.x, this.point.y, this.width, this.height);
        ctx.fillStyle = Block.color[this.life-1];
        ctx.fill();
        ctx.closePath();
    }
}