// ============================================
// BILDEBASERT MØNSTER
// ============================================

let puzzleImageUrl = null;
let selectedImageId = 0;
let defaultImages = []; // { id, name, url }

function createCanvas() {
    const c = document.createElement('canvas');
    c.width = 360;
    c.height = 480;
    return { c, ctx: c.getContext('2d') };
}

/** Landskap med fjell, hytte og vann */
function generateLandscape() {
    const { c, ctx } = createCanvas();

    const sky = ctx.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, '#0f52ba');
    sky.addColorStop(0.6, '#5b9bd5');
    sky.addColorStop(1, '#a8d8ea');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 360, 280);

    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.arc(290, 75, 38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF3B0';
    ctx.beginPath(); ctx.arc(290, 75, 28, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    [[50,55,35],[100,45,25],[160,70,30]].forEach(([x,y,r]) => {
        ctx.beginPath();
        ctx.arc(x,y,r,0,Math.PI*2); ctx.arc(x+r*0.9,y-r*0.4,r*0.7,0,Math.PI*2); ctx.arc(x+r*1.5,y,r*0.8,0,Math.PI*2);
        ctx.fill();
    });

    ctx.fillStyle = '#5a7d6a';
    ctx.beginPath(); ctx.moveTo(-20,280); ctx.lineTo(100,150); ctx.lineTo(200,220); ctx.lineTo(280,130); ctx.lineTo(380,240); ctx.lineTo(380,280); ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(100,150); ctx.lineTo(85,178); ctx.lineTo(115,175); ctx.fill();
    ctx.beginPath(); ctx.moveTo(280,130); ctx.lineTo(262,162); ctx.lineTo(298,158); ctx.fill();

    ctx.fillStyle = '#3d6b4e';
    ctx.beginPath(); ctx.moveTo(40,280); ctx.lineTo(180,190); ctx.lineTo(320,280); ctx.fill();

    const grass = ctx.createLinearGradient(0,270,0,350);
    grass.addColorStop(0,'#4caf50'); grass.addColorStop(1,'#2e7d32');
    ctx.fillStyle = grass; ctx.fillRect(0,270,360,80);

    const water = ctx.createLinearGradient(0,340,0,480);
    water.addColorStop(0,'#2196F3'); water.addColorStop(0.5,'#1565C0'); water.addColorStop(1,'#0D47A1');
    ctx.fillStyle = water; ctx.fillRect(0,340,360,140);

    ctx.globalAlpha = 0.25; ctx.fillStyle = '#90CAF9';
    [[20,360,100,3],[150,375,80,2],[250,365,90,3],[60,395,70,2],[200,405,110,3],[30,425,120,2],[180,440,80,3],[80,460,100,2],[260,450,70,3]].forEach(([x,y,w,h]) => ctx.fillRect(x,y,w,h));
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#c0392b'; ctx.fillRect(155,248,30,24);
    ctx.fillStyle = '#7f1d1e'; ctx.beginPath(); ctx.moveTo(150,248); ctx.lineTo(170,234); ctx.lineTo(190,248); ctx.fill();
    ctx.fillStyle = '#F1C40F'; ctx.fillRect(165,258,8,8);

    return c.toDataURL();
}

/** Norsk flagg */
function generateFlag() {
    const { c, ctx } = createCanvas();

    ctx.fillStyle = '#BA0C2F';
    ctx.fillRect(0, 0, 360, 480);

    // Hvitt kors
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(100, 0, 60, 480);
    ctx.fillRect(0, 190, 360, 100);

    // Blått kors
    ctx.fillStyle = '#00205B';
    ctx.fillRect(115, 0, 30, 480);
    ctx.fillRect(0, 205, 360, 70);

    return c.toDataURL();
}

/** Solnedgang over havet */
function generateSunset() {
    const { c, ctx } = createCanvas();

    // Himmel gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#1a0533');
    sky.addColorStop(0.3, '#6b2fa0');
    sky.addColorStop(0.5, '#e85d04');
    sky.addColorStop(0.7, '#f48c06');
    sky.addColorStop(1, '#ffba08');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 360, 300);

    // Sol
    ctx.fillStyle = '#fff7d6';
    ctx.beginPath(); ctx.arc(180, 260, 50, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe566';
    ctx.beginPath(); ctx.arc(180, 260, 40, 0, Math.PI * 2); ctx.fill();

    // Hav
    const sea = ctx.createLinearGradient(0, 280, 0, 480);
    sea.addColorStop(0, '#e85d04');
    sea.addColorStop(0.3, '#c77b30');
    sea.addColorStop(0.6, '#1a5276');
    sea.addColorStop(1, '#0a1628');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 280, 360, 200);

    // Solrefleksjon i vann
    ctx.globalAlpha = 0.4;
    const refl = ctx.createLinearGradient(0, 280, 0, 480);
    refl.addColorStop(0, '#ffe566');
    refl.addColorStop(1, 'transparent');
    ctx.fillStyle = refl;
    ctx.fillRect(140, 280, 80, 200);
    ctx.globalAlpha = 0.2;
    [[120,300,16,3],[160,320,40,2],[140,345,60,3],[125,370,30,2],[170,390,40,3],[130,415,50,2],[155,440,35,3],[140,465,45,2]].forEach(([x,y,w,h]) => {
        ctx.fillStyle = '#ffe566'; ctx.fillRect(x,y,w,h);
    });
    ctx.globalAlpha = 1;

    // Stjerner
    ctx.fillStyle = '#fff';
    [[40,30],[90,60],[280,20],[320,50],[200,15],[50,100],[310,90],[250,45]].forEach(([x,y]) => {
        ctx.beginPath(); ctx.arc(x,y,1.5,0,Math.PI*2); ctx.fill();
    });

    return c.toDataURL();
}

/** Nordlys over vinterlandskap */
function generateNorthernLights() {
    const { c, ctx } = createCanvas();

    // Nattehimmel
    const sky = ctx.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#0a0e27');
    sky.addColorStop(0.5, '#111d4a');
    sky.addColorStop(1, '#1a2a5e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 360, 320);

    // Nordlys (bølgende grønne/lilla bånd)
    ctx.globalAlpha = 0.3;
    const colors = ['#00ff88','#00cc66','#22ddaa','#8844ff','#00ff88'];
    colors.forEach((color, i) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 18 + i * 4;
        ctx.beginPath();
        ctx.moveTo(-20, 80 + i * 30);
        ctx.bezierCurveTo(80, 40 + i * 25, 160, 120 + i * 20, 240, 60 + i * 30);
        ctx.bezierCurveTo(300, 30 + i * 28, 340, 90 + i * 22, 380, 50 + i * 30);
        ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Stjerner
    ctx.fillStyle = '#fff';
    [[30,20],[80,50],[150,15],[220,40],[290,25],[340,55],[50,90],[180,80],
     [260,70],[320,100],[40,140],[130,130],[250,150],[310,135]].forEach(([x,y]) => {
        ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI*2); ctx.fill();
    });

    // Snødekket bakke
    const snow = ctx.createLinearGradient(0, 300, 0, 480);
    snow.addColorStop(0, '#d6e8f0');
    snow.addColorStop(0.3, '#c4dce8');
    snow.addColorStop(1, '#a8c8d8');
    ctx.fillStyle = snow;
    ctx.fillRect(0, 300, 360, 180);

    // Snødekte trær (grantrær)
    const trees = [[60,280,40],[140,260,50],[250,270,45],[330,285,35],[90,310,30],[200,295,38],[300,305,32]];
    trees.forEach(([x, y, h]) => {
        // Stamme
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(x - 3, y, 6, h * 0.3);
        // Grønt tre
        ctx.fillStyle = '#1a4d2e';
        ctx.beginPath(); ctx.moveTo(x, y - h * 0.6); ctx.lineTo(x - h * 0.35, y); ctx.lineTo(x + h * 0.35, y); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, y - h * 0.8); ctx.lineTo(x - h * 0.25, y - h * 0.3); ctx.lineTo(x + h * 0.25, y - h * 0.3); ctx.fill();
        // Snø på tre
        ctx.fillStyle = 'rgba(220,235,245,0.7)';
        ctx.beginPath(); ctx.moveTo(x, y - h * 0.8); ctx.lineTo(x - h * 0.18, y - h * 0.5); ctx.lineTo(x + h * 0.18, y - h * 0.5); ctx.fill();
    });

    // Snøflak
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    [[20,180],[70,220],[120,190],[170,240],[220,200],[270,230],[320,210],
     [45,260],[95,280],[160,270],[210,290],[280,260],[340,280]].forEach(([x,y]) => {
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
    });

    return c.toDataURL();
}

/** Romskip / verdensrom */
function generateSpace() {
    const { c, ctx } = createCanvas();

    // Mørk bakgrunn
    const bg = ctx.createRadialGradient(180, 240, 50, 180, 240, 350);
    bg.addColorStop(0, '#1a1a3e');
    bg.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 360, 480);

    // Stjerner
    ctx.fillStyle = '#fff';
    const stars = [
        [20,15],[55,40],[100,20],[150,55],[200,10],[250,35],[300,25],[340,50],
        [30,80],[80,110],[140,90],[210,120],[270,85],[330,100],[15,150],[70,170],
        [130,155],[190,180],[250,145],[310,165],[40,210],[100,230],[170,205],
        [230,240],[290,215],[350,235],[25,270],[85,290],[155,275],[220,300],
        [280,265],[345,285],[50,330],[120,350],[180,320],[240,340],[310,325],
        [35,380],[95,400],[160,385],[225,410],[285,370],[340,395],[20,440],
        [80,460],[145,445],[210,470],[275,435],[330,455],
    ];
    stars.forEach(([x,y]) => {
        const r = Math.random() > 0.7 ? 2 : 1;
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    });

    // Planet (stor)
    const planet = ctx.createRadialGradient(140, 200, 10, 180, 180, 80);
    planet.addColorStop(0, '#4FC3F7');
    planet.addColorStop(0.5, '#0288D1');
    planet.addColorStop(1, '#01579B');
    ctx.fillStyle = planet;
    ctx.beginPath(); ctx.arc(160, 200, 70, 0, Math.PI*2); ctx.fill();

    // Ring rundt planet
    ctx.strokeStyle = 'rgba(200,200,255,0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(160, 200, 110, 25, -0.3, 0, Math.PI * 2);
    ctx.stroke();

    // Liten planet
    const p2 = ctx.createRadialGradient(290, 350, 5, 300, 340, 30);
    p2.addColorStop(0, '#FF8A65');
    p2.addColorStop(1, '#BF360C');
    ctx.fillStyle = p2;
    ctx.beginPath(); ctx.arc(290, 350, 28, 0, Math.PI*2); ctx.fill();

    // Rakett
    ctx.fillStyle = '#E0E0E0';
    ctx.beginPath(); ctx.moveTo(70, 350); ctx.lineTo(85, 310); ctx.lineTo(100, 350); ctx.fill();
    ctx.fillStyle = '#F44336';
    ctx.beginPath(); ctx.moveTo(85, 310); ctx.lineTo(78, 325); ctx.lineTo(92, 325); ctx.fill();
    ctx.fillStyle = '#FF9800';
    ctx.beginPath(); ctx.moveTo(75, 350); ctx.lineTo(85, 380); ctx.lineTo(95, 350); ctx.fill();
    ctx.fillStyle = '#FFEB3B';
    ctx.beginPath(); ctx.moveTo(80, 350); ctx.lineTo(85, 370); ctx.lineTo(90, 350); ctx.fill();
    // Vindu
    ctx.fillStyle = '#64B5F6';
    ctx.beginPath(); ctx.arc(85, 332, 5, 0, Math.PI*2); ctx.fill();

    return c.toDataURL();
}

/** Generer alle standardbilder */
function generateAllDefaultImages() {
    defaultImages = [
        { id: 0, name: 'Landskap',    url: generateLandscape() },
        { id: 1, name: 'Flagg',       url: generateFlag() },
        { id: 2, name: 'Solnedgang',  url: generateSunset() },
        { id: 3, name: 'Nordlys',     url: generateNorthernLights() },
        { id: 4, name: 'Verdensrom',  url: generateSpace() },
    ];
}

/** Returner CSS-stil for en brikke (bildedel) */
function getBrickStyle(pieceIndex) {
    const col = pieceIndex % 3;
    const row = Math.floor(pieceIndex / 3);
    return {
        backgroundImage: `url('${puzzleImageUrl}')`,
        backgroundSize: '300% 400%',
        backgroundPosition: `${col * 50}% ${row * (100 / 3)}%`,
    };
}

/** Håndter opplastet bilde */
function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // Tegn bildet på canvas i 3:4 format for å passe rutenettet
            const c = document.createElement('canvas');
            c.width = 360;
            c.height = 480;
            const ctx = c.getContext('2d');

            // Crop-to-fill: fyll 3:4-rammen uten forvrengning
            const targetRatio = 3 / 4;
            const imgRatio = img.width / img.height;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;
            if (imgRatio > targetRatio) {
                sw = img.height * targetRatio;
                sx = (img.width - sw) / 2;
            } else {
                sh = img.width / targetRatio;
                sy = (img.height - sh) / 2;
            }
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 360, 480);
            puzzleImageUrl = c.toDataURL();
            renderRefGrid();
            renderUserGrid();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

const badgeColors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
    '#9b59b6', '#1abc9c', '#e91e63', '#00bcd4',
    '#ff9800', '#673ab7', '#4caf50', '#f44336',
];
