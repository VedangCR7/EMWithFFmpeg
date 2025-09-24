# EventMarketers Backend - Render Deployment Guide

This guide will help you deploy the EventMarketers backend to Render cloud platform.

## Prerequisites

1. A Render account (free tier available)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. A frontend domain (for CORS configuration)

## Step 1: Prepare Your Repository

The following files have been created for deployment:

- `render.yaml` - Render service configuration
- `Dockerfile` - Container configuration (optional)
- `.dockerignore` - Docker ignore file
- Updated `package.json` with production scripts

## Step 2: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

1. **Login to Render Dashboard**
   - Go to [render.com](https://render.com)
   - Sign up/Login with your GitHub account

2. **Create a New Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Select your EventMarketers backend repository

3. **Configure the Service**
   - **Name**: `eventmarketers-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma generate && npx prisma db push`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose paid plan for better performance)

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-frontend-domain.com
   BCRYPT_ROUNDS=12
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

5. **Create Database**
   - Click "New +" → "PostgreSQL"
   - **Name**: `eventmarketers-db`
   - **Plan**: Free (or choose paid plan)
   - **Database Name**: `eventmarketers`
   - **User**: `eventmarketers_user`

6. **Link Database to Service**
   - In your web service settings
   - Add environment variable: `DATABASE_URL` (Render will auto-populate this)

### Option B: Using render.yaml (Infrastructure as Code)

1. **Push your code** with the `render.yaml` file to your repository
2. **In Render Dashboard**:
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will automatically detect and use the `render.yaml` configuration

## Step 3: Database Setup

1. **Update Prisma Schema** (if needed)
   - The current schema uses SQLite for development
   - For production, you'll use PostgreSQL (provided by Render)

2. **Database Migration**
   - Render will automatically run `npx prisma db push` during deployment
   - This will create all necessary tables

3. **Seed Data** (Optional)
   - If you have seed data, you can run it manually after deployment
   - Or add it to the build command: `npm run db:seed`

## Step 4: Environment Variables

Set these environment variables in your Render service:

### Required Variables
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render's default)
- `DATABASE_URL`: Auto-provided by Render when you link the database
- `JWT_SECRET`: Generate a secure random string
- `CORS_ORIGIN`: Your frontend domain (e.g., `https://your-app.vercel.app`)

### Optional Variables
- `JWT_EXPIRES_IN`: `7d` (default)
- `BCRYPT_ROUNDS`: `12` (default)
- `RATE_LIMIT_WINDOW_MS`: `900000` (15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: `100`

### External API Keys (if using)
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `WHATSAPP_API_KEY`: Your WhatsApp API key
- `MAILGUN_API_KEY`: Your Mailgun API key
- `MAILGUN_DOMAIN`: Your Mailgun domain

## Step 5: Deploy and Test

1. **Deploy**
   - Click "Create Web Service" (or "Deploy" if using Blueprint)
   - Wait for the build to complete (usually 2-5 minutes)

2. **Test Your Deployment**
   - Health check: `https://your-service-name.onrender.com/health`
   - API base: `https://your-service-name.onrender.com/api`

3. **Monitor Logs**
   - Check the "Logs" tab in Render dashboard
   - Look for any errors during startup

## Step 6: Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to your service settings
   - Click "Custom Domains"
   - Add your domain (e.g., `api.yourdomain.com`)

2. **Update CORS**
   - Update `CORS_ORIGIN` environment variable
   - Redeploy if necessary

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation succeeds locally
   - Check build logs in Render dashboard

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is set correctly
   - Check database is running and accessible
   - Ensure Prisma schema is compatible with PostgreSQL

3. **Runtime Errors**
   - Check application logs
   - Verify all environment variables are set
   - Test endpoints individually

4. **CORS Issues**
   - Update `CORS_ORIGIN` to match your frontend domain
   - Ensure frontend is making requests to the correct backend URL

### Performance Optimization

1. **Upgrade Plan**
   - Free tier has limitations (sleeps after 15 minutes of inactivity)
   - Consider upgrading to paid plan for production use

2. **Database Optimization**
   - Use connection pooling
   - Add database indexes for frequently queried fields

3. **Caching**
   - Implement Redis for session storage
   - Add response caching for static content

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive keys to repository
   - Use Render's environment variable system
   - Rotate JWT secrets regularly

2. **Database Security**
   - Use strong database passwords
   - Enable SSL connections
   - Regular backups

3. **API Security**
   - Rate limiting is already configured
   - Helmet.js provides security headers
   - Input validation with express-validator

## Monitoring and Maintenance

1. **Health Checks**
   - Monitor `/health` endpoint
   - Set up uptime monitoring
   - Configure alerts for downtime

2. **Logs**
   - Review logs regularly
   - Set up log aggregation if needed
   - Monitor error rates

3. **Updates**
   - Keep dependencies updated
   - Test updates in staging environment
   - Use blue-green deployments for zero downtime

## Support

- Render Documentation: https://render.com/docs
- Prisma Documentation: https://www.prisma.io/docs
- Express.js Documentation: https://expressjs.com/

Your EventMarketers backend should now be successfully deployed to Render! 🚀
