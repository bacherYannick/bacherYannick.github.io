import {
    BufferGeometry,
    TextureLoader,
    Vector2,
    Vector3,
    Scene,
    Color,
    PerspectiveCamera,
    WebGLRenderer,
    Float32BufferAttribute,
    Points,
    PointsMaterial
} from "./lib/three.module.js";
import { GLTFLoader } from './lib/GLTFLoader.js';
import { MathUtils } from './lib/MathUtils.js';
import { EffectComposer } from './lib/EffectComposer.js';
import { RenderPass } from './lib/RenderPass.js';
import { UnrealBloomPass } from './lib/UnrealBloomPass.js';

let $window = $(window);

let interactive = $(".interactive");
let contact = $("nav .contactBtn");
let language = $("#language");
let image = $(".imgContainer");

let endVertices = [];
let vertices = [];
let destinationVert = [];
let randGeo = new BufferGeometry();
let aniParticles = new BufferGeometry();
let endGeo = new BufferGeometry();
let particleAnimation;
let particleActive = false;
let particleCount;
let renderScene, bloomPass, composer;
let sprite = new TextureLoader().load('/dist/assets/img/disc.png');
let particles, modelParticles;
let testStart = false;

let scene, renderer, camera;

let targetPosition = new Vector3();
let phi;
let theta;

let lat = 0;
let lon = 0;

let mouseX = 0;
let mouseY = 0;

let alpha = 0;
let beta = 0;

let isMobile;
if(window.matchMedia("(min-width: 800px)").matches) {
    isMobile = false;
} else {
    isMobile = true;
}

/* Events */
$window.on("mousemove", onMouseMove);
interactive.on("mouseenter", onLinkEnter);
interactive.on("mouseleave", onLinkLeave);
image.on("mouseenter", onImgEnter);
image.on("mouseleave", onImgLeave);
language.on("click", e => {
    if(language.text() === "DEU"){
        $(".german").attr("aria-hidden", "false");
        $(".english").attr("aria-hidden", "true");
        language.text("ENG");
    } else {
        $(".english").attr("aria-hidden", "false");
        $(".german").attr("aria-hidden", "true");
        language.text("DEU");
    }
})
contact.on("click", e => {
    e.preventDefault();
    gsap.to($("html"), 1, {scrollTo: "#contact"});
});
/* --- */

let tl = gsap.timeline({paused:true});
tl.to(".imgOverlay", 0.3, {width:"100%"})
.to(".imgOverlay h4", 0.3, {left:"50%"}, 0.1)
.to(".imgOverlay button", 0.3, {left:"50%"}, 0.2);

/* cursor */
gsap.set("#cursorOutline", {xPercent: -50, yPercent: -50});
gsap.set("#cursor", {xPercent: -50, yPercent: -50});


let cursor = $("#cursor");
let cursorOutline = $("#cursorOutline");
let pos = {x: $window.width() / 2, y: $window.height() / 2};
let posPoint = {x: $window.width() / 2, y: $window.height() / 2};
let mouse = {x: pos.x, y: pos.y};
let hoverLink = false;

let xSet = gsap.quickSetter(cursorOutline, "x", "px");
let ySet = gsap.quickSetter(cursorOutline, "y", "px");
let xSetPoint = gsap.quickSetter(cursor, "x", "px");
let ySetPoint = gsap.quickSetter(cursor, "y", "px");

if(!$.os.phone && !$.os.tablet) {
    gsap.ticker.add(() => {
        if (!hoverLink) {
            pos.x += (mouse.x - pos.x) * 0.2;
            pos.y += (mouse.y - pos.y) * 0.2;
        } else {
            pos.x += (mouse.x - pos.x) * 0.4;
            pos.y += (mouse.y - pos.y) * 0.4;
        }
        posPoint.x += (mouse.x - posPoint.x);
        posPoint.y += (mouse.y - posPoint.y);
        xSet(pos.x);
        ySet(pos.y);
        xSetPoint(posPoint.x);
        ySetPoint(posPoint.y);
    });
}

/* --- */


/* Event functions */

function onMouseMove(event) {
    mouse.x = event.x;
    mouse.y = event.y;
    mouseX = (event.clientX - window.innerWidth / 2) * 0.01;
    mouseY = (event.clientY - window.innerHeight / 2) * 0.01;
/*     mouseX = (event.x - window.innerHeight / 2) * 0.1
    mouseY = (event.y - window.innerWidth / 2) * 0.1 */
/*     console.log(mouseX + "X--------------Y" + mouseY) */
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onLinkEnter() {
    gsap.to(cursor, {duration: 0.25, height: 50, width: 50});
    hoverLink = true;
}

function onLinkLeave() {
    gsap.to(cursor, {duration: 0.25, height: 10, width: 10, opacity: 1});
    hoverLink = false;
}

function onImgEnter() {
    tl.play();
}

function onImgLeave() {
    tl.reverse();
}
/* --- */


/* Three----------------------------- */


init()


function init() {
    scene = new Scene();
    scene.background = new Color(0x050505);

    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 9, 1000);
    camera.position.set(0, 0, 40);
    scene.add(camera);

    renderer = new WebGLRenderer();
    renderer.setPixelRatio($window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = 0;
    $("#canvas").append(renderer.domElement);

    createModels();
    createShader();
    animate();
}

function createModels() {
    let loader = new GLTFLoader();

    loader.load(
        '/dist/assets/models/scene.gltf',

        function (gltf) {
            gltf.scene.traverse(function (child) {
                if(child.isMesh) {

                    let geometry = child.geometry.attributes.position.array;
                    $.each(geometry, function(index, item) {
                        endVertices.push(item);
                    })

                    particleCount = endVertices.length / 3;

                    for ( let i = 0; i < 3000; i++ ) {

                        const x = 200 * Math.random() - 100;
                        const y = 200 * Math.random() - 100;
                        const z = 200 * Math.random() - 100;

                        vertices.push( x, y, z );
    
                    }

                    randGeo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
                    let mat = new PointsMaterial({color: 0xa6e89c, size: 0.4, transparent: true, alphaTest: 0.1, map: sprite, sizeAttenuation: true});
                    particles = new Points(randGeo, mat);
                    
                    scene.add(particles);


                    if(!particleActive) {
                    
                        for (let i = 0; i < particleCount * 3; i ++) {
                        
                            const num = 200 * Math.random() - 100;
                        
                            destinationVert.push(num);
                        
                        }
                        
                        aniParticles.setAttribute('position', new Float32BufferAttribute(destinationVert, 3));
                        endGeo.setAttribute('position', new Float32BufferAttribute(endVertices, 3));
                        particleAnimation = true;
                        
                        
                        let mat = new PointsMaterial({color: 0xa6e89c, size: 0.4, transparent: true, alphaTest: 0.1, map: sprite, sizeAttenuation: true});
                        modelParticles = new Points(aniParticles, mat);
                        scene.add(modelParticles);
                        //gsap.to(aniParticles.attributes.position.array, 2, endGeo.attributes.position.array);
                        particleActive = true;
                        
                        if(isMobile) {
                            $("#home").css("height", window.innerHeight);
                            gsap.set(modelParticles.position, {y: -1})
                            gsap.to(modelParticles.position, 5, {y: 1, yoyo: true, repeat: -1, ease: "power1.inOut"})
                        }
                        
                    } else{
                        newVert = [];
                    }

                 
                    gsap.delayedCall(2, function() {
                        testStart = true;
                    })

                }
            })
        },
        
    )
}

function createShader() {
    renderScene = new RenderPass(scene, camera);

    bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0;
    bloomPass.strength = 0.2;
    bloomPass.radius = 0.01;

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
}


function animate() {
    requestAnimationFrame(animate);

    render();
}

function render() {

    if(!isMobile) {
        lon += (mouseX -lon) * 0.05;
        lat += (-mouseY -lat) * 0.05;
        lat = Math.max(-85, Math.min(85, lat));
    
        targetPosition = new Vector3();
    
        phi = MathUtils.degToRad(90 - lat);
        theta = MathUtils.degToRad(180 - lon);
    
        let position = camera.position
        
        targetPosition.setFromSphericalCoords(1, phi, theta).add(position);
    
        camera.lookAt(targetPosition);

        if(testStart) {
            camera.position.x += 0.05 * ((mouseX * 0.1) - camera.position.x);
            camera.position.y += 0.05 * ((-mouseY * 0.1) - camera.position.y);
            modelParticles.position.x += 0.05 * ((mouseX * 0.1) - modelParticles.position.x);
            modelParticles.position.y += 0.05 * ((-mouseY * 0.1) - modelParticles.position.y);
            modelParticles.rotation.x += 0.05 * ((mouseY * 0.05) - modelParticles.rotation.x);
            modelParticles.rotation.y += 0.05 * ((mouseX * 0.05) - modelParticles.rotation.y);
        }
    }


    if(particleAnimation) {
        randGeo.attributes.position.needsUpdate = true;
        randGeo.computeBoundingBox();
        randGeo.computeBoundingSphere();
        aniParticles.attributes.position.needsUpdate = true;
        aniParticles.computeBoundingBox();
        aniParticles.computeBoundingSphere();
    }


    renderer.render(scene, camera);

    composer.render();
}
