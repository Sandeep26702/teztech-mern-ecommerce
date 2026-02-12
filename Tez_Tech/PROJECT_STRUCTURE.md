# Sonani Electronics - Project Structure

## 📁 Organized Folder Structure

```
src/
├── assets/                 # Static assets
│   ├── images/            # Image files
│   ├── icons/             # Icon files
│   └── react.svg          # React logo
├── components/            # Reusable components
│   ├── common/            # Common components
│   │   └── ProductCard.jsx
│   └── layout/            # Layout components
│       ├── Header.jsx     # Navigation header
│       └── Footer.jsx     # Site footer
├── pages/                 # Page components
│   ├── About.jsx          # About page
│   ├── Career.jsx         # Career page
│   ├── Cart.jsx           # Shopping cart
│   ├── ForgotPassword.jsx # Password reset
│   ├── Home.jsx           # Homepage
│   ├── Login.jsx          # Login page
│   ├── ProductItems.jsx   # Product items list
│   ├── Products.jsx       # Product categories
│   ├── Quotation.jsx      # Quote request
│   └── Register.jsx       # User registration
├── routes/                # Route components
│   └── PrivateRoute.jsx   # Protected routes
├── services/              # API services
│   ├── api.js             # Base API config
│   ├── productService.js  # Product API calls
│   └── quotationService.js # Quote API calls
├── styles/                # CSS styles
│   └── components/        # Component styles
│       ├── About.css
│       ├── Career.css
│       ├── Cart.css
│       ├── Footer.css
│       ├── Header.css
│       ├── Home.css
│       ├── Login.css
│       ├── ProductItems.css
│       ├── Products.css
│       ├── Quotation.css
│       └── Register.css
├── utils/                 # Utility functions
│   └── constants.js       # App constants
├── App.jsx               # Main app component
├── App.css               # Global app styles
├── index.css             # Global styles
└── main.jsx              # App entry point
```

## 🎯 Benefits for Backend Integration

✅ **Organized Structure** - Clear separation of concerns
✅ **Scalable Architecture** - Easy to add new features
✅ **Maintainable Code** - Components are properly organized
✅ **Backend Ready** - Services folder for API integration
✅ **Constants Management** - Centralized data management
✅ **Reusable Components** - Common components for consistency

## 🔧 Ready for Backend

- **Services folder** - Ready for API integration
- **Constants file** - Centralized data management
- **Component separation** - Easy to connect with backend
- **Proper imports** - Clean import structure
- **Scalable architecture** - Easy to extend functionality