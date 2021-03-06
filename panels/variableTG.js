function Terrain (blockScaleConstant) {
    this.blocks = [];//list of top level blocks
    this.blockDepth = 11;
    this.blockWidth = 11;
    this.blockScaleConstant = blockScaleConstant;//largest level grid size
}

Terrain.prototype.createTerrain = function (l,w) {
    var helper = 10 * this.blockScaleConstant;
    for(var z = -l ; z<l ; z++) {
        for(var x = -w; x<w ; x++) { 
            this.blocks.push(new Block(this.blockScaleConstant, new THREE.Vector3(x*helper,0,z*helper), 0));
        }
    }
}

Terrain.prototype.render = function (scene, material) {
    for(var index in this.blocks){
        block = this.blocks[index];
        mesh = new THREE.Mesh(block.geometry, material);
        mesh.position.x = block.position.x;
        mesh.position.y = block.position.y;
        mesh.position.z = block.position.z;

        scene.add(mesh);
    }
}

Terrain.prototype.getHeight = function (x, z) {
    for(i=0 ; i < this.blocks.length ; i++){
        if(this.blocks[i].containsPoint(x,z)){
            return this.blocks[i].getPointHeight(x,z);
        }
    }
    return 0;
}

function Block (scale, position, level){
    this.width = 11;
    this.depth = 11;

    this.scale = scale;  
    this.level = level;
    this.position = position;

    this.geometry = createGridGeometry(this.depth, this.width, this.scale);
    this.makeHills(this.position);

    this.parent = null;
    this.subBlocks = [null, null, null, null];
}

Block.prototype.containsPoint = function (x,z) {
    if(this.position.x <= x && this.position.x + (this.width * this.scale) - this.scale > x && this.position.z <= z && this.position.z + this.depth * this.scale - this.scale > z){
        return true;
    }
    return false;
}

Block.prototype.getPointHeight = function (x,z){
    if(this.containsPoint(x,z)){
        //turns x and z into the number of cells (grid spaces) from the origin of this tile
        x = (x - this.position.x)/this.scale;
        z = (z - this.position.z)/this.scale;

        /* get heights for the square of points that encompass the point(x,z)
            y0: closest to (0,0)
            yx: to the right of y0
            yz: above y0
            y1: above and to the right (across) from y0 */        
        y0 = this.geometry.vertices[Math.floor(x) + Math.floor(z) * this.width].y;
        yx = this.geometry.vertices[Math.ceil(x) + Math.floor(z) * this.width].y;
        yz = this.geometry.vertices[Math.floor(x) + Math.ceil(z) * this.width].y;
        y1 = this.geometry.vertices[Math.ceil(x) + Math.ceil(z) * this.width].y;

        //this turns x and z into decimal fractions from the top left (0,0) point in the square
        x -= Math.floor(x);
        z -= Math.floor(z);
      
        if(x+z <= 1){
            //if the point is in the bottom left triangle
            y = x * (yx-y0) + z * (yz-y0) + y0;
        }else{
            //if the point is in the top right trinangle
            y = (1-x) * (yz-y1) + (1-z) * (yx-y1) + y1;
        }

        return y;
        
    }else{
        return false;    
    } 
}

function equalAvg(i, vertices) {
    //this returns the average height of point at index and the surrounding points (up,down,left,right)

    if(i%11!=0 && i%11!=10 && Math.floor(i/11)!=0 && Math.floor(i/11)!=10 && i != 0){
        return (vertices[i].y + vertices[i-1].y + vertices[i+1].y + vertices[i-11].y + vertices[i+11].y)/5;
    }else{
        return vertices[i].y;
    }
}

function createGridGeometry (depth, width, size) {
    /*
    1) creates a grid of points/faces
        vertices are keeped in a one dimensional array
        starting at (0,0) <width> points are created heading to the right with <size> units between them
        this is repeated <depth> times to create rows <size> apart, going up
        this forms a square grid of points

    2) two triangular faces are then created in each of the grid squares
        the diagonal of the faces goes from the top left to bottom right
    
    3)finally normals are computed
        this is necessary to tell the renderer how light should interact with this object;
    */

    geometry = new THREE.Geometry();

    //create points
    for(var d = 0; d < depth ; d++){
        for(var x = 0; x < width ; x++){
            if(x!=0 && d!=0 && x != width-1 && d != depth-1 && false){
                geometry.vertices.push(new THREE.Vector3((x + (Math.random() - .5)/2)*size,0,(d + (Math.random() - .5)/2)*size));
            }else{
                geometry.vertices.push(new THREE.Vector3(x*size,0,d*size));
            }        
        }
    }

    //create bottom left faces
    for(var d = 0; d < depth - 1 ; d++){
        for(var x = 0; x < width - 1 ; x++){
            geometry.faces.push(new THREE.Face3((d+1)*width + x, d*width + x, d*width + x + 1));
        }
    }

    //create top right faces
    for(var d = depth - 1; d > 0 ; d--){
        for(var x = width - 1; x > 0 ; x--){
            geometry.faces.push(new THREE.Face3((d-1)*width + x, d*width + x, d*width + x - 1));
        }
    }

    //compute normals
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    assignUVs(geometry);
    return geometry;
}

assignUVs = function( geometry ){

    geometry.computeBoundingBox();

    var max     = geometry.boundingBox.max;
    var min     = geometry.boundingBox.min;

    var offset  = new THREE.Vector2(0 - min.x, 0 - min.y);
    var range   = new THREE.Vector2(max.x - min.x, max.y - min.y);

    geometry.faceVertexUvs[0] = [];
    var faces = geometry.faces;

    points = [
        new THREE.Vector2( 1,1 ),
        new THREE.Vector2( 1,0 ),
        new THREE.Vector2( 0,1 ),
        new THREE.Vector2( 0,0 )
    ]


    possible = [
      //point 3 missing
      [
            points[0],
            points[1],
            points[2]
      ],
      [
            points[0],
            points[2],
            points[1]
      ],
      [
            points[1],
            points[0],
            points[2]
      ],

      [
            points[1],
            points[2],
            points[0]
      ],
      [
            points[2],
            points[0],
            points[1]
      ],
      [
            points[2],
            points[1],
            points[0]
      ],

      //point 2 missing
      [
            points[0],
            points[1],
            points[3]
      ],
      [
            points[0],
            points[3],
            points[1]
      ],
      [
            points[1],
            points[0],
            points[3]
      ],

      [
            points[1],
            points[3],
            points[0]
      ],
      [
            points[3],
            points[0],
            points[1]
      ],
      [
            points[3],
            points[1],
            points[0]
      ],

      //point 1 missing
      [
            points[0],
            points[3],
            points[2]
      ],
      [
            points[0],
            points[2],
            points[3]
      ],
      [
            points[3],
            points[0],
            points[2]
      ],

      [
            points[3],
            points[2],
            points[0]
      ],
      [
            points[2],
            points[0],
            points[3]
      ],
      [
            points[2],
            points[3],
            points[0]
      ],

      //point 0 missing
      [
            points[3],
            points[1],
            points[2]
      ],
      [
            points[3],
            points[2],
            points[1]
      ],
      [
            points[1],
            points[3],
            points[2]
      ],

      [
            points[1],
            points[2],
            points[3]
      ],
      [
            points[2],
            points[3],
            points[1]
      ],
      [
            points[2],
            points[1],
            points[3]
      ]
    ]

    for (i = 0; i < geometry.faces.length ; i++) {

      var v1 = geometry.vertices[faces[i].a];
      var v2 = geometry.vertices[faces[i].b];
      var v3 = geometry.vertices[faces[i].c];

      
      var r = Math.floor(Math.random() * 24);

      geometry.faceVertexUvs[0].push(possible[r]);

    }

    geometry.uvsNeedUpdate = true;

}
