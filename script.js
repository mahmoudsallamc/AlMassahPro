console.log("AlMassahPro Started");

// المتغيرات العامة لتخزين آخر نتيجة
let currentResult = {};

window.onload = () => {
    // زيادة الوقت لـ 3.5 ثانية لضمان انتهاء أنيميشن الاسم
    setTimeout(() => {
        let splash = document.getElementById("splash-screen");
        splash.style.opacity = "0";
        setTimeout(() => {
            splash.style.display = "none";
        }, 800);
    }, 3500);
    loadHistory(); // تحميل المحفوظات عند الفتح
};

// --- التنقل بين الصفحات ---
function toggleView(view) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    if (view === 'main') {
        document.getElementById('main-view').style.display = 'block';
        document.getElementById('history-view').style.display = 'none';
        document.querySelector('.nav-btn:nth-child(1)').classList.add('active');
    } else {
        document.getElementById('main-view').style.display = 'none';
        document.getElementById('history-view').style.display = 'block';
        document.querySelector('.nav-btn:nth-child(2)').classList.add('active');
    }
}

let measureType = "full";
let divider = 14;

function selectMeasure(type, button) {
    measureType = type;
    document.querySelectorAll(".measure-grid .option").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    drawLand();
}

function selectDivider(value, button) {
    divider = value;
    document.querySelectorAll(".divider-options .option").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
}

function drawLand() {
    let top = Number(document.getElementById("topWidth").value) || 0;
    let bottom = Number(document.getElementById("bottomWidth").value) || 0;
    let length = Number(document.getElementById("length").value) || 0;
    
    let hint = document.getElementById("drawing-hint");
    let polygon = document.getElementById("land-shape");

    if (top === 0 && bottom === 0 && length === 0) {
        hint.style.opacity = "0.5";
        polygon.setAttribute("points", "50,50 150,50 150,150 50,150");
        return;
    }

    hint.style.opacity = "0";
    let maxWidth = Math.max(top, bottom);
    if (maxWidth === 0) maxWidth = 1;
    if (length === 0) length = 1;

    let scaleX = 160 / maxWidth; 
    let scaleY = 160 / length;

    let scaledTop = top * scaleX;
    let scaledBottom = bottom * scaleX;
    let scaledLength = length * scaleY;

    let topX1 = 100 - (scaledTop / 2);
    let topX2 = 100 + (scaledTop / 2);
    let bottomX1 = 100 - (scaledBottom / 2);
    let bottomX2 = 100 + (scaledBottom / 2);
    let startY = 100 - (scaledLength / 2);
    let endY = 100 + (scaledLength / 2);

    let points = `${topX1},${startY} ${topX2},${startY} ${bottomX2},${endY} ${bottomX1},${endY}`;
    polygon.setAttribute("points", points);
}

function playProSound() {
    try {
        let ctx = new (window.AudioContext || window.webkitAudioContext)();
        let osc = ctx.createOscillator();
        let gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
    } catch(e) { console.log("الصوت غير مدعوم"); }
}

function convertToLandUnits(qiratValue) {
    let feddan = Math.floor(qiratValue / 24);
    let remainingQirat = qiratValue - (feddan * 24);
    let qirat = Math.floor(remainingQirat);
    let saham = Math.round((remainingQirat - qirat) * 24);
    return { feddan, qirat, saham };
}

function calculateArea() {
    let top = Number(document.getElementById("topWidth").value);
    let bottom = Number(document.getElementById("bottomWidth").value);
    let length = Number(document.getElementById("length").value);

    if (top <= 0 || bottom <= 0 || length <= 0) {
        alert("اكتب كل القياسات بشكل صحيح");
        return;
    }

    if ("vibrate" in navigator) navigator.vibrate(80);
    playProSound();

    let resultBox1 = document.getElementById("result-box");
    let resultBox2 = document.getElementById("meter-result-box");
    
    resultBox1.classList.remove("animate-result");
    resultBox2.classList.remove("animate-result");
    void resultBox1.offsetWidth; 
    resultBox1.classList.add("animate-result");
    resultBox2.classList.add("animate-result");

    let averageWidth = (top + bottom) / 2;
    let qiratValue = 0;
    let areaInSqMeters = 0;

    if (measureType === "half") {
        let halfAverageWidth = ((top/2) + (bottom/2)) / 2;
        let halfLength = length / 2;
        qiratValue = (halfAverageWidth * halfLength) / divider;
        areaInSqMeters = qiratValue * divider * 12.5; 
    } else if (measureType === "meter") {
        areaInSqMeters = averageWidth * length;
        let areaInSqBousa = areaInSqMeters / 12.5; 
        qiratValue = areaInSqBousa / divider;
    } else { 
        qiratValue = (averageWidth * length) / divider;
        areaInSqMeters = qiratValue * divider * 12.5;
    }

    let result = convertToLandUnits(qiratValue);

    document.getElementById("feddan").innerHTML = result.feddan + " فدان";
    document.getElementById("qirat").innerHTML = result.qirat + " قيراط";
    document.getElementById("saham").innerHTML = result.saham + " سهم";
    let sqMetersFormatted = areaInSqMeters.toFixed(2) + " متر مربع";
    document.getElementById("squareMeters").innerHTML = sqMetersFormatted;

    // تخزين البيانات للقدرة على حفظها
    currentResult = {
        top: top,
        bottom: bottom,
        length: length,
        feddan: result.feddan,
        qirat: result.qirat,
        saham: result.saham,
        sqMeters: sqMetersFormatted
    };

    // إظهار قسم الإجراءات (حفظ، مشاركة، pdf)
    document.getElementById("action-section").style.display = "block";
}

// --- وظائف الحفظ والمشاركة ---

function saveOperation() {
    let name = document.getElementById("operationName").value || "عملية بدون اسم";
    let history = JSON.parse(localStorage.getItem('almassah_history')) || [];
    
    let newOp = {
        id: Date.now(),
        name: name,
        dimensions: `فوق: ${currentResult.top} | تحت: ${currentResult.bottom} | طول: ${currentResult.length}`,
        area: `${currentResult.feddan} فدان، ${currentResult.qirat} قيراط، ${currentResult.saham} سهم`
    };

    history.push(newOp);
    localStorage.setItem('almassah_history', JSON.stringify(history));
    
    alert("تم حفظ العملية بنجاح! 💾");
    document.getElementById("operationName").value = "";
    loadHistory();
}

function loadHistory() {
    let history = JSON.parse(localStorage.getItem('almassah_history')) || [];
    let tbody = document.getElementById("history-body");
    tbody.innerHTML = "";

    if (history.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>لا توجد عمليات محفوظة</td></tr>";
        return;
    }

    history.reverse().forEach(item => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td style="font-size:12px; color:#555;">${item.dimensions}</td>
            <td style="color:#2e7d32; font-weight:bold;">${item.area}</td>
            <td><button class="delete-btn" onclick="deleteOperation(${item.id})"><i class="fas fa-trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteOperation(id) {
    let history = JSON.parse(localStorage.getItem('almassah_history')) || [];
    history = history.filter(item => item.id !== id);
    localStorage.setItem('almassah_history', JSON.stringify(history));
    loadHistory();
}

function shareOperation() {
    let textToShare = `نتيجة المساح الزراعي PRO 🌾\n\nالمساحة: ${currentResult.feddan} فدان و ${currentResult.qirat} قيراط و ${currentResult.saham} سهم.\nالمساحة بالمتر: ${currentResult.sqMeters}\n\n©By/ Mahmoud Sallam`;
    
    if (navigator.share) {
        navigator.share({
            title: 'نتيجة قياس الأرض',
            text: textToShare
        }).catch(err => console.log("تم إلغاء المشاركة"));
    } else {
        // بديل للأجهزة التي لا تدعم Web Share (يفتح واتساب مباشرة)
        window.open(`https://wa.me/?text=${encodeURIComponent(textToShare)}`);
    }
}

function downloadPDF() {
    let element = document.getElementById('pdf-content');
    let opt = {
      margin:       1,
      filename:     'AlMassah_Result.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}
