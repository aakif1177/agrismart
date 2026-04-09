// --- AUTHENTICATION LOGIC ---
function toggleAuth(type) {
    if (type === 'signup') {
        document.getElementById('login-card').style.display = 'none';
        document.getElementById('signup-card').style.display = 'block';
    } else {
        document.getElementById('signup-card').style.display = 'none';
        document.getElementById('login-card').style.display = 'block';
    }
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('signup-error').style.display = 'none';
    document.getElementById('signup-success').style.display = 'none';
}

async function handleLogin() {
    const userOrEmail = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    const errorBox = document.getElementById('login-error');

    if (!userOrEmail || !pass) {
        errorBox.textContent = 'Please fill in both fields.';
        errorBox.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usernameOrEmail: userOrEmail, password: pass })
        });
        const data = await response.json();

        if (!response.ok) {
            errorBox.textContent = data.error || 'Invalid credentials. Please register first.';
            errorBox.style.display = 'block';
            return;
        }

        errorBox.style.display = 'none';
        
        const firstName = data.user.fullName.split(' ')[0];
        document.getElementById('user-display-name').textContent = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        
        document.getElementById('auth-section').classList.remove('active');
        document.getElementById('app-container').style.display = 'block';
        
        showSection('home');
    } catch (err) {
        console.error(err);
        errorBox.textContent = 'Server error. Is the backend running?';
        errorBox.style.display = 'block';
    }
}

async function handleSignup() {
    const name = document.getElementById('signup-fullname').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const user = document.getElementById('signup-username').value.trim();
    const pass = document.getElementById('signup-password').value.trim();
    const errorBox = document.getElementById('signup-error');
    const successBox = document.getElementById('signup-success');

    if (!name || !email || !user || !pass) {
        errorBox.textContent = 'Please fill in all fields.';
        errorBox.style.display = 'block';
        successBox.style.display = 'none';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName: name, email: email, username: user, password: pass })
        });
        const data = await response.json();

        if (!response.ok) {
            errorBox.textContent = data.error || 'Username or email already exists!';
            errorBox.style.display = 'block';
            successBox.style.display = 'none';
            return;
        }

        errorBox.style.display = 'none';
        successBox.style.display = 'block';
        
        document.getElementById('signup-fullname').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-username').value = '';
        document.getElementById('signup-password').value = '';

        setTimeout(() => {
            toggleAuth('login');
        }, 1500);
    } catch (err) {
        console.error(err);
        errorBox.textContent = 'Server error. Is the backend running?';
        errorBox.style.display = 'block';
        successBox.style.display = 'none';
    }
}

function handleLogout() {
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('auth-section').classList.add('active');
    toggleAuth('login');
    
    document.querySelectorAll('.section').forEach(sec => {
        if(sec.id !== 'auth-section') sec.classList.remove('active');
    });
}

// --- NAVIGATION LOGIC ---
let activeStream = null;

function showSection(sectionId, element = null) {
    document.querySelectorAll('#app-container .section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if(targetSection) targetSection.classList.add('active');
    
    if (element) {
        element.classList.add('active');
    } else {
        const navLink = document.querySelector(`.nav-links a[onclick*="${sectionId}"]`);
        if(navLink) navLink.classList.add('active');
    }

    // Stop camera if user navigates away from disease tab
    if (sectionId !== 'disease' && activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
        document.getElementById('webcam-feed').style.display = 'none';
        document.getElementById('camera-placeholder').style.display = 'block';
        const btnStart = document.getElementById('btn-start-cam');
        if(btnStart) {
            btnStart.textContent = 'Start Camera';
            btnStart.onclick = startCamera;
        }
    }
}

// --- MODULE 1: CROP RECOMMENDATION ---
const cropRules = {
    sandy: { summer: ["Watermelon", "Muskmelon"], winter: ["Carrot", "Potato"], rainy: ["Groundnut"] },
    clay: { summer: ["Paddy", "Sunflower"], winter: ["Wheat", "Gram"], rainy: ["Rice", "Cotton"] },
    loamy: { summer: ["Maize", "Cotton"], winter: ["Wheat", "Oats"], rainy: ["Jute", "Bamboo"] },
    black: { summer: ["Soybean", "Sorghum"], winter: ["Safflower", "Linseed"], rainy: ["Tur", "Millet"] },
    red: { summer: ["Millets", "Castor"], winter: ["Pulses", "Tobacco"], rainy: ["Maize", "Pigeon Pea"] }
};

function recommendCrops() {
    const soil = document.getElementById('soil-type').value;
    const season = document.getElementById('season').value;
    const box = document.getElementById('crop-result');

    if (!soil || !season) { alert("Select both Soil Type and Season."); return; }

    const recommendations = cropRules[soil]?.[season];
    if (!recommendations) return;

    let html = `<h3>🌟 Recommended Crops</h3>
                <p>Based on <strong>${soil}</strong> soil during <strong>${season}</strong>:</p>
                <div class="badge-container">`;
    recommendations.forEach(crop => html += `<span class="badge">${crop}</span>`);
    html += `</div>`;
    box.innerHTML = html;
    box.classList.remove('hidden');
}

// --- MODULE 2: DISEASE DETECTION ---
const diseaseData = {
    wheat: {
        symptoms: {
            "yellow patches": { name: "Wheat Rust", prevention: "Use rust-resistant varieties and fungicides." },
            "powdery spots": { name: "Powdery Mildew", prevention: "Avoid dense canopy planting, use sulfur fungicides." },
            "stunted growth": { name: "Root Rot", prevention: "Ensure well-drained soil and use fungicide seed treatments." },
            "black spots on stems": { name: "Stem Rust", prevention: "Eradicate alternate hosts (barberry) and apply foliar fungicide." },
            "white heads": { name: "Fusarium Head Blight", prevention: "Plant resistant varieties and monitor humidity near flowering." }
        }
    },
    rice: {
        symptoms: {
            "brown spots": { name: "Brown Spot", prevention: "Seed treatment with fungicides and potassium nutrition." },
            "leaf drying": { name: "Bacterial Blight", prevention: "Proper seedling spacing and field sanitation." },
            "yellowing leaves": { name: "Tungro Virus", prevention: "Control green leafhopper vectors with insecticides and delay planting." },
            "white streaks": { name: "Leaf Streak", prevention: "Use copper-based sprays and ensure clean water flow without splashing." },
            "stunted plants": { name: "Rice Dwarf", prevention: "Plow under infected crop residue and manage insect population densely." }
        }
    },
    cotton: {
        symptoms: {
            "wilting": { name: "Fusarium Wilt", prevention: "Crop rotation and resistant seed varieties." },
            "leaf curling": { name: "Cotton Leaf Curl Virus", prevention: "Eradicate whiteflies and uproot infected weeds immediately." },
            "red spots on leaves": { name: "Tirupati / Bacterial Blight", prevention: "Acid delinting of seeds to destroy bacterial load." },
            "boll rot": { name: "Boll Rot", prevention: "Avoid heavy nitrogen logic and prune bottom leaves for aeration." }
        }
    },
    tomato: {
        symptoms: {
            "dark circles": { name: "Early Blight", prevention: "Crop rotation, heavy mulching, copper fungicides." },
            "yellow mosaic pattern": { name: "Tomato Mosaic Virus", prevention: "Disinfect tools, rotate crops securely, and control aphids." },
            "curled leaves": { name: "Leaf Curl Virus", prevention: "Manage whitefly infestations using sticky traps and neem oil." },
            "fruit cracking": { name: "Moisture Fluctuation", prevention: "Provide highly consistent watering; mulch heavily." }
        }
    }
};

function updateSymptoms() {
    const crop = document.getElementById('crop').value;
    const dropdown = document.getElementById('symptoms');
    dropdown.innerHTML = '<option value="">-- Select Symptom --</option>';
    
    if (crop) {
        dropdown.disabled = false;
        Object.keys(diseaseData[crop].symptoms).forEach(sym => {
            const opt = document.createElement('option');
            opt.value = sym; opt.textContent = sym.charAt(0).toUpperCase() + sym.slice(1);
            dropdown.appendChild(opt);
        });
    } else {
        dropdown.disabled = true;
    }
    document.getElementById('disease-result').classList.add('hidden');
}

function detectDisease() {
    const crop = document.getElementById('crop').value;
    const symptom = document.getElementById('symptoms').value;
    const box = document.getElementById('disease-result');

    if (!crop || !symptom) { alert("Select both Crop and Symptom."); return; }

    const disease = diseaseData[crop].symptoms[symptom];
    box.innerHTML = `<h3>🔍 Identified: <span style="color:var(--primary-color)">${disease.name}</span></h3>
                     <div style="background: rgba(46, 125, 50, 0.05); padding: 1rem; border-radius: 8px;">
                     <strong>🛡️ Action Plan:</strong><br/> ${disease.prevention}</div>`;
    box.classList.remove('hidden');
}

// --- CAMERA DETECTION LOGIC ---
function switchDiseaseTab(mode) {
    document.getElementById('mode-manual').style.display = mode === 'manual' ? 'block' : 'none';
    document.getElementById('mode-camera').style.display = mode === 'camera' ? 'block' : 'none';
    
    document.getElementById('tab-manual').classList.toggle('active', mode === 'manual');
    document.getElementById('tab-manual').style.background = mode === 'manual' ? 'var(--primary-color)' : 'transparent';
    document.getElementById('tab-manual').style.color = mode === 'manual' ? 'white' : 'var(--primary-color)';

    document.getElementById('tab-camera').classList.toggle('active', mode === 'camera');
    document.getElementById('tab-camera').style.background = mode === 'camera' ? 'var(--primary-color)' : 'transparent';
    document.getElementById('tab-camera').style.color = mode === 'camera' ? 'white' : 'var(--primary-color)';

    document.getElementById('disease-result').classList.add('hidden');
    
    if (mode === 'manual' && activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
        document.getElementById('webcam-feed').style.display = 'none';
        document.getElementById('camera-placeholder').style.display = 'block';
        const btnStart = document.getElementById('btn-start-cam');
        btnStart.textContent = 'Start Camera';
        btnStart.onclick = startCamera;
        document.getElementById('btn-capture').disabled = true;
    }
}

async function startCamera() {
    const crop = document.getElementById('crop').value;
    if (!crop) {
        alert("Please select a crop first so we know what to analyze.");
        return;
    }

    const video = document.getElementById('webcam-feed');
    const placeholder = document.getElementById('camera-placeholder');
    const btnStart = document.getElementById('btn-start-cam');
    const btnCapture = document.getElementById('btn-capture');
    const canvas = document.getElementById('snapshot-canvas');

    canvas.style.display = 'none';
    document.getElementById('disease-result').classList.add('hidden');
    placeholder.style.display = 'block';
    video.style.display = 'none';

    try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = activeStream;
        video.style.display = 'block';
        placeholder.style.display = 'none';
        
        btnStart.textContent = 'Stop Camera';
        btnStart.onclick = function() {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
                activeStream = null;
            }
            video.style.display = 'none';
            placeholder.style.display = 'block';
            btnStart.textContent = 'Start Camera';
            btnStart.onclick = startCamera;
            btnCapture.disabled = true;
        };
        btnCapture.disabled = false;
    } catch (err) {
        console.error(err);
        alert("Unable to access camera or permissions were denied. If you're on a secure browser, please allow camera access.");
    }
}

function captureAndAnalyze() {
    const video = document.getElementById('webcam-feed');
    const canvas = document.getElementById('snapshot-canvas');
    const crop = document.getElementById('crop').value;
    const overlay = document.getElementById('scan-overlay');
    
    if (!activeStream || !crop) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    video.style.display = 'none';
    canvas.style.display = 'block';
    
    activeStream.getTracks().forEach(track => track.stop());
    activeStream = null;

    const btnStart = document.getElementById('btn-start-cam');
    btnStart.textContent = 'Retake Photo';
    btnStart.onclick = startCamera;
    document.getElementById('btn-capture').disabled = true;

    overlay.style.display = 'flex';
    document.getElementById('disease-result').classList.add('hidden');
    
    setTimeout(() => {
        overlay.style.display = 'none';
        
        const symptomsKeys = Object.keys(diseaseData[crop].symptoms);
        const randomSymptom = symptomsKeys[Math.floor(Math.random() * symptomsKeys.length)];
        const disease = diseaseData[crop].symptoms[randomSymptom];

        const box = document.getElementById('disease-result');
        box.innerHTML = `<h3>🔍 Smart Scan Identified: <span style="color:var(--primary-color)">${disease.name}</span></h3>
                         <p style="font-size:0.9rem; color:var(--text-light); margin-bottom:1rem;">Detected visual marker via AI Simulation: <em style="text-transform:capitalize;">${randomSymptom}</em></p>
                         <div style="background: rgba(46, 125, 50, 0.05); padding: 1rem; border-radius: 8px;">
                         <strong>🛡️ Action Plan:</strong><br/> ${disease.prevention}</div>`;
        box.classList.remove('hidden');
    }, 2000);
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const crop = document.getElementById('crop').value;
    if (!crop) {
        alert("Please select a crop first so we know what to analyze.");
        event.target.value = '';
        return;
    }

    if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
        activeStream = null;
        document.getElementById('btn-start-cam').textContent = 'Start Camera';
        document.getElementById('btn-start-cam').onclick = startCamera;
        document.getElementById('btn-capture').disabled = true;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('snapshot-canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

            document.getElementById('webcam-feed').style.display = 'none';
            document.getElementById('camera-placeholder').style.display = 'none';
            canvas.style.display = 'block';

            const overlay = document.getElementById('scan-overlay');
            overlay.style.display = 'flex';
            document.getElementById('disease-result').classList.add('hidden');
            
            setTimeout(() => {
                overlay.style.display = 'none';
                
                const symptomsKeys = Object.keys(diseaseData[crop].symptoms);
                const randomSymptom = symptomsKeys[Math.floor(Math.random() * symptomsKeys.length)];
                const disease = diseaseData[crop].symptoms[randomSymptom];

                const box = document.getElementById('disease-result');
                box.innerHTML = `<h3>🔍 Smart Scan Identified: <span style="color:var(--primary-color)">${disease.name}</span></h3>
                                 <p style="font-size:0.9rem; color:var(--text-light); margin-bottom:1rem;">Detected visual marker via AI Simulation: <em style="text-transform:capitalize;">${randomSymptom}</em></p>
                                 <div style="background: rgba(46, 125, 50, 0.05); padding: 1rem; border-radius: 8px;">
                                 <strong>🛡️ Action Plan:</strong><br/> ${disease.prevention}</div>`;
                box.classList.remove('hidden');
            }, 2000);
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
}

// --- MODULE 3: FERTILIZER GUIDE ---
const fertMatrix = {
    sandy: { 
        wheat: "Heavy Organic Compost (25 tons/ha) + Split NPK 120:60:40 to avoid leaching.",
        rice: "Green Manuring + NPK 140:60:60 (Higher nitrogen split into 3 doses).",
        tomato: "Vermicompost + Calcium Nitrate spray to prevent end-rot.",
        cotton: "FYM (Farm Yard Manure) + NPK 120:60:60."
    },
    clay: {
        wheat: "NPK 100:50:50. Clay retains nutrients well, avoid excessive applications.",
        rice: "NPK 120:60:40. Apply basal zinc sulphate.",
        tomato: "Standard NPK + moderate organic manure for aeration.",
        cotton: "NPK 100:50:50 + deep slitting to improve soil breathability."
    },
    loamy: {
        wheat: "Balanced NPK 120:60:40. Highly receptive to standard fertilization.",
        rice: "NPK 120:60:60 + light top dressing of urea.",
        tomato: "NPK 100:50:50 + micronutrient foliar spray.",
        cotton: "NPK 150:75:75 ensuring high yield stability."
    }
};

function recommendFertilizer() {
    const soil = document.getElementById('fert-soil').value;
    const crop = document.getElementById('fert-crop').value;
    const box = document.getElementById('fert-result');

    if (!soil || !crop) { alert("Select both Soil and Crop type."); return; }

    const rec = fertMatrix[soil]?.[crop] || "Apply standard balanced NPK with organic mulch. Specific data unmapped for this exact edge case.";
    
    box.innerHTML = `<h3>🧪 Fertilizer Strategy</h3>
                     <p><strong>Recommendation:</strong> ${rec}</p>`;
    box.classList.remove('hidden');
}

// --- MODULE 4: WATERING SCHEDULE ---
const waterMatrix = {
    summer: {
        wheat: "Critical Stage: Every 5-7 days. High evaporation demands consistent moisture.",
        rice: "Continuous submergence (3-5cm) required. Water daily to avoid cracking.",
        tomato: "Every 2-3 days directly at roots. Avoid wetting leaves to stop fungi.",
        cotton: "Every 12-15 days. Cotton has deep roots but summer stress requires it."
    },
    winter: {
        wheat: "Every 20-25 days. Focus on crown root initiation stage.",
        rice: "Every 5-7 days depending on surface moisture.",
        tomato: "Every 7-10 days. Ensure soil is dry to touch before re-watering.",
        cotton: "Every 20-25 days. Minimize excess water logging."
    },
    rainy: {
        wheat: "Rainfed. Only irrigate if there's a prolonged dry spell of 15+ days.",
        rice: "Maintain 5cm standing water natively via monsoon. Drain excess if flooding.",
        tomato: "Protect from water-logging. Ensure raised beds and high drainage.",
        cotton: "Strictly avoid stagnation. Ensure field drains are physically cleared."
    }
};

function getWateringGuide() {
    const crop = document.getElementById('water-crop').value;
    const season = document.getElementById('water-season').value;
    const box = document.getElementById('water-result');

    if (!crop || !season) { alert("Select both Crop and Weather Season."); return; }

    const guide = waterMatrix[season]?.[crop];
    
    box.innerHTML = `<h3>💧 Watering Schedule</h3>
                     <div style="background: rgba(42, 161, 230, 0.1); border-left: 4px solid #2aa1e6; padding: 1rem; border-radius: 8px;">
                         <strong>Guideline:</strong> ${guide}
                     </div>`;
    box.classList.remove('hidden');
}
