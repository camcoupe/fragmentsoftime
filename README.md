# India 10th Anniversary Photo Gallery

A beautiful, modern photo gallery website to showcase your India photos.

## View the site

Double-click `index.html` to open it in your browser. No installation needed.

---

## Getting Started

### Step 1: Add Your Photos

1. Create a folder called `images` in this project directory
2. Add your photos to the `images` folder
3. Name your photos (e.g., `photo1.jpg`, `photo2.jpg`, etc.)

### Step 2: Update the Photo List

Open `script.js` and find the `photos` array at the top of the file. Update it with your actual photos:

```javascript
const photos = [
    {
        src: 'images/your-photo-1.jpg',
        caption: 'Description of your photo',
        category: 'landscape'  // or 'people', 'culture', 'food'
    },
    {
        src: 'images/your-photo-2.jpg',
        caption: 'Another description',
        category: 'culture'
    },
    // Add more photos here...
];
```

**Categories you can use:**
- `landscape` - For scenic views, nature, landscapes
- `people` - For portraits and people photos
- `culture` - For cultural events, traditions, festivals
- `food` - For food and dining photos
- Or create your own categories!

### Step 3: Open the Website

1. Simply open `index.html` in your web browser
   - Double-click the file, or
   - Right-click and select "Open with" → your browser

That's it! Your gallery is ready.

## Features

- ✨ Beautiful, modern design
- 📱 Responsive (works on phones, tablets, and computers)
- 🔍 Filter photos by category
- 🖼️ Click any photo to view it full-size
- ⌨️ Use arrow keys to navigate between photos
- 🎨 Smooth animations and transitions

## File Structure

```
India 10th Anniversay Website/
├── index.html      # Main webpage
├── styles.css      # Styling and design
├── script.js       # Gallery functionality
├── README.md       # This file
└── images/         # Your photos go here
    ├── photo1.jpg
    ├── photo2.jpg
    └── ...
```

## Customization

### Change Colors

Edit `styles.css` and look for the color values:
- `#667eea` - Main purple color
- `#764ba2` - Secondary purple color

Replace these with any colors you like!

### Change Title

Edit `index.html` and find:
```html
<h1>India - 10th Anniversary</h1>
<p class="subtitle">A Visual Journey</p>
```

Change these to whatever you want!

### Add More Categories

1. In `index.html`, add a new filter button:
```html
<button class="filter-btn" data-filter="your-category">Your Category</button>
```

2. Use that category name in your photos in `script.js`

## Tips

- **Image sizes**: For best performance, resize large photos to around 1200-2000px wide before adding them
- **File formats**: JPG works best for photos. PNG works too, but files may be larger
- **Naming**: Use descriptive names for your image files to make them easier to manage

## Need Help?

If you're stuck:
1. Make sure your `images` folder exists and contains your photos
2. Check that the file paths in `script.js` match your actual image file names
3. Make sure image file names don't have spaces (use dashes or underscores instead)

Enjoy showcasing your India photos! 🇮🇳

