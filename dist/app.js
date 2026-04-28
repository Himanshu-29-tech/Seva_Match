"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const Need_1 = __importDefault(require("./models/Need"));
const Volunteer_1 = __importDefault(require("./models/Volunteer"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// ================= ENV CHECK =================
console.log("🔍 MONGODB:", process.env.MONGODB_URI ? "Loaded" : "Missing");
console.log("🔍 GEMINI:", process.env.GEMINI_API_KEY ? "Loaded (optional now)" : "Not used");
// ================= MIDDLEWARE =================
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// Background style
app.use((req, res, next) => {
    res.locals.backgroundStyle = `
    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #ffffff 100%);
    min-height: 100vh;
    color: #ffffff;
  `;
    next();
});
// ================= DB CONNECT =================
const MONGO = process.env.MONGODB_URI;
if (!MONGO) {
    console.error("❌ MongoDB URI missing");
    process.exit(1);
}
mongoose_1.default.connect(MONGO)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Error:", err.message));
// ================= ROUTES =================
app.get('/', (req, res) => res.render('index'));
app.get('/need-form', (req, res) => res.render('need-form'));
app.get('/volunteer-form', (req, res) => res.render('volunteer-form'));
// ================= SUBMIT NEED =================
app.post('/submit-need', async (req, res) => {
    try {
        const need = new Need_1.default(req.body);
        await need.save();
        console.log("✅ Need Saved:", need.name);
        res.send(`
      <h2 style="text-align:center;color:green;margin-top:50px;">
        Need Submitted Successfully ✅
      </h2>
      <div style="text-align:center;margin-top:20px;">
        <a href="/">Go Home</a>
      </div>
    `);
    }
    catch (err) {
        console.log(err);
        res.status(500).send("Error saving need");
    }
});
// ================= SUBMIT VOLUNTEER =================
app.post('/submit-volunteer', async (req, res) => {
    try {
        const vol = new Volunteer_1.default(req.body);
        await vol.save();
        console.log("✅ Volunteer Saved:", vol.name);
        res.send(`
      <h2 style="text-align:center;color:green;margin-top:50px;">
        Volunteer Registered ✅
      </h2>
      <div style="text-align:center;margin-top:20px;">
        <a href="/">Go Home</a>
      </div>
    `);
    }
    catch (err) {
        console.log(err);
        res.status(500).send("Error saving volunteer");
    }
});
// ================= DASHBOARD =================
app.get('/dashboard', async (req, res) => {
    const needs = await Need_1.default.find().sort({ createdAt: -1 });
    const volunteers = await Volunteer_1.default.find().sort({ createdAt: -1 });
    res.render('dashboard', { needs, volunteers });
});
// ================= SMART MATCH (LOCAL AI) =================
app.get('/smart-match/:needId', async (req, res) => {
    try {
        const need = await Need_1.default.findById(req.params.needId);
        const volunteers = await Volunteer_1.default.find();
        if (!need)
            return res.send("Need not found");
        const scored = volunteers.map(v => {
            let score = 0;
            let reasons = [];
            if (v.location.toLowerCase().includes(need.location.toLowerCase())) {
                score += 40;
                reasons.push("Same location");
            }
            if (v.skills.toLowerCase().includes(need.type.toLowerCase()) ||
                need.description.toLowerCase().includes(v.skills.toLowerCase())) {
                score += 35;
                reasons.push("Skill match");
            }
            if (v.availability === "Full Time" || v.availability === "Emergency") {
                score += 15;
                reasons.push("High availability");
            }
            if (need.urgency === "High") {
                score += 10;
                reasons.push("Urgent case");
            }
            return {
                ...v.toObject(),
                score,
                reasons
            };
        });
        scored.sort((a, b) => b.score - a.score);
        const topMatches = scored.slice(0, 3);
        // ================= UI =================
        res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Smart Match Result</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

  <style>
    body {
      background: linear-gradient(135deg, #0f0f0f, #1a1a1a, #ffffff);
      min-height: 100vh;
      font-family: Arial;
    }

    .container-box {
      max-width: 900px;
      margin: 50px auto;
      padding: 30px;
    }

    .header-card {
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 20px;
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .vol-card {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      padding: 20px;
      margin-top: 15px;
      color: white;
      transition: 0.3s;
    }

    .vol-card:hover {
      transform: translateY(-5px);
      background: rgba(255,255,255,0.15);
    }

    .score {
      color: #00ff99;
      font-weight: bold;
    }

    .badge-custom {
      background: #0d6efd;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 12px;
    }

    a {
      color: #fff;
      text-decoration: none;
    }

    .back-btn {
      margin-top: 20px;
      display: inline-block;
      padding: 10px 15px;
      background: #dc3545;
      border-radius: 8px;
    }
  </style>
</head>

<body>

<div class="container-box">

  <div class="header-card">
    <h2>🤖 Smart Match Result</h2>
    <h5>Need: ${need.name} (${need.type})</h5>
    <p>📍 Location: ${need.location}</p>
    <p>⚡ Urgency: ${need.urgency}</p>
  </div>

  ${topMatches.map((match, index) => `
    <div class="vol-card">
      <h4>#${index + 1} ${match.name}</h4>

      <p><span class="badge-custom">📍 ${match.location}</span></p>

      <p>🧠 Skills: ${match.skills}</p>
      <p>⏰ Availability: ${match.availability}</p>

      <p class="score">⭐ Match Score: ${match.score}/100</p>

      <p>💡 Why matched: ${match.reasons.join(", ")}</p>
    </div>
  `).join("")}

  <a class="back-btn" href="/dashboard">← Back to Dashboard</a>

</div>

</body>
</html>
`);
    }
    catch (err) {
        console.log("Smart Match Error:", err);
        res.status(500).send("Smart Match failed");
    }
});
// ================= ASSIGN =================
app.post('/assign', async (req, res) => {
    try {
        const { needId, volunteerId } = req.body;
        const vol = await Volunteer_1.default.findById(volunteerId);
        await Need_1.default.findByIdAndUpdate(needId, {
            status: "Assigned",
            assignedVolunteer: vol?.name
        });
        res.redirect('/dashboard');
    }
    catch (err) {
        console.log(err);
        res.status(500).send("Assign failed");
    }
});
//==================ui/ux================
app.get('/', (req, res) => res.render('index'));
app.get('/need-form', (req, res) => res.render('need-form'));
app.get('/volunteer-form', (req, res) => res.render('volunteer-form'));
app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/register', (req, res) => {
    res.render('register');
});
// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
