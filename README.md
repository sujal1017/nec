# NEC-Ecom

NEC-Ecom is a full-stack e-commerce platform featuring a modern React + Vite frontend, a Django backend, and a separate Flask-based seller-side backend. The project is organized for modularity, scalability, and ease of development.

---

## File Tree

```
.
â”œâ”€â”€ .git/
â”œâ”€â”€ .venv/
â”œâ”€â”€ venv/
â”œâ”€â”€ README.md
â”œâ”€â”€ ecom-app/
â”‚   â”œâ”€â”€ .gitignore
â”‚   â”œâ”€â”€ README.md
â”‚   â”œâ”€â”€ eslint.config.js
â”‚   â”œâ”€â”€ index.html
â”‚   â”œâ”€â”€ package-lock.json
â”‚   â”œâ”€â”€ package.json
â”‚   â”œâ”€â”€ postcss.config.cjs
â”‚   â”œâ”€â”€ tailwind.config.js
â”‚   â”œâ”€â”€ vite.config.js
â”‚   â”œâ”€â”€ node_modules/
â”‚   â”œâ”€â”€ public/
â”‚   â”‚   â”œâ”€â”€ ads.json
â”‚   â”‚   â”œâ”€â”€ categories.json
â”‚   â”‚   â”œâ”€â”€ favicon.ico
â”‚   â”‚   â”œâ”€â”€ shopping-bag.png
â”‚   â”‚   â”œâ”€â”€ data/
â”‚   â”‚   â”‚   â”œâ”€â”€ banners.json
â”‚   â”‚   â”‚   â”œâ”€â”€ bids.json
â”‚   â”‚   â”‚   â”œâ”€â”€ carts.json
â”‚   â”‚   â”‚   â”œâ”€â”€ products.json
â”‚   â”‚   â”‚   â”œâ”€â”€ profile.json
â”‚   â”‚   â”‚   â”œâ”€â”€ search.json
â”‚   â”‚   â”‚   â”œâ”€â”€ sellers.json
â”‚   â”‚   â”‚   â”œâ”€â”€ wishlist.json
â”‚   â”‚   â”œâ”€â”€ images/
â”‚   â”‚   â”‚   â”œâ”€â”€ ad1.jpg
â”‚   â”‚   â”‚   â”œâ”€â”€ ad2.jpg
â”‚   â”‚   â”‚   â”œâ”€â”€ ad3.jpg
â”‚   â”‚   â”‚   â”œâ”€â”€ avatar.png
â”‚   â”‚   â”‚   â”œâ”€â”€ headphones.jpg
â”‚   â”‚   â”‚   â”œâ”€â”€ phone-case.jpg
â”‚   â”‚   â”‚   â”œâ”€â”€ products/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ ... (product images)
â”‚   â”‚   â”‚   â”œâ”€â”€ category/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ ... (category images)
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ App.css
â”‚   â”‚   â”œâ”€â”€ App.jsx
â”‚   â”‚   â”œâ”€â”€ index.css
â”‚   â”‚   â”œâ”€â”€ main.jsx
â”‚   â”‚   â”œâ”€â”€ theme.js
â”‚   â”‚   â”œâ”€â”€ assets/
â”‚   â”‚   â”‚   â””â”€â”€ ... (icons, images)
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”‚   â”œâ”€â”€ Footer.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Navbar.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ ProductCard.jsx
â”‚   â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”‚   â”œâ”€â”€ Bids.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Cart.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Checkout.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ HeroSection.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ OrderSection.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ PaymentGateway.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ PraductPage.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ ProductDetails.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ ProductListing.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Profile.jsx
â”‚   â”‚   â”‚   â”œâ”€â”€ Wishlist.jsx
â”‚   â”‚   â”œâ”€â”€ Sellerside/
â”‚   â”‚   â”‚   â”œâ”€â”€ Backend/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ __pycache__/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ app.py
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ auth.py
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ config.py
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ instance/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ users.db
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ models.py
â”‚   â”‚   â”‚   â”œâ”€â”€ Front-end/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ App.css
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Maindashboard.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Nav.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Preformance.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Productlisting.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ assets/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ index.css
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ main.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Profile/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Address.jsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Messages.jsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Password.jsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Profile.jsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Profilenav.jsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Topnav.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Signup/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ Signup.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Login/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ Login.jsx
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Addproduct/
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Adddetails.jsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Addproduct.jsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Applicationlive.jsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Chooseop.jsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Preview.jsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ Suggestion.jsx
â”‚   â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ shoesAndIphones.json

---

## Project Structure & Main Components

- **ecom-app/**: The main frontend, built with React, Vite, Tailwind CSS, and Material-UI. Contains all user-facing pages, components, and assets.
  - `src/pages/`: Main user pages (Product Listing, Product Details, Cart, Checkout, Profile, etc.).
  - `src/components/`: Shared UI components (Navbar, Footer, ProductCard).
  - `src/assets/`: Static images and icons.
  - `public/`: Static files, images, and mock data (JSON).
  - `Sellerside/`: Seller dashboard, with both a React frontend and a Flask backend for seller operations.
    - `Front-end/`: Seller dashboard UI.
    - `Backend/`: Flask backend for seller authentication and product management.

- **nec_ecom_backend/**: The main backend, built with Django.
  - `core/`: Django app for core models and logic.
  - `nec_ecom_backend/`: Django project settings, URLs, and entry points.

- **.venv/**, **venv/**: Python virtual environments for backend dependencies.

---

## Getting Started

### Prerequisites

- Node.js & npm (for frontend)
- Python 3.x (for backend)
- PostgreSQL (for Django backend database)

### Frontend Setup

```bash
cd ecom-app
npm install
npm run dev
```

### Django Backend Setup


Frontend will run on:

http://localhost:5173

```bash
E-comm_team_1
npm install
npm run dev
```

```bash
cd backend
python -m venv env
.\env\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py runserver
```
```bash
If your modules do not contain __init__.py, run:

foreach ($folder in "Customer","Orders","Cart","WishList") { 
    ni "$folder\__init__.py" -Force 
}

python manage.py makemigrations Customer
python manage.py makemigrations Cart
python manage.py makemigrations Orders
python manage.py makemigrations WishList

python manage.py 
python manage.py runserver
```

Backend will run on:
http://127.0.0.1:8000

```bash

backend
 |-carts 
 |-Customer
 |-EcommerceProject
    |-.env ## file this .env place
    |-asgi.py
    |-settings.py
    |-urls.py
    |-wsgi.py
```
## Notes

- The frontend uses mock data in `public/data/` for development.
- The Django backend is scaffolded for future API and admin features.
- The seller dashboard is a separate module, with its own backend and frontend.








---

## API Contract: Signup

`POST /api/signup` is the public API contract alias for customer signup. It uses the same registration flow as `POST /customer/register/`, which remains supported for backward compatibility.

Successful registration returns `201 Created`:

```json
{
  "userId": 123,
  "status": "pending_verification",
  "message": "Verification email sent"
}
```

Error responses:

| Scenario | HTTP status |
|---|---:|
| Duplicate email | 409 |
| Duplicate mobile | 409 |
| Validation errors | 400 |
```


