# Dayal Trading LLC - Luxury Watch Store

A modern, premium luxury watch e-commerce website featuring an elegant black and gold design theme.

## Features

### Frontend
- **Hero Section**: Full-screen animated analog watch with real-time clock functionality
- **Responsive Design**: Mobile-friendly layout with smooth animations
- **Watch Collections**: Separate pages for Men's and Women's watches (20 watches each)
- **Brand Showcase**: Premium watch brands with filtering capability
- **Search & Filter**: Search by brand and watch type
- **Contact Page**: Phone, WhatsApp, location map, and email form
- **Admin Panel**: Secure login system for managing watches

### Design Theme
- Background: Black (#000000)
- Text: White (#FFFFFF)
- Accent: Gold (#D4AF37)
- Premium typography with Playfair Display and Montserrat fonts
- Smooth animations and transitions
- Luxury aesthetic throughout

### Admin Features
- Add new watches (Men's/Women's)
- Edit existing watches
- Delete watches
- Upload watch images
- Manage watch details (Brand, Name, Price, Type, Description)

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and visit:
```
http://localhost:3000
```

## Admin Access

To access the admin panel:
1. Go to the About page
2. Click the small dot button at the bottom
3. Login with:
   - Username: `admin`
   - Password: `admin123`

## Project Structure

```
web2/
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   ├── index.html
│   ├── men.html
│   ├── women.html
│   ├── brands.html
│   ├── about.html
│   ├── contact.html
│   └── admin.html
├── backend/
│   ├── server.js
│   ├── package.json
│   └── uploads/ (created automatically)
└── README.md
```

## Pages

1. **Home (index.html)**: Hero section with animated watch, search, and featured collections
2. **Men's Watches (men.html)**: 20 men's watches with filters and "View More" functionality
3. **Women's Watches (women.html)**: 20 women's watches with filters and "View More" functionality
4. **Brands (brands.html)**: 10 premium watch brands with brand-specific filtering
5. **About (about.html)**: Company information and hidden admin login
6. **Contact (contact.html)**: Contact information, WhatsApp, map, and email form
7. **Admin (admin.html)**: Dashboard for managing watches

## Watch Brands Included

- Rolex
- Omega
- Tag Heuer
- Seiko
- Tissot
- Casio
- Fossil
- Citizen
- Longines
- Rado

## Technologies Used

### Frontend
- HTML5
- CSS3 (with animations and transitions)
- JavaScript (ES6+)
- Google Fonts (Playfair Display, Montserrat)

### Backend
- Node.js
- Express.js
- Multer (file uploads)
- CORS
- Body-parser

## Features Highlights

- Real-time animated analog watch on homepage
- Smooth scroll animations
- Hover effects on all interactive elements
- Mobile-responsive grid layouts
- Filter watches by brand and type
- View More functionality (shows 8 initially, then all 20)
- Admin authentication system
- CRUD operations for watch management
- Image upload capability
- Local storage for admin session
- Premium luxury design aesthetic

## Contact Information

**Dayal Trading LLC**
- Location: Dubai, UAE
- Phone: +971 50 123 4567
- Email: info@dayaltrading.com

## License

© 2024 Dayal Trading LLC. All Rights Reserved.
