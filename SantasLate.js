/*
 * CSI4130 Assignment 4
 * Amani Farid 300173889
 * "Santa Sleigh" (https://skfb.ly/6XrxO) by PatelDev is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
 */


import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from "dat.gui";


let scene, renderer, cameraFront, cameraTop, curve, gui;
let t = 0;
let n = 0; 
let increment = 0.001;

let model, sleighModel; 

let boolClear = false; 

let snowflakeCount, snowflakeGeometry, snowflakeVertices, snowflakeMaterial, snowflakes;

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
    alpha_x: 1, 
    alpha_s:1, 
    alpha_y: 1,
    alpha_z: 1,
    displayMesh:false
    
}

// initial amplitudes a
let Ax = 20, As = 2, Ay = 0, Az = 10;
let wx = 3.1, ws = 3.3, wy = 1.7, wz = 2.6;
let alpha_x, alpha_s, alpha_y, alpha_z;

function init() {
    // Scene
    scene = new THREE.Scene();
   
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
            scene.add(model);

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


    // Snowy ground
    const groundGeometry = new THREE.PlaneGeometry(1000, 500);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 'white' });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -30
    ground.rotation.x = -Math.PI / 2; // Rotate the ground to be horizontal
    scene.add(ground);

    // Falling snow

   
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
            var x  = this.Ax * Math.sin(this.wx*t*2*Math.PI + this.px) + this.As * Math.sin(this.ws * t * 2*Math.PI +this.ps);
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

    // so that t can be controlled and set back to 0 once it reaches 1
    setInterval(() => {
        t += increment;
        n += increment; 
        if (model) {

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
    
            model.position.set(pt.x, pt.y, pt.z);
            sleighModel.position.set(pt.x, pt.y, pt.z);
    
        }
        if (t >= 1) {
            t = 0; //t returns to 0 for the curve parameter 
        }

    }, 30); 

    window.addEventListener('resize', onWindowResize, false);

    render();

}

function render() {
    requestAnimationFrame(render);

    
    renderer.render(scene, cameraFront);

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
init();
