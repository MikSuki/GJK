var ctx;
var s = []
var transparency = 1

class Polygon {
    constructor(x, y, w, vertex_num, color) {
        this.x = x
        this.y = y
        this.w = w
        this.vertex_num = vertex_num
        this.vertex = []
        this.rotation = 0
        this.color = color
        this.offsetX = 0
        this.offsetY = 0
        this.isSelect = false
        this.axis = [
            { x: 0, y: -3 },
            { x: 0, y: 3 },
            { x: w, y: 3 },
            { x: w, y: -3 },
        ]
        this.axis.forEach(e => {
            e.size = Math.sqrt(e.x ** 2 + e.y ** 2)
            e.rotation = Math.atan(e.y / e.x)
        })

        this.getVertex()
    }

    getVertex() {
        var rad = 0
        this.vertex = []
        for (let i = 0; i < this.vertex_num; ++i) {
            this.vertex.push({
                x: this.x + this.w * Math.cos(rad - this.rotation),
                y: this.y + this.w * Math.sin(rad - this.rotation)
            })
            rad += (360 / this.vertex_num) / 180 * Math.PI
        }
        rad = this.rotation
        // axis
        this.axis.forEach(e => {
            e.x = e.size * Math.cos(e.rotation - rad)
            e.y = e.size * Math.sin(e.rotation - rad)
        })
    }

    draw(ctx) {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.moveTo(this.vertex[0].x, this.vertex[0].y)
        for (let i = 1; i < this.vertex_num; ++i)
            ctx.lineTo(this.vertex[i].x, this.vertex[i].y)
        ctx.fill()

        // axis
        ctx.fillStyle = '#000000'
        ctx.beginPath()
        ctx.moveTo(this.vertex[0].x + this.axis[0].x, this.vertex[0].y + this.axis[0].y)
        for (let i = 1; i < this.axis.length; ++i)
            ctx.lineTo(this.vertex[0].x + this.axis[i].x, this.vertex[0].y + this.axis[i].y)
        ctx.fill()


        ctx.fillStyle = '#000000'

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
            this.isSelect = 'axis'
            return true
        }
        if (ptInPolygon({ x: x, y: y }, this.vertex)) {
            this.offsetX = x - this.x
            this.offsetY = y - this.y
            this.isSelect = 'move'
            return true
        }
    }
}

window.onload = function () {
    var canvas = document.getElementById('canvas')
    ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.onmousedown = mouseclick
    canvas.onmousemove = mousemove
    canvas.onmouseup = mouseup

    s.push(new Polygon(300, 300, 80, 4, "#00FF00"))
    s.push(new Polygon(550, 300, 120, 4, "#FF0000"))


    requestAnimationFrame(render)
}


function render() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    ctx.globalAlpha = transparency
    s.forEach(e => {
        e.draw(ctx)
    })
}


function mouseclick(e) {
    s.every(ele => {
        if (ele.isclick(e.clientX, e.clientY))
            return false
        return true
    })
}

function mousemove(e) {
    s.forEach(ele => {
        if (ele.isSelect == 'axis') {
            let [x, y] = [ele.x - e.clientX, ele.y - e.clientY]
            let dot = -x
            let len = Math.sqrt(x ** 2 + y ** 2)
            let rad = Math.acos(dot / len)
            if (y < 0) rad = - rad
            ele.rotation = rad
            ele.getVertex()
            transparency = gjk(s[0], s[1]) ? 0.6 : 1
        }
        if (ele.isSelect == 'move') {
            let shapeA = ele
            let shapeB = ele === s[0] ? s[1] : s[0]
            ele.x = e.clientX - ele.offsetX
            ele.y = e.clientY - ele.offsetY
            ele.getVertex()
            if (gjk(shapeA, shapeB)) {
                let num = 0
                transparency = 0.6
                for (let i = 0; i < shapeA.vertex.length; ++i) {
                    if (ptInPolygon(shapeA.vertex[i], shapeB.vertex))
                        ++num
                }
                switch (num) {
                    case 1:

                        break
                }
            }
            else
                transparency = 1
        }
    })

    requestAnimationFrame(render)
}

function mouseup() {
    s.forEach(ele => {
        ele.isSelect = false
    })
}


function ptInPolygon(pt, polygon) {
    let i = 0,
        j = polygon.length - 1,
        c = 0
    for (; i < polygon.length; j = i++) {
        if (((polygon[i].y > pt.y) != (polygon[j].y > pt.y)) &&
            (pt.x < (polygon[j].x - polygon[i].x) * (pt.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x))
            c = !c
    }
    return c
}

const origin = { x: 0, y: 0 }
