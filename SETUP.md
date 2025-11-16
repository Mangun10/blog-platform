# Blog Platform - Setup Instructions

## Prerequisites

- Node.js 18+ installed
- MySQL server running locally
- Git

## Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database

Make sure MySQL is running on your local machine, then create a database:

```sql
CREATE DATABASE blog_platform;
```

### 3. Configure Environment

Update the `.env` file with your MySQL credentials:
```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/blog_platform"
PORT=8080
NODE_ENV=development
```

### 4. Run Database Migration

```bash
npx prisma migrate dev --name init
```

This will create all the necessary tables in your MySQL database.

### 5. Start the Development Server

```bash
npm run start:dev
```

The application will be available at `http://localhost:8080`

## Testing the Application

Open your browser and go to:
- Frontend: `http://localhost:8080`
- Health Check: `http://localhost:8080/health`
- Database Status: `http://localhost:8080/db-status`

## API Endpoints

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post
- `POST /api/posts/:id/like` - Like a post
- `POST /api/posts/:id/share` - Share a post

### Comments
- `GET /api/comments/post/:postId` - Get comments for a post
- `POST /api/comments` - Create a comment

### Subscribers
- `POST /api/subscribers/subscribe` - Subscribe to newsletter
- `DELETE /api/subscribers/unsubscribe/:email` - Unsubscribe

## Production Deployment (Railway)

### Environment Variables to Set in Railway:

```env
DATABASE_URL=<your-railway-mysql-url>
NODE_ENV=production
PORT=8080
```

### Deploy
Just push to your main branch and Railway will automatically deploy!

```bash
git add .
git commit -m "Migrated to NestJS with MySQL"
git push origin main
```

## Troubleshooting

### MySQL Connection Issues
- Make sure MySQL is running: `services.msc` (Windows) or `systemctl status mysql` (Linux)
- Check your MySQL credentials in `.env`
- Verify the database exists: `SHOW DATABASES;`

### Port Already in Use
Change the PORT in your `.env` file to a different port (e.g., 3000)

## Tech Stack

- **Backend**: NestJS (TypeScript)
- **Database**: MySQL
- **ORM**: Prisma
- **Deployment**: Railway
- **Email**: Nodemailer (optional)
