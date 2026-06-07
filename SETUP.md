# HR Attendance App - Quick Start

## Prerequisites
- Node.js (v14+)

**That's it! No database installation needed.**

## Setup (2 minutes)

### 1. Install Dependencies
```bash
cd your-folder-path
npm install
```

### 2. Configure Google OAuth (Optional but Recommended for Worker Login)
See `OAUTH_SETUP.md` for detailed instructions.

```bash
# Create .env file (copy from .env.example)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Server
```bash
npm start
```

You'll see:
```
Server running on http://localhost:5000
Database: ./hr_attendance.db
```

The SQLite database creates automatically on first run.

### 5. Open Interfaces

**Admin Dashboard (For You/Boss):**
- Open `admin.html` in your browser
- Full access: manage workers, view all data, approve leaves

**Worker Interface (For Employees):**
- Open `worker.html` in your browser  
- Google login required
- Can only see & manage their own data

---

## Features

### Worker Management
- Add/remove workers

### Check-in/Check-out
- Select worker → click check-in (timestamp auto-recorded)
- Check-out records end time

### Daily Report
- View today's check-ins
- Quick check-out action

### Monthly Report
- Select month
- See days present, entries, avg hours
- **Export to Excel** button

### Leave Tracking
- Request vacation/sick/personal leave
- Admin approves/rejects
- View all requests

---

## API Endpoints

**Workers**
- `GET /api/workers` - List all
- `POST /api/workers` - Add worker
- `DELETE /api/workers/:id` - Remove

**Check-ins**
- `POST /api/checkins` - Record check-in
- `GET /api/checkins/today` - Today's entries
- `GET /api/checkins/month/:month` - Monthly (YYYY-MM)
- `PATCH /api/checkins/:id` - Update check-out

**Leaves**
- `POST /api/leaves` - Request leave
- `GET /api/leaves` - All requests
- `GET /api/leaves/:worker_id` - Worker's leaves
- `PATCH /api/leaves/:id/approve` - Approve
- `PATCH /api/leaves/:id/reject` - Reject

**Export**
- `GET /api/export/monthly/:month` - Download XLSX (YYYY-MM)

---

## Database
- **Type:** SQLite (local file: `hr_attendance.db`)
- **Location:** Same folder as server.js
- **Auto-creates:** On first run

## Multi-Device Access
All devices must point to same backend URL (e.g., `http://your-ip:5000`)

## Troubleshooting

**Port already in use?**
Edit `.env`:
```
PORT=5001
```

**Database file missing?**
Delete `hr_attendance.db` and restart — it recreates with empty schema.

**Frontend can't connect?**
Check browser console. Backend URL in `frontend.html` must match your server location.
