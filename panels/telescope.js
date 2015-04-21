function TelescopeManager(scene) {
    this.telescopes = [];
    this.createTelescopesCircle(40);
}

TelescopeManager.prototype.createTelescopesRandom = function (d){
    for(var z = -d ; z<d ; z++) {
        for(var x = -d ; x<d ; x++) { 
            posx = x * 10000/d + Math.random()*6000/d;
            posz = z * 10000/d + Math.random()*6000/d;
            t = new Telescope(100,50,500,500,500);
            t.setPosition(posx,terrain.getHeight(posx,posz),posz);
            t.lookAt(0,0,0);
            scene.add(t.mesh);
            this.telescopes.push(t);
        }
    }
}

TelescopeManager.prototype.createTelescopesCircle = function (d){
    angle = 2*Math.PI/d;
    for(var x = 0 ; x<d ; x++) { 
        posx = Math.cos(x*angle)*10000;
        posz = Math.sin(x*angle)*10000;
        t = new Telescope(100,50,500,500,500);
        t.setPosition(posx,terrain.getHeight(posx,posz),posz);
        t.lookAt(0,0,0);
        scene.add(t.mesh);
        this.telescopes.push(t);
    }
}

TelescopeManager.prototype.updateTarget = function (x,y,z) {
    for(i in this.telescopes){
        this.target(this.telescopes[i],x,y,z);
    }
}

TelescopeManager.prototype.target = function (t,x,y,z) {
    distance =  Math.sqrt(Math.pow((x - t.mesh.position.x),2) + Math.pow((z - t.mesh.position.z),2));
    if(distance > t.w2 + t.w3 && !inCameraView(t.mesh.position.x,t.mesh.position.z)){
        t.lookAt(x,y,z);
    }
}

function Telescope (r1,r3,w1,w2,w3) {
    this.r1 = r1;
    this.r3 = r3;
    this.w1 = w1;
    this.w2 = w2;
    this.w3 = w3;

    this.geometry = this.getGeometry(r1,r3,w1,w2,w3);
    this.material = this.getMaterial();
    this.mesh = new THREE.Mesh(this.geometry,this.material);
}

Telescope.prototype.setPosition = function (x,y,z) {
    this.mesh.position.x = x;
    this.mesh.position.y = y;
    this.mesh.position.z = z; 
}

Telescope.prototype.lookAt = function (x,y,z) {
    dx = x - this.mesh.position.x;
    dz = z - this.mesh.position.z;

    this.mesh.rotation.y = -Math.atan(dz/dx);    

    if(dx<0){
        this.mesh.rotation.y += Math.PI;    
    }
}

Telescope.prototype.getGeometry = function (r1,r3,w1,w2,w3) {
    var polys = 50;

    var r2 = (r3+r1)/2;

    //tweak sizes
    if(r1 * Math.sqrt(2)/2 < r2){
        r1 = 2*r2/Math.sqrt(2);
    }
    if(r2 * Math.sqrt(2)/2 < r3){
        r3 = r2 * Math.sqrt(2)/2;
    }

    var geometryOne = new THREE.CylinderGeometry( r1, r1, w1, polys, 1 );
    geometryOne.applyMatrix( new THREE.Matrix4().makeRotationZ(Math.PI/2));
    geometryOne.applyMatrix( new THREE.Matrix4().makeTranslation(w1/2 + w2/Math.sqrt(2),w3 + (w2/Math.sqrt(2)) , 0));

    var geometryTwo = new THREE.CylinderGeometry( r2, r2, w2+r2, polys, 1 );
    geometryTwo.applyMatrix( new THREE.Matrix4().makeRotationZ(- Math.PI/4));
    geometryTwo.applyMatrix( new THREE.Matrix4().makeTranslation( w2/Math.sqrt(8) + r2/Math.sqrt(8) , w3 + (w2/Math.sqrt(8)) + r2/Math.sqrt(9) , 0));

    var r2 = (r3+r1)/2;
    var geometryThree = new THREE.CylinderGeometry( r3, r3, w3 + r3*2, polys, 1 );
    geometryThree.applyMatrix( new THREE.Matrix4().makeTranslation( 0, w3/2,0));
    
    var geometry = geometryThree;
    geometry.merge(geometryTwo);
    geometry.merge(geometryOne);
    
    return geometry;
}

Telescope.prototype.getMaterial = function () {
    return new THREE.MeshLambertMaterial({
        ambient: 0x333333, 
        color: 0xffffff, 
        specular: 0xffffff, 
        shininess: 20, 
        doubleSided:true,                        
        shading: THREE.SmoothShading 
        });
}



