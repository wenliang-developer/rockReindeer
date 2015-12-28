/*!
 * DATE:2015-12-28
 * @author: Wen Liang, 1423263917@qq.com
 */
function Reindeer(container){
    //DOM
    this.container = container;
    this.body = container.querySelector('.body'); //驯鹿的身体
    this.otherElems = [].slice.call(container.querySelectorAll('.other')); //驯鹿的其余部分
    TweenMax.set(this.otherElems, {transformOrigin: '50% 75%'}); //设置旋转中心

        //path d 计算参数
    this.maxDegrees = 45; //左右最大旋转角度
    this.centerX = 50; //摇摆中心点 X 相对于 SVG 坐标
    this.centerY = 120; //摇摆中心点 Y 相对于 SVG 坐标
    this.headX = 50; //驯鹿头部 X 相对于 SVG 坐标
    this.headY = 50; //驯鹿头部 Y 相对于 SVG 坐标

    //用户交互需要的参数
    this.swingStartX; //开始交互时 相对于 container 的 x 坐标
    this.swingStartY; //开始交互时 相对于 container 的 y 坐标
    this.swingStartDegrees; // 开始交互时 相对于摇摆中心点的 角度
    this.swingCurrentDegress; //交互中 相对于摇摆中心点的 角度
    this.containerHeight = container.offsetHeight; // 容器的 高度
    this.containerWidth = container.offsetWidth; // 容器的 宽度
    this.isSwing = false; // 是否正在摇摆的 flag


    // 生成 event handle
    // 注意： bind 方法，每次生成新的 function 示例，
    // 因此 this.startGesture.bind(this) !== this.startGesture
    // 如果不将 bind 生成的 handle 存储，叫无法移除某事件的 handle
    this.eventHandleList = [];
    this.eventHandleList['start'] = this.startGesture.bind(this);
    this.eventHandleList['move'] = this.moveGesture.bind(this);
    this.eventHandleList['end'] = this.endGesture.bind(this);
    //添加手势
    container.addEventListener('touchstart',this.eventHandleList['start']);
    container.addEventListener('mousedown', this.eventHandleList['start']);
}
// 让我们一起摇摆 ╮(╯▽╰)╭
Reindeer.prototype.rock = function(degrees){
    //获取弧度
    var angle = !degrees ? 0 : ((Math.abs(degrees) / degrees) * Math.min(this.maxDegrees, Math.abs(degrees))) * Math.PI / 180;

    //Q x1 y1, x y
    var x1, y1, x, y;
    x = (this.headX - this.centerX) * Math.cos(angle) - (this.headY - this.centerY) * Math.sin(-angle);
    y = (this.headY - this.centerY) * Math.cos(angle) + (this.headX - this.centerX) * Math.sin(-angle);
    x1 = 50;
    // 余弦定理： b^2 = a^2 + c^2 - 2*a*c*cos(angle)
    // (centerY - y1)^2 = (centerY - y1)^2 + (centerY - startY)^2 - 2*(centerY - startY)*(centerY-y1)*Math.cos(Math.abs(angle));
    y1 = this.centerY - (this.centerY - this.headY) / (2 * Math.cos(Math.abs(angle)));
    TweenMax.set(this.otherElems, {
        rotation: -angle * 180 / Math.PI * 2,
        x: (x + this.centerX - this.headX),
        y: (y + this.centerY - this.headY)
    });
    var d = 'M'+ this.centerX +' '+ this.centerY +' Q ' + x1 + ' ' + y1 + ' ' + (x + this.centerX) + ' ' + (y + this.centerY);
    this.body.setAttribute('d', d);
};
//计算 偏移角度
Reindeer.prototype.calculateOffsetDegrees = function(event){
    //获取容器相对于页面的偏移位置
    var containerOffset = this.getElemOffsetForPage(this.container);
    //获取相对于容器的偏移位置
    this.swingStartX = event.type.indexOf('touch') >= 0 ? event.targetTouches[0].pageX - containerOffset.x: event.pageX - containerOffset.x;
    this.swingStartY = event.type.indexOf('touch') >= 0 ? event.targetTouches[0].pageY - containerOffset.y : event.pageY - containerOffset.y;
    var degrees = Math.atan2( this.containerWidth/2 - this.swingStartX, this.containerHeight - this.swingStartY)
            * 180 / Math.PI + 90;
    return degrees;
};
// 手势开始 handle
Reindeer.prototype.startGesture  = function(e){
    e.preventDefault();
    // 驯鹿正在摇摆时不能进行移动
    if (this.isSwing) return;
    console.group('Gestures');
    console.log('%cGestures Start','color:#4CAF50');


    this.swingStartDegrees = this.calculateOffsetDegrees(e);

    //添加 移动手势和离开手势 event handle
    if(e.type === 'touchstart'){
        document.addEventListener('touchmove', this.eventHandleList['move']);
        document.addEventListener('touchend', this.eventHandleList['end']);
    }else{
        document.addEventListener('mousemove', this.eventHandleList['move']);
        document.addEventListener('mouseup', this.eventHandleList['end']);
    }
};
// 手势移动 handle
Reindeer.prototype.moveGesture = function (e) {
    e.preventDefault();
    console.log('%cFollowing Gestures','color:#3F51B5');
    this.swingCurrentDegress = this.calculateOffsetDegrees(e);
    var deviationDegrees = this.swingCurrentDegress - this.swingStartDegrees;
    this.rock(deviationDegrees);
};
// 手势结束 handle
Reindeer.prototype.endGesture = function (e) {
    e.preventDefault();
    console.log('%cGestures End','color:#F44336');
    console.groupEnd('Gestures');
    var that = this;

    // 移除 移动手势和离开手势 event handle
    if(e.type === 'touchend'){
        document.removeEventListener('touchmove', this.eventHandleList['move']);
        document.removeEventListener('touchend', this.eventHandleList['end']);
    }else{
        document.removeEventListener('mousemove', this.eventHandleList['move']);
        document.removeEventListener('mouseup', this.eventHandleList['end']);
    }

    var o = {
        // this.swingCurrentDegress === 0
        // 说明 用户只是触碰(或点击) 而没有移动手势
        // 这时 将角度设为最大的摇摆角度，以实现 触碰(或点击)而没有移动手势时，摇摆驯鹿
        degress: !this.swingCurrentDegress ? this.maxDegrees : this.swingCurrentDegress
    };
    TweenMax.to(o, 1, {
        degress: 0, onStart: function () {
            //标记为 驯鹿正在摇摆
            that.isSwing = true
        }, onUpdate: function () {
            that.rock(o.degress);
        }, onComplete: function () {
            that.isSwing = false;
            // 重置移动手势时的当前摇摆角度，
            // 以避免下次触碰(或点击) 而没有移动手势时，
            // 使用上一次 移动手势 结束位置的角度
            that.swingCurrentDegress = 0;
        }, ease: Elastic.easeOut.config(1, 0.2)
    });
};
// 获取元素相对于页面的偏移位置
Reindeer.prototype.getElemOffsetForPage = function(elem){
    var offsetX = 0,
            offsetY = 0;
    for(;elem && elem !== document;elem = elem.parentNode){
        offsetX += elem.offsetLeft;
        offsetY += elem.offsetTop;
    }
    return {x: offsetX, y: offsetY};
};