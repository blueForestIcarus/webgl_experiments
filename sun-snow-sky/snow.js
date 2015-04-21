var clock = new THREE.Clock();

function initSnow(){
    numParticles = 100000;
    width = 300;
    height = 300;
    depth = 300;

    color = 0xFFFFFF;
    radiusX = 2.5;
    radiusZ = 2.5;
    size = 100;
    scale = 4.0;
    opacity = 0.4;
    speedH = .5;
    speedV = .5;

    texture = THREE.ImageUtils.loadTexture( 'snowflake1.png' );

    systemGeometry = new THREE.Geometry(),
    systemMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color:  { type: 'c', value: new THREE.Color( color ) },
            height: { type: 'f', value: height },
            elapsedTime: { type: 'f', value: 0 },
            radiusX: { type: 'f', value: radiusX },
            radiusZ: { type: 'f', value: radiusZ },
            size: { type: 'f', value: size },
            scale: { type: 'f', value: scale },
            opacity: { type: 'f', value: opacity },
            texture: { type: 't', value: texture },
            speedH: { type: 'f', value: speedH },
            speedV: { type: 'f', value: speedV }
        },
        vertexShader: document.getElementById( 'snow_vertex' ).textContent,
        fragmentShader: document.getElementById( 'snow_fragment' ).textContent,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthTest: true
    });
 
    for( var i = 0; i < numParticles; i++ ) {
        var vertex = new THREE.Vector3(
            rand( width ),
            Math.random() * height,
            rand( depth )
        );
        systemGeometry.vertices.push( vertex );
    }

    particleSystem = new THREE.ParticleSystem( systemGeometry, systemMaterial );
    particleSystem.position.y = 0;

    scene.add( particleSystem );
}

function rand( v ) {
    return (v * (Math.random() - 0.5));
}

function updateSnow(position) {
        particleSystem.position.copy(position)
        particleSystem.position.y -= 100;
    
        delta = clock.getDelta();
        elapsedTime = clock.getElapsedTime();

        particleSystem.material.uniforms.elapsedTime.value = elapsedTime * 10;
}
