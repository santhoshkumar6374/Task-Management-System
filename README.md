# Task Management System

Follow these simple steps to set up and run the system on your local machine.

---

### The 1-Minute Setup

### 1. Start the Backend
Open a terminal, navigate to the `backend` directory, and run:
```bash
cd backend
npm install
cp .env.example .env
npm run seed     # Seeds the default administrator credentials
npm run dev      # Runs API server on http://localhost:5000
```

### 2. Start the Frontend
Open a new terminal window, navigate to the `frontend` directory, and run:
```bash
cd frontend
npm install
cp .env.example .env # all the details are in the .env.example file    copy to edit .env file
npm run dev      # Runs web application on http://localhost:5173
```

---

## ⚙️ Environment Configuration

In `backend/.env`, configure your values:
- `MONGO_URI`: Your MongoDB database connection string.
- `JWT_SECRET`: Any random string (e.g. `secret123`).
- `EMAIL_USER`: Your Gmail address.
- `EMAIL_PASS`: Your 16-character **Gmail App Password** (spaces do not matter).
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: Your login details for the Administrator account.

---

## 📧 How to Set Up Gmail Notifications

1. Enable 2Step Verification on your Google Account settings.
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords) and create an App Password.
3. Copy the 16-character code (e.g. `tqfn izfz znqg osvg`) and paste it as `EMAIL_PASS` in your `backend/.env`.

---

## 🔍 How to Test the App

1. **Open and Log in**: Open `http://localhost:5173` and log in with the **Admin** credentials configured in your backend `.env` file (use `ADMIN_EMAIL` and `ADMIN_PASSWORD`).
2. **Review Action Cards**: Hover your mouse cursor over **Manage Employees** or **View & Assign Tasks** cards to see the sliding gradient hover animations.
3. **Verify Clickable Stats**: Click any color box (e.g. "In Progress", "Completed") to jump to that pre-filtered task list.
4. **Create an Employee**: Go to **Manage Employees** -> click **+ Add Employee** -> register an employee with a real address (e.g. another Gmail account).
5. **Edit the Profile**: Click the **Edit** button next to the employee name -> modify fields (like department) or update their password, and save.
6. **Trigger Email Validation Rejections**: Try creating or updating an employee with a typo domain (e.g. `abc@gamil.com`) or keyword (e.g. `fakegmail@gmail.com`) to check the validation block.
7. **Assign a Task**: Go to **Tasks** -> **Assign Task**, choose the newly registered employee, and submit. *(Verify that the employee receives an assignment email!)*
8. **Switch Accounts**: Log out of the Admin panel.
9. **Log in as Employee**: Log in with the email and password you just created for the new employee.
10. **Review Employee Dashboard Layout**: Notice that the assigned task details card has **Assigned by**, **Created**, and **Updated** timestamps formatted neatly and stacked vertically.
11. **Update Task & Dispatch Alert**: Change the task status to **In Progress** or **Completed**. *(Verify that the Administrator receives a notification email stating the task has been updated!)*
