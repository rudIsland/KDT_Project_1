export {Vector2D};

class Vector2D{ 
    constructor(x,y){
        if(typeof x === "number" && typeof y === "number"){
            this.x = x;
            this.y = y;
        }
        else if(typeof x==="number" && typeof y === "string"){
            /* 각좌표(r,theta) => 평면 좌표계 좌표(x,y) */
            let length = x;
            let theta=parseInt(y)*Math.PI/180; //Degree to Radian
            this.x = length*Math.cos(theta);
            this.y = length*Math.sin(theta);
        }
        else{
            this.x = 0;
            this.y = 0;
        }
    }
    
    errMsg(error){ 
        console.error("[Error] : "+error);
    }//에러 메시지
    
    copy(){ //깊은 복사 반환
        return new Vector2D(this.x,this.y);
    } //return Vector2D
    
    /* 벡터 연산 */
    add(vec){
        let result = this.copy();
        try{
            if(vec instanceof Vector2D){
                result.x += vec.x;
                result.y += vec.y;
            }
            else{
                throw "add연산 인자 불일치";
            }
        }catch(err){
            this.errMsg(err);
            result = undefined;
        }finally{
            return result;
        }
    } //return Vector2D | undefined

    sub(vec){
        let result = this.copy();
        try{
            if(vec instanceof Vector2D){
                result.x -= vec.x;
                result.y -= vec.y;
            }
            else{
                throw "sub연산 인자 불일치";
            }
        }catch(err){
            this.errMsg(err);
            result = undefined;
        }finally{
            return result;
        }
    } //return Vector2D | undefined

    mul(real){ //scalar 곱
        let result = this.copy();
        try{
            if(typeof real === "number"){
                result.x *= real;
                result.y *= real;
            }
            else{
                throw "mul연산 인자 불일치";
            }
        }catch(err){
            this.errMsg(err);
            result = undefined;
        }finally{
            return result;
        }
    } //return Vector2D | undefined

    dot(vec){ //내적
        let result = this.copy();
        try{
            if(vec instanceof Vector2D){
                result.x *= vec.x;
                result.y *= vec.y;
                result = result.x+result.y;
            }
            else{
                throw "dot연산 인자 불일치";
            }
        }catch(err){
            this.errMsg(err);
            result = undefined;
        }finally{
            return result;
        }
    }//return scalar | undefined

    mag(){ //벡터 크기
        let square = Math.pow(this.x,2)+Math.pow(this.y,2);
        return Math.sqrt(square);
    } //return number

    normalize(){ //단위 벡터
        let mag = this.mag();
        return (mag==0)? this.mul(0) : this.mul(1/mag);
    }//return Vector2D

    angle(){ 
        return Math.atan2(this.y,this.x);
    }//return radian

    static angleBetween(v1,v2){ //벡터사이각
        let radian = undefined;
        try{
            if(v1 instanceof Vector2D && v2 instanceof Vector2D){
                let theta = v1.dot(v2)/(v1.mag()*v2.mag());
                radian = Math.acos(theta);
            }
            else{
                throw "Vector 인자 불일치";
            }
        }catch(err){
            this.errMsg(err);
        }finally{
            return radian;
        }
    }//return radian | undefined

    rotate(degree){
        if(typeof degree==="string")
            degree=parseInt(degree);
        let result = this.copy(); 
        let rad = degree*Math.PI/180;
        result.x = this.x*Math.cos(rad) - this.y*Math.sin(rad);
        result.y = this.x*Math.sin(rad) + this.y*Math.cos(rad);
        return result;
    }//return Vector2D
}