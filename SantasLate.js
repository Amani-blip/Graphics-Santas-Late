/*
 * CSI4130 Assignment 4
 * Amani Farid 300173889
 * "Santa Sleigh" (https://skfb.ly/6XrxO) by PatelDev is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 * "Jolly Santa" (https://skfb.ly/oONTG) by Tomato Owl is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 */


import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from "dat.gui";
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { vec3 } from 'three/examples/jsm/nodes/shadernode/ShaderNode';

let clock = new THREE.Clock();



let scene, renderer, cameraFront, cameraTop, curve, gui;
let t = 0;
let n = 0; 
let increment = 0.001;

let model, sleighModel, presentModel; 

let boolClear = false; 

let snowflakeCount, snowflakeGeometry, snowflakeVertices, snowflakeMaterial, snowflakes;

let points; 
let mostLeftPoint; 
let mostRightPoint; 

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

let wx = 1;   // Frequency for x
let ws = 1.5; // Frequency for s
let wy = 2;   // Frequency for y
let wz = 3;   // Frequency for z


let mixer, action; // for animations

function init() {
    // Scene
    scene = new THREE.Scene();
   
    // Front View Camera
    cameraFront = new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraFront.position.set(0, 0, 100); // Adjust to see the ground
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
            presentModel.position.set(5,5,5);
            presentModel.scale.set(0.25, 0.25, 0.25);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error('An error happened', error);
        }
    );


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
    house.add(body);  // Add the body to the house group

    // Roof
    const roofGroup = new THREE.Group();
    const roofGeometry = new THREE.ConeGeometry(3, 2.7, 4);
    const roofMaterial = new THREE.MeshBasicMaterial({ color: '#2b1d0e' });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 3, 0); 
    roof.rotation.y = Math.PI / 4; // Align the roof's corners with the house body
    roofGroup.add(roof);

    
    // // Roof TODO: Not showing
    // const chimneyGeometry = new THREE.BoxGeometry(1, 2, 1);
    // const chimneyMaterial = new THREE.MeshBasicMaterial({ color: '#120d0a' });
    // const chimney = new THREE.Mesh(chimneyGeometry, brickMaterial);
    // chimney.position.set(5, 5, 5); 
    // //chimney.rotation.y = Math.PI / 4; // Align the roof's corners with the house body
    // roofGroup.add(chimney);
    // house.add(roofGroup); 

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
    
    // Position the boxes to form the chimney
    wallFront.position.set(0, 0, 0 + depth / 2 + thickness / 2);
    wallBack.position.set(0, 0, 0 - depth / 2 - thickness / 2);
    wallLeft.position.set(0 - width / 2 - thickness / 2, 0, 0);
    wallRight.position.set(0 + width / 2 + thickness / 2, 0, 0);
    
    // Group the walls together
    const chimneyGroup = new THREE.Group();
    chimneyGroup.add(wallFront, wallBack, wallLeft, wallRight);
    chimneyGroup.position.set(1,3,0)

    // Add the chimney to the 
    roofGroup.add(chimneyGroup);
    house.add(roofGroup); 
   

        // Window and door sizing
    const windowWidth = 0.3;
    const windowHeight = 0.3;
    const windowDepth = 0.1;

    const doorWidth = 1; // Example width for the door
    const doorHeight = 1.4; // Example height for the door
    const doorDepth = 0.1;

    // Housing material 
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 'black',
        emissive: 0xffff00,
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
    scene.add(house);
    house.position.set(0,0,0);



    const groundGeometry = new THREE.PlaneGeometry(500, 500, 64, 32);

// Access the position attribute of the geometry
    const positions = groundGeometry.attributes.position;

    //TO MAKE THE GROUND BUMPY, UNCOMMENT
    // // randomize the z component of each vertex to create textured snow
    for (let i = 0; i < positions.count; i++) {
    //     // Randomly adjust the z position of each vertex
         positions.setZ(i, Math.random() * 1); // height variation
    }

    // // Notify Three.js that the position data has changed
    positions.needsUpdate = true;

    // // Recompute normals for the lighting calculations
    groundGeometry.computeVertexNormals();

     const groundMaterial = new THREE.MeshLambertMaterial({ color: 'white' });
     const ground = new THREE.Mesh(groundGeometry, groundMaterial);
     ground.position.y = -10;
     ground.rotation.x = -Math.PI / 2; // Rotate the ground to be horizontal
    scene.add(ground);

    // Create a raycaster
    const raycaster = new THREE.Raycaster();

    // The starting point of the ray should be above the highest point of the ground
    // You might need to adjust this based on your scene's scale
    const rayStartHeight = 100; 

    // Set the raycaster starting point directly above the house's position
    const rayOrigin = new THREE.Vector3(house.position.x, rayStartHeight, house.position.z);
    raycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0)); // pointing downwards

    // Calculate intersects
    const intersects = raycaster.intersectObject(ground);

    
    if (intersects.length > 0) {
        // Assuming the house's pivot is at its base, set the house on the ground
        // You might need to add half the house's height if the pivot is in the middle
        house.position.y = intersects[0].point.y + (houseBodyHeight / 2) + roofHeight;
    } else {
        console.warn('No intersection found - make sure the house is above the ground mesh');
    }


    const helper = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 100, 0xff0000);
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

function render() {
    requestAnimationFrame(render);

    const delta = clock.getDelta(); // Get the time elapsed since the last call to getDelta
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
    }
});

init();
