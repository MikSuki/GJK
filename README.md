# GJK
 2d collision detection and return penetration depth
 
 ![image](https://github.com/MikSuki/GJK/blob/master/intro.gif)
 
 DEMO: https://miksuki.github.io/GJK/
# Usage
```javascript
let shape = {
    x: num, // center x
    y: num, // center y
    vertex = [
        {x: num, y: num},
        {x: num, y: num},
        {x: num, y: num},
        ...
    ]
};

let depth = gjk(shape1, shape2) ;

```

# Return 

* `-1`: no collision
* `0`: two graphics overlap
* ` other`: penetration depth
