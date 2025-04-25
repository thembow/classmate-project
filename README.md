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
npm install
```
3. Set up emailing
* Create an account at  https://www.mailgun.com/
* Add the email addresses you wish to use, and click verify in each respective inbox
5. Create a .env file, and add your API Key and mailgun domain
```bash
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
```
4. Start the server!
```bash
npm start
```
The app will be live at http://localhost:3000 
