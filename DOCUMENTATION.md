# MAMS - Manikaran Assets Management System
## Project Documentation & Maintenance Guide

This document provides technical details on the recent implementations and instructions for maintaining the MAMS platform on both local and production environments.

---

## 1. Interactive Floor Plan System
The platform now features a high-fidelity, dynamic SVG floor plan for real-time seat management.

### Key Features
- **Live Data Binding**: Seats on the map are mapped to real database records.
- **Visual Occupancy**:
  - <span style="color: #10b981; font-weight: bold;">Emerald Green</span>: Vacant (Available).
  - <span style="color: #475569; font-weight: bold;">Slate Gray</span>: Occupied (Assigned to employee).
- **Navigation**:
  - **Zoom**: `Ctrl + Mouse Wheel`.
  - **Pan**: Click and drag the map.
- **Responsive Tooltip**: Displays employee details (Avatar, Name, ID, Dept, Email) with smart boundary detection.

### Seat Mapping Logic
The visual layout in `src/components/InteractiveFloorPlan.tsx` uses a mapping object to link SVG IDs to your actual database workstation codes:

| SVG ID | Database Code (Mapped) |
| :--- | :--- |
| `MGR-01` | `MPL-WS009` (Cabin) |
| `A-101` to `A-108` | `MPL-WS001` to `MPL-WS008` |

---

## 2. Production Deployment (VPS)
Follow these steps to ensure smooth operation on your Linux VPS.

### Directory Permissions
The application requires write access to the `public/uploads` directory for employee profile photos.
```bash
cd /var/www/mams
mkdir -p public/uploads/employees
sudo chown -R $USER:$USER public/uploads
sudo chmod -R 775 public/uploads
```

### Nginx Configuration
To allow high-quality image uploads (larger than 1MB), update your Nginx site configuration:
```nginx
server {
    ...
    client_max_body_size 10M; # Increases limit to 10MB
    ...
}
```
*Restart Nginx after changes:* `sudo systemctl restart nginx`

---

## 3. Build & Maintenance
### Running a Production Build
Always run a build before deploying to verify TypeScript and routing integrity:
```bash
npm run build
```

### Checking Application Logs
If you encounter errors in production, use these commands on the VPS:
- **PM2 Logs**: `pm2 logs`
- **Nginx Errors**: `sudo tail -f /var/log/nginx/error.log`

---

## 4. Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS & Vanilla CSS
- **Visuals**: Dynamic SVG with React interaction layers
