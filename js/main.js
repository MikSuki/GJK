const number_of_shape = 80;
const s = [];
const flag = {
    click_axis: false,
    click_shape: false,
    move: false,
};
const mouse = {
    prev_pos: {
        x: 0,
        y: 0
    },
    cur_pos: {
        x: 0,
        y: 0
    },
    getDir: function () {
        return {
            x: this.cur_pos.x - this.prev_pos.x,
            y: this.cur_pos.y - this.prev_pos.y
        }
    },
    update: function (e, offsetX, offsetY) {
        this.prev_pos.x = this.cur_pos.x
        this.prev_pos.y = this.cur_pos.y
        this.cur_pos.x = e.clientX - offsetX
        this.cur_pos.y = e.clientY - offsetY
    }

};
const wall = {};
var stop = false;
var selected = null;
var ctx = null;

class Polygon {
    constructor(x, y, width, vertex_num, rad, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.vertex_num = vertex_num;
        this.vertex = [];
        this.boundary = null; // minX, minY, maxX, maxX
        this.rotation = rad;
        this.color = color;
        this.offsetX = 0;
        this.offsetY = 0;
        this.init();
    }

    init() {
        let rad = 0,
            boundary = {
                minX: Number.MAX_SAFE_INTEGER,
                minY: Number.MAX_SAFE_INTEGER,
                maxX: Number.MIN_SAFE_INTEGER,
                maxY: Number.MIN_SAFE_INTEGER
            };
        this.vertex = []
        for (let i = 0; i < this.vertex_num; ++i) {
            let x = this.x + this.width * Math.cos(rad - this.rotation),
                y = this.y + this.width * Math.sin(rad - this.rotation)
                ;
            this.vertex.push({
                x: x,
                y: y
            })
            rad += (360 / this.vertex_num) / 180 * Math.PI;
            if (x < boundary.minX)
                boundary.minX = x;
            if (x > boundary.maxX)
                boundary.maxX = x;
            if (y < boundary.minY)
                boundary.minY = y;
            if (y > boundary.maxY)
                boundary.maxY = y;
        }
        this.boundary = boundary;
    }

    moveShape(x, y) {
        this.boundary.minX += x;
        this.boundary.maxX += x;
        this.boundary.minY += y;
        this.boundary.maxY += y;
        // disable out object of screen
        // if (this.boundary.minX < wall.minX) {
        //     let v = this.boundary.minX - wall.minX;
        //     x -= v;
        //     this.boundary.minX = wall.minX;
        //     this.boundary.maxX -= v;
        // }
        // else if (this.boundary.maxX > wall.maxX) {
        //     let v = this.boundary.maxX - wall.maxX;
        //     x -= v;
        //     this.boundary.minX -= v;
        //     this.boundary.maxX = wall.maxX;
        // }
        // if (this.boundary.minY < wall.minY) {
        //     let v = this.boundary.minY - wall.minY;
        //     y -= v;
        //     this.boundary.minY = wall.minY;
        //     this.boundary.maxY -= v;
        // }
        // else if (this.boundary.maxY > wall.maxY) {
        //     let v = this.boundary.maxY - wall.maxY;
        //     y -= v;
        //     this.boundary.minY -= v;
        //     this.boundary.maxY = wall.maxY;
        // }

        this.x += x;
        this.y += y;
        this.vertex.forEach(e => {
            e.x += x;
            e.y += y;
        });
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.vertex[0].x, this.vertex[0].y);
        for (let i = 1; i < this.vertex_num; ++i)
            ctx.lineTo(this.vertex[i].x, this.vertex[i].y);
        ctx.fill();
    }

    setPostion(pos) {
        let x = pos.x - this.x,
            y = pos.y - this.y;
        this.moveShape(x, y)
    }

    isclick(x, y) {
        if (ptInPolygon({ x: x, y: y }, this.vertex)) {
            this.offsetX = x - this.x;
            this.offsetY = y - this.y;
            flag.click_shape = true;
            return true;
        }
    }
}

window.onload = function () {
    let canvas = document.getElementById('canvas'),
        [w, h] = [window.innerWidth, window.innerHeight];
    ctx = canvas.getContext('2d');
    canvas.width = w;
    canvas.height = h;
    canvas.onmousedown = mouseclick;
    canvas.onmousemove = mousemove;
    canvas.onmouseup = mouseup;
    canvas.ontouchstart = function (e) {
        e.preventDefault()
        mouseclick(e.touches[0])
    }
    canvas.ontouchmove = function (e) {
        e.preventDefault()
        mousemove(e.touches[0])
    }
    canvas.ontouchend = function (e) {
        e.preventDefault()
        mouseup()
    }
    wall.minX = 0;
    wall.minY = 0;
    wall.maxX = w;
    wall.maxY = h;
    const shape_max = w > h ? w : h
    for (let i = 0; i < number_of_shape; ++i) {
        let [d1, d2] = [Math.random() + 0.01, Math.random() + 0.01];
        if (d1 > 0.9) d1 = 0.9;
        if (d2 > 0.9) d2 = 0.9;
        s.push(
            new Polygon(
                w * d1,
                h * d2,
                shape_max * (Math.floor(Math.random() * 2) + 2) * 0.02,
                Math.floor(Math.random() * 7) + 3,
                Math.floor(Math.random() * 315) / 100,
                getRandomColor()
            )
        );
    }
    requestAnimationFrame(loop);
}

function update() {
    if (flag.move) {
        flag.move = false;
        selected.setPostion(mouse.cur_pos);
        collide([s.indexOf(selected)]);
    }

    function collide(collider_s) {
        for (let i = 0; i < collider_s.length; ++i) {
            let polygonA = s[collider_s[i]];
            for (let j = 0; j < s.length; ++j) {
                if (collider_s.indexOf(j) != -1) continue;
                let polygonB = s[j],
                    dist = Math.sqrt((polygonA.x - polygonB.x) ** 2 + (polygonA.y - polygonB.y) ** 2)
                    ;
                if (dist >= polygonA.width + polygonB.width)
                    continue;
                let depth = gjk(polygonA, polygonB);
                if (depth != -1) {
                    // dynamic increase collider_s
                    collider_s.push(j);
                    let side = edge(
                            polygonB.vertex,
                            {
                                x: polygonA.x - polygonB.x,
                                y: polygonA.y - polygonB.y
                            }
                        ),
                        vert_angle = getVerticalAngle(side);
                    s[j].moveShape(
                        depth * Math.cos(vert_angle),
                        depth * Math.sin(vert_angle)
                    );
                }
            }
        }
    }
}

function render() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = s.length - 1; i >= 0; --i)
        s[i].draw(ctx);
}

function loop() {
    update()
    render()
    requestAnimationFrame(loop)
}


function mouseclick(e) {
    s.every(obj => {
        let ele = obj
        if (ele.isclick(e.clientX, e.clientY)) {
            selected = obj
            return false
        }
        return true
    })
}

function mousemove(e) {
    if (stop) return
    if (flag.click_shape) {
        mouse.update(e, selected.offsetX, selected.offsetY)
        flag.move = true
    }
}

function mouseup() {
    flag.click_shape = false
    flag.click_axis = false
}

function ptInPolygon(pt, shape) {
    let i = 0,
        j = shape.length - 1,
        c = 0
    for (; i < shape.length; j = i++) {
        if (((shape[i].y > pt.y) != (shape[j].y > pt.y)) &&
            (pt.x < (shape[j].x - shape[i].x) * (pt.y - shape[i].y) / (shape[j].y - shape[i].y) + shape[i].x))
            c = !c
    }
    return c
}

function edge(vertex, dir) {
    let index = 0
    for (let i = 0, max = Number.MIN_SAFE_INTEGER; i < vertex.length; ++i) {
        let proj = dot(vertex[i], dir)
        if (proj > max) {
            max = proj
            index = i
        }
    }
    let v = vertex[index]
    let v1 = index == vertex.length - 1 ? vertex[0] : vertex[index + 1]
    let v0 = index == 0 ? vertex[vertex.length - 1] : vertex[index - 1]
    let l = normalize({
        x: v.x - v1.x,
        y: v.y - v1.y
    })
    let r = normalize({
        x: v.x - v0.x,
        y: v.y - v0.y
    })

    if (dot(r, dir) <= dot(l, dir)) {
        return showV(v0, v)
    } else {
        return showV(v, v1)
    }

    function showV(v1, v2) {
        let a = -1, b = -1;
        for (let i = 0; i < vertex.length; ++i) {
            if (vertex[i] === v1) {
                a = i
            }
            else if (vertex[i] === v2) {
                b = i
            }
        }
        return {
            x: vertex[a].x - vertex[b].x,
            y: vertex[a].y - vertex[b].y
        }
    }

    function dot(vec1, vec2) {
        return vec1.x * vec2.x + vec1.y * vec2.y
    }

    function normalize(vec) {
        let size = Math.sqrt(vec.x ** 2 + vec.y ** 2)
        return {
            x: vec.x / size,
            y: vec.y / size
        }
    }
}

function getVerticalAngle(side) {
    let side_angle = Math.acos(dot(side, { x: 1, y: 0 }) / length(side))
    if (side.y < 0) side_angle *= -1
    return side_angle - 1.571
}

function dot(vec1, vec2) {
    return vec1.x * vec2.x + vec1.y * vec2.y
}

function length(vec) {
    return Math.sqrt(vec.x ** 2 + vec.y ** 2)
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}