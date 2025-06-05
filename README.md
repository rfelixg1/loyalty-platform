# Loyalty Platform

A comprehensive loyalty program management system consisting of three main modules:

## Project Structure

- `backend/` - Express.js REST API server
- `frontend-admin/` - React-based admin dashboard (Vite)
- `mobile-scanner/` - React Native mobile app for QR scanning (Expo)
- `docs/` - Project documentation

## Modules

### Backend API
- REST API built with Express.js
- Handles authentication, loyalty program management, and points tracking
- Located in `backend/`

### Admin Dashboard
- Web-based dashboard for program management
- Built with React + Vite
- Located in `frontend-admin/`

### Mobile Scanner
- QR code scanner app for points collection
- Built with React Native (Expo)
- Located in `mobile-scanner/`

## Getting Started

### Prerequisites
- Node.js v20.18.3 or higher
- npm 9.8.1 or higher

### Installation

1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

2. Admin Dashboard Setup
```bash
cd frontend-admin
npm install
npm run dev
```

3. Mobile Scanner Setup
```bash
cd mobile-scanner
npm install
npx expo start
```

## Development

Each module can be developed independently. Please refer to the README in each module's directory for specific development instructions.

## License

ISC 