# GJK
 2d collision detection and return penetration depth
 
 DEMO: https://miksuki.github.io/GJK/
# Usage
```javascript
var shape = {
    x: num, // center x
    y: num, // center y
    vertex = [
        {x: num, y: num},
        {x: num, y: num},
        {x: num, y: num},
        ...
    ]
};

gjk(shape1, shape2) ;

```

# Return 

* `-1`: no collision
* `0`: two graphics overlap
* ` other`: penetration depth
