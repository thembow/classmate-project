# ClassMate 🎓

ClassMate is a productivity-focused web application built for UNC Charlotte students. It provides a centralized platform for managing academic schedules, tracking assignments, checking real-time availability of campus resources, and collaborating with classmates through study groups.

## 🚀 Features

- 📚 **Library Availability**: Real-time data pulled from Atkins Library API to help students find study space.
- 🚗 **Parking Deck Availability**: Displays live updates of campus parking availability.
- 🗓️ **Calendar Functionality**: A Calendar to manage events and deadlines.
- ✅ **Assignment Tracker**: Input, view, and update tasks to keep up with class deliverables.
- ⏲️ **Productivity Timer**: Built-in Pomodoro-style timer to promote focused study sessions.
- 👥 **Study Group Formation**: Form groups, manage membership, and coordinate academic efforts.
- 💬 **Group Communication**: Email group members about classes, projects, etc.

---

## 🛠️ Tech Stack

**Frontend**  
- React.js  
- HTML5 / CSS3  
- Axios (for API calls)

**Backend**  
- Node.js  
- Express.js  
- MongoDB  
- Mongoose

**APIs & Services**  
- UNCC Library & Parking APIs

---

## 📂 Project Structure

```bash
classmate-project/
├── client/             # Frontend source code (React)
│   └── src/
├── server/             # Backend server code (Express)
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── db.js
├── .env                # Environment variables
├── package.json        # Project metadata and scripts
└── README.md           # You're here!
```
---
## 📦 Setup Instructions
1. Clone the repository
```bash
git clone https://github.com/thembow/classmate-project.git
cd classmate-project
```
2. Install dependencies
```bash
# For backend
cd server
npm install

# For frontend
cd ../client
npm install
```
3. Set up environment variables
Create a .env file in the server/ directory and add your configuration:
```bash
MONGO_URI=your_mongodb_connection_string
PORT=5000
```
4. Start the development servers
```bash
# Backend
cd server
npm run dev

# Frontend (in a separate terminal)
cd ../client
npm start
```
The app will be live at http://localhost:3000 and connect to the backend at http://localhost:5000.
