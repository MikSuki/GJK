const gjk = function (shape1, shape2) {
    if (shape1.vertex === undefined || shape2.vertex === undefined ||
        shape1.x === undefined || shape2.y === undefined ||
        shape1.vertex.length < 3 || shape2.vertex.length < 3) throw ('shape error')

    var dir, simplex = [];
    // simplex point 1
    // farthest from (shape2.center - shape1.center)
    dir = {
        x: shape2.x - shape1.x,
        y: shape2.y - shape1.y
    }
    simplex.push(support(dir))
    // simplex point 2
    // farthest from (shape1.center - shape2.center)
    dir = {
        x: -dir.x,
        y: -dir.y
    }
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
            return true
        }
        else if (v == 2) {
            return false
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

    function tripleProduct(a, b, c) {
        return {
            x: b.x * dot(a, c) - c.x * dot(a, b),
            y: b.y * dot(a, c) - c.y * dot(a, b)
        }
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
        return tripleProduct(cb, c0, cb)
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
        var ab_normal = tripleProduct(ab, ab, ac)
        var ac_normal = tripleProduct(ac, ac, ab)

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
}
