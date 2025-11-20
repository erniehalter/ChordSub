# Barry Harris Analyzer Web App

## How to Deploy to Netlify (Free & Easy)

1. **Download Code:**
   - Save all the provided files into a folder on your computer (e.g., `bh-analyzer`). Ensure the folder structure matches the file paths (create `src` folder, `components` subfolder, etc.). 
   - *Note:* The XML provided flattens the structure slightly for `App.tsx` and `index.tsx` being in the root. Ensure they are in the root of your source folder.

2. **Install Dependencies:**
   - You need Node.js installed.
   - Open your terminal/command prompt in the folder.
   - Run: `npm init -y`
   - Run: `npm install react react-dom vite @vitejs/plugin-react typescript tailwindcss postcss autoprefixer lucide-react @tonaljs/tonal`
   - Run: `npm install -D @types/react @types/react-dom`

3. **Create Build Script:**
   - Open `package.json` and add these scripts:
     ```json
     "scripts": {
       "dev": "vite",
       "build": "tsc && vite build",
       "preview": "vite preview"
     }
     ```

4. **GitHub (Recommended for Netlify):**
   - Create a new repository on GitHub.
   - Push this code to the repository.

5. **Deploy on Netlify:**
   - Log in to [Netlify](https://www.netlify.com/).
   - Click **"Add new site"** > **"Import from an existing project"**.
   - Select **GitHub** and choose your repository.
   - Netlify will auto-detect the settings:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
   - Click **"Deploy Site"**.

6. **Done!** Netlify will give you a URL (e.g., `musical-sunshine-12345.netlify.app`).

## Manual Upload (Alternative)
1. Run `npm run build` locally.
2. Drag and drop the generated `dist` folder onto the Netlify dashboard "Sites" area.
