import * as THREE from './build/three.module.js';
import { OrbitControls } from './js/OrbitControls.js';
import { FlakesTexture } from './js/FlakesTexture.js';
import { RGBELoader } from './js/RGBELoader.js';
import { Country } from './classes.js';

//Creating Variables
let scene, camera, renderer, controls, pointlight;

//Array of all CountryObjects
let countries = [];

let leftPanel, rightPanel;

let mainColor = 'black';
let bgColor = 'white';
let selectedColor = 'green';

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
    //camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
    //Set pos of Camera
    camera.position.z = 500;

    //Create Controls for Orbit
    controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.zoomSpeed = 3;
    controls.minZoom = 1;
    controls.maxZoom = 15;
    //Gives the Objects a feel of weight, makes dragging smooth
    controls.enableDamping = true;

    //Create Light, setting Position and adding to Scene (currently not necessary)
    pointlight = new THREE.PointLight(0xffffff, 1);
    pointlight.position.set(200, 200, 200);
    scene.add(pointlight);

    const light = new THREE.AmbientLight( 0xffffff ); // soft white light
    scene.add( light );


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
            let code = (data.features[i].properties.iso_a2).toLowerCase();
            let geometry = data.features[i].geometry;


            //Create Country Object
            let country = new Country(name, code, geometry);
            //Push Object to Array
            countries.push(country);
        }
        //Sort Countries Alphabetically
        countries.sort((a, b) => a.name > b.name ? 1 : -1);
    }

    //Get ListView Element from Html to append the CountryPanels later on
    let listView = document.getElementById('list-view');
    //Creates the according Country Panel for Each Country and appends it to ListView
    function addCountriesToListView() {
        //Create a DocumentFragment to temporarily store the panels before ading them to ListView
        let docFrag = document.createDocumentFragment();
        //Loop through The Country Array
        for (let i = 0; i < countries.length; i++) {
            //Clone the Country Template
            let tempNode = document.querySelector("div[data-type='template']").cloneNode(true); //true for deep clone
            //Make the Div visible again
            tempNode.style.display = "flex";
            //Change the Display name
            tempNode.querySelector("p.country-text").textContent = countries[i].name;
            //Change Image source
            tempNode.querySelector("img").src = 'https://flagcdn.com/28x21/' + countries[i].code + '.png';
            //Get checkbox instance

            let checkbox = tempNode.querySelector("input[type='checkbox']");
            //Change value and id of checkbox to the according country
            checkbox.value = countries[i].code;
            checkbox.id = 'check-' + countries[i].code;
            //Add an event Listener on the Checkbox. When Checkbox gets checked, paint the Country again
            checkbox.addEventListener('change', (event) => {
                let tempColor = event.target.checked ? selectedColor : mainColor;
                paintCountry(countries[i], tempColor);
            });

            //Append the TempNode to the documentFragment
            docFrag.appendChild(tempNode);
        }
        //Append documentFragment to ListView
        listView.appendChild(docFrag);
    }

    //Get the Divs in ListView
    let countryPanels = listView.children;
    //Get the inputField of CountrySearchPanel
    let countrySearch = document.getElementById('country-search');
    //When input changes in inputField
    countrySearch.addEventListener('input', (event) => {
        //Store Input
        let input = countrySearch.value.toLowerCase();
        //Loop through each CountryPanel
        for (let country of countryPanels) {
            //Store current Country Panel Name
            let name = (country.getElementsByClassName('country-text')[0].outerText).toLowerCase();
            //if the input is a substring of the country name, make div visible. If not, make div invisble
            country.style.display = name.includes(input) ? 'flex' : 'none';
        }
    });

    //Paint one Country
    function paintCountry(country, color = 'white', init = false) {
        //Storing variables
        let isMulti = country.geometry.type === 'MultiPolygon';
        //Get coordinates
        let coords = country.geometry.coordinates;
        //Get the amount of Polygons that the Country has
        let polygonCount = coords.length;
        //loop through polygons
        for (let p = 0; p < polygonCount; p++) {
            //NOTE: MultiPolygon and Polygon Countries have to be treated differently
            //Check if Country is MultiPolygon
            if (isMulti) {
                //loop through each polygons Coordinate and draw a Polygon
                for (let u = 0; u < coords[p].length; u++) {
                    drawPolygonByArray(coords[p][u]);
                }
            } else {
                //loop through each Coordinate and draw a Polygon
                for (let u = 0; u < coords.length; u++) {
                    drawPolygonByArray(coords[u]);
                }
            }
        };

        //Draw The Countries Polygons
        function drawPolygonByArray(arr) {
            //Begin Path and move to first Coordinate in array
            ctx.beginPath();
            let xy = getPXfromLatLng(arr[0][0], arr[0][1]);
            ctx.moveTo(xy.x, xy.y);
            //Loop through each Coordinate in Array and Draw Lines
            for (let i = 0; i < arr.length; i++) {
                let xy = getPXfromLatLng(arr[i][0], arr[i][1]);
                ctx.lineTo(xy.x, xy.y)
            }
            //Close Path, Fill with according color, and create Stroke
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.stroke();

            //If Country is selected, update Canvas
            if (!init) {
                sphereMaterial.map = canvas;
                texture.needsUpdate = true;
            }


        }

        //Converts latitude and longitute to x and y.
        function getPXfromLatLng(lat, lon) {
            let posX = ((lat + 180.0) * (canvasW / 360.0));
            let posY = (((lon * -1.0) + 90.0) * (canvasH / 180.0));
            return { x: posX, y: posY };
        }


    }

    //Create a Canvas
    const canvas = document.createElement('canvas');
    //Store Resoultion of Canvas
    let canvasW = 10800;
    let canvasH = 5400;
    //Set resolution of Canvas
    canvas.width = canvasW;
    canvas.height = canvasH;
    //Get Context of Canvas and set Background
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
    //Load All Countries
    await loadCountries();
    //Paint All Countries
    for (let i = 0; i < countries.length; i++) {
        paintCountry(countries[i], mainColor, true);
    }
    //Add All Countries to ListView
    addCountriesToListView();

    //Set texture to Canvas
    let texture = new THREE.CanvasTexture(canvas);
    //Update Texture
    texture.needsUpdate = true;

    const loader = new THREE.TextureLoader();
    const displacement = loader.load('./textures/height.jpg');

    //Configurations for the Material
    const sphereMaterial = {
        map: texture,
        displacementMap: displacement,
        displacementScale: 1,
        //wireframe: true
    };

    //Creating Sphere Object
    let sphereGeo = new THREE.SphereGeometry(128, 64, 64);
    let sphereMat = new THREE.MeshStandardMaterial(sphereMaterial);
    let sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    //Adding Sphere to Scene
    scene.add(sphereMesh);
    //Get left Panel
    leftPanel = document.getElementById('left-panel');
    rightPanel = document.getElementById('right-panel');

    //document.getElementById('body').appendChild(canvas);

    addEventListener('mousewheel', (event) => {
        //Calculate offset according to ZoomLevel
        let offset = ((camera.zoom - 1) * (camera.zoom - 1)) * 25;
        //Change values of leftPanel according to zoomLevel
        leftPanel.style.left = `calc(25% - ${offset}px)`;
        rightPanel.style.left = `calc(75% + ${offset}px)`;

        leftPanel.style.visibility = camera.zoom > 3.7 ? 'hidden' : 'visible';
        rightPanel.style.visibility = camera.zoom > 3.7 ? 'hidden' : 'visible';
        leftPanel.style.opacity = camera.zoom > 3.7 ? '0' : '1';
        rightPanel.style.opacity = camera.zoom > 3.7 ? '0' : '1';

    });
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