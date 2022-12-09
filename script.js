import * as THREE from './build/three.module.js';
import { OrbitControls } from './js/OrbitControls.js';
import { FlakesTexture } from './js/FlakesTexture.js';
import { RGBELoader } from './js/RGBELoader.js';
import { Country } from './classes.js';

//Creating Variables
let scene, camera, renderer, controls, pointlight;

//Function that fires at the start of app



async function init() {
    //Create Scene
    scene = new THREE.Scene();

    //Create Renderer (alpha = is background invivible)
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    //Set size of renderer and add to HTML
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    //Config Renderer
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    //Create Camera with FOV, Aspect, and Clippings
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    //Set pos of Camera
    camera.position.set(0, 0, 500);

    //Create Controls for Orbit
    controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    //Gives the Objects a feel of weight, makes dragging smooth
    controls.enableDamping = true;

    //Create Light, setting Position and adding to Scene
    pointlight = new THREE.PointLight(0xffffff, 1);
    pointlight.position.set(200, 200, 200);
    scene.add(pointlight);

    let countries = [];

    

    //Get Json Country Data and fills the countries array with CountryObjects
    async function loadCountries() {
        //Fetching json data
        const response = await fetch("./textures/custom.geo.json");
        const data = await response.json();

        //Get Number of Countries in Json
        let countryLen = data.features.length;
        //For each Country
        for (let i = 0; i < countryLen; i++) {
            //Save name, code and geometry
            let name = data.features[i].properties.name;
            let code = data.features[i].properties.postal;
            let geometry = data.features[i].geometry;
            //Create Country Object
            let country = new Country(name, code, geometry);
            //Push Object to Array
            countries.push(country);
        }

        console.log(countries);

        return data;
    }

    //Paint all Countries
    function paintCountries(json) {
        //The amount of countries in the JSON
        let countryLen = json.features.length;
        let countries = json.features;
        //loop through each Country
        for (let i = 0; i < countryLen; i++) {

            //Storing variables
            let isMulti = countries[i].geometry.type === 'MultiPolygon';
            let coords = countries[i].geometry.coordinates
            let polygonCount = coords.length;

            //loop through polygons
            for (let p = 0; p < polygonCount; p++) {
                //Check if Country is MultiPolygon
                if (isMulti) {
                    for (let u = 0; u < coords[p].length; u++) {
                        drawPolygonByArray(coords[p][u]);
                    }
                } else {
                    for (let u = 0; u < coords.length; u++) {
                        drawPolygonByArray(coords[u]);
                    }
                }
            }


        };

        //Draw The Countries Polygons
        function drawPolygonByArray(arr) {

            ctx.beginPath();
            let xy = getPXfromLatLng(arr[0][0], arr[0][1]);
            ctx.moveTo(xy.x, xy.y);
            for (let i = 0; i < arr.length; i++) {
                let xy = getPXfromLatLng(arr[i][0], arr[i][1]);
                ctx.lineTo(xy.x, xy.y)
            }
            ctx.closePath();
            ctx.fillStyle = 'silver';
            ctx.fill();
            ctx.stroke();
        }

        function getPXfromLatLng(lat, lon) {
            let posX = ((lat + 180.0) * (canvasW / 360.0));
            let posY = (((lon * -1.0) + 90.0) * (canvasH / 180.0));
            return { x: posX, y: posY };
        }


    }

    const canvas = document.createElement('canvas');
    let canvasW = 10800;
    let canvasH = 5400;

    canvas.width = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvasW, canvasH);

    let json = await loadCountries();
    paintCountries(json);

    let tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;


    //Configurations for the Material
    const sphereMaterial = {
        map: tex
    };

    //Creating Sphere Object
    let sphereGeo = new THREE.SphereGeometry(80, 64, 64);
    let sphereMat = new THREE.MeshBasicMaterial(sphereMaterial);
    let sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    function createUI() {
        
    }


    //Call animation Function
    animate();

}

//Animate the Objects
function animate() {
    //Update the Controls that roate the object
    controls.update();
    //Update renderer
    renderer.render(scene, camera);
    //Call function again
    requestAnimationFrame(animate);
}

//Start Init Function
init();