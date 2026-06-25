# NEC-Ecom

Full-stack e-commerce platform with a React + Vite frontend and Django backend.

---

## File Structure

```
E-comm_team_1/
├── backend/              # Django backend
│   ├── Cart/
│   ├── Customer/
│   ├── EcommerceProject/ # Project settings, URLs, WSGI
│   ├── Orders/
│   ├── Product/
│   ├── Seller/
│   ├── WishList/
│   ├── core/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env
├── public/               # Static assets & mock data (JSON)
├── src/                  # React frontend source
│   ├── components/       # Shared UI (Navbar, Footer, etc.)
│   ├── pages/            # Product, Cart, Checkout, Profile, etc.
│   ├── Sellerside/       # Seller dashboard (React + Flask backend)
│   ├── assets/
│   └── services/
├── package.json
├── vite.config.js
└── README.md
```

---

## Prerequisites

- **Node.js & npm** — for the frontend
- **Python 3.10+** — for the backend

---

## Setup & Run

### Frontend (React + Vite)

```bash
npm install
npm run dev
```
Runs on http://localhost:5173

### Backend (Django)

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Runs on http://127.0.0.1:8000

### Seed Data (optional)

```bash
cd backend
python seed_data.py
```

---

## Environment Variables

Create `backend/.env` inside the `backend/` directory:

```
SECRET_KEY=your-django-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
```

---

## API Contract: Signup

`POST /api/signup` — Alias for `POST /customer/register/`

**Success (201):**
```json
{ "userId": 123, "status": "pending_verification", "message": "Verification email sent" }
```

**Errors:**

| Scenario | Status |
|---|---|
| Duplicate email | 409 |
| Duplicate mobile | 409 |
| Validation errors | 400 |
