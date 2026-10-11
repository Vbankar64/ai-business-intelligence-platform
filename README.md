# AI Business Intelligence Platform

A full-stack business intelligence dashboard for monitoring business performance, analyzing revenue, reviewing sales and customer data, tracking inventory, and surfacing actionable business insights.

**Live Demo:** [Open the application](https://ai-business-intelligence-platform-plum.vercel.app/)  
**API Documentation:** [Explore the FastAPI documentation](https://ai-business-intelligence-platform-15vb.onrender.com/docs)  
**Backend Health:** [Check API and database status](https://ai-business-intelligence-platform-15vb.onrender.com/health)  
**GitHub Repository:** [View the source code](https://github.com/Vbankar64/ai-business-intelligence-platform)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Business Metrics and Insights](#business-metrics-and-insights)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)
- [Future Improvements](#future-improvements)
- [Author](#author)

## Project Overview

The AI Business Intelligence Platform brings important business metrics into one dashboard. It connects a React frontend to a FastAPI backend and uses a PostgreSQL database in the deployed environment.

The platform demonstrates how business data can be organized into dashboard KPIs, revenue analytics, customer information, sales records, inventory monitoring, and rule-based business insights.

This project was developed as a full-stack portfolio project to demonstrate frontend development, backend API design, database integration, data analysis, and deployment.

## Features

- **Business Dashboard:** View revenue, customer counts, order counts, and business summaries.
- **Analytics:** Explore monthly revenue, average completed order value, order statuses, and product performance.
- **Customer Management:** Review customer information and completed-order spending.
- **Sales Management:** Inspect sales records and completed, pending, and cancelled order values.
- **Product and Inventory Monitoring:** Review product information and identify low-stock products.
- **AI Insights:** Display rule-based business observations derived from current business data.
- **Settings Interface:** Access the application's settings page.
- **REST API:** Retrieve business data through FastAPI endpoints.
- **Database Integration:** Store and retrieve structured business records through SQLAlchemy.
- **Cloud Deployment:** Access the deployed frontend and backend online.

## Screenshots

The screenshots below are stored in `docs/screenshots/`. GitHub displays them automatically when the image paths match the files committed to the repository.

### Dashboard

![Business Dashboard](docs/screenshots/Dashboard.png)

### Analytics

![Business Analytics](docs/screenshots/Analytics.png)

### Customer Management

![Customer Management](docs/screenshots/Customer.png)

### Sales

![Sales Management](docs/screenshots/Sales.png)

### Products and Inventory

![Product and Inventory Management](docs/screenshots/Products.png)

### AI Insights

![AI Business Insights](docs/screenshots/AI%20insights.png)

> If a screenshot does not appear, check the exact filename, capitalization, and file extension in `docs/screenshots/`.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Visualizations | Recharts |
| Backend | Python, FastAPI, Uvicorn |
| Database layer | SQLAlchemy |
| Deployed database | PostgreSQL |
| Development tools | Git, GitHub, Visual Studio Code |
| Deployment | Vercel (frontend), Render (backend) |

## Architecture

The application uses a frontend–backend–database architecture.

1. **Frontend:** React renders the dashboard, charts, tables, and application pages.
2. **Backend:** FastAPI exposes REST endpoints that process requests and return business data.
3. **Database:** SQLAlchemy connects the backend to the configured database.
4. **Visualization:** The frontend presents returned data as metrics, charts, and tables.
5. **Insights:** Backend rules produce business observations from the available records.

```text
User
  |
  v
React + Vite Frontend
  |
  | HTTP requests
  v
FastAPI REST Backend
  |
  | SQLAlchemy
  v
PostgreSQL Database
  |
  v
Business Metrics and Rule-Based Insights
```

## Business Metrics and Insights

The sample dataset contains four orders with different statuses. The following figures are based on that sample data and demonstrate how the platform handles business metrics.

| Metric | Sample result |
|---|---:|
| Completed revenue | ₹42,700 |
| Total customers | 4 |
| Total orders | 4 |
| Completed orders | 2 |
| Pending orders | 1 |
| Cancelled orders | 1 |
| Pending sales value | ₹42,800 |
| Cancelled sales value | ₹12,600 |
| Total value of all orders | ₹98,100 |
| Average completed order value | ₹21,350 |

**Revenue calculation:** Only completed orders contribute to completed revenue. Pending and cancelled orders are reported separately, preventing them from inflating revenue figures.

**Inventory insight:** The platform identifies products with stock below the configured threshold as low-stock products.

**Monthly revenue:** Completed revenue is grouped by order month to help users understand the distribution of sales over time.

*Note: These are sample project figures, not live business results. The current conversion-rate field is a proxy based on completed orders and customer count; a true website conversion rate requires visitor or session data.*

## API Endpoints

The deployed API provides the following endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check backend and database health |
| GET | `/dashboard` | Retrieve dashboard metrics and recent orders |
| GET | `/analytics` | Retrieve revenue trends and product performance |
| GET | `/customers` | Retrieve customer information |
| GET | `/sales` | Retrieve sales records and order summaries |
| GET | `/products` | Retrieve product and inventory information |
| GET | `/ai-insights` | Retrieve rule-based business insights |

Explore the complete API schemas and responses in the [interactive Swagger documentation](https://ai-business-intelligence-platform-15vb.onrender.com/docs).

## Getting Started

Follow these instructions to run the application locally.

### Prerequisites

Install the following tools:

- Python
- Node.js and npm
- Git
- A database configured for the backend

### 1. Clone the repository

```bash
git clone https://github.com/Vbankar64/ai-business-intelligence-platform.git
cd ai-business-intelligence-platform
```

### 2. Configure and start the backend

Open a terminal in the project root.

```bash
cd backend
python -m venv venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

If you use Command Prompt instead:

```bat
venv\Scripts\activate.bat
```

Install the dependencies:

```bash
python -m pip install -r requirements.txt
```

Configure the database connection according to the backend's database configuration. Use your own local database credentials and never commit secrets to GitHub.

Start the API:

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Open the local API documentation:

http://127.0.0.1:8000/docs

Health check:

http://127.0.0.1:8000/health

### 3. Configure and start the frontend

Open a **second terminal** in the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in the terminal.

Ensure the frontend API configuration points to the backend you intend to use. For local development, the backend runs at `http://127.0.0.1:8000`; the deployed frontend uses the deployed backend.

### 4. Verify the application

Check the following after starting both services:

- The health endpoint reports a healthy backend.
- The dashboard loads its metrics.
- Analytics displays monthly revenue.
- Customers, Sales, and Products display their records.
- AI Insights displays business observations.
- Settings opens successfully.

## Environment Configuration

The backend needs a valid database connection. Depending on the existing database configuration, you may need to configure a local database or environment variables before running the application.

For the deployed version, the frontend and backend are hosted separately. Configure deployment environment variables in the hosting provider's dashboard rather than committing credentials to source control.

**Security checklist:**

- Keep `.env` files out of Git.
- Never publish database passwords, secret keys, or API credentials.
- Provide a safe example configuration file if documenting environment variables.
- Use separate development and production credentials.

## Project Structure

```text
AI-Buisness-Intelligence/
├── backend/
│   ├── main.py
│   ├── database/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── database/
├── data/
├── docs/
│   └── screenshots/
├── .gitignore
└── README.md
```

## Future Improvements

- Add automated backend and frontend tests.
- Introduce authentication and role-based access control.
- Add date-range filters and downloadable reports.
- Improve dashboard interactivity and analytics drill-downs.
- Add visitor and session tracking for a genuine conversion-rate metric.
- Enhance insights with a properly integrated generative AI model, with validation and appropriate error handling.
- Add data refresh, pagination, and improved error states.
- Expand the sample dataset and document the database schema.

## Author

Developed as a full-stack business intelligence and analytics portfolio project.

**GitHub:** [Vbankar64](https://github.com/Vbankar64)

**Live Application:** [AI Business Intelligence Platform](https://ai-business-intelligence-platform-plum.vercel.app/)
