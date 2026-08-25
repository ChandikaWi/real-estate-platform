<div align="center">
  <h1 align="center">LakEstates<br>Sri Lanka's Property Marketplace</h1>

  <p align="center">
    A comprehensive, full-stack MERN real estate platform with ML Powered property valuation, real-time synchronization and advanced analytics.
    <br />
  </p>
</div>

<details open>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#tech-stack">Tech Stack</a></li>
    <li><a href="#comprehensive-feature-list">Comprehensive Feature List</a>
      <ul>
        <li><a href="#-buyer-features">Buyer Features</a></li>
        <li><a href="#-seller-features">Seller Features</a></li>
        <li><a href="#-admin--moderation-features">Admin Features</a></li>
      </ul>
    </li>
    <li><a href="#architecture--data-integrity">Architecture & Data Integrity</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#environment-variables">Environment Variables</a></li>
    <li><a href="#contributing">Contributing</a></li>
  </ol>
</details>

## About The Project

The **Premium Real Estate Platform** is a robust, enterprise-grade web application designed to connect buyers, sellers and administrators in a seamless, transparent property trading environment. 

Moving beyond standard listing websites, this platform facilitates the **entire lifecycle of a real estate transaction**:
- ML-based market evaluation to spot overpriced/underpriced listings.
- Real-time chat & negotiation built on WebSockets.
- Direct-to-seller property visits and scheduling.
- Deep financial tracking reflecting the *actual offline negotiated sale prices* instead of static listing prices.
- Comprehensive administrative dispute resolution and market oversight.

Built for a university development project, this system demonstrates advanced state management, secure backend architecture, real-time bidirectional data flow and modern responsive UI/UX principles using Vanilla CSS.

## Tech Stack

**Frontend Architecture:**
* ![React](https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) React 19 (Vite)
* ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white) Vanilla CSS (Custom Design System)
* ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socketdotio&badgeColor=010101) Socket.io-client (Real-time Chat)
* ![Recharts](https://img.shields.io/badge/Recharts-%2322b5bf.svg?style=for-the-badge) Recharts (Data Visualization)
* **JSPDF & HTML2Canvas**: Dynamic PDF Receipt Generation

**Backend Architecture:**
* ![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) Node.js
* ![Express](https://img.shields.io/badge/Express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB) Express.js
* ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white) MongoDB & Mongoose
* ![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens) JSON Web Tokens (Authentication)
* ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=Cloudinary&logoColor=white) Cloudinary (Image Hosting)
* **Nodemailer**: Automated Email Alerts
* **Node-Cron**: Scheduled Background Jobs

## Comprehensive Feature List

### 👤 Buyer Features
- **Smart Search & Filters**: Search properties by location, type, price range and keywords.
- **ML Property Valuation**: Checks listings against ML predicted market values to determine fair pricing before buying.
- **NLP ChatBot Assistant**: Interact with an NLP assistant to get property recommendations tailored to your needs.
- **Property Comparison Tool**: Select multiple properties to evaluate specs, pricing and value per sqft side-by-side.
- **Real-time Chat**: Negotiate directly with sellers via a live messaging system without leaving the platform.
- **Schedule Visits**: Book property viewings based on available time slots.
- **Mortgage Calculator**: In-page dynamic financial estimation based on custom down payments, interest rates and loan terms.
- **Favorites System**: Save properties to a personalized wishlist for later review.
- **Portfolio Analytics**: Track total investments and target budgets with interactive charts.
- **Purchase Ledger & Receipts**: Download dynamically generated PDF receipts for completed transactions.
- **Ratings & Reviews**: Leave feedback on sellers after a successful transaction.
- **Reporting System**: Report suspicious properties or users directly to the administration.

### 🏢 Seller Features
- **Property Management**: Add, edit and delete property listings with seamless multi-image uploads via Cloudinary.
- **Deal Pipeline Management**: Manage buyer requests through Pending, Approved, Completed and Cancelled stages.
- **Offline Negotiation Sync**: "Finalize Sale" workflow forces the capture of the *true negotiated sale price*, ensuring accurate ledger tracking.
- **Real-time Chat**: Receive and respond to buyer inquiries instantly.
- **Visit Scheduling**: View and manage incoming physical viewing requests.
- **Seller Analytics Dashboard**: Dynamic charts visualizing 12-month revenue trends, sales by category and total profits based on actual completed sale values.
- **Export Ledger**: Export historical sales and financial records directly to a CSV file.
- **Sales Receipts**: Generate and download PDF receipts for any completed sale.
- **Profile Management**: Maintain a public profile displaying verification status, contact details and aggregated buyer reviews.

### 🛡️ Admin & Moderation Features
- **Global Analytics Dashboard**: Monitor aggregate platform sales, active users, total properties and system-wide revenue trajectories.
- **Real Estate Market Audit**: Automatically scans the platform to flag Overpriced and Underpriced properties by comparing seller list prices against ML valuations.
- **Dispute Center**: Centralized hub to review user reports against properties, reviews or other users.
- **Order Intervention**: Ability to "Force Cancel" transactions that violate platform terms or are under dispute.
- **User Management**: View all registered users, monitor their roles and apply bans or suspensions as needed.
- **Property Moderation**: Review all listings across the platform with the authority to delete fraudulent or inappropriate properties.
- **Seller Leaderboards**: Track top-performing sellers to understand platform dynamics.
- **Automated Workflows**: Cron jobs running in the background to handle expired listings or unresolved disputes automatically.

## Architecture & Data Integrity

A core philosophy of this project is **Financial Accuracy**. 

Real estate properties are rarely sold for their exact initial listing price. To solve this, the database and backend logic completely decouple the `price` (listing price) from the `finalSoldPrice` (actual offline negotiated price). 

1. **Transaction Lifecycle**: When a seller accepts a buyer's request, the property status transitions to `Pending`. 
2. **Offline Closing**: Once they physically meet and money exchanges hands, the seller triggers the "Complete Transaction" event in the dashboard.
3. **Data Injection**: The UI forces the seller to input the final negotiated price. 
4. **Global Propagation**: The backend permanently binds this `soldPrice` to the `Property` and `Order` models. This immediately triggers WebSockets to update Admin, Seller and Buyer analytics dashboards, ensuring that all financial charts, receipts and market comparisons utilize the mathematically correct revenue.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js (v18+ recommended)
* MongoDB Database (Local or MongoDB Atlas)
* Cloudinary Account (for image uploads)

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/your-username/real-estate-marketplace.git
   ```
2. Install NPM packages for both Backend and Frontend
   ```sh
   cd backend
   npm install
   
   cd ../frontend
   npm install
   ```
3. Configure your Environment Variables (see below).
4. Run the application concurrently
   ```sh
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the `backend/` directory with the following keys:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Nodemailer (Email Notifications)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
*A.G.Chandika Wickramasena - 2026 August*
