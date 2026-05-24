# NEC-Ecom

NEC-Ecom is a full-stack e-commerce platform featuring a modern React + Vite frontend, a Django backend, and a separate Flask-based seller-side backend. The project is organized for modularity, scalability, and ease of development.

---

## File Tree

```
.
├── .git/
├── .venv/
├── venv/
├── README.md
├── ecom-app/
│   ├── .gitignore
│   ├── README.md
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.cjs
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── node_modules/
│   ├── public/
│   │   ├── ads.json
│   │   ├── categories.json
│   │   ├── favicon.ico
│   │   ├── shopping-bag.png
│   │   ├── data/
│   │   │   ├── banners.json
│   │   │   ├── bids.json
│   │   │   ├── carts.json
│   │   │   ├── products.json
│   │   │   ├── profile.json
│   │   │   ├── search.json
│   │   │   ├── sellers.json
│   │   │   ├── wishlist.json
│   │   ├── images/
│   │   │   ├── ad1.jpg
│   │   │   ├── ad2.jpg
│   │   │   ├── ad3.jpg
│   │   │   ├── avatar.png
│   │   │   ├── headphones.jpg
│   │   │   ├── phone-case.jpg
│   │   │   ├── products/
│   │   │   │   └── ... (product images)
│   │   │   ├── category/
│   │   │   │   └── ... (category images)
│   ├── src/
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   ├── theme.js
│   │   ├── assets/
│   │   │   └── ... (icons, images)
│   │   ├── components/
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   ├── pages/
│   │   │   ├── Bids.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── HeroSection.jsx
│   │   │   ├── OrderSection.jsx
│   │   │   ├── PaymentGateway.jsx
│   │   │   ├── PraductPage.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── ProductListing.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Wishlist.jsx
│   │   ├── Sellerside/
│   │   │   ├── Backend/
│   │   │   │   ├── __pycache__/
│   │   │   │   ├── app.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── config.py
│   │   │   │   ├── instance/
│   │   │   │   │   └── users.db
│   │   │   │   ├── models.py
│   │   │   ├── Front-end/
│   │   │   │   ├── App.css
│   │   │   │   ├── Maindashboard.jsx
│   │   │   │   ├── Nav.jsx
│   │   │   │   ├── Preformance.jsx
│   │   │   │   ├── Productlisting.jsx
│   │   │   │   ├── assets/
│   │   │   │   ├── index.css
│   │   │   │   ├── main.jsx
│   │   │   │   ├── Profile/
│   │   │   │   │   ├── Address.jsx
│   │   │   │   │   ├── Messages.jsx
│   │   │   │   │   ├── Password.jsx
│   │   │   │   │   ├── Profile.jsx
│   │   │   │   │   ├── Profilenav.jsx
│   │   │   │   │   ├── Topnav.jsx
│   │   │   │   ├── Signup/
│   │   │   │   │   └── Signup.jsx
│   │   │   │   ├── Login/
│   │   │   │   │   └── Login.jsx
│   │   │   │   ├── Addproduct/
│   │   │   │   │   ├── Adddetails.jsx
│   │   │   │   │   ├── Addproduct.jsx
│   │   │   │   │   ├── Applicationlive.jsx
│   │   │   │   │   ├── Chooseop.jsx
│   │   │   │   │   ├── Preview.jsx
│   │   │   │   │   ├── Suggestion.jsx
│   │   │   │   │   ├── shoesAndIphones.json

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
