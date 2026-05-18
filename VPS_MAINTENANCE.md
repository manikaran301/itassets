# 🛠️ VPS Maintenance & Troubleshooting Guide

This guide explains how to fix common production issues like broken image uploads, large file blocks, and application crashes on your Linux VPS.

---

## 1. Fixing Folder Permissions (Broken Uploads)
If you can't upload employee photos, it's usually because the Linux server is blocking the application from writing new files to the folder.

### How to fix it:
Open your VPS terminal and run these commands:

```bash
# 1. Navigate to your project directory
cd /var/www/mams

# 2. Ensure the uploads directory exists
# This creates the 'uploads/employees' folder if it's missing
mkdir -p public/uploads/employees

# 3. Grant Ownership
# This tells Linux that YOUR user owns this folder and can write to it
sudo chown -R $USER:$USER public/uploads

# 4. Set Write Permissions (775)
# This gives read/write/execute permissions to the owner and group
sudo chmod -R 775 public/uploads
```

> [!TIP]
> If you are using a web server like Nginx, you might occasionally need to give ownership to the `www-data` user instead:
> `sudo chown -R www-data:www-data public/uploads`

---

## 2. Increasing Nginx Upload Limit (Error 413)
By default, Nginx blocks any file upload larger than **1MB**. If you try to upload a high-resolution photo, you will see a `413 Request Entity Too Large` error.

### How to fix it:
1. **Open the Nginx config file**:
   ```bash
   sudo nano /etc/nginx/sites-available/default
   ```
2. **Add the limit line** inside the `server { ... }` block:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Allow uploads up to 10MB
       client_max_body_size 10M; 

       location / {
           proxy_pass http://localhost:3000;
           ...
       }
   }
   ```
3. **Save and Restart**:
   - Press `Ctrl + O` then `Enter` to save.
   - Press `Ctrl + X` to exit.
   - Run: `sudo nginx -t` (Checks for typos)
   - Run: `sudo systemctl restart nginx` (Applies changes)

---

## 3. Monitoring Application Logs
If the app crashes or behaves strangely, the logs will tell you exactly why.

### If you use PM2 (Recommended):
PM2 keeps your app running in the background. To see live errors:
```bash
pm2 logs
```
*To see only the last 100 lines:* `pm2 logs --lines 100`

### If you use standard NPM:
If you are testing the app manually:
```bash
npm run start
```
*Watch the terminal output for any red error text.*

### Checking Nginx System Logs:
If you think the problem is with the web server itself:
```bash
sudo tail -f /var/log/nginx/error.log
```

---

> [!IMPORTANT]
> **Security Reminder**: Always run `npm run build` on your local machine before pushing code to the VPS to ensure there are no TypeScript errors that could break the production site.
