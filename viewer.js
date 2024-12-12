import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/VRButton.js';

let camera, scene, renderer, sphere, clock;
let panoSphereGeo, panoSphereMat;
let currentPanorama = null;
let panoramas = [];

init();

async function init() {
    const container = document.getElementById('container');
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101010);

    const light = new THREE.AmbientLight(0xffffff, 3);
    scene.add(light);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    container.appendChild(renderer.domElement);

    document.body.appendChild(VRButton.createButton(renderer));
    window.addEventListener('resize', onWindowResize);

    // Load the list of panoramas
    await loadPanoramas();

    setupControls();

    if (panoramas.length > 0) {
        loadPanorama(panoramas[0]);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    if (renderer.xr.isPresenting === false && sphere) {
        const time = clock.getElapsedTime();
        sphere.rotation.y += 0.001;
        sphere.position.x = Math.sin(time) * 0.2;
        sphere.position.z = Math.cos(time) * 0.2;
    }
    renderer.render(scene, camera);
}

async function loadPanoramas() {
    try {
        const response = await fetch('panorama_list.json');
        panoramas = await response.json();
    } catch (err) {
        console.error('Failed to load panorama list:', err);
        panoramas = [];
    }

    const selector = document.getElementById('panoramaSelector');
    selector.innerHTML = '';
    panoramas.forEach((pano) => {
        const option = document.createElement('option');
        option.value = pano;
        option.text = pano;
        selector.add(option);
    });

    selector.addEventListener('change', () => {
        loadPanorama(selector.value);
    });
}

function setupControls() {
    document.getElementById('applySettings').addEventListener('click', async () => {
        const sphereSize = parseFloat(document.getElementById('sphereSize').value);
        const depthScale = parseFloat(document.getElementById('depthScale').value);
        const meshResolution = parseInt(document.getElementById('meshResolution').value);

        if (currentPanorama) {
            await loadPanorama(currentPanorama, { sphereSize, depthScale, meshResolution });
        }
    });
}

async function loadPanorama(panorama, overrideConfig = {}) {
    currentPanorama = panorama;

    if (sphere) {
        scene.remove(sphere);
        sphere.geometry.dispose();
        sphere.material.dispose();
    }

    const configResponse = await fetch(`panoramas/${panorama}/config.json`);
    if (!configResponse.ok) {
        console.error('Config file not found for', panorama);
        return;
    }
    const config = await configResponse.json();

    if (overrideConfig.sphereSize !== undefined) config.sphereSize = overrideConfig.sphereSize;
    if (overrideConfig.depthScale !== undefined) config.depthScale = overrideConfig.depthScale;
    if (overrideConfig.meshResolution !== undefined) config.meshResolution = overrideConfig.meshResolution;

    document.getElementById('sphereSizeValue').innerText = config.sphereSize;
    document.getElementById('depthScaleValue').innerText = config.depthScale;
    document.getElementById('meshResolutionValue').innerText = config.meshResolution;

    document.getElementById('sphereSize').value = config.sphereSize;
    document.getElementById('depthScale').value = config.depthScale;
    document.getElementById('meshResolution').value = config.meshResolution;

    panoSphereGeo = new THREE.SphereGeometry(config.sphereSize, config.meshResolution, config.meshResolution);
    panoSphereMat = new THREE.MeshStandardMaterial({ side: THREE.BackSide, displacementScale: config.depthScale });
    sphere = new THREE.Mesh(panoSphereGeo, panoSphereMat);
    scene.add(sphere);

    const manager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(manager);

    loader.load(`panoramas/${panorama}/image.png`, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        sphere.material.map = texture;
    });

    loader.load(`panoramas/${panorama}/depth.png`, (depth) => {
        depth.minFilter = THREE.NearestFilter;
        depth.generateMipmaps = false;
        sphere.material.displacementMap = depth;
    }, undefined, () => {
        console.log(`No depth map found for ${panorama}`);
    });

    manager.onLoad = () => {
        console.log(`Panorama ${panorama} loaded successfully.`);
    };
}
