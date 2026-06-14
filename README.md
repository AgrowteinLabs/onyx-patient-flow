# Onyx Health+ Patient Portal & Management Platform

Welcome to the **Onyx Health+ Patient Portal**, a premium, high-fidelity healthcare portal designed to provide patients with complete control over their medical workflows. The portal is styled with a modern, glassmorphic design language using vibrant medical blue colors (`#0EA5E9` to `#2563EB`) and smooth 20px rounded corners.

---

## 🚀 Key Features

- 👥 **Multi-Profile Family Management**: Seamlessly add, view, and switch between family profiles from a global topbar dropdown list. Each profile loads independent and specific medical records.
- 📅 **Dynamic Appointment Booking**: Select healthcare professionals, look up doctor specialty/rating details, check calendar availability slots, and book real-time appointments.
- 📋 **Integrated Support Tickets**: Raise, monitor, and resolve support tickets directly from the dashboard relative to specific appointment bookings.
- 📄 **Diagnostic Reports & Prescriptions**: View and preview PDF lab reports, track daily prescription dosages, and monitor doctor instructions in real-time.
- 🎥 **Virtual Video Consultations**: Join secure tele-consultations directly inside the portal, leveraging dynamic secure video tokens matched to active bookings.
- 🔐 **HIPAA-Compliant Security**: Fully secure token workflows and data models ensuring the privacy and safety of protected health information.

---

## 🛠️ Technology Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn-ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State & Routing**: [React Router DOM](https://reactrouter.com/) + Custom Hook Providers

---

## 📦 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18+) and [npm](https://www.npmjs.com/) installed on your machine.

### Setup and Installation

1. **Clone the repository**:
   ```bash
   git clone <YOUR_GIT_URL>
   cd onyx-patient-flow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the backend API URL:
   ```env
   VITE_BACKEND_URL=https://api.onyxhealthplus.com
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:8080` in your browser to view the application.

### Build and Deployment

To build the production-ready bundle, run:
```bash
npm run build
```
The static files will be generated in the `dist/` directory, ready to be served by any hosting provider.
