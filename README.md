# RAISE – Resource Allocation & Inventory Support Engine

RAISE is a **web-based hardware request and inventory management system** designed to streamline the process of requesting, approving, allocating, and tracking hardware resources within an organization or institution.

It provides **role-based access** for Admins and Users, ensuring transparency, accountability, and efficient resource utilization.

---

## Features

### User Module

* Submit hardware requests
* View request status (Pending / Approved / Rejected)
* Track allocated hardware
* Simple and user-friendly interface

### Admin Module

* View and manage all hardware requests
* Approve or reject requests
* Assign hardware to users
* Maintain hardware inventory
* Admin dashboard for monitoring activities

---

## Project Structure

```
RAISE-main/
│
├── Admin/
│   ├── dashboard.html
│   ├── inventory.html
│   ├── Request.html
│   ├── ticket_assigned.html
│   ├── settings.html
│   └── profile_dashboard.html
│
├── User Request/
│   └── backend/
│       ├── db.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Hardware.js
│       │   ├── HardwareRequest.js
│       │   ├── Allocation.js
│       │   └── Purchase.js
│       └── routes/
│           └── adminroutes.js
│
├── login-system/
│   ├── server.js
│   ├── package.json
│   └── node_modules/
│
└── .gitattributes
```

---

## Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB (Mongoose ORM)

### Authentication

* bcrypt (Password hashing)

---

## Installation & Setup

### 1️ Clone the Repository

```bash
git clone https://github.com/your-username/RAISE.git
cd RAISE-main
```

### 2️ Install Dependencies

```bash
cd login-system
npm install
```

### 3️ Configure Database

* Update MongoDB connection string in:

```bash
User Request/backend/db.js
```

### 4️ Start the Server

```bash
npm start
```

The server will start on:

```
http://localhost:3000
```

---

## Roles & Access

| Role  | Access Level                              |
| ----- | ----------------------------------------- |
| User  | Request hardware, view status             |
| Admin | Approve/reject requests, manage inventory |

---

## Use Cases

* College labs hardware allocation
* Company IT asset management
* Project-based resource tracking
* Internal inventory management systems

---

## Future Enhancements

* Email notifications for request updates
* Analytics dashboard
* Role-based permissions
* Deployment using Docker
* JWT-based authentication

---

## Contributors

Developed as part of an academic / institutional project.
Feel free to contribute by submitting pull requests or reporting issues.

---



