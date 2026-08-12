# Quiz Management & Online Assessment System

A production-ready, full-stack **Quiz Management & Online Assessment System** built with Node.js, Express.js, React.js (Vite), MongoDB (Mongoose), and Tailwind CSS. The application provides dedicated, role-protected portals for **Super Admins**, **Admins**, and **Students**.

---

## 🌟 Key Features

### 👑 Super Admin & Admin Capabilities
- **Super Admin Account**: Initial seeded account (`admin@quiz.com` / `Admin@123` stored securely as a bcrypt hash).
- **Admin Management**: Super Admins can create, edit, activate/deactivate, reset passwords for, or delete Admin accounts (Initial Super Admin cannot be deleted or deactivated).
- **Interactive Dashboard**: Summary stat cards (Total Quiz Attempts, Total Quizzes, Total Students, Average Score, Completed, In-Progress, Expired, Pass Percentage) and a paginated/filterable Quiz Results Table.
- **Dynamic Quiz Builder**: Configure basic details, passing percentage, total marks, and settings (Randomize Questions/Options, Allow Back Navigation, Negative Marking).
- **Section Management**: Optional section hierarchy with section reordering and move features.
- **Dynamic Question Creator**: 4-option multiple-choice questions with correct answer key configuration, marks, and negative marks per question.
- **Quiz Preview Simulator**: Admin preview of candidate exam UI with visible correct answers.
- **Candidate Assignment & Emailing**: Assign quizzes to candidate emails, auto-generate credentials & secure unique assignment tokens, send invitation emails via Nodemailer.
- **Results & Question Analysis**: View detailed student attempt metrics, total scores, pass/fail status, and question-by-question candidate analysis.

### 🎓 Student Examination Engine
- **Distraction-Free SaaS Exam UI**: Single question display with option selection.
- **Single Attempt Rule**: Strictly enforces one attempt per student assignment token.
- **Server-Authoritative Timer**: Auto-submits exam when the server timer expires.
- **Auto-Save & Resume**: Continuously saves student selections. Browser refresh or crash automatically resumes active attempt without creating duplicates.
- **Multi-Device Protection**: Single active attempt state validated on backend.
- **Question Navigator & Statuses**: Visual indicator for `ANSWERED`, `REVIEW_LATER`, `SKIPPED`, and `NOT_VISITED` questions (never exposes correctness/score).
- **Review Mode & Final Confirmation**: Ability to revise answers before final submission if time remains.
- **Zero Result Leak Security**: Student APIs and screens strictly display **ONLY** `"Quiz Submitted Successfully"`. Correct answers, marks, scores, percentages, and pass/fail statuses are NEVER returned or rendered to students.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Axios, Tailwind CSS, Lucide React icons
- **Backend**: Node.js, Express.js, REST API, JWT authentication, bcryptjs, Nodemailer
- **Database**: MongoDB & Mongoose (with fail-safe MongoMemoryServer fallback)
- **Security**: Helmet, CORS, Rate limiting (`express-rate-limit`), bcrypt hashing, role authorization

---

## 📂 Project Structure

```text
quiz-management-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── routes/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── seeders/
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Database Seeding
To seed the initial Super Admin account and sample quiz:

```bash
cd quiz-management-system/backend
npm run seed
```

**Seeded Super Admin Credentials**:
- **Email**: `admin@quiz.com`
- **Password**: `Admin@123`
- **Role**: `SUPER_ADMIN`

### 2. Start Backend API
```bash
cd quiz-management-system/backend
npm run dev
```
Backend server runs at `http://localhost:5000`.

### 3. Start Frontend Client
```bash
cd quiz-management-system/frontend
npm run dev
```
Frontend application runs at `http://localhost:5173`.

---

## 📄 License
ISC License. Built for production deployment.
