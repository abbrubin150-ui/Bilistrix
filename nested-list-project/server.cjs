const express = require('express');
const path = require('path');

const app = express();
const distPath = path.join(__dirname, 'dist');
const indexHtml = path.join(distPath, 'index.html');

app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(indexHtml);
});

const port = process.env.PORT || 4173;
app.listen(port, () => {
  console.log(`Nested List App running at http://localhost:${port}`);
});
