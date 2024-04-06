/*
 * CSI4130 Assignment 4
 * Amani Farid 300173889
 * "Santa Sleigh" (https://skfb.ly/6XrxO) by PatelDev is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 * "Jolly Santa" (https://skfb.ly/oONTG) by Tomato Owl is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 */

import './ammo.js'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from "dat.gui";
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { vec3 } from 'three/examples/jsm/nodes/shadernode/ShaderNode';

let clock;



let scene, renderer, cameraFront, cameraTop, curve, gui;
let t = 0;
let n = 0; 
let increment = 0.001;
let physicsWorld, rigidBodies = [];
let tmpTrans;

let model, sleighModel, presentModel; 

let boolClear = false; 

let snowflakeCount, snowflakeGeometry, snowflakeVertices, snowflakeMaterial, snowflakes;

let points; 
let mostLeftPoint; 
let mostRightPoint; 
clock = new THREE.Clock();

// curve geometries and meshes
let tubeGeometry = new THREE.TubeGeometry(curve,300, 0.08, 8, false);
let tubeMaterial = new THREE.MeshBasicMaterial({ color: 'white'});
let tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

// to display or not display the curve from the gui
var meshControls = {
    myCheckbox: false // This will be represented as a checkbox
};

// default values for the gui controls 
var defaultControls = {
    px: 0.6, 
    ps: 1.1, 
    py: 0.3,
    pz: 0.9,
    alpha_x: 1 , 
    alpha_s:1, 
    alpha_y: 0,
    alpha_z: 1,
    displayMesh:false
    
}

let flycontrols;

// initial amplitudes a
let Ax = 20, As = 2, Ay = 9, Az = 10;
//let wx = 3.1, ws = 3.3, wy = 0, wz = 2.6;
let alpha_x, alpha_s, alpha_y, alpha_z;

let colGroupGround = 1, colGroupPresent = 2, colGroupCone=3;

let wx = 1;   // Frequency for x
let ws = 1.5; // Frequency for s
let wy = 2;   // Frequency for y
let wz = 3;   // Frequency for z


let mixer, action; // for animations


function setupPhysicsWorld(){

    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}

Ammo().then( start )
            
function start(){
            tmpTrans = new Ammo.btTransform();
            setupPhysicsWorld();
            init();
}


function init() {
    // Scene

    

    scene = new THREE.Scene();
    const axesHelper = new THREE.AxesHelper( 10 );
    scene.add( axesHelper );

    // Front View Camera
    cameraFront = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraFront.position.set(0, 10, 100); // Adjust to see the ground
    cameraFront.lookAt(0, 0, 0);

   renderer = new THREE.WebGLRenderer


   // renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.background = new THREE.Color('#040348');

    // Lighting setup
    const ambientLight = new THREE.AmbientLight('white', 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 5);
    scene.add(directionalLight);

    const loader = new GLTFLoader();

    // Load gltf
    loader.load(
        'assets/jolly_santa/scene.gltf', 
        function (gltf) {
            model = gltf.scene; 
            let animations = gltf.animations;
            scene.add(model);

            mixer = new THREE.AnimationMixer(model);
            action = mixer.clipAction(animations[3]);
            // Set the animation to play once and stop
            action.setLoop(THREE.LoopOnce);  // Play the animation once
            action.clampWhenFinished = true;  // Stop the animation when it's finished

            // for (let i = 0; i < animations.length; i++) {
            //     let action = mixer.clipAction(animations[i]);
            //     action.play();
            // }

            model.scale.set(25, 25, 25); 
            
           // model.rotateY(-Math.PI/2);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened', error);
        }
    );

    // Load gltf
    loader.load(
        'assets/sleigh/scene.gltf', 
        function (gltf) {
            sleighModel = gltf.scene; 
            scene.add(sleighModel);
            sleighModel.scale.set(0.005, 0.005, 0.005);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened', error);
        }
    );
    // Load gltf
    loader.load(
        'assets/present/scene.gltf', 
        function (gltf) {
            presentModel = gltf.scene; 
            scene.add(presentModel);
            presentModel.position.set(0,5,5);
            presentModel.scale.set(0.5, 0.5, 0.5);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened', error);
        }
    );

    let pos = {x: 0.1, y: 10, z: 0};
    let scale = {x: 1, y: 1, z: 1};
    let quat = {x: 0, y: 0, z: 0, w: 1};

    let pos_ground = {x: 0, y: -0.5, z: 0};
    let scale_ground = {x: 20, y: 1, z:20};
    let quat_ground = {x: 0, y: 0, z: 0, w: 1};
    
    let mass_ground = 0;
    let mass = 10;

    //Create Ground
    let blockPlane_ground = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshPhongMaterial({color: 0xa0afa4}));

    blockPlane_ground.position.set(pos_ground.x, pos_ground.y, pos_ground.z);
    blockPlane_ground.scale.set(scale_ground.x, scale_ground.y, scale_ground.z);

    blockPlane_ground.castShadow = true;
    blockPlane_ground.receiveShadow = true;

    scene.add(blockPlane_ground);
    let transform_ground = new Ammo.btTransform();
    transform_ground.setIdentity();
    transform_ground.setOrigin( new Ammo.btVector3( pos_ground.x, pos_ground.y, pos_ground.z ) );
    transform_ground.setRotation( new Ammo.btQuaternion( quat_ground.x, quat_ground.y, quat_ground.z, quat_ground.w ) );
    let motionState_ground = new Ammo.btDefaultMotionState( transform_ground);

    let colShape_ground = new Ammo.btBoxShape( new Ammo.btVector3( scale_ground.x*.5, scale_ground.y*.5, scale_ground.z*.5) );
    colShape_ground.setMargin( 0.05 );

    let localInertia_ground = new Ammo.btVector3( 0, 0, 0 );
    colShape_ground.calculateLocalInertia( mass_ground, localInertia_ground );

    let rbInfo_ground = new Ammo.btRigidBodyConstructionInfo( mass_ground, motionState_ground, colShape_ground, localInertia_ground );
    let physics_body_ground = new Ammo.btRigidBody( rbInfo_ground );
    blockPlane_ground.userData.physicsBody = physics_body_ground;
    rigidBodies.push(blockPlane_ground)
    physicsWorld.addRigidBody( physics_body_ground, colGroupGround, colGroupPresent);

    //Create Present
    let blockPlane = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshPhongMaterial({color: 0xa0afa4}));

    blockPlane.position.set(pos.x, pos.y, pos.z);
    blockPlane.scale.set(scale.x, scale.y, scale.z);

    blockPlane.castShadow = true;
    blockPlane.receiveShadow = true;

    //scene.add(blockPlane);
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );

    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x*.5, scale.y*.5, scale.z*.5) );
    colShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let physics_body = new Ammo.btRigidBody( rbInfo );
    blockPlane.userData.physicsBody = physics_body;
    rigidBodies.push(blockPlane)
    physicsWorld.addRigidBody( physics_body, colGroupPresent, colGroupGround);

    // Create a group for the house
    const house = new THREE.Group();

    // Load the texture
    const textureLoader = new THREE.TextureLoader();
    const brickTexture = textureLoader.load('assets/brick_texture.jpg'); 

    // Create material with texture
    const brickMaterial = new THREE.MeshLambertMaterial({ map: brickTexture });

    // House body
    const bodyGeometry = new THREE.BoxGeometry(3,4, 3);
    //const bodyMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
    const body = new THREE.Mesh(bodyGeometry, brickMaterial);
    body.position.set(0, 2, 0);  
    house.add(body);  // Add the body to the house group

    // Roof
    const roofGeometry = new THREE.ConeGeometry(3, 2.7, 4);
    const roofMaterial = new THREE.MeshBasicMaterial({ color: '#120d0a' });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 5.2, 0); 
    roof.rotation.y = Math.PI / 4; // Align the roof's corners with the house body
    house.add(roof);  // Add the roof to the house group

    let conePlane = new THREE.Mesh(new THREE.ConeGeometry(1,1.2,4), new THREE.MeshPhongMaterial({color: 0x00fa4}));

    scene.add(conePlane);
    let cone_transform = new Ammo.btTransform();
    cone_transform.setIdentity();
    cone_transform.setOrigin( new Ammo.btVector3( 0,2.5,0) );
    cone_transform.setRotation( new Ammo.btQuaternion( 0,0,0,1) );
    let cone_motionState = new Ammo.btDefaultMotionState( cone_transform );

    let cone_colShape = new Ammo.btConeShape(1,1);
    colShape.setMargin( 0.05 );

    let cone_localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( 0, cone_localInertia );

    let cone_rbInfo = new Ammo.btRigidBodyConstructionInfo( 0, cone_motionState, cone_colShape, cone_localInertia );
    let cone_physics_body = new Ammo.btRigidBody( cone_rbInfo );
    conePlane.userData.physicsBody = cone_physics_body;
    rigidBodies.push(conePlane)
    physicsWorld.addRigidBody( cone_physics_body, colGroupCone, colGroupPresent);

    
    // Roof TODO: Not showing
    const chimneyGeometry = new THREE.BoxGeometry(3, 2.7, 4);
    const chimneyMaterial = new THREE.MeshBasicMaterial({ color: '#120d0a' });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyGeometry);
    chimney.position.set(5, 5, 0); 
    //chimney.rotation.y = Math.PI / 4; // Align the roof's corners with the house body
    house.add(chimney);  // chimney

        // Window and door sizing
    const windowWidth = 0.3;
    const windowHeight = 0.3;
    const windowDepth = 0.1;

    const doorWidth = 0.6; // Example width for the door
    const doorHeight = 1.0; // Example height for the door
    const doorDepth = 0.1;

    // Housing material 
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 'black',
        emissive: 0xffff00,
        emissiveIntensity: 1
    });
    const doorMaterial = new THREE.MeshStandardMaterial({ color: 'brown' });
    

    // Housing geometry
    const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, doorDepth);

    // Create and position windows function
    function createWindow(x, y, z) {
        const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
        windowMesh.position.set(x, y, z);
        house.add(windowMesh);
    }

    // Add windows
    createWindow(-1, 3, 1.5);
    createWindow(-0.5, 3, 1.5);
    createWindow(1, 3, 1.5);
    createWindow(0.5, 3, 1.5);
    createWindow(-1, 2.5, 1.5);
    createWindow(-0.5, 2.5, 1.5);
    createWindow(1, 2.5, 1.5);
    createWindow(0.5, 2.5, 1.5);

    // Create and add the door
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    doorMesh.position.set(0, 1, 1.5);
    house.add(doorMesh);

    // Now scale the entire house group
    house.scale.set(0.5, 0.5, 0.5);
    scene.add(house);



    const groundGeometry = new THREE.PlaneGeometry(500, 500, 64, 32);

// Access the position attribute of the geometry
    const positions = groundGeometry.attributes.position;

    //TO MAKE THE GROUND BUMPY, UNCOMMENT
    // // randomize the z component of each vertex to create textured snow
    /*for (let i = 0; i < positions.count; i++) {
    //     // Randomly adjust the z position of each vertex
         positions.setZ(i, Math.random() * 1); // height variation
    }*/

    // // Notify Three.js that the position data has changed
    positions.needsUpdate = true;

    // // Recompute normals for the lighting calculations
    groundGeometry.computeVertexNormals();

     const groundMaterial = new THREE.MeshLambertMaterial({ color: 'white' });
     const ground = new THREE.Mesh(groundGeometry, groundMaterial);
     ground.position.y = 0;
     ground.rotation.x = -Math.PI / 2; // Rotate the ground to be horizontal
    //scene.add(ground);

    // Create a raycaster
    //const raycaster = new THREE.Raycaster();

    // The starting point of the ray should be above the highest point of the ground
    // You might need to adjust this based on your scene's scale
    //const rayStartHeight = 100; 

    // Set the raycaster starting point directly above the house's position
    //const rayOrigin = new THREE.Vector3(house.position.x, rayStartHeight, house.position.z);
    //raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0)); // pointing downwards

    // Calculate intersects
    //const intersects = raycaster.intersectObject(ground);

    
    /*if (intersects.length > 0) {
        // Assuming the house's pivot is at its base, set the house on the ground
        // You might need to add half the house's height if the pivot is in the middle
        house.position.y = intersects[0].point.y + (houseBodyHeight / 2) + roofHeight;
    } else {
        console.warn('No intersection found - make sure the house is above the ground mesh');
    }*/


    //const helper = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 100, 0xff0000);
    //scene.add(helper);
    
   
    snowflakeCount = 10000;
    snowflakeGeometry = new THREE.BufferGeometry();
    snowflakeVertices = [];

    for (let i = 0; i < snowflakeCount; i++) {
        const x = Math.random() * 200 - 100;
        const y = Math.random() * 200;
        const z = Math.random() * 200 - 100;
        snowflakeVertices.push(x, y, z);
    }

    snowflakeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(snowflakeVertices, 3));

    snowflakeMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    snowflakes = new THREE.Points(snowflakeGeometry, snowflakeMaterial);

    scene.add(snowflakes);

   
    // constructor for Harmonograph curve
    class HarmonographicCurve extends THREE.Curve{
        constructor(Ax, As, Ay, Az, wx, ws, wy, wz, px, ps, py, pz){
            super();
            this.Ax = Ax;
            this.As = As;
            this.Ay = Ay;
            this.Az = Az;
            this.wx = wx;
            this.wy = wy;
            this.ws = ws;  
            this.wz = wz;
            this.px = px;
            this.ps = ps;
            this.py = py;
            this.pz = pz;
        }
        getPoint(t){
            //since three uses a range of t=0..1, for frequency you will need a factor of 2pi
            var x  = this.Ax * Math.sin(this.wx*t*2*Math.PI + this.px)
            var y = this.Ay * Math.sin(this.wy*t*2*Math.PI + this.py);
            var z = this.Az*Math.sin(this.wz*2*t*Math.PI + this.pz);
            return new THREE.Vector3(x, y, z);
        }
    };

    // setting default values for the controls of the gui,
    var controls = new function(){
        this.px = defaultControls.px;
        this.ps = defaultControls.ps;
        this.py = defaultControls.py;
        this.pz = defaultControls.pz;
        this.alpha_x = defaultControls.alpha_x;
        this.alpha_s = defaultControls.alpha_s;
        this.alpha_y = defaultControls.alpha_y;
        this.alpha_z = defaultControls.alpha_z;
        this.displayMesh = defaultControls.displayMesh;
        this.update = function() {
            updateHarmonographicCurve();
        };
        this.reset = function(){ 
            btnReset()
        }
    };

    // reset button click to clear screen and reset alpha sliders
    function btnReset() {
        controls.alpha_x = defaultControls.alpha_x;
        controls.alpha_s = defaultControls.alpha_s;
        controls.alpha_y = defaultControls.alpha_y;
        controls.alpha_z = defaultControls.alpha_z;
        controls.displayMesh = false;
        defaultControls.displayMesh = false;
        n=0; // resetting the nth number of step to 0
        t=0; // reset curve parameter t to 0
        alpha_x = 1; 
        alpha_s = 1; 
        alpha_y = 1;
        alpha_z = 1;

        for (let i in gui.__controllers) {
            gui.__controllers[i].updateDisplay();
        }

        if (boolClear == false){
            boolClear = true; 
        }
    }

    // creates/updaes the harmonographic curve according to parameters when sliders are adjusted
    function updateHarmonographicCurve(){
        if(model){
            scene.add(model);
        }

        // value of the damp controls are assigned to global damping parameters to be later used in damping
        alpha_x = controls.alpha_x; 
        alpha_y = controls.alpha_y; 
        alpha_s = controls.alpha_s; 
        alpha_z = controls.alpha_z; 
       
        // phase offsets are handled by controls, global Amplitudes are adjusted with each step, frequencies remain default values
        curve = new HarmonographicCurve(Ax, As, Ay, Az, wx, ws, wy, wz, controls.px, controls.ps, controls.py, controls.pz);
        if (meshControls.displayCurve){
            scene.remove(tubeMesh);
            tubeGeometry = new THREE.TubeGeometry(curve,300, 0.01, 8, false);
            tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
            scene.add(tubeMesh);
        }

    }
    
    // creates the initial curve
    updateHarmonographicCurve();

    // gui controls
    gui = new GUI();
    gui.add(controls, 'px', -15, 15).onChange(controls.update);
    gui.add(controls, 'ps', -15, 15).onChange(controls.update);
    gui.add(controls, 'py', -15, 15).onChange(controls.update);
    gui.add(controls, 'pz', -15, 15).onChange(controls.update);
    gui.add(controls, 'alpha_x', 0, 1).onChange(controls.update);
    gui.add(controls, 'alpha_s', 0, 1).onChange(controls.update);
    gui.add(controls, 'alpha_y', 0, 1).onChange(controls.update);
    gui.add(controls, 'alpha_z', 0, 1).onChange(controls.update);
    gui.add({ btnReset }, 'btnReset').name('Reset');
    gui.add(controls, 'displayMesh').name('Display Curve').onChange((value) => {
        defaultControls.displayMesh = value; 
    }
    );

    // Initialize the most left and most right points to the first point


    console.log(mostLeftPoint)

    // so that t can be controlled and set back to 0 once it reaches 1
    setInterval(() => {
        t += increment;
        n += increment; 
        if (model) {

            points = curve.getPoints(100);
            mostLeftPoint = points[0];
            let mostRightPoint = points[0];
        
            // Iterate over the points
            for (let i = 1; i < points.length; i++) {
                // Update the most left point if necessary
                if (points[i].x < mostLeftPoint.x) {
                    mostLeftPoint = points[i];
                }
        
                // Update the most right point if necessary
                if (points[i].x > mostRightPoint.x) {
                    mostRightPoint = points[i];
                }
            }

            //Damping Note: Ax_n = (alpha_x^n)*Ax_0 is the direct calculation for Ax_n = Ax_n-1*alpha_x
            curve.Ax = (alpha_x**n)*Ax;
            curve.As = (alpha_s**n)*As;
            curve.Ay = (alpha_y**n)*Ay;
            curve.Az = (alpha_z**n)*Az;

            if (defaultControls.displayMesh){
            scene.remove(tubeMesh);
            tubeGeometry = new THREE.TubeGeometry(curve,300, 0.01, 8, false);
            tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
            scene.add(tubeMesh);
            }else{
                scene.remove(tubeMesh); 
            }
    
            const pt = curve.getPoint(t);
    
            model.position.set(pt.x+0.05, pt.y+0.25, pt.z);
            sleighModel.position.set(pt.x, pt.y, pt.z);

            if (pt.x == mostLeftPoint.x || pt.x == mostRightPoint.x) {
                model.rotateY(Math.PI);
                sleighModel.rotateY(Math.PI);
            }


            
    
        }

        if (t >= 1) {
            t = 0; //t returns to 0 for the curve parameter 
        }

    }, 30); 
    flycontrols = new FlyControls(cameraFront, renderer.domElement);
    flycontrols.movementSpeed = 10;  // Adjust movement speed as needed
    flycontrols.domElement = renderer.domElement;
    flycontrols.rollSpeed = Math.PI / 24;  // Adjust roll speed as needed
    flycontrols.autoForward = false;
    flycontrols.dragToLook = true;

    window.addEventListener('resize', onWindowResize, false);

    render();

}

function updatePhysics( deltaTime ){

    // Step world
    physicsWorld.stepSimulation( deltaTime, 10 );

    // Update rigid bodies
    for ( let i = 0; i < rigidBodies.length; i++ ) {
        let objThree = rigidBodies[ i ];
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if ( ms ) {
            ms.getWorldTransform( tmpTrans );
            let p = tmpTrans.getOrigin();
            let q = tmpTrans.getRotation();
            objThree.position.set( p.x(), p.y(), p.z() );
            //console.log("Updated position is " + p.x() + ", " + p.y() + " " + p.z());
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
            if (i == 1) {
                presentModel.position.set(p.x(), p.y(), p.z() )
                presentModel.quaternion.set( q.x(), q.y(), q.z(), q.w() );
            }
        }
    }
}

function render() {
    requestAnimationFrame(render);
    
    const delta = clock.getDelta(); // Get the time elapsed since the last call to getDelta
    updatePhysics(delta);
    flycontrols.update(delta); // Update the controls based on the elapsed time

    renderer.render(scene, cameraFront);

    if (mixer) {
        mixer.update(delta);
    }


    // Simulate snow falling by updating the positions of the snowflakes
    let positions = snowflakes.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {  // Start at 1 to affect y coordinates
        positions[i] -= 0.1;  // Speed of falling snow
        if (positions[i] < -30) {  // Ground level check
            positions[i] = 200;  // Reset to top of the scene
        }
    }
    snowflakes.geometry.attributes.position.needsUpdate = true;

    // Render the scene
    renderer.render(scene, cameraFront);

    if (boolClear) {
        renderer.clear();
        boolClear = false;
    }

    if (boolClear==true){
        renderer.clear(); 
    }
    boolClear = false; 
}

function onWindowResize() {
    cameraFront.aspect = (window.innerWidth / 2) / window.innerHeight;
    cameraFront.updateProjectionMatrix();
    cameraTop.aspect = (window.innerWidth / 2) / window.innerHeight;
    cameraTop.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
// Add an event listener for the keydown event
window.addEventListener('keydown', function(event) {
    // If the pressed key is the spacebar, play the animation
    if (event.code === 'Space') {
        action.reset();
        action.play();
        const pt_local = curve.getPoint(t);  
        console.log("present model: " + presentModel.position.x + " " + presentModel.position.y-0.5 + " " + presentModel.position.z);
        presentModel.position.set(pt_local.x,pt_local.y,pt_local.z)
        console.log("present model: " + presentModel.position.x + " " + presentModel.position.y + " " + presentModel.position.z);
    }
});

