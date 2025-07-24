BadPhone Sales Management System
BadPhone is a sales management and inventory tracking system designed for retail stores. It supports shift management, user roles (owner and seller), sales statistics, and an admin dashboard.

Description
This application allows you to:

Manage products (add, edit, delete)

Record sales with automatic stock deduction

Track sales statistics by shift, daily, and overall

Manage users (register, delete)

Track visits and seller shifts

Monitor online/offline app status

Technologies
React (Next.js with "use client")

Supabase (backend and database)

TypeScript

UI components: TailwindCSS, Lucide icons

Getting Started
Clone the repository:

bash
Копировать
Редактировать
git clone https://github.com/your-repo/badphone.git
cd badphone
Install dependencies:

bash
Копировать
Редактировать
npm install
Configure Supabase (set your URL and keys in environment variables).

Run the development server:

bash
Копировать
Редактировать
npm run dev
Open http://localhost:3000 in your browser.

Features
Authentication: Login and registration with owner and seller roles

Shift Management: Start and end shifts, track working time and sales

Sales: Add sales, auto-update product quantities, support payment methods

Product Catalog: Manage products (owner only)

Statistics: Daily, total, and per-shift sales stats

Visits: Auto-create and display visits after sales

Admin Dashboard: User management and detailed stats

Highlights
Real-time updates of sales and products data

Robust error handling and logging with Supabase

Role-based access control

Modern and user-friendly UI components

Contributing
Feel free to fork the project and submit pull requests. Suggestions and bug reports are welcome!

License
MIT License © 2025 BadPhone Team

