# Netlify Deployment Guide

Your frontend is fully configured and ready to be deployed to Netlify! I have added the essential `_redirects` file so React Router works correctly, and updated the `api.js` configuration.

### How to deploy:

1. Create a GitHub repository and push this entire `barcode-attendance-system` folder to it.
2. Log into [Netlify](https://www.netlify.com/), click **Add new site** > **Import an existing project**.
3. Connect your GitHub account and select your repository.
4. **Important Build Settings:**
   * **Base directory:** `frontend`
   * **Build command:** `npm run build`
   * **Publish directory:** `frontend/dist`
5. Click **Deploy Site**! Your frontend will instantly be live on a public HTTPS URL.

### ⚠️ Critical Backend Step ⚠️

Netlify only hosts your frontend. Since your frontend is accessed via a mobile phone from anywhere in the world, **it cannot connect to the `localhost:5000` backend server running on your laptop!** 

You must also deploy your backend to a free service like **Render.com**:
1. Go to [Render.com](https://render.com/) and create a "Web Service".
2. Connect the same GitHub repository.
3. Set the Root Directory to `backend`.
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add your Environment Variables in Render:
   * `MONGO_URI` = your MongoDB Atlas URL (you need a cloud database now, not a local one!)
   * `JWT_SECRET` = any secret key
7. Once Render builds your backend successfully, it will give you a public URL (e.g., `https://my-backend.onrender.com`).

**Final Step:**
Go back to your Netlify site settings > **Environment Variables** and add:
* Key: `VITE_API_URL`
* Value: `https://my-backend.onrender.com/api` (Whatever URL Render gave you, plus `/api`)

Then trigger a re-deploy on Netlify. Your mobile phone will now load the frontend on Netlify, securely connect to your backend on Render, and your scanner will run smoothly!
