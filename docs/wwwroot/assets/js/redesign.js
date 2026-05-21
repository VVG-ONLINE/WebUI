window.vvg = window.vvg || {};

let scene, camera, renderer;

// This function will be called from C# to update the grid color
window.vvg.updateGridColor = (theme) => {
    if (window.gridHelper) {
        const gridColor = theme === 'dark' ? 0xffdd33 : 0x000000;
        window.gridHelper.material.color.setHex(gridColor);
    }
};

function typeWriterElement(el, speed = 40) {
    return new Promise((resolve) => {
        if (!el) return resolve();
        if (!el.dataset.orig) el.dataset.orig = el.textContent.trim();
        const text = el.dataset.orig;
        el.textContent = '';
        let i = 0;
        function step() {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
                setTimeout(step, speed);
            } else {
                resolve();
            }
        }
        step();
    });
}

async function playWorkflowLoop() {
    const nodes = Array.from(document.querySelectorAll('.workflow-node'));
    const connectors = Array.from(document.querySelectorAll('.workflow-connector'));
    if (!nodes.length) return;

    const drawDuration = 520, perCharSpeed = 28, afterCodeDelay = 120;
    const afterH5Delay = 140, afterPDelay = 180, connectorDelay = 220;
    const nodeFadeDuration = 480, betweenNodesGap = 120, endOfLoopPause = 1000;

    nodes.forEach(n => {
        n.querySelectorAll('code, h5, p').forEach(el => {
            if (el && !el.dataset.orig) el.dataset.orig = el.textContent.trim();
            if (el) el.textContent = '';
            el.classList.remove('visible', 'flow-el', 'code-blink');
        });
        n.classList.remove('draw-rect', 'visible', 'active', 'loop-fade');
    });

    while (true) {
        connectors.forEach(c => c.classList.remove('connector-active'));
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.classList.add('draw-rect', 'visible', 'active');
            await new Promise(r => setTimeout(r, drawDuration));

            const codeEl = n.querySelector('code');
            if (codeEl) {
                codeEl.classList.add('flow-el', 'code-blink', 'visible');
                await typeWriterElement(codeEl, perCharSpeed);
                codeEl.classList.remove('code-blink');
                await new Promise(r => setTimeout(r, afterCodeDelay));
            }

            const h5El = n.querySelector('h5');
            if (h5El) {
                h5El.classList.add('flow-el', 'visible');
                await typeWriterElement(h5El, perCharSpeed);
                await new Promise(r => setTimeout(r, afterH5Delay));
            }

            const pEl = n.querySelector('p');
            if (pEl) {
                pEl.classList.add('flow-el', 'visible');
                await typeWriterElement(pEl, perCharSpeed);
                await new Promise(r => setTimeout(r, afterPDelay));
            }
            
            if (connectors[i]) {
                connectors[i].classList.add('connector-active');
                await new Promise(r => setTimeout(r, connectorDelay));
            }
            await new Promise(r => setTimeout(r, betweenNodesGap));
        }

        await new Promise(r => setTimeout(r, endOfLoopPause));
        nodes.forEach(n => n.classList.add('loop-fade'));
        connectors.forEach(c => c.classList.remove('connector-active'));
        await new Promise(r => setTimeout(r, nodeFadeDuration));

        nodes.forEach(n => {
            n.classList.remove('draw-rect', 'visible', 'active', 'loop-fade');
            n.querySelectorAll('code, h5, p').forEach(el => {
                if (el) el.textContent = '';
                el.classList.remove('visible', 'flow-el', 'code-blink');
            });
        });
        await new Promise(r => setTimeout(r, endOfLoopPause));
    }
}

function initBackground() {
    const container = document.getElementById('canvas-container');
    if (!container || !window.THREE) return;
    
    const theme = document.documentElement.getAttribute('data-theme') || 'light';

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const gridColor = theme === 'dark' ? 0xffdd33 : 0xcccccc;
    window.gridHelper = new THREE.GridHelper(100, 40, gridColor, 0x444444);
    window.gridHelper.position.y = -5;
    scene.add(window.gridHelper);

    camera.position.z = 10;
    camera.position.y = 2;

    function animate() {
        requestAnimationFrame(animate);
        window.gridHelper.position.z += 0.04;
        if (window.gridHelper.position.z > 2.5) window.gridHelper.position.z = 0;
        renderer.render(scene, camera);
    }
    animate();
}

window.vvg.initPage = () => {
    initBackground();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card, .workflow-node').forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "all 0.6s ease-out";
        observer.observe(el);
    });

    if (document.getElementById('workflow')) {
        setTimeout(() => {
            try { playWorkflowLoop(); } catch (e) { console.warn('workflow loop failed', e); }
        }, 600);
    }
};

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});