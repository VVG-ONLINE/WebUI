/**
 * boot-sequence.js — Terminal-style boot animation shown before the app loads
 *
 * When the page first opens, a full-screen "preloader" overlay appears
 * with a terminal-like progress sequence. It runs through 5 frames:
 *
 *   1. ASCII logo
 *   2. [=>               ] 10%   — initialisation
 *   3. [==========>      ] 50%   — loading assets
 *   4. [================> ] 90%   — final checks
 *   5. [=================] 100%  — system ready
 *
 * After all frames, the preloader fades out and removes itself from the DOM.
 * The app's CSS preloader is currently commented out, so this only runs if
 * the .preloader element exists in the page.
 */

// Force preloader removal after 8 seconds regardless of DOMContentLoaded
const forceRemove = setTimeout(() => {
    const el = document.querySelector('.preloader');
    if (el && el.parentNode) {
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }
}, 8000);

document.addEventListener("DOMContentLoaded", function () {
    clearTimeout(forceRemove);
    const preloader = document.querySelector('.preloader');
    if (!preloader) return;

    // Replace whatever was inside the preloader with a clean terminal output area
    preloader.innerHTML = '<div class="terminal-output-area" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; width: 85%;"></div>';
    const output = preloader.querySelector('.terminal-output-area');

    // The ASCII logo line — backslashes are doubled (\\ → \) for JavaScript string escaping
    const asciiLogo = `// ACCESS THE FUTURE \\\\ VVG ONLINE \\\\ LOADING...`;

    /**
     * Each step defines:
     *   text  — what to show in the terminal (can include newlines)
     *   delay — how long to wait before advancing to the next step (ms)
     */
    const steps = [
        { text: asciiLogo, delay: 1000 },
        { text: `${asciiLogo}\n\n[=>                  ] 10%`, delay: 400 },
        { text: `${asciiLogo}\n\n[==========>         ] 50%`, delay: 400 },
        { text: `${asciiLogo}\n\n[==================> ] 90%`, delay: 400 },
        { text: `${asciiLogo}\n\n[====================] 100%\n\nSYSTEM READY.`, delay: 800 }
    ];

    let currentStep = 0;

    /** Recursively advances through the boot frames one at a time. */
    function nextStep() {
        // All frames played — fade out the preloader
        if (currentStep >= steps.length) {
            preloader.style.transition = 'opacity 0.5s ease';
            preloader.style.opacity = '0';
            setTimeout(() => preloader.remove(), 500);
            return;
        }

        output.textContent = steps[currentStep].text;
        setTimeout(nextStep, steps[currentStep].delay);
        currentStep++;
    }

    nextStep();
});