var ctx;
var s = []
var wall = []
var key = { 87: false, 83: false, 65: false, 68: false }
var start = 0
var cnt = 0
const cnt_max = 1
var flag = {
    click_axis: false,
    click_shape: false,
    move: false,
    rotate: false
}
var mouse = {
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
        this.cur_pos.x = e.x - offsetX
        this.cur_pos.y = e.y - offsetY
    }

}

const gravity = 0//9.8

var stop = false

var selected = null

var c = 0
var t = 0

class Rigidbody {
    constructor(position, linearVelocity, angle, angularVelocity, force, shape) {
        this.position = position
        this.linearVelocity = linearVelocity
        this.angle = angle
        this.angularVelocity = angularVelocity
        this.force = force
        this.torque = null
        this.shape = shape
        this.resetShape()
    }

    computeForceAndTorque() {
        let f = this.force//{ x: 0, y: 0 }
        this.force.y += gravity
        // r is the 'arm vector' that goes from the center of mass to the point of force application
        let r = {
            x: 0 * this.shape.width * 2,
            y: 0 * this.shape.height * 2
        }
        // this.force = f
        this.torque = r.x * f.y - r.y * f.x
    }

    setPostion(pos) {
        this.position.x = pos.x
        this.position.y = pos.y
        this.resetShape()
    }

    resetShape() {
        this.shape.reset(this.position, this.angle / 180 * Math.PI)
    }

    update(dt) {
        this.computeForceAndTorque()
        let linearAcceleration = {
            x: this.force.x / this.shape.mass,
            y: this.force.y / this.shape.mass
        }
        this.linearVelocity.x += linearAcceleration.x * dt
        this.linearVelocity.y += linearAcceleration.y * dt
        this.position.x += this.linearVelocity.x * dt
        this.position.y += this.linearVelocity.y * dt
        let angularAcceleration = this.torque / this.shape.momentOfInertia
        this.angularVelocity += angularAcceleration * dt
        this.angle += this.angularVelocity * dt
        this.resetShape()
    }
}

class Polygon {
    constructor(width, mass, vertex_num, color) {
        this.x = 0
        this.y = 0
        this.width = width
        this.height = width
        this.mass = mass
        this.vertex_num = vertex_num
        this.vertex = []
        this.rigid_rotation = 0
        this.rotation = Math.PI / 4
        this.color = color
        this.offsetX = 0
        this.offsetY = 0
        this.axis = [
            { x: 0, y: -3 },
            { x: 0, y: 3 },
            { x: width, y: 3 },
            { x: width, y: -3 },
        ]
        this.axis.forEach(e => {
            e.size = Math.sqrt(e.x ** 2 + e.y ** 2)
            e.rotation = Math.atan(e.y / e.x)
        })

        this.CalculateBoxInertia()
    }

    CalculateBoxInertia() {
        this.momentOfInertia = this.mass * (this.width ** 2 + this.height ** 2) / 12
    }

    reset(position, angle) {
        var rad = 0
        this.rigid_rotation = angle
        this.x = position.x
        this.y = position.y
        this.vertex = []
        for (let i = 0; i < this.vertex_num; ++i) {
            this.vertex.push({
                x: this.x + this.width * Math.cos(rad - this.rotation - this.rigid_rotation),
                y: this.y + this.width * Math.sin(rad - this.rotation - this.rigid_rotation)
            })
            rad += (360 / this.vertex_num) / 180 * Math.PI
        }
        rad = this.rotation
        // axis
        this.axis.forEach(e => {
            e.x = e.size * Math.cos(e.rotation - rad - this.rigid_rotation)
            e.y = e.size * Math.sin(e.rotation - rad - this.rigid_rotation)
        })
    }

    draw(ctx) {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.moveTo(this.vertex[0].x, this.vertex[0].y)
        for (let i = 1; i < this.vertex_num; ++i)
            ctx.lineTo(this.vertex[i].x, this.vertex[i].y)
        ctx.fill()

        ctx.fillStyle = '#000000'
        // text
        // ctx.fillStyle = '#000000'
        // ctx.font = "30px Arial";
        // for (let i = 0; i < this.vertex_num; ++i)
        //     ctx.fillText(i + 1, this.vertex[i].x, this.vertex[i].y)

        // axis
        ctx.beginPath()
        ctx.moveTo(this.vertex[0].x + this.axis[0].x, this.vertex[0].y + this.axis[0].y)
        for (let i = 1; i < this.axis.length; ++i)
            ctx.lineTo(this.vertex[0].x + this.axis[i].x, this.vertex[0].y + this.axis[i].y)
        ctx.fill()

        return


        for (let i = 0; i < this.vertex_num; ++i) {
            ctx.beginPath()
            ctx.moveTo(this.x, this.y)
            ctx.lineTo(this.vertex[i].x, this.vertex[i].y)
            ctx.stroke()
        }
    }

    isclick(x, y) {
        if (ptInPolygon({ x: x - this.vertex[0].x, y: y - this.vertex[0].y }, this.axis)) {
            this.offsetX = x - this.x
            this.offsetY = y - this.y
            flag.click_axis = true
            return true
        }
        if (ptInPolygon({ x: x, y: y }, this.vertex)) {
            this.offsetX = x - this.x
            this.offsetY = y - this.y
            flag.click_shape = true
            return true
        }
    }
}

class Wall {
    constructor(x, y, w, h) {
        this.x = x
        this.y = y
        // this.w = w
        // this.h = h
        this.x1 = x - w / 2
        this.x2 = x + w / 2
        this.y1 = y - h / 2
        this.y2 = y + h / 2
        this.vertex = []
        this.vertex.push(
            { x: this.x1, y: this.y1 },
            { x: this.x2, y: this.y1 },
            { x: this.x1, y: this.y2 },
            { x: this.x2, y: this.y2 },
        )
    }
}

window.onload = function () {
    var canvas = document.getElementById('canvas')
    ctx = canvas.getContext('2d')
    let [w, h] = [window.innerWidth, window.innerHeight]
    canvas.width = w
    canvas.height = h
    canvas.onmousedown = mouseclick
    canvas.onmousemove = mousemove
    canvas.onmouseup = mouseup

    wall.push(new Wall(w / 2, -h * 0.05, w, h * 0.1))
    wall.push(new Wall(w / 2, h * 1.05, w, h * 0.1))
    wall.push(new Wall(-w * 0.05, h * 0.5, w * 0.1, h * 1.2))
    wall.push(new Wall(w * 1.05, h * 0.5, w * 0.1, h * 1.2))


    s.push(new Rigidbody(
        { x: w / 3, y: h / 3 },
        { x: 0, y: 0 },
        0,
        0,
        { x: 0, y: 0 },
        new Polygon(/*w * 0.1*/70.7, 1, 4, "#00FF00")
    ))

    s.push(new Rigidbody(
        { x: w / 6, y: h / 3 },
        { x: 0, y: 0 },
        0,
        0,
        { x: 0, y: 0 },
        new Polygon(/*w * 0.1*/70.7, 1, 5, "#FF0000")
    ))

    s.push(new Rigidbody(
        { x: w / 3, y: h / 1.5 },
        { x: 0, y: 0 },
        0,
        0,
        { x: 0, y: 0 },
        new Polygon(w * 0.1, 1, 6, "#0000FF")
    ))

    s.push(new Rigidbody(
        { x: w / 6, y: h / 1.5 },
        { x: 0, y: 0 },
        0,
        0,
        { x: 0, y: 0 },
        new Polygon(w * 0.05, 1, 100, "#FFFF00")
    ))
    requestAnimationFrame(loop)
}


function render() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    s.forEach(e => {
        e.shape.draw(ctx)
    })
}

function loop(timestamp) {
    let dt = timestamp - start
    start = timestamp

    s.forEach(e => {
        e.update(dt / 1000)
    })

    update()
    render()
    requestAnimationFrame(loop)
}

function update() {
    if (flag.rotate) {
        flag.rotate = false
        rotate()
    }
    if (flag.move) {
        flag.move = false
        move()

        // wall.forEach(e => {
        //     let depth = gjk(selected.shape, e)
        //     if (depth) console.log('co')
        // })
    }

    function rotate() {
        let Polygon = selected.shape
        let [x, y] = [
            selected.position.x - mouse.cur_pos.x - selected.shape.offsetX,
            selected.position.y - mouse.cur_pos.y - selected.shape.offsetY
        ]
        let dot = -x
        let len = Math.sqrt(x ** 2 + y ** 2)
        let rad = Math.acos(dot / len)
        if (y < 0) rad = - rad
        Polygon.rotation = rad
        selected.resetShape()
    }

    function move() {
        selected.setPostion(mouse.cur_pos)
        for (let i = 0; i < s.length; ++i) {
            if (s[i] === selected) continue
            let polygonA = selected.shape,
                polygonB = s[i].shape,
                depth = gjk(polygonA, polygonB);
            // console.log(depth)
            // return
            if (depth != -1) {
                let force = mouse.getDir(),
                    side = edge(
                        polygonB.vertex,
                        {
                            x: polygonA.x - polygonB.x,
                            y: polygonA.y - polygonB.y
                        }
                    ),
                    vert_angle = getVerticalAngle(force, side);
                let force_angle = Math.acos(dot(force, { x: 1, y: 0 }) / length(force))
                if (force.y < 0) force_angle *= -1
                // selected.position.x -= depth * Math.cos(vert_angle)
                // selected.position.y -= depth * Math.sin(vert_angle)
                // selected.resetShape()
                s[i].position.x += depth * Math.cos(vert_angle)
                s[i].position.y += depth * Math.sin(vert_angle)
                s[i].resetShape()
                // s[i].force.x = depth * Math.cos(vert_angle)
                // s[i].force.y = depth * Math.sin(vert_angle)
                // s[i].force.x = depth * Math.cos(force_angle) * 1
                // s[i].force.y = depth * Math.sin(force_angle) * 1
                // s[i].resetShape()
                // console.log(force)
                // console.log(force_angle)
                // console.log(i)
                // console.log(s[i].force)
            }
        }
    }
}

function mouseclick(e) {
    s.every(obj => {
        let ele = obj.shape
        if (ele.isclick(e.clientX, e.clientY)) {
            selected = obj
            return false
        }
        return true
    })
}

function mousemove(e) {
    if (stop) return
    if (flag.click_axis) {
        mouse.update(e, selected.shape.offsetX, selected.shape.offsetY)
        flag.rotate = true
    }
    if (flag.click_shape) {
        mouse.update(e, selected.shape.offsetX, selected.shape.offsetY)
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


onkeydown = onkeyup = function (e) {
    return
    key[e.keyCode] = e.type == 'keydown'

    let force = {
        x: 0,
        y: 0
    }
    if (key[87]) force.y -= 5
    if (key[83]) force.y += 5
    if (key[65]) force.x -= 5
    if (key[68]) force.x += 5
    if (force.x == 0 && force.y == 0) return
    s[1].position.x += force.x
    s[1].position.y += force.y
    s[1].shape.getVertex(s[1].position.x, s[1].position.y)
    let depth = gjk(s[1].shape, s[0].shape)
    if (depth) {
        let side = edge(
            s[0].shape.vertex,
            { x: -force.x, y: -force.y }
        )
        side = edge(
            s[0].shape.vertex,
            {
                x: s[1].position.x - s[0].position.x,
                y: s[1].position.y - s[0].position.y
            }
        )
        let force_v = getVerticalForce(force, side)
        let f = Math.sqrt(force.x ** 2 + force.y ** 2)
        this.console.log(
            depth * Math.cos(force_v.angle),
            depth * Math.sin(force_v.angle)
        )
        s[1].position.x -= depth * Math.cos(force_v.angle)
        s[1].position.y -= depth * Math.sin(force_v.angle)
        s[1].shape.getVertex(s[1].position.x, s[1].position.y)
    }
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
        // console.log(a + 1, b + 1)
        // console.log(vertex[a], vertex[b])
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

function getVerticalAngle(force, side) {
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