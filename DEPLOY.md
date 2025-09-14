# Deploy to Vercel

## Quick Deploy Steps:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project directory:**
   ```bash
   vercel
   ```

4. **Follow prompts:**
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N**
   - Project name? **realtime-chat-app**
   - Directory? **./realtime-chat-app**

## Alternative: GitHub Deploy

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Deploy automatically

## Environment Variables (Optional):
- `PORT`: Server port (default: 4000)

## Features Included:
- ✅ Real-time messaging
- ✅ Voice/Video calling
- ✅ Image sharing
- ✅ Emoji picker
- ✅ User colors
- ✅ Room management
- ✅ WebRTC support

## Post-Deploy:
Your app will be available at: `https://your-app-name.vercel.app`

## Notes:
- WebSocket connections work on Vercel
- CORS configured for cross-origin requests
- Static files served from `/public`
- Node.js 18.x runtime specified
