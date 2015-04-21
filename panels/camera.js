// scene size
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

// camera
var VIEW_ANGLE = 45;
var ASPECT = WIDTH / HEIGHT;
var NEAR = 1;
var FAR = 10000;

var camera;
var cameraStand;
var controls;
var mode = true;

window.addEventListener( 'keydown', switchCamera, false );

if ('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document) {

    var element = document.body;

    var pointerlockchange = function ( event ) {
	    if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
		    controls.enabled = true;

	    } else {
		    controls.enabled = false;
        }
    }

    var pointerlockerror = function ( event ) {
	    instructions.style.display = '';
    }

    // Hook pointer lock state change events
    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );


    document.addEventListener( 'click', function ( event ) {
        if(mode){
	        // Ask the browser to lock the pointer
	        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

	        if ( /Firefox/i.test( navigator.userAgent ) ) {

	            var fullscreenchange = function ( event ) {
		            if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
			            document.removeEventListener( 'fullscreenchange', fullscreenchange );
			            document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

			            element.requestPointerLock();
		            }
	            }

	            document.addEventListener( 'fullscreenchange', fullscreenchange, false );
	            document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

	            element.requestFullscreen = 
                    element.requestFullscreen || 
                    element.mozRequestFullscreen || 
                    element.mozRequestFullScreen || 
                    element.webkitRequestFullscreen;

	            element.requestFullscreen();

            } else {
	            element.requestPointerLock();
            }
        }}, false );

} else {
    alert("get wrecked (your browser cant pointer lock)");
}

function inCameraView(x,z){
    //Tests if the point is in the cameras field of view
    
    //find the angle from the camera to the object 
    //  using the horizontal and vertical offsets
    //subtract this from the camera angle to get the offset angle
    //if this angle is less than the field of view then return true

    offsetZ = (z - cameraStand.position.z);
    offsetX = (x - cameraStand.position.x);

    cameraOffset = getSimpleRadian(cameraStand.rotation.y);
    pointOffset = getSimpleRadian(-Math.atan(-offsetX/offsetZ));
    if(offsetZ>0){
        pointOffset -= Math.PI;
    }

    offset = Math.abs(getSimpleRadian(cameraOffset-pointOffset));

    if(offset<Math.PI/4){
        //console.log("success");        
        return true;
    }else{
        return false;   
    }
}

function getSimpleRadian(radian){
    radian %= 2*Math.PI;
    if(radian > Math.PI){
        radian -= 2*Math.PI;
    }
    return radian;
}

function switchCamera(event){
    if(event.keyCode == 86){
        if(mode){
            controls.walkSpeed = 6000;
            mode = false;
        }else{
            controls.walkSpeed = 500;
            mode = true;	    
        }    
    }
}

function initCameraPointLock(scene){
    //set up the camera (view)
	camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	camera.position.set( 0, 0, 0 );
    camera.lookAt(1,0,0);

	controls = new THREE.PointerLockControls( camera );
    cameraStand = controls.getObject();
	scene.add(cameraStand);
}
