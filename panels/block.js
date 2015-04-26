function Terrain (blockScaleConstant, maxLevel, firstMacro) {
    this.blocks = [];//list of top level blocks
    this.blockDepth = 11;
    this.blockWidth = 11;
    this.firstMacro = firstMacro;//number of minimum size blocks before compression begins = 4^(firstMacro+2)
    this.maxLevel = maxLevel;
    this.blockScaleConstant = blockScaleConstant;//largest level grid size
	
	this.generator = new Generator();
}

Terrain.prototype.initTerrain = function () {
    var size = 10 * this.blockScaleConstant * Math.pow(2,this.maxLevel);
    this.blocks.push(new Block(this.blockScaleConstant*Math.pow(2,this.maxLevel), new THREE.Vector3(-size,0,-size), this.maxLevel,0,null));
    this.blocks.push(new Block(this.blockScaleConstant*Math.pow(2,this.maxLevel), new THREE.Vector3(-size,0,0), this.maxLevel,0,null));
    this.blocks.push(new Block(this.blockScaleConstant*Math.pow(2,this.maxLevel), new THREE.Vector3(0,0,0), this.maxLevel,0,null));
    this.blocks.push(new Block(this.blockScaleConstant*Math.pow(2,this.maxLevel), new THREE.Vector3(0,0,-size), this.maxLevel,0,null));

    
    for(var index in this.blocks){
        var parent = this.blocks[index];
		
		//this is a very inefficient
        while( parent.level > this.firstMacro){
            parent.state = 2;
            parent.generateChildren_recursive(parent.level - 1 - this.firstMacro);
            parent = parent.children[index];
        }
        
        
    }
}

Terrain.prototype.render = function (scene, material) {
    for(var index in this.blocks){
        this.blocks[index].render(scene,material);
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

Terrain.prototype.generateTerrain = function (block){
	if(block.state==2){
		this.generateTerrain(block.children[0]);
		this.generateTerrain(block.children[1]);
		this.generateTerrain(block.children[2]);
		this.generateTerrain(block.children[3]);

		this.computeFromChildren();
	}else if(block.state==1){
		this.generator.generate(block);
	}
}

function Generator () {
	this.levels = [];
}

Generator.prototype.addFunction = function (foo , level){
	this.levels[level].push(foo);
}

Generator.prototype.generate = function (block){
	for(level in levels){
		block.geometry.vertices.forEach(function (v, i){
			var x = position.x + v.x;
			var z = position.z + v.z;
			var r = Math.sqrt(x*x + z*z);

			for(foo in level){
				foo();
			}
		}
	}
}

function Block (scale, position, level, quad, parent){
    this.width = 11;
    this.depth = 11;

    this.scale = scale;
    this.level = level;
    this.quad = quad;
    this.position = position;//from lower left corner

    this.geometry = createGridGeometry(this.depth, this.width, this.scale);//will store actual geometry
    this.heightmap = createGridGeometry(this.depth, this.width, this.scale);//will store target values
    this.generateTerrain();
	this.mesh = null;

    this.parent = null;
    this.children = [null, null, null, null];//tr,tl,bl,br (faceing due +X, with +Z to the right)
    this.neighbor = [null, null, null , null, null, null, null, null];//R,RT,T,LT,L,LB,B,BR (faceing due +X, with +Z to the right)

    this.state = 1; //0=none, 1=self, 2=children

    //debug
    this.position.y = this.level;
}

Block.prototype.render = function (scene,material) {
    if(this.state==1){
        this.mesh = new THREE.Mesh(this.geometry, material);
        this.mesh.position.x = this.position.x;
        this.mesh.position.y = this.position.y;
        this.mesh.position.z = this.position.z;
        scene.add(this.mesh);
    }else if(this.state==2){
        this.children[0].render(scene,material);
        this.children[1].render(scene,material);
        this.children[2].render(scene,material);
        this.children[3].render(scene,material);
    }
}

Block.prototype.generateChildren = function () {
    this.children[0] = new Block(this.scale/2, new THREE.Vector3(5*this.scale,0,5*this.scale).add(this.position), this.level-1,0, this);
    this.children[1] = new Block(this.scale/2, new THREE.Vector3(5*this.scale,0,0).add(this.position), this.level-1, 1, this);
    this.children[2] = new Block(this.scale/2, new THREE.Vector3(0,0,0).add(this.position), this.level-1, 2, this);
    this.children[3] = new Block(this.scale/2, new THREE.Vector3(0,0,5*this.scale).add(this.position), this.level-1, 3, this);
}

//will create child blocks and their child blocks and so on until the level is zero
Block.prototype.generateChildren_recursive = function (level) {
    console.log("gcr " + this.level);
    if(this.level > level){    
        this.state = 2;
        this.generateChildren();
        for(var i=0 ; i < 4 ; i++){
            this.children[i].generateChildren_recursive(level);
        }
    }
}

Block.prototype.computeFromChildren = function(){
	//set heightmap based on children
	//TODO
}

Block.prototype.getPointHeight = function (x,z){
    if(this.state == 2){
        for(i=0 ; i < this.children.length ; i++){
            if(this.children[i].containsPoint(x,z)){
                return this.children[i].getPointHeight(x,z);
            }
        }
    } else if(this.containsPoint(x,z)){
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

        return y+this.position.y;
        
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
            if(x!=0 && d!=0 && x != width-1 && d != depth-1){
                //debug
                //geometry.vertices.push(new THREE.Vector3((x + (Math.random() - .5)/2)*size,0,(d + (Math.random() - .5)/2)*size));
                geometry.vertices.push(new THREE.Vector3(x*size,1,d*size));
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

Block.prototype.containsPoint = function (x,z) {
    if(this.position.x <= x && this.position.x + (this.width * this.scale) - this.scale > x && this.position.z <= z && this.position.z + this.depth * this.scale - this.scale > z){
        return true;
    }
    return false;
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
