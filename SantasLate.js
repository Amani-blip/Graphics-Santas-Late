/*
 * CSI4130 Assignment 4
 * Amani Farid 300173889
 * Jordan Takefman
 * Model Credits: 
 * "Santa Sleigh" (https://skfb.ly/6XrxO) by PatelDev is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 * "Jolly Santa" (https://skfb.ly/oONTG) by Tomato Owl is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 * "Elk (WIP)" (https://skfb.ly/opVXK) by UlissesVinicios is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 * "Present" (https://skfb.ly/IJCX) by holtkamp is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 * "Candy cane" (https://skfb.ly/6UvJY) by CzernO is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 */

// importing libraries
import './ammo.js'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from "dat.gui";
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { vec3 } from 'three/examples/jsm/nodes/shadernode/ShaderNode';
import HarmonographicCurve from './HarmonographicCurve.js';


let clock = new THREE.Clock();
let scene, renderer, camera, curve, gui;

// declaring all santa related models
const modelGroup = new THREE.Group(); 
let santaModel, sleighModel, presentModel, raindeerModel, candyModel1, candyModel2; 
const santaGroup = new THREE.Group();
let snowflakes;

// ammo physics objects declarations
let colGroupPresent = 1, colGroupCone=2, colGroupGround = 3;
let physicsWorld, rigidBodies = [];
let ispresent = [];
let conePositions = [];
let collisionCounter = 0; 
let collisionDistance = 3;
let globalTrans;

// curve properties, geometries and meshes
let points; 
let mostLeftPoint; 
let mostRightPoint; 
let boolClear = false; 
let t = 0;
let increment = 0.001;
    // initial amplitudes a
let Ax = 20, Ay = 9, Az = 10;
//let wx = 3.1, ws = 3.3, wy = 0, wz = 2.6;
let alpha_x, alpha_s, alpha_y, alpha_z;
let wx = 1;   // Frequency for x
let wy = 2;   // Frequency for y
let wz = 3;   // Frequency for z

// default values for the gui controls 
var defaultControls = {
    px: 0.6, 
    py: 0.3,
    pz: 0.9,
    alpha_x: 1 , 
    alpha_y: 1,
    alpha_z: 1,
    displayMesh:false,
    speed: 30
}

// to display or not display the curve from the gui
var meshControls = {
    myCheckbox: false // This will be represented as a checkbox
};

//curve geometries and meshes
let tubeGeometry = new THREE.TubeGeometry(curve,300, 0.08, 8, false);
let tubeMaterial = new THREE.MeshBasicMaterial({ color: 'white'});
let tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

// ground properties 
let groundY = -10; 
let max_x = 300, max_y=300, max_z = 300; 
let min_x = -300, min_z = -300;
let min_y = groundY; 

let flycontrols;

let santaMixer, raindeerMixer, action; // mixer for animations

let speed = 30; //default speed for santa 

let presentPositions = []; // keep track of the dropped presents


function initGlobalPhysics(){

    let collisionConf  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConf),
        broadphase    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConf);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}

Ammo().then( start )
            
function start(){
            globalTrans = new Ammo.btTransform();
            initGlobalPhysics();
            init();
}


function init() {
    // Scene
    scene = new THREE.Scene();
   
    // Front View Camera
    camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 200); // Adjust to see the ground
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.background = new THREE.Color('#000133');

    // setting up the lighting
    const ambientLight = new THREE.AmbientLight('white', 0.5);
    scene.add(ambientLight);

    // adding fly controls
    flycontrols = new FlyControls(camera, renderer.domElement);
    flycontrols.movementSpeed = 40; 
    flycontrols.domElement = renderer.domElement;
    flycontrols.rollSpeed = Math.PI / 24;  
    flycontrols.autoForward = false;
    flycontrols.dragToLook = true;

    // creating the snowy and rageddy ground
    const groundGeometry = new THREE.PlaneGeometry(500, 500, 250, 60);
    const positions = groundGeometry.attributes.position;

    //randomize the height each vertex to create textured snow
    for (let i = 0; i < positions.count; i++) {
    // Randomly adjust the z position of each vertex
         positions.setZ(i, Math.random() * 2);
    }
    // re-calculate normals for the lighting calculations

    groundGeometry.computeVertexNormals();

     const groundMaterial = new THREE.MeshLambertMaterial({ color: 'white' });
     const ground = new THREE.Mesh(groundGeometry, groundMaterial);
     ground.position.y = groundY;
     ground.rotation.x = -Math.PI / 2; // Rotate the ground to be horizontal
    scene.add(ground);
    spawnPlane();

    let moonGeometry = new THREE.SphereGeometry(2, 62, 62);
    let moonMaterial = new THREE.MeshBasicMaterial({color: '#F7D560'});
    let moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(0, 20, 0); // Adjust position as needed
    scene.add(moon);

    let moonLight = new THREE.PointLight('#E49B0F' , 1000, 100);
    moonLight.position.set(0, 10, 0); // Position should match moon's position
    scene.add(moonLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    // create random positioning of the snowflakes and store them in the buffer
    let numSnowflake = 5000;
    let snowflakeGeometry = new THREE.BufferGeometry();
    let snowflakeVertices = [];
    for (let i = 0; i < numSnowflake; i++) {
        const x = Math.random() * (max_x - min_x) + min_x;
        const y = Math.random() * (max_y - min_y) + min_y;
        const z = Math.random()  * (max_z - min_z) + min_z;
        snowflakeVertices.push(x, y, z);
    }
    // 3 -> x, y, z values for the randomized snowflake position
    snowflakeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(snowflakeVertices, 3));

    // using points to represent each flake
    let snowflakeMaterial = new THREE.PointsMaterial({ color: 'white', size: 1 });
    snowflakes = new THREE.Points(snowflakeGeometry, snowflakeMaterial);

    scene.add(snowflakes);
    
    //load the gltf models
    loadModels();

    scene.add(modelGroup);

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
        this.speed = defaultControls.speed; 
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

        // value of the damp controls are assigned to global damping parameters to be later used in damping
        alpha_x = controls.alpha_x; 
        alpha_y = controls.alpha_y; 
        alpha_s = controls.alpha_s; 
        alpha_z = controls.alpha_z; 
       
        // phase offsets are handled by controls, global Amplitudes are adjusted with each step, frequencies remain default values
        curve = new HarmonographicCurve(Ax, Ay, Az, wx, wy, wz, controls.px, controls.py, controls.pz);
        if (meshControls.displayCurve){
            scene.remove(tubeMesh);
            tubeGeometry = new THREE.TubeGeometry(curve,300, 0.01, 8, false);
            tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
            scene.add(tubeMesh);
        }

        speed = controls.speed; 

    }
    
    // creates the initial curve
    updateHarmonographicCurve();

    let numHouses = 15; 
    let gap = 1/numHouses //distance between houses

    for (let i = 0; i < numHouses; i++) {
        let tp = i*gap; 
        let point = curve.getPointAt(tp);
        
        // position house at the x and z of the curve
        let house = createHouse();
        
        house.position.set(point.x+1, -8, point.z);
        let cone = createCone(point.x+1, -8, point.z);
        conePositions.push({x: point.x+1, y: -8, z: point.z});

        // Add the house to the scene
        scene.add(house);

        //scene.add(cone);
        
    }

    // create the rest of the bordering houses 
    gap = 5; 

    for (let i = 0; i < 10; i++) { //houses at the front and the back
        let fronthouse = createHouse();
        let backhouse = createHouse(); 
        
        fronthouse.position.set(i * gap-23, -8, 20);
        fronthouse.rotateY(Math.PI);

        backhouse.position.set(i * gap-23, -8, -30);

        scene.add(fronthouse);
        scene.add(backhouse);
    }
    
    for (let i = 0; i < 10; i++) { //houses on the left and the right
        let lefthouse = createHouse();
        let righthouse = createHouse(); 
        
        lefthouse.position.set(gap-33, -8, i * gap-25);
        lefthouse.rotateY(Math.PI/2);

        righthouse.position.set(gap+22, -8, i * gap-25);
        righthouse.rotateY(-Math.PI/2);

        scene.add(lefthouse);
        scene.add(righthouse);
    }

    // gui controls
    gui = new GUI();
    gui.add(controls, 'px', -15, 15).onChange(controls.update);
    gui.add(controls, 'py', -15, 15).onChange(controls.update);
    gui.add(controls, 'pz', -15, 15).onChange(controls.update);
    gui.add(controls, 'alpha_x', 0, 1).onChange(controls.update);
    gui.add(controls, 'alpha_y', 0, 1).onChange(controls.update);
    gui.add(controls, 'alpha_z', 0, 1).onChange(controls.update);
    
    gui.add({ btnReset }, 'btnReset').name('Reset Damping');
    gui.add(controls, 'displayMesh').name('Display Curve').onChange((value) => {
        defaultControls.displayMesh = value; 
    }
    );
   

    // so that t curve parameter can be controlled and set back to 0 once it reaches 1
    setInterval(() => {
        t += increment;
        if (santaModel && sleighModel) {

            points = curve.getPoints(1000);
            mostLeftPoint = points[0];
            mostRightPoint = points[0];
        
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

            let collisionDetected = false; 


            //Damping Note: Ax_n = (alpha_x^n)*Ax_0 is the direct calculation for Ax_n = Ax_n-1*alpha_x
            curve.Ax = (alpha_x**t)*Ax;
            curve.Ay = (alpha_y**t)*Ay;
            curve.Az = (alpha_z**t)*Az;

            if (defaultControls.displayMesh){
            scene.remove(tubeMesh);
            tubeGeometry = new THREE.TubeGeometry(curve,300, 0.01, 8, false);
            tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
            scene.add(tubeMesh);
            }else{
                scene.remove(tubeMesh); 
            }
    
            const pt = curve.getPoint(t);

            modelGroup.position.set(pt.x, pt.y, pt.z);

            if (modelGroup.position.x == mostLeftPoint.x || modelGroup.position.x == mostRightPoint.x) {
                modelGroup.rotateY(Math.PI);
            }
        }
        if (t >= 1) {
            t = 0; //t returns to 0 for the curve parameter 
        }
    }, 10); 

    setInterval(function() {

        if (presentModel){

            

            // Iterate over the cone positions
            for (let i = 0; i < conePositions.length; i++) {
                // Calculate the distance from the present to the cone
                let distance = presentModel.position.distanceTo(new THREE.Vector3(conePositions[i].x, conePositions[i].y, conePositions[i].z));

                // if the distance is less than the collision distance, increment the counter
                if (distance < collisionDistance) {

                    // check the positions of the already dropped presents and verify if it exists
                    let alreadyDropped = presentPositions.some(pos => 
                        pos.x === presentModel.position.x && 
                        pos.y === presentModel.position.y && 
                        pos.z === presentModel.position.z
                    );

                    if(!alreadyDropped){
                        // push the dropped present to keep track, and increment the collision counter
                        presentPositions.push({x: presentModel.position.x, y: presentModel.position.y, z: presentModel.position.z});
                        collisionCounter++;
                        document.getElementById('collisionCount').innerHTML = "Presents Delivered: " + collisionCounter;

                    }
                
                    
                }
            } 
        }
    }, 1500);
    

    window.addEventListener('resize', onWindowResize, false);

    animate();

}

function createHouse(){ 
    // Creating a group for the house
    const house = new THREE.Group();
    
    // Loading and mapping the texture to the body of the house
    const textureLoader = new THREE.TextureLoader();
    const brickTexture = textureLoader.load('assets/textures/brick_texture.jpg'); 
    const brickMaterial = new THREE.MeshLambertMaterial({ map: brickTexture });

    // House body
    const bodyGeometry = new THREE.BoxGeometry(3,4, 3);
    //const bodyMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
    const body = new THREE.Mesh(bodyGeometry, brickMaterial);
    house.add(body);  // Add the body to the house group

    // Roof
    const roofGroup = new THREE.Group();
    const roofGeometry = new THREE.ConeGeometry(3, 2.7, 4);
    const roofMaterial = new THREE.MeshBasicMaterial({ color: '#2b1d0e' });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 3, 0); 
    roof.rotation.y = Math.PI / 4; 
    roofGroup.add(roof);

    // Dimensions for the chimney planes
    const width = 1;
    const height = 2;
    const depth = 1;
    const thickness = 0.1;

    // Defining the four boxes for the chimney walls
    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), brickMaterial);
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(width, height, thickness), brickMaterial);
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depth), brickMaterial);
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depth), brickMaterial);
    
    const chimneyGroup = new THREE.Group();

    // Position the walls to form the chimney
    wallFront.position.set(0, 0, 0 + depth / 2 + thickness / 2);
    wallBack.position.set(0, 0, 0 - depth / 2 - thickness / 2);
    wallLeft.position.set(0 - width / 2 - thickness / 2, 0, 0);
    wallRight.position.set(0 + width / 2 + thickness / 2, 0, 0);
    
    // Group the walls together
    chimneyGroup.add(wallFront, wallBack, wallLeft, wallRight);
    chimneyGroup.position.set(1,3,0)

    // Add the chimney to the roof and the roof to the house
    roofGroup.add(chimneyGroup);
    house.add(roofGroup); 

    let planeGeometry = new THREE.PlaneGeometry(1, 1);
    let planeMaterial = new THREE.MeshBasicMaterial({color: 'black'});
    let plane1 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane1.position.set(0.7, 0.8, 1.55);
    
    let plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.position.set(-0.8, 0.8, 1.55);

    // Add the boxes to the house
    house.add(plane1);
    house.add(plane2);

    // Window and door sizing
    const windowWidth = 0.3;
    const windowHeight = 0.3;
    const windowDepth = 0.3;
    const doorWidth = 1; 
    const doorHeight = 1.4; 
    const doorDepth = 0.1;

    // Housing material 
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 'black',
        emissive: '#E49B0F',
        emissiveIntensity: 1
    });
    const doorMaterial = new THREE.MeshStandardMaterial({ color: '#3f2a14' });

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
    createWindow(-1, 1, 1.5);
    createWindow(-0.5, 1, 1.5);
    createWindow(1, 1, 1.5);
    createWindow(0.5, 1, 1.5);
    createWindow(-1, 0.5, 1.5);
    createWindow(-0.5, 0.5, 1.5);
    createWindow(1, 0.5, 1.5);
    createWindow(0.5, 0.5, 1.5);

    // add the door
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, -1.25, 1.5);
    house.add(door);

    // scale the entire house group down, smaller size is more aesthetic
    house.scale.set(0.5, 0.5, 0.5);

    return house; 

}

// helper function to load all the models into a group (which we then reposition / rotate using the curve)
function loadModels(){
    const loader = new GLTFLoader();

    // Loading the santa model 
    loader.load(
        'assets/jolly_santa/scene.gltf', 
        function (gltf) {
            santaModel = gltf.scene; 
            let animations = gltf.animations;
            santaMixer = new THREE.AnimationMixer(santaModel);

            action = santaMixer.clipAction(animations[3]);
            // Set the animation to play once and stop
            action.setLoop(THREE.LoopOnce); 
            action.clampWhenFinished = true;  

            santaModel.scale.set(25, 25, 25);
            santaModel.position.x += +0.05; 
            santaModel.position.y += +0.25;
            modelGroup.add(santaModel); 

        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened trying to load the santa model', error);
        }
    );

    // Loading the sleigh model 
    loader.load(
        'assets/sleigh/scene.gltf', 
        function (gltf) {
            sleighModel = gltf.scene; 
            sleighModel.scale.set(0.005, 0.005, 0.005);
            modelGroup.add(sleighModel); 
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened trying to load the sleigh', error);
        }
    );
    // Load gift model 
    loader.load(
        'assets/present/scene.gltf', 
        function (gltf) {
            presentModel = gltf.scene; 
            scene.add(presentModel);
            spawnBox();
            presentModel.scale.set(0.25, 0.25, 0.25);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened trying to load the present model', error);
        }
    );

    // Load raindeer model 
    loader.load(
        'assets/raindeer/scene.gltf', 
        function (gltf) {
            raindeerModel = gltf.scene; 
  
            raindeerModel.rotateY(Math.PI/2);
            raindeerModel.scale.set(0.5, 0.5, 0.5);

            raindeerModel.position.x = 2; 
            modelGroup.add(raindeerModel);

            raindeerMixer = new THREE.AnimationMixer(raindeerModel);
            for (let i = 0; i < gltf.animations.length; i++) {
                let animation = gltf.animations[i];
    
                // Create an AnimationAction and play it
                let action = raindeerMixer.clipAction(animation);
                action.play();
            }
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened trying to load the raindeer model', error);
        }
    );
    // Loading the candy cane models
    loader.load(
        'assets/candy_cane/scene.gltf', 
        function (gltf) {
            candyModel1 = gltf.scene.clone(); 
            candyModel1.position.set(-10, -10, 70);
            candyModel1.rotateY(Math.PI/2);
            candyModel1.rotateX(-Math.PI/6);
            candyModel1.scale.set(5, 5, 5);
            scene.add(candyModel1);
    
            candyModel2 = gltf.scene.clone();
            candyModel2.position.set(10, -10, 70);
            candyModel2.rotateY(-Math.PI/2);
            candyModel2.rotateX(-Math.PI/6);
            candyModel2.scale.set(5, 5, 5);
            scene.add(candyModel2);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened trying to load the candy canes', error);
        }
    );
}

function updatePhysics( deltaTime ){

    // Step world
    physicsWorld.stepSimulation( deltaTime, 10 );

    // Update rigid bodies
    for ( let i = 0; i < rigidBodies.length; i++ ) {
        //Get current rigid body and associated data
        let objThree = rigidBodies[ i ];
        let objAmmo = objThree.userData.physicsBody;
        let ms = objAmmo.getMotionState();
        if ( ms ) {
            ms.getWorldTransform( globalTrans );
            let p = globalTrans.getOrigin(); 
            let q = globalTrans.getRotation();
            //Set new position data
            objThree.position.set( p.x(), p.y(), p.z() );
            objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );

            //Since the present is always the first element of the list
            if (i == 0) {
                presentModel.position.set(p.x(), p.y(), p.z());
                presentModel.quaternion.set(q.x(), q.y(), q.z(), q.w());
            }

        }
    }
}

//Create the collision box for a house at a given coordinate.
function createCone(x,y,z) {
 
    let coneGeometry = new THREE.ConeGeometry(3, 2.7, 4);

    //Rotate and scale to the same size as the roof
    let coneMaterial = new THREE.MeshBasicMaterial({ color: '#FF0000' });
    let cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.rotation.y = Math.PI / 4; 
    cone.scale.set(0.5,0.5,0.5);
    cone.position.set(x,y+1.5,z);
    //Create a transform describing the initial motion state of the object
    //In this case, imobile for the roof.
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3(x,y+1.5,z) );
    transform.setRotation( new Ammo.btQuaternion(0,0,0,0.92) );
    
    //Set the intial motion state
    let motionState = new Ammo.btDefaultMotionState( transform );

    //Define the collision shape
    let cone_boundary = new Ammo.btConeShape( 3/2, 2.7/2);
    cone_boundary.setMargin(0.05);
    const mass = 0;

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    cone_boundary.calculateLocalInertia( mass, localInertia );

    //Construct the new rigid body from all of the above
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, cone_boundary, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );

    physicsWorld.addRigidBody( body, colGroupCone, colGroupPresent );
    return cone;
}

function spawnPlane() {
    let scale = {x: 500, y: 0.01 , z: 500};
    let mass = 0;

    //Add the plane to the scene
    let blockMesh = new THREE.Mesh(new THREE.BoxGeometry(scale.x, scale.y, scale.z), new THREE.MeshPhongMaterial({color: 0xa0afa4}));
    scene.add(blockMesh)

    //Define the transform
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3(0, -10, 0));
    transform.setRotation( new Ammo.btQuaternion( 0,0,0,1) );
    let motionState = new Ammo.btDefaultMotionState( transform );
    
    //Define collision shape
    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    colShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    //Construct rigid body from the scene and add to world as well as rigidBodies array
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let physics_body = new Ammo.btRigidBody( rbInfo );
    blockMesh.userData.physicsBody = physics_body;
    rigidBodies.push(blockMesh)
    physicsWorld.addRigidBody( physics_body, colGroupGround, colGroupPresent);
}

function spawnBox() {
    let scale = {x: 1, y: 1, z: 1};
    let mass = 1;

    //remove previous box
    rigidBodies.shift();

    let blockPlane = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshPhongMaterial({color: 0xa0afa4}));
    
    //Shift model to santa location
    const pt_local = curve.getPoint(t);
    presentModel.position.set(pt_local.x, pt_local.y, pt_local.z)

    //Define the transform
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3(pt_local.x,pt_local.y,pt_local.z) );
    transform.setRotation( new Ammo.btQuaternion( 0,0,0,1) );
    let motionState = new Ammo.btDefaultMotionState( transform );

    //Defin the colision shape
    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    colShape.setMargin( 0.05 );

    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );

    //Construct rigid body and add to front of rigidBodies list
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let physics_body = new Ammo.btRigidBody( rbInfo );
    blockPlane.userData.physicsBody = physics_body;
    rigidBodies.unshift(blockPlane)
    physicsWorld.addRigidBody( physics_body, colGroupPresent, colGroupCone | colGroupGround);

}


function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Get the time elapsed since the last call to getDelta
    updatePhysics(delta);
    flycontrols.update(delta); // Update the controls based on the elapsed time

    renderer.render(scene, camera);

    if (santaMixer && raindeerMixer) {
        santaMixer.update(delta);
        raindeerMixer.update(delta);
    }

    //snow falling - update the y ever x, y, z, first y being at index 1 and incremented accordingly
    let positions = snowflakes.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {  // Start at 1 to affect y coordinates
        positions[i] -= 0.1;  // Speed of falling snow
        if (positions[i] < groundY) {  // Ground level check
            positions[i] = max_y;  // Reset to top of the scene
        }
    }
    snowflakes.geometry.attributes.position.needsUpdate = true;

    // Render the scene
    renderer.render(scene, camera);

    if (boolClear) {
        renderer.clear();
        boolClear = false;
    }

    if (boolClear==true){
        renderer.clear(); 
    }
    boolClear = false; 
}

// Window resize event listener
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Space button click event listener
window.addEventListener('keydown', function(event) {
    
    if (event.code === 'Space') {
        action.reset();
        action.play(); // play the animation
        const pt_local = curve.getPoint(t);  
        presentModel.position.set(pt_local.x,pt_local.y,pt_local.z);
        spawnBox();
    }
});
