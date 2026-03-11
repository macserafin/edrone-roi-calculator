const express = require('express');
const compression = require('compression');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3002;

// Gzip compression — critical for ad landing page speed
app.use(compression({ level: 6, threshold: 256 }));

// Static files with aggressive caching (images/fonts = 1 year, HTML = 10 min)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '10m',
  setHeaders: (res, filePath) => {
    if (/\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    if (/\.html$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=86400');
    }
  }
}));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`ROI Calculator running on :${PORT}`));
