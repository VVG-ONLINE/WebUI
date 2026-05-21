document.addEventListener("DOMContentLoaded", function () {
    const preloader = document.querySelector('.preloader');
    if (!preloader) return;

    // Clean up any existing HTML inside preloader (like spinners)
    preloader.innerHTML = '<div class="terminal-output-area" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; width: 85%;"></div>';
    const output = preloader.querySelector('.terminal-output-area');

    // NOTE: All backslashes (\) in the ASCII art below are escaped as (\\) to display correctly in JS.
    const asciiLogo = `// ACCESS THE FUTURE \\\\ VVG ONLINE \\\\ LOADING...`;

    // Boot sequence frames
    const steps = [
        {
            text: asciiLogo,
            delay: 1000
        },
        {
            text: `${asciiLogo}

[=>                  ] 10%`,
            delay: 400
        },
        {
            text: `${asciiLogo}

[==========>         ] 50%`,
            delay: 400
        },
        {
            text: `${asciiLogo}

[==================> ] 90%`,
            delay: 400
        },
        {
            text: `${asciiLogo}

[====================] 100%

SYSTEM READY.`,
            delay: 800
        }
    ];

    let currentStep = 0;

    function nextStep() {
        if (currentStep >= steps.length) {
            // Fade out
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