# Movie Quiz - Daily Image Order Game

A React-based daily movie puzzle game where players arrange movie scenes in chronological order.

## Features

- **Player Experience**: Daily movie puzzles with drag-and-drop image ordering
- **Admin Panel**: Upload images, create puzzles, and manage content
- **Firebase Integration**: Authentication, Firestore database, and Storage
- **Responsive Design**: Mobile-friendly with touch support
- **Accessibility**: Alt text support for all images

## Tech Stack

- React 19 with functional components and hooks
- Vite for build tooling
- TailwindCSS for styling
- Firebase (Auth, Firestore, Storage)
- React Router for navigation
- @dnd-kit for drag-and-drop functionality

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Navigation with admin access
│   └── DraggableImage.jsx  # Drag-and-drop image component
├── pages/              # Main application pages
│   ├── PlayerPage.jsx  # Main game interface
│   └── AdminPage.jsx   # Admin puzzle creation
├── hooks/              # Custom React hooks
│   └── useAuth.js      # Firebase authentication hook
├── utils/              # Utility functions
│   └── css.js          # CSS transform utilities
├── firebase.js         # Firebase configuration
└── App.jsx            # Main app with routing
```

## Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd disorder
npm install
```

### 2. Firebase Configuration
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Enable Storage
5. Copy your Firebase config to `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Create Admin User
Create an admin user in Firebase Authentication with email/password.

### 4. Run the Application
```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

## Usage

### For Players
1. Visit the home page to see today's movie puzzle
2. Drag and drop images to arrange them in chronological order
3. Click "Check Order" to validate your solution
4. Use "Shuffle Again" to reset if needed

### For Admins
1. Navigate to `/admin` and login with your Firebase credentials
2. Enter a movie title and select the puzzle date
3. Upload exactly 5 images from the movie
4. Arrange them in the correct chronological order using drag-and-drop
5. Add descriptive alt text for each image
6. Save the puzzle for the selected date

## Database Structure

### Puzzles Collection
```javascript
{
  title: "Movie Title",
  date: "YYYY-MM-DD",
  images: [
    {
      url: "firebase_storage_url",
      alt: "Scene description",
      originalIndex: 0
    }
  ],
  createdAt: timestamp,
  createdBy: "admin_uid"
}
```

## Build for Production
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
