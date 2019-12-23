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

        //this.update()
        this.getVertex()
    }

    getVertex() {
        var rad = 0
        this.vertex = []
        for (let i = 0; i < this.vertex_num; ++i) {
            this.vertex.push({
                x: this.x + this.w * Math.cos(rad),
                y: this.y + this.w * Math.sin(rad)
            })
            rad += (360 / this.vertex_num) / 180 * Math.PI
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.moveTo(this.vertex[0].x, this.vertex[0].y)
        for (let i = 1; i < this.vertex_num; ++i)
            ctx.lineTo(this.vertex[i].x, this.vertex[i].y)
        ctx.fill()
    }

    isclick(x, y) {
        if (ptInPolygon({ x: x, y: y }, this.vertex)) {
            this.offsetX = x - this.x
            this.offsetY = y - this.y
            return true
        }
    }

    update() {
        this.getVertex()
    }

}

class Square {
    constructor(x, y, w, color) {
        this.x = x
        this.y = y
        this.w = w
        this.color = color
        this.x1 = 0
        this.x2 = 0
        this.y1 = 0
        this.y2 = 0
        this.offsetX = 0
        this.offsetY = 0
        this.isSelect = false

        this.update()
    }

    draw(ctx) {
        ctx.fillStyle = this.color
        ctx.fillRect(
            this.x1,
            this.y1,
            this.x2 - this.x1,
            this.y2 - this.y1
        )
    }

    isclick(x, y) {
        if (x >= this.x1 && x <= this.x2
            && y >= this.y1 && y <= this.y2) {
            this.offsetX = x - this.x
            this.offsetY = y - this.y
            this.isSelect = true
        }
    }

    update() {
        this.x1 = this.x - this.w / 2
        this.x2 = this.x + this.w / 2
        this.y1 = this.y - this.w / 2
        this.y2 = this.y + this.w / 2
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

    s.push(new Polygon(300, 300, 100, 7, "#00FF00"))
    s.push(new Polygon(300, 300, 100, 5, "#FF0000"))


    transparency = gjk(s[0], s[1]) ? 0.6 : 1

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
        if (ele.isclick(e.clientX, e.clientY)) {
            ele.isSelect = true
            return false
        }
        return true
    })
}

function mousemove(e) {
    s.forEach(ele => {
        if (ele.isSelect) {
            ele.x = e.clientX - ele.offsetX
            ele.y = e.clientY - ele.offsetY
            ele.update()
            // transparency = collider(s[0], s[1]) ? 0.6 : 1
            transparency = gjk(s[0], s[1]) ? 0.6 : 1
        }
    })

    requestAnimationFrame(render)
}

function mouseup() {
    s.forEach(ele => {
        ele.isSelect = false
    })
}

function collider(a, b) {
    var pos = []
    for (let i = 0; i < a.vertex.length; ++i) {
        // let pos = []
        for (let j = 0; j < b.vertex.length; ++j) {
            pos.push({
                x: a.vertex[i].x - b.vertex[j].x,
                y: a.vertex[i].y - b.vertex[j].y,
            })
        }
    }
    if (ptInPolygon(origin, pos))
        return true
    return false
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