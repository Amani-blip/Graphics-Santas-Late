/*
 * CSI4130 Assignment 4
 * Amani Farid 300173889
 * Model Credits: 
 * "Santa Sleigh" (https://skfb.ly/6XrxO) by PatelDev is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 * "Jolly Santa" (https://skfb.ly/oONTG) by Tomato Owl is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 * "Elk (WIP)" (https://skfb.ly/opVXK) by UlissesVinicios is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 */

import './ammo.js'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from "dat.gui";
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { vec3 } from 'three/examples/jsm/nodes/shadernode/ShaderNode';
import HarmonographicCurve from './HarmonographicCurve.js';

let clock = new THREE.Clock();

let scene, renderer, camera, curve, gui;

// models 

const modelGroup = new THREE.Group(); 
let santaModel, sleighModel, presentModel, raindeerModel; 
const santaGroup = new THREE.Group();

let boolClear = false; 

let snowflakes;

// curve properties, geometries and meshes
let points; 
let mostLeftPoint; 
let mostRightPoint; 
let t = 0;
let increment = 0.001;
let tubeGeometry = new THREE.TubeGeometry(curve,300, 0.08, 8, false);
let tubeMaterial = new THREE.MeshBasicMaterial({ color: 'white'});
let tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

//ground y position
let groundY = -10; 
let max_x = 300, max_y=300, max_z = 300; 
let min_x = -300, min_z = -300;
let min_y = groundY; 

// to display or not display the curve from the gui
var meshControls = {
    myCheckbox: false // This will be represented as a checkbox
};

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

let flycontrols;

// initial amplitudes a
let Ax = 20, As = 2, Ay = 9, Az = 10;
//let wx = 3.1, ws = 3.3, wy = 0, wz = 2.6;
let alpha_x, alpha_s, alpha_y, alpha_z;

let wx = 1;   // Frequency for x
let ws = 1.5; // Frequency for s
let wy = 2;   // Frequency for y
let wz = 3;   // Frequency for z


let santaMixer, raindeerMixer, action; // for animations

let speed = 30; //default speed for santa 

Ammo().then( start )
            
            function start(){
                setupPhysicsWorld();
    }

function setupPhysicsWorld(){

    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache    = new Ammo.btDbvtBroadphase(),
        solver                  = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

}

function init() {
    // Scene
    scene = new THREE.Scene();
   
    // Front View Camera
    camera = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 200); // Adjust to see the ground
    camera.lookAt(0, 0, 0);
    const axesHelper = new THREE.AxesHelper( 5 );
    scene.add( axesHelper );

   renderer = new THREE.WebGLRenderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.background = new THREE.Color('#000133');

    // setting up the lighting
    const ambientLight = new THREE.AmbientLight('white', 0.5);
    scene.add(ambientLight);

    // adding fly controls
    flycontrols = new FlyControls(camera, renderer.domElement);
    flycontrols.movementSpeed = 10; 
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

    let moonGeometry = new THREE.SphereGeometry(2, 62, 62);
    let moonMaterial = new THREE.MeshBasicMaterial({color: '#F7D560'});
    let moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(0, 15, 0); // Adjust position as needed
    scene.add(moon);

    let moonLight = new THREE.PointLight('#E49B0F' , 1000, 100);
    moonLight.position.set(0, 10, 0); // Position should match moon's position
    scene.add(moonLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

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

    let snowflakeMaterial = new THREE.PointsMaterial({ color: 'white', size: 0.5 });
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

    let housePositions = [];

    let numHouses = 15; 
    let gap = 1/numHouses

    for (let i = 0; i < numHouses; i++) {
        let tp = i*gap; 
        let point = curve.getPointAt(tp);
        
        // position house at the x and z of the curve
        let house = createHouse();
        house.position.set(point.x+1, -8, point.z);
        // Add the house to the scene
        scene.add(house);
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

    window.addEventListener('resize', onWindowResize, false);

    animate();

}

function createHouse(){ 
    // Creating a group for the house
    const house = new THREE.Group();
    
    // Load the texture
    const textureLoader = new THREE.TextureLoader();
    const brickTexture = textureLoader.load('assets/textures/brick_texture.jpg'); 

    // Create material with texture
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
    const thickness = 0.1;  // Define the thickness of the walls

    // Create four boxes for the chimney walls
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

    // Add the chimney to the 
    roofGroup.add(chimneyGroup);
    house.add(roofGroup); 

    let planeGeometry = new THREE.PlaneGeometry(1, 1);
    let planeMaterial = new THREE.MeshBasicMaterial({color: 'black'});
    let plane1 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane1.position.set(0.7, 0.8, 1.55);
    
    let plane2 = new THREE.Mesh(planeGeometry, planeMaterial);
    plane2.position.set(-0.8, 0.8, 1.55);

    // Position the boxes
    //box1.position.set(0.7, 0.8, 4);
    //box2.position.set(window2.position.x, window2.position.y, window2.position.z - 1);

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

    // Create and add the door
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, -1.25, 1.5);
    house.add(door);

    // Now scale the entire house group
    house.scale.set(0.5, 0.5, 0.5);

    return house; 

}

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
            presentModel.position.set(5,5,5);
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
    
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // Get the time elapsed since the last call to getDelta
    flycontrols.update(delta); // Update the controls based on the elapsed time

    renderer.render(scene, camera);

    if (santaMixer && raindeerMixer) {
        santaMixer.update(delta);
        raindeerMixer.update(delta);
    }

    // Simulate snow falling by updating the positions of the snowflakes
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

init();
