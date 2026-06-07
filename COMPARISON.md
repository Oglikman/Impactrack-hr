# 👥 Admin vs Worker Interface

## Side-by-Side Comparison

| Feature | Admin (`admin.html`) | Worker (`worker.html`) |
|---------|---------------------|----------------------|
| **Login** | Direct access (no auth needed) | Google OAuth required |
| **View Workers** | ✓ All workers | ✓ Only their own data |
| **Manage Workers** | ✓ Add/remove workers | ✗ Cannot manage |
| **Check-in** | ✓ Record for any worker | ✓ Only self check-in |
| **View Check-ins** | ✓ All workers, all dates | ✓ Only their own (last 30) |
| **Request Leaves** | ✗ Not in this interface | ✓ Submit vacation/sick |
| **View Leaves** | ✓ All requests (pending/approved) | ✓ Only their requests |
| **Approve Leaves** | ✓ Yes | ✗ No |
| **Monthly Reports** | ✓ View all, export Excel | ✗ Not available |
| **Data Security** | None (trusted admin) | Only sees their data |

---

## Usage Scenarios

### Admin Scenario (You)
```
1. Open admin.html in browser
2. Add workers to system (name + email)
3. Throughout day: check worker check-ins
4. End of month: view attendance, export Excel report
5. When worker requests leave: approve or reject
```

### Worker Scenario (Employees)
```
1. Open worker.html in browser
2. Click "Google Login" button
3. Authorize with their Google account
4. Click "Register Check-In" button (timestamp recorded)
5. Request vacation/sick leave with dates
6. View status of their leave requests
```

---

## Security Notes

**Admin Version:**
- ✓ No authentication (trusted user)
- ✓ Full database access
- ⚠️ Should be password-protected if deployed online

**Worker Version:**
- ✓ Google OAuth authentication required
- ✓ Only sees own check-ins and leaves
- ✓ Cannot see other workers' data
- ✓ Cannot approve/reject requests
- ✓ Safe to share with employees

---

## Database Connections

Both interfaces use the same backend but with different data visibility:

```
admin.html
    ↓
/api/workers (all)
/api/checkins (all)
/api/leaves (all)
/api/leaves/:id/approve (admin only)
    ↓
Same SQLite Database

worker.html
    ↓
/auth/google (login)
    ↓
/api/workers (filtered to user)
/api/checkins/worker/:id (own only)
/api/leaves/:id (own only)
    ↓
Same SQLite Database
```

---

## Deployment Tips

**Local Network:**
1. Get your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Share link: `http://YOUR-IP:5000/admin.html` for admin
3. Share link: `http://YOUR-IP:5000/worker.html` for workers
4. Workers click Google login → enter their account

**Cloud Deployment:**
1. Deploy to Heroku, AWS, or similar
2. Update Google OAuth redirect URLs to your domain
3. Use HTTPS (required for OAuth in production)
4. Add password to admin.html if public

---

## Future Role-Based Access

Currently:
- Admin = direct access
- Worker = OAuth + filtered views

Future options:
- Add "Manager" role (approve leaves only, view team data)
- Add "HR" role (reporting only, no worker management)
- Add role selector in admin.html
- Add permission matrix in backend
