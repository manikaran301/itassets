# M_AMS - VPS Deployment Guide

This guide will walk you through the process of deploying the M_AMS (Asset Management System) Next.js application onto a generic Linux Virtual Private Server (VPS) like DigitalOcean, Linode, AWS EC2, or Hostinger using Docker.

## Prerequisites

- A Linux VPS (Ubuntu 22.04 or 24.04 is recommended) with at least **2GB RAM**
- SSH access to your server
- A PostgreSQL database (can be on the same VPS or external like Supabase, Neon, etc.)
- A registered Domain Name (optional but highly recommended) pointed to your VPS's IP Address using an `A` record

---

### Step 1: Connect to your Server

Open your terminal and SSH into your VPS:

```bash
ssh root@your_server_ip
```

Update your system packages to ensure everything is secure and up to date:

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Docker and Git

You need `git` to clone your repository and `docker` to run the application.

```bash
# Install Git
sudo apt install git -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify Installations
docker --version
docker compose version
```

### Step 3: Clone Your Project

Navigate to the directory where you want to store your project (e.g., `/var/www` or your home directory) and clone your private repository.

```bash
# Example if using the /var/www directory
sudo mkdir -p /var/www
cd /var/www

# Clone the repository
git clone https://github.com/manikaran301/itassets.git mams
cd mams
```

### Step 4: Setup Environment Variables

Docker will read the `.env` file to pass environment configurations into the container.

1. Ensure you are inside the `mams` directory.
2. Create your `.env` file:

```bash
nano .env
```

3. Paste all your production database URLs, Node Environment, and Next Auth secrets into this file. For example:

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/mams"
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
```

4. Save and Exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

### Step 5: Build and Start the Application

Run Docker Compose in the background. This will automatically invoke the multi-stage build process defined in the `Dockerfile`.

```bash
docker compose up -d --build
```

_Note: The first time you run this, it may take a few minutes to download the Node.js image and build the Prisma client._

Check logs to ensure it's running smoothly without errors:

```bash
docker compose logs -f
```

_(Press `Ctrl+C` to exit the logs view)_

At this point, if your firewall is open, you can access your app via `http://your_server_ip:3000`.

---

### Step 6: Install and Configure Nginx (Reverse Proxy)

To access the site via a standard domain name (without the `:3000` port), we'll set up `Nginx`.

```bash
sudo apt install nginx -y
```

Create a new configuration block for your site:

```bash
sudo nano /etc/nginx/sites-available/mams
```

Paste the following, substituting `yourdomain.com`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
# Link to sites-enabled
sudo ln -s /etc/nginx/sites-available/mams /etc/nginx/sites-enabled/

# Test configuration syntax
sudo nginx -t

# Restart Nginx to apply
sudo systemctl restart nginx
```

### Step 7: Secure with SSL (Certbot / Let's Encrypt)

Make your site secure (`https://`) using free SSL certificates from Let's Encrypt.

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the on-screen prompts. Certbot will automatically rewrite your Nginx configuration to point to port 443 (HTTPS) and set up auto-renewals.

---

### Step 8: Updating the Application in the Future

When you push new changes to GitHub and want to update your VPS:

```bash
cd /var/www/mams
git pull origin main

# Rebuild the container and recreate it
docker compose up -d --build

# Optional: Run Prisma migrations if schema.prisma has changed
docker compose exec mams-app npx prisma migrate deploy
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs -f

# Restart containers
docker compose down && docker compose up -d --build
```

### Database connection issues

- Verify `DATABASE_URL` in `.env` is correct
- Ensure PostgreSQL is running and accessible from the VPS
- Check firewall rules (port 5432 for PostgreSQL)

### App shows 502 Bad Gateway

- Check if container is running: `docker ps`
- Check Nginx config: `sudo nginx -t`
- Restart Nginx: `sudo systemctl restart nginx`

### Create Admin User After Deployment

```bash
# Enter the container
docker compose exec mams-app sh

# Run the admin creation script
npx ts-node prisma/create-admins.ts

# Exit container
exit
```

---

## Quick Reference Commands

| Action         | Command                                                  |
| -------------- | -------------------------------------------------------- |
| Start app      | `docker compose up -d`                                   |
| Stop app       | `docker compose down`                                    |
| View logs      | `docker compose logs -f`                                 |
| Rebuild        | `docker compose up -d --build`                           |
| Run migrations | `docker compose exec mams-app npx prisma migrate deploy` |
| Restart Nginx  | `sudo systemctl restart nginx`                           |
| Renew SSL      | `sudo certbot renew`                                     |
