import { Vector2D } from "./vector.js"
export { GameObject, Ball, Paddle, Block, Line, Vector2D, Item };

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
class Ball extends GameObject {
    constructor(x, y, r, color) {
        super(x, y);
        this.radius = r;
        this.color = color;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.point.x, this.point.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.closePath();
    }
}

/* 받침대 */
class Paddle extends GameObject {
    constructor(x, y, width, height, color) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw(ctx) {
        let gradient = ctx.createLinearGradient(this.point.x, this.point.y, this.point.x + this.width, this.point.y + this.height);
        gradient.addColorStop(0, '#ff6f61'); // Start color
        gradient.addColorStop(1, '#d6006b'); // End color

        ctx.beginPath();
        ctx.rect(this.point.x, this.point.y, this.width, this.height);
        
        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke for the border
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.closePath();
    }
}

/* 벽돌 */
class Block extends GameObject {
    constructor(x, y, width, height, life) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.life = life;
        this.hit = false;
        this.scale = 1.0;
    }
    
    // 생명력에 따른 색상 배열
    static color = ["#b50000", "#f59e33", "#3fad03", "#3941db", "#78206e"];

    setLife(value) {
        this.life = value;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.point.x + this.width / 2, this.point.y + this.height / 2);
        ctx.scale(this.scale, this.scale);
        ctx.translate(-(this.point.x + this.width / 2), -(this.point.y + this.height / 2));
        
        // Create gradient
        let gradient = ctx.createLinearGradient(this.point.x, this.point.y, this.point.x + this.width, this.point.y + this.height);
        gradient.addColorStop(0, this.shadeColor(Block.color[this.life - 1], 30)); // Slightly brighter shade for gradient effect
        gradient.addColorStop(1, Block.color[this.life - 1]);

        // Draw block
        ctx.beginPath();
        ctx.rect(this.point.x, this.point.y, this.width, this.height);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke for the border
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.closePath();
        
        ctx.restore();

        if (this.hit) {
            this.scale = 1.8; // 충돌 시 크기 증가
            this.hit = false; // 한 프레임 후에 원래 상태로 되돌림
        } else {
            if (this.scale > 1.0) {
                this.scale -= 0.1; // 원래 크기로 돌아옴
            }
        }
    }

    // Helper function to shade a color
    shadeColor(color, percent) {
        let num = parseInt(color.slice(1), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
                      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
                      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1).toUpperCase();
    }

    // 블럭 충돌 함수
    hitBlock() {
        this.hit = true;
    }
}

/* 선 */
class Line extends GameObject {
    constructor(sx, sy, ex, ey, color) {
        super(0, 0);
        this.start = new Vector2D(sx, sy);
        this.end = new Vector2D(ex, ey);
        this.color = color;
    }

    //Object의 메서드 오버라이드
    mapCoordLB2Canvas(canvas) {
        let start = this.start;
        let end = this.end;
        if (this.coordinate == "LeftBottom origin" && typeof canvas == "object") {
            let height = canvas.height;
            start.y = height - start.y;
            end.y = height - end.y;
            this.coordinate = "Canvas origin";
        }
    }//change origin LeftBottom to Canvas

    mapCoordCanvas2LB(canvas) {
        let start = this.start;
        let end = this.end;
        if (this.coordinate == "Canvas origin" && typeof canvas == "object") {
            let height = canvas.height;
            start.y = (start.y - height) * -1;
            end.y = (end.y - height) * -1;
            this.coordinate = "LeftBottom origin";
        }
    }//change origin Canvas to LeftBottom

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
    }
}

/************************* Item ********************************/
class Item extends GameObject {
    constructor(x, y, width, height, color, itemType, speed) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = speed;
        this.type = itemType;
        this.active = true;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.beginPath();
        ctx.rect(this.point.x, this.point.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.closePath();
    }

    update() {
        if (!this.active) return;
        this.point.y -= this.speed; // 아래로 떨어짐
        if (this.point.y < 0) {
            this.active = false; // 화면 밖으로 나가면 비활성화
        }
    }

    deactivate() {
        this.active = false;
    }
}