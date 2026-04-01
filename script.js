/**
 * SQUID GAME 2 Certificate Generator - Logic Script
 * This file contains the application logic. 
 * Assets are loaded directly from the images folder.
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const elements = {
        form: document.getElementById('certificateForm'),
        rollNoInput: document.getElementById('rollNo'),
        canvas: document.getElementById('certificateCanvas'),
        downloadLink: document.getElementById('downloadLink'),
        certificateResult: document.getElementById('certificateResult'),
        notRegisteredMessage: document.getElementById('notRegisteredMessage'),
        btnScanQr: document.getElementById('btnScanQr'),
        readerDiv: document.getElementById('reader'),
        themeToggle: document.getElementById('themeToggle')
    };

    // Theme Management
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            elements.themeToggle.textContent = '☀️';
        }
    };

    elements.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        elements.themeToggle.textContent = isDark ? '☀️' : '🌙';
    });

    initTheme();

    const ctx = elements.canvas.getContext('2d');
    let html5QrcodeScanner = null;

    // Initialize Certificate Template
    const certificateTemplate = new Image();
    // Load image directly from file
    certificateTemplate.src = 'certificate.png';

    certificateTemplate.onload = () => {
        elements.canvas.width = certificateTemplate.width;
        elements.canvas.height = certificateTemplate.height;
        console.log("✓ Certificate template loaded successfully");
        initApp();
    };

    certificateTemplate.onerror = () => {
        console.error("✗ Failed to load certificate template image");
        alert("Critical error: Certificate template could not be loaded.");
    };

    function initApp() {
        setupScanner();
        setupForm();
        console.log(`✓ Application initialized with ${Object.keys(STUDENTS_DATA).length} students`);
    }

    /**
     * QR Code Scanner Logic
     */
    function setupScanner() {
        elements.btnScanQr.addEventListener('click', () => {
            if (elements.readerDiv.style.display === 'none') {
                startScanning();
            } else {
                stopScanning();
            }
        });
    }

    function startScanning() {
        elements.readerDiv.style.display = 'block';
        elements.btnScanQr.textContent = 'Stop Scanning';

        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        html5QrcodeScanner.render(onScanSuccess, (err) => {/* ignore errors */ });
    }

    function stopScanning() {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear().then(() => {
                elements.readerDiv.style.display = 'none';
                elements.btnScanQr.textContent = 'Scan QR Code';
                html5QrcodeScanner = null;
            });
        }
    }

    function onScanSuccess(decodedText) {
        console.log("QR Scanned:", decodedText);
        stopScanning();

        elements.rollNoInput.value = decodedText.toUpperCase().trim();
        elements.form.dispatchEvent(new Event('submit'));
    }

    /**
     * Form Submission and Certificate Generation
     */
    function setupForm() {
        elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const rollNo = elements.rollNoInput.value.toUpperCase().trim();
            const studentName = STUDENTS_DATA[rollNo];

            resetUI();

            if (studentName) {
                generateCertificate(studentName);
            } else {
                handleUserNotFound();
            }
        });
    }

    function resetUI() {
        elements.certificateResult.style.display = 'none';
        elements.notRegisteredMessage.style.display = 'none';
        elements.downloadLink.style.display = 'none';
    }

    function generateCertificate(name) {
        console.log(`Generating certificate for: ${name}`);

        // Draw Template
        ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
        ctx.drawImage(certificateTemplate, 0, 0);

        // Draw Name
        ctx.font = 'bold 80px "Google Sans", Roboto, Arial, sans-serif';
        ctx.fillStyle = '#060505ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textX = elements.canvas.width / 2;
        const textY = elements.canvas.height * 0.45 + 195;

        ctx.fillText(name, textX, textY);

        prepareDownload(name);
    }

    function prepareDownload(name) {
        try {
            elements.canvas.toBlob((blob) => {
                if (!blob) throw new Error("toBlob failed");

                const url = URL.createObjectURL(blob);
                elements.downloadLink.href = url;
                elements.downloadLink.download = `SQUID_GAME_2_Certificate_${name.replace(/\s+/g, '_')}.png`;

                elements.downloadLink.onclick = () => {
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                };

                elements.downloadLink.style.display = 'inline-block';
                elements.certificateResult.style.display = 'block';
            }, 'image/png');
        } catch (err) {
            console.error("Failed to generate download:", err);
            alert("Security/CORS Error: If you are running this locally without a server, the browser might block certificate downloads for security reasons.");
        }
    }

    function handleUserNotFound() {
        console.warn("Roll number not found in database.");
        elements.notRegisteredMessage.style.display = 'block';
    }
});
