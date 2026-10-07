import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// ==============================
// Scene
// ==============================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);


// ==============================
// Camera
// ==============================

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 1.8, 4);


// ==============================
// Renderer
// ==============================

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);


// ==============================
// Controls
// ==============================

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.update();


// ==============================
// Light
// ==============================

const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);


// ==============================
// 바닥 / 기준선
// ==============================

const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);


// ==============================
// Animation 관련 변수
// ==============================

let model;
let mixer;
let currentAction = null;

const actions = {};


// ==============================
// 애니메이션 찾기 함수
// suffix 기준으로 찾음
// 예: "Man_Idle"
// ==============================

function findClipBySuffix(clips, suffix) {
    return clips.find(clip => clip.name.endsWith(suffix));
}


// ==============================
// 애니메이션 전환 함수
// ==============================

function playAction(actionName) {
    const nextAction = actions[actionName];

    if (!nextAction) {
        console.log(`${actionName} 애니메이션이 없습니다.`);
        return;
    }

    if (currentAction === nextAction) {
        return;
    }

    if (currentAction) {
        currentAction.fadeOut(0.25);
    }

    nextAction
        .reset()
        .fadeIn(0.25)
        .play();

    currentAction = nextAction;
}


// ==============================
// Loader
// ==============================

const loader = new GLTFLoader();

loader.load(
    './models/man.glb',

    function (gltf) {
        model = gltf.scene;
        scene.add(model);

        model.position.set(0, 0, 0);
        model.scale.set(1, 1, 1);

        console.log('애니메이션 목록:');
        gltf.animations.forEach((clip) => {
            console.log(clip.name);
        });

        mixer = new THREE.AnimationMixer(model);

        // 필요한 애니메이션 액션 등록
        const animationMap = {
            idle: 'Man_Idle',
            walk: 'Man_Walk',
            run: 'Man_Run',
            jump: 'Man_Jump',
            clap: 'Man_Clapping',
            punch: 'Man_Punch',
            death: 'Man_Death'
        };

        for (const key in animationMap) {
            const clip = findClipBySuffix(gltf.animations, animationMap[key]);

            if (clip) {
                actions[key] = mixer.clipAction(clip);

                // 반복 설정
                if (key === 'death') {
                    actions[key].setLoop(THREE.LoopOnce);
                    actions[key].clampWhenFinished = true;
                } else {
                    actions[key].setLoop(THREE.LoopRepeat);
                }
            } else {
                console.log(`${animationMap[key]} 를 찾지 못했습니다.`);
            }
        }

        // 시작은 Idle
        playAction('idle');
    },

    function (xhr) {
        if (xhr.total > 0) {
            const percent = (xhr.loaded / xhr.total) * 100;
            console.log(percent.toFixed(1) + '% loaded');
        }
    },

    function (error) {
        console.error('GLB 로딩 실패:', error);
    }
);


// ==============================
// 버튼 연결
// ==============================

document.getElementById('idleButton').addEventListener('click', () => {
    playAction('idle');
});

document.getElementById('walkButton').addEventListener('click', () => {
    playAction('walk');
});

document.getElementById('runButton').addEventListener('click', () => {
    playAction('run');
});

document.getElementById('jumpButton').addEventListener('click', () => {
    playAction('jump');
});

document.getElementById('clapButton').addEventListener('click', () => {
    playAction('clap');
});

document.getElementById('punchButton').addEventListener('click', () => {
    playAction('punch');
});

document.getElementById('deathButton').addEventListener('click', () => {
    playAction('death');
});


// ==============================
// Clock / Animation Loop
// ==============================

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (mixer) {
        mixer.update(delta);
    }

    renderer.render(scene, camera);
}

animate();


// ==============================
// Resize
// ==============================

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});