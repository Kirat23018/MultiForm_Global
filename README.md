# MultiForm Global (MFG)

> Full-Stack Multi-Service Digital Agency Platform & Management Suite.

MultiForm Global provides cutting-edge digital solutions ranging from Custom Software & Web Development, Brand Identity & UI/UX Design, Performance Marketing & SEO, to Academic/Corporate Automation pipelines.

---

## 🌟 Key Features

- **Dynamic Interactive Client Portal**:
  - Modern responsive dark-mode / glassmorphism interface.
  - Multi-service inquiry booking with dynamic service & budget selectors.
  - Dual-dispatch notification system: Instant WhatsApp routing + Nodemailer SMTP automated alerts.
- **Admin Management Suite**:
  - Secure JWT-based authentication & role-based access control.
  - Full CRUD control over media assets, portfolio items, and client inquiries.
  - Real-time client lead management and database synchronization.
- **File Upload & Asset Storage**:
  - High-performance asset handling using Multer.
- **Lightweight JSON Database Engine**:
  - Fast, portable file-based JSON database with automatic backup and error recovery.

---

## 🚀 Tech Stack

- **Frontend**: HTML5, Modern Vanilla CSS3 (Custom Glassmorphism, Micro-animations, CSS Grid/Flexbox), Vanilla JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Authentication**: JSON Web Tokens (JWT), bcryptjs
- **File Uploads**: Multer
- **Email Dispatch**: Nodemailer
- **Database**: Local JSON File Database (`database.json` / `data/`)

---

## 📁 Project Structure

```text
├── assets/
│   ├── css/
│   │   ├── style.css
│   │   └── ...
│   ├── js/
│   │   ├── main.js
│   │   ├── whatsapp-form.js
│   │   └── ...
│   └── images/
├── data/
│   └── database.json
├── uploads/
├── .env.example
├── .gitignore
├── auth.html
├── contact.html
├── database.js
├── database.json
├── feedback.html
├── founders.html
├── index.html
├── login.html
├── package.json
├── portfolio.html
├── server.js
└── services.html
```

---

## ⚙️ Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/Kirat23018/MultiForm_Global.git
cd MultiForm_Global
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your configuration:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
TEAM_EMAIL=your_email@example.com
EMAIL_APP_PASSWORD=your_gmail_app_password
NOTIFICATION_EMAILS=your_email@example.com
```

### 5. Run the Server
```bash
# Production mode
npm start

# Development mode (with file watching)
npm run dev
```

Visit the application at: `http://localhost:5000`

---

## 📄 License

ISC License. Copyright (c) MultiForm Global.
