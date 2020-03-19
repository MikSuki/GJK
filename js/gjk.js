var gjk = function (shape1, shape2) {
    if (shape1.vertex === undefined || shape2.vertex === undefined ||
        shape1.x === undefined || shape2.y === undefined ||
        shape1.vertex.length < 3 || shape2.vertex.length < 3) throw ('shape error')

    const ACCURACY = 0.001
    var dir, simplex = [];
    // simplex point 1
    // farthest from (shape2.center - shape1.center)
    dir = {
        x: shape2.x - shape1.x,
        y: shape2.y - shape1.y
    }
    if(dir.x == 0 && dir.y == 0) dir = {x: 1, y: 0}
    simplex.push(support(dir))
    // simplex point 2
    // farthest from (shape1.center - shape2.center)
    dir = {
        x: -dir.x,
        y: -dir.y
    }
    if(dir.x == 0 && dir.y == 0) dir = {x: -1, y: 0}
    simplex.push(support(dir))
    // simplex point 3
    // get the normal of line (point 1 & 2)
    // and this normal towards to the origin
    // then get point farthest from this direction
    dir = getNormalDir()
    simplex.push(support(dir))

    while (true) {
        let v = containOrigin()
        if (v == 1) {
            return EPA()
        }
        else if (v == 2) {
            return -1
        }
    }

    function support(dir) {
        var dir_inv = {
            x: -dir.x,
            y: -dir.y
        }
        var a = getPoint(shape1.vertex, dir)
        var b = getPoint(shape2.vertex, dir_inv)
        return {
            x: a.x - b.x,
            y: a.y - b.y
        }

        function getPoint(vertex, dir) {
            var max_dot = Number.MIN_SAFE_INTEGER
            var p = 0
            for (let i = 0; i < vertex.length; ++i) {
                let cur_dot = dot(vertex[i], dir)
                if (cur_dot > max_dot) {
                    max_dot = cur_dot
                    p = i
                }
            }
            return vertex[p]
        }
    }

    function dot(vec1, vec2) {
        return vec1.x * vec2.x + vec1.y * vec2.y
    }

    function cross(vec1, vec2) {
        return vec1.x * vec2.y - vec1.y * vec2.x
    }

    function tripleProduct(a, b, c) {
        return {
            x: b.x * dot(a, c) - c.x * dot(a, b),
            y: b.y * dot(a, c) - c.y * dot(a, b)
        }
    }

    function normalize(vec) {
        let size = Math.sqrt(vec.x ** 2 + vec.y ** 2)
        return {
            x: vec.x / size,
            y: vec.y / size
        }
    }

    function length(v) {
        return Math.sqrt(v.x ** 2 + v.y ** 2)
    }

    function getNormalDir() {
        var b = simplex[1]
        var c = simplex[0]
        var cb = {
            x: b.x - c.x,
            y: b.y - c.y
        }
        var c0 = {
            x: - c.x,
            y: - c.y
        }
        // toward to origin
        var normal = tripleProduct(cb, c0, cb)
        // simplex 0 && 1 collinear with origin
        if (Math.abs(normal.x) < ACCURACY && Math.abs(normal.y) < ACCURACY) {
            let a = simplex[0],
                b = simplex[1],
                ab = normalize({
                    x: b.x - a.x,
                    y: b.y - a.y
                });
            normal = { x: ab.y, y: -ab.x }
        }
        return normal
    }

    function containOrigin() {
        var a = simplex[2]
        var b = simplex[1]
        var c = simplex[0]

        var a0 = {
            x: -a.x,
            y: -a.y
        }
        var ab = {
            x: b.x - a.x,
            y: b.y - a.y
        }
        var ac = {
            x: c.x - a.x,
            y: c.y - a.y
        }
        // find normal reverse to origin
        var ab_normal = normalize(tripleProduct(ab, ab, ac))
        var ac_normal = normalize(tripleProduct(ac, ac, ab))

        // is origin outside of ab
        if (dot(ab_normal, a0) > 0) {
            simplex.splice(0, 1)
            simplex.push(support(ab_normal))
            // if new point is not in direction of ac_normal 
            // so, no collision
            if (dot(simplex[2], ab_normal) < 0) return 2
        }
        // is origin outside of ac
        else if (dot(ac_normal, a0) > 0) {
            simplex.splice(1, 1)
            simplex.push(support(ac_normal))
            // if new point is not in direction of ac_normal 
            // so, no collision
            if (dot(simplex[2], ac_normal) < 0) return 2
        }
        // origin is inside of this simplex
        else
            return 1
        return 0
    }

    function EPA() {
        while (true) {
            let closest,
                clockwise = null,
                dist_min = Number.MAX_SAFE_INTEGER;

            for (let i = 0, j = simplex.length - 1; i < simplex.length; j = i++) {
                dir = cross(simplex[i], simplex[j])
                if (dir != 0) {
                    if (dir > 0)
                        clockwise = true
                    else
                        clockwise = false
                    break
                }
            }
            // all points are zeros (A & B are same)
            if (clockwise == null) {
                console.log('same shape')
                return 0
            }

            for (let i = 0, j = simplex.length - 1; i < simplex.length; j = i++) {
                let a = simplex[i],
                    b = simplex[j],
                    ab = normalize({
                        x: b.x - a.x,
                        y: b.y - a.y
                    }),
                    oa = a,
                    ab_normal = clockwise == true ? { x: ab.y, y: -ab.x } : { x: -ab.y, y: ab.x },
                    dist = dot(ab_normal, oa);
                // line ab through origin
                if (dist === 0) 
                    continue
                if (dist < dist_min) {
                    dist_min = dist
                    closest = {
                        a: a,
                        b: b,
                        index: i,
                        normal: {
                            x: ab_normal.x,
                            y: ab_normal.y
                        },
                        dist: dist
                    }
                }
            }
            let p = support(closest.normal)

            dist = dot(p, closest.normal)
            if (dist - closest.dist < ACCURACY) {
                return dist
            }
            else {
                simplex.splice(closest.index, 0, p)
                // // safe
                // if (simplex.length > 1000) {
                //     console.log('> 1000')
                //     return
                // }
            }
        }
    }
}


function distance(pt, l1, l2) {
    let v1 = {
        x: pt.x - l1.x,
        y: pt.y - l1.y
    }
    let v2 = {
        x: l2.x - l1.x,
        y: l2.y - l1.y
    }
    return Math.abs(cross(v1, v2)) / length(v2)


    function cross(v1, v2) {
        return v1.x * v2.y - v1.y * v2.x
    }

    function length(v) {
        return Math.sqrt(v.x ** 2 + v.y ** 2)
    }
}




