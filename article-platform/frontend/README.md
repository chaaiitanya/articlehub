# Article Hub - Modern Publishing Platform

A responsive, client-side article publishing platform with localStorage data persistence, perfect for hosting on Netlify.

## Features

- 📝 **Article Management**: Create, read, and manage articles
- 💾 **Local Storage**: All data stored in browser's localStorage
- 🎨 **Modern Design**: Clean, responsive UI with dark mode support
- 👤 **Admin Dashboard**: Comprehensive admin panel for content management
- 💬 **Comments System**: Built-in commenting functionality
- 🔍 **Search & Filter**: Search articles and filter by category
- 📱 **Mobile Responsive**: Works perfectly on all devices
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📤 **Data Export/Import**: Backup and restore your data

## Data Storage

**All data is stored locally in the browser's localStorage**, including:
- Articles (published and drafts)
- Comments
- User preferences (theme settings)

This means:
- ✅ No backend server required
- ✅ Zero hosting costs (static site hosting only)
- ✅ Complete privacy - data never leaves your browser
- ✅ Works offline once loaded
- ⚠️ Data is specific to each browser/device
- ⚠️ Clearing browser data will delete all content

## Deployment to Netlify

### Method 1: Deploy with Git

1. **Fork or clone this repository**
2. **Push to your GitHub/GitLab/Bitbucket repository**
3. **Connect to Netlify**:
   - Log in to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Choose your repository
   - Set build settings:
     - **Publish directory**: `article-platform/frontend`
   - Click "Deploy site"

### Method 2: Drag and Drop

1. **Download the frontend folder**
2. **Visit [Netlify Drop](https://app.netlify.com/drop)**
3. **Drag the entire `frontend` folder** to the upload area
4. **Your site will be live instantly!**

### Method 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to frontend directory
cd article-platform/frontend

# Deploy to Netlify
netlify deploy

# Deploy to production
netlify deploy --prod
```

## Project Structure

```
frontend/
├── index.html          # Home page with article listing
├── article.html        # Article detail page
├── write.html          # Article creation/editing page
├── admin.html          # Admin dashboard
├── styles.css          # All styles
├── app.js              # Main page JavaScript
├── article.js          # Article page JavaScript
├── write.js            # Write page JavaScript
├── admin.js            # Admin dashboard JavaScript
├── netlify.toml        # Netlify configuration
└── README.md           # This file
```

## Usage

### Writing Articles
1. Navigate to the "Write" page
2. Fill in article details (title, author, category, etc.)
3. Use the formatting toolbar for rich text
4. Preview your article before publishing
5. Save as draft or publish immediately

### Admin Dashboard
1. Go to the "Admin" page
2. View statistics (total articles, comments, views)
3. Manage all articles and drafts
4. Export/import data for backup
5. Clear all data if needed

### Data Backup
1. Go to Admin Dashboard
2. Click "Export Data" to download a JSON backup
3. Use "Import Data" to restore from a backup file

## Features in Detail

### Article Features
- Rich text editor with markdown-like formatting
- Cover image support (via URL)
- Categories and tags
- View tracking
- Auto-save drafts every 30 seconds

### Comment System
- Anonymous or named comments
- Timestamp for each comment
- Associated with specific articles

### Search and Filter
- Real-time search across titles, content, and tags
- Filter by category
- Sort by date or popularity

## Customization

### Modify Categories
Edit the category options in `write.html` and `index.html`:
```html
<option value="technology">Technology</option>
<option value="science">Science</option>
<!-- Add your categories here -->
```

### Change Theme Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-color: #4f46e5;
    --secondary-color: #06b6d4;
    /* Modify colors here */
}
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Limitations

Since data is stored in localStorage:
- Storage limit: ~5-10MB depending on browser
- Data doesn't sync across devices
- Clearing browser data removes all content
- Each domain has separate storage

## Tips for Production

1. **Regular Backups**: Export your data regularly
2. **Custom Domain**: Set up a custom domain in Netlify settings
3. **Analytics**: Add Google Analytics or Netlify Analytics
4. **SEO**: Modify meta tags in HTML files for better SEO

## Security Notes

- All data is stored client-side
- No authentication system (consider adding if needed)
- Admin panel is accessible to anyone (add password protection via Netlify if needed)
- Content is not encrypted in localStorage

## Future Enhancements

Possible improvements:
- Add authentication/authorization
- Implement IndexedDB for larger storage
- Add PWA capabilities for offline use
- Integrate with a backend API
- Add image upload functionality
- Implement user accounts

## Support

For issues or questions:
1. Check browser console for errors
2. Ensure localStorage is enabled
3. Try exporting and re-importing data
4. Clear cache and reload

## License

MIT License - feel free to use and modify as needed!

---

**Ready to deploy?** Just drag the `frontend` folder to [Netlify Drop](https://app.netlify.com/drop) and your site will be live in seconds! 🚀