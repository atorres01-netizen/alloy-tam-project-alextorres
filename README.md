# Alloy TAM Take-Home Project  
**Submitted by:** Alexandra Torres

This project is a simple full-stack web application demonstrating user form submission, basic identity validation logic, and dynamic success/denial outcomes based on entered data.

It was created as part of a Solutions Architect / TAM technical exercise.

---

## 🚀 Tech Stack
| Area | Technology |
|---|---|
Frontend | Svelte + Vite  
Backend | Node.js + Express  
Build Tools | npm scripts  
Version Control | Git + GitHub  

---

## ✨ Features
- Frontend form to capture applicant data
- Basic validation on user input fields
- Backend API to process submissions
- Dynamic responses: **Approved**, **Denied**, **Unknown**
- Error handling and edge cases
- Clean separation of UI vs business logic

---

## 📦 Project Structure
```
/project-root
  /src          → Svelte frontend
  /public       → Static assets
  server.js     → Express backend
  package.json  → Scripts & dependencies
```

---

## 🛠️ Scripts

**Start backend**
```bash
npm run server
```

**Start frontend**
```bash
npm run dev
```

> These are run in separate terminals during local development.

---

## 🧪 Running the App Locally

### ✅ Requirements
- Node.js 18+
- npm

### ✅ Steps
```bash
# 1. Clone this repository
git clone https://github.com/atorres01-netizen/alloy-tam-project-alextorres

# 2. Install dependencies
npm install

# 3. Start backend (Terminal window 1)
npm run server

# 4. Start frontend (Terminal window 2)
npm run dev
```

### Default URLs
| Service | URL |
|---|---|
Frontend | http://localhost:5173  
Backend | http://localhost:5000  

---

## 🔐 Environment Variables
Create a file named `.env` in the project root (not committed to GitHub)

```
PORT=5000
```

(If additional variables existed locally, configure them here)

---

## ✅ Example User Inputs
Test the form with different valid / invalid input combinations.  
Response message will classify the application as *Approved*, *Denied*, or *Unknown*.

---

## 📸 Screenshots (Optional)

You may drag and drop screenshots into this README later. Suggested placements:

```
### 🖥️ App UI
<insert screenshot here>
```

---

## 📚 Notes

- `node_modules` and build artifacts are intentionally excluded
- `.env` values are local only and not committed
- This project demonstrates frontend validation + backend logic flow

---

## 📝 License
MIT — feel free to reference or adapt structure for personal learning.

---

## 👋 About Me

Hi! I'm Alexandra Torres — a Customer Experience & Technical Solutions professional with experience in:

- Technical Account Management  
- API-driven support workflows  
- AI-enabled self-service + automation  
- Customer success + platform adoption strategy  

If you'd like to discuss this project or chat about technical roles, feel free to connect!

**🔗 LinkedIn:** https://www.linkedin.com/in/atorres01/
