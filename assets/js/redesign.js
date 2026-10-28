/**
 * redesign.js — Three.js animated background + workflow typewriter animation
 *
 * This file powers two visual effects on the VVG ONLINE site:
 *
 * 1. A Three.js grid background that slowly scrolls upward behind all content.
 *    The grid colour changes when the user toggles between light/dark theme.
 *
 * 2. A workflow pipeline animation on the homepage. Nodes are revealed
 *    one at a time with a typewriter text effect and connector lines.
 *
 * It is called from App.razor via vvg.initPage() after Blazor boots up.
 */

window.vvg = window.vvg || {};

// ── Three.js scene globals (shared with theme toggle) ──
let scene, camera, renderer;

// Workflow abort / running / paused flags — used by restartWorkflow for safe re-entry
let _workflowAbort = false;
let _workflowRunning = false;
let _workflowPaused = false;

/**
 * Updates the Three.js grid colour when the theme changes.
 * Called from SystemPanel.razor via JS interop after toggling the theme.
 *
 * @param {string} theme — "dark" or "light"
 */
window.vvg.updateGridColor = (theme) => {
    if (window.gridHelper) {
        const gridColor = theme === 'dark' ? 0xffdd33 : 0x000000;
        window.gridHelper.material.color.setHex(gridColor);
    }
};

/**
 * Reveals text one character at a time (typewriter effect).
 * The original text is saved in data-orig so it can be reset for looping.
 *
 * @param {HTMLElement} el    — the element whose text to animate
 * @param {number}      speed — ms delay between each character (default 40)
 * @returns {Promise} resolves when all characters have been typed
 */
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

/**
 * Checks the pause flag between animation steps.
 * Polls every 100ms while paused, exits when unpaused or aborted.
 */
async function pauseCheck() {
    while (_workflowPaused && !_workflowAbort) {
        await new Promise(r => setTimeout(r, 100));
    }
}

/**
 * Infinite loop that animates the workflow pipeline on the homepage.
 * Each cycle:
 *   1. Resets all nodes (hides text, removes animation classes)
 *   2. Loops through nodes left → right
 *   3. For each node: draw rectangle → type code block → type h5 → type p → activate connector
 *   4. After all nodes: fade everything out, reset, pause, repeat
 *
 * Timing constants are tuned for a smooth, unhurried reveal.
 */
async function playWorkflowLoop() {
    _workflowRunning = true;
    const nodes = Array.from(document.querySelectorAll('.workflow-node'));
    const connectors = Array.from(document.querySelectorAll('.workflow-connector'));
    if (!nodes.length) { _workflowRunning = false; return; }

    // Animation timing (ms)
    const drawDuration = 520, perCharSpeed = 28, afterCodeDelay = 120;
    const afterH5Delay = 140, afterPDelay = 180, connectorDelay = 220;
    const nodeFadeDuration = 480, betweenNodesGap = 120, endOfLoopPause = 1000;

    // Reset all nodes: save original text, clear display, remove animation classes
    nodes.forEach(n => {
        n.querySelectorAll('code, h5, p').forEach(el => {
            if (el && !el.dataset.orig) el.dataset.orig = el.textContent.trim();
            if (el) el.textContent = '';
            el.classList.remove('visible', 'flow-el', 'code-blink');
        });
        n.classList.remove('draw-rect', 'visible', 'active', 'loop-fade');
    });

    // Infinite animation loop
    while (true) {
        if (_workflowAbort) break;
        connectors.forEach(c => c.classList.remove('connector-active'));

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];

            // Step 1: Draw the rectangle outline
            n.classList.add('draw-rect', 'visible', 'active');
            await new Promise(r => setTimeout(r, drawDuration));
            await pauseCheck();

            // Step 2: Type the <code> block (e.g. "[service]~#")
            const codeEl = n.querySelector('code');
            if (codeEl) {
                codeEl.classList.add('flow-el', 'code-blink', 'visible');
                await typeWriterElement(codeEl, perCharSpeed);
                await pauseCheck();
                codeEl.classList.remove('code-blink');
                await new Promise(r => setTimeout(r, afterCodeDelay));
            }

            // Step 3: Type the <h5> heading
            const h5El = n.querySelector('h5');
            if (h5El) {
                h5El.classList.add('flow-el', 'visible');
                await typeWriterElement(h5El, perCharSpeed);
                await pauseCheck();
                await new Promise(r => setTimeout(r, afterH5Delay));
            }

            // Step 4: Type the <p> description
            const pEl = n.querySelector('p');
            if (pEl) {
                pEl.classList.add('flow-el', 'visible');
                await typeWriterElement(pEl, perCharSpeed);
                await pauseCheck();
                await new Promise(r => setTimeout(r, afterPDelay));
            }

            // Step 5: Activate the connector arrow to the next node
            if (connectors[i]) {
                connectors[i].classList.add('connector-active');
                await new Promise(r => setTimeout(r, connectorDelay));
            }
            await pauseCheck();
            await new Promise(r => setTimeout(r, betweenNodesGap));
        }

        // All nodes shown — pause, then fade out
        await new Promise(r => setTimeout(r, endOfLoopPause));
        await pauseCheck();
        nodes.forEach(n => n.classList.add('loop-fade'));
        connectors.forEach(c => c.classList.remove('connector-active'));
        await new Promise(r => setTimeout(r, nodeFadeDuration));
        await pauseCheck();

        // Reset everything for the next loop
        nodes.forEach(n => {
            n.classList.remove('draw-rect', 'visible', 'active', 'loop-fade');
            n.querySelectorAll('code, h5, p').forEach(el => {
                if (el) el.textContent = '';
                el.classList.remove('visible', 'flow-el', 'code-blink');
            });
        });
        await new Promise(r => setTimeout(r, endOfLoopPause));
        await pauseCheck();
        if (_workflowAbort) break;
    }
    _workflowRunning = false;
}

// ── Play/Pause toggle — toggles _workflowPaused and updates the button text ──
// Called from Home.razor button onclick
window.vvg.togglePlayPause = () => {
    _workflowPaused = !_workflowPaused;
    const btn = document.getElementById('wf-play-pause-btn');
    if (btn) {
        btn.textContent = _workflowPaused ? '[ RESUME ]' : '[ PAUSE ]';
    }
};

// ── Workflow restart — called from Home.razor on every navigation ──
window.vvg.restartWorkflow = () => {
    _workflowPaused = false;
    const btn = document.getElementById('wf-play-pause-btn');
    if (btn) btn.textContent = '[ PAUSE ]';
    if (_workflowRunning) {
        _workflowAbort = true;
        const wait = setInterval(() => {
            if (!_workflowRunning) {
                clearInterval(wait);
                _workflowAbort = false;
                const wf = document.getElementById('workflow');
                if (wf) playWorkflowLoop();
            }
        }, 50);
    } else {
        const wf = document.getElementById('workflow');
        if (wf) playWorkflowLoop();
    }
};

/**
 * Creates the Three.js animated grid background.
 * A GridHelper plane scrolls slowly upward, giving depth behind the content.
 * Runs inside the #canvas-container div (which has pointer-events: none).
 */
function initBackground() {
    const container = document.getElementById('canvas-container');
    if (!container || !window.THREE) return;

    // Read the current theme from <html data-theme="...">
    const theme = document.documentElement.getAttribute('data-theme') || 'light';

    // Standard Three.js setup: scene, perspective camera, WebGL renderer
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Grid colour depends on theme:
    // - Dark mode:  golden accent (#ffdd33) for a cyberpunk look
    // - Light mode: light grey (#cccccc) for subtle texture
    const gridColor = theme === 'dark' ? 0xffdd33 : 0xcccccc;
    window.gridHelper = new THREE.GridHelper(100, 40, gridColor, 0x444444);
    window.gridHelper.position.y = -5;
    scene.add(window.gridHelper);

    camera.position.z = 10;
    camera.position.y = 2;

    /**
     * Animation loop — moves the grid upward by 0.04 units per frame.
     * When it scrolls past 2.5, it snaps back to 0 (seamless loop).
     * requestAnimationFrame runs at ~60fps.
     */
    function animate() {
        requestAnimationFrame(animate);
        window.gridHelper.position.z += 0.04;
        if (window.gridHelper.position.z > 2.5) window.gridHelper.position.z = 0;
        renderer.render(scene, camera);
    }
    animate();
}

/**
 * Entry point — called from C# (App.razor) after Blazor finishes booting.
 * Initialises the background and sets up fade-in animations for cards
 * and workflow nodes as they scroll into view.
 */
window.vvg.initPage = () => {
    try { initBackground(); } catch (e) { console.warn('[Workflow] 3D background unavailable:', e.message); }

    /**
     * IntersectionObserver watches for elements entering the viewport.
     * When a .card or .workflow-node scrolls into view, it fades in
     * with a staggered delay (each element waits 100ms longer than the last).
     */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });  // Trigger when at least 10% of the element is visible

    // Set initial state (invisible, slightly offset) then start observing
    // Only observe .card elements — .workflow-node is managed by playWorkflowLoop
    document.querySelectorAll('.card').forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "all 0.6s ease-out";
        observer.observe(el);
    });

    // Start the workflow loop if the workflow section exists on this page
    // Use restartWorkflow so it can be safely called again on re-navigation
    setTimeout(() => window.vvg.restartWorkflow(), 60);
};

// Handle browser window resize — update the Three.js camera and renderer
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});