# Google Form Clone

A modern, feature-rich form management system built with Next.js, TypeScript, and Prisma. This application provides a powerful alternative to Google Forms with enhanced features and a beautiful user interface.

## Features

### Form Management
- Create and customize forms with a drag-and-drop interface
- Support for multiple field types:
  - Text input
  - Paragraph
  - Multiple choice
  - Checkbox
  - Dropdown
  - Image upload
  - Rich text editor
- Grid-based form layout system
- Form styling and customization
- Form preview and testing
- Form publication and sharing

### User Management
- Role-based access control:
  - Regular Users
  - Administrators
  - Managers
  - Super Administrators
- Two-factor authentication
- OAuth integration (Google)
- Email/password authentication
- User profile management
- Admin code system for organization management

### Form Submissions
- Real-time form submission tracking
- Response management
- Export submissions to PDF
- Submission analytics
- Response validation

### Security
- Secure authentication system
- Role-based access control
- Two-factor authentication
- Session management
- Password reset functionality
- Email verification

## Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI Components
- Framer Motion
- React Hook Form
- Zod Validation
- TipTap Rich Text Editor

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL Database
- NextAuth.js
- Winston Logger

### Development Tools
- ESLint
- TypeScript
- Prisma Studio
- Tailwind CSS

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/google-form-clone.git
cd google-form-clone
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env

DATABASE_URL="database_url"

AUTH_SECRET="auth_secret"

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret


RESEND_API_KEY=your_resend_api

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.
