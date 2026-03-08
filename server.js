const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 3000;
const rootDir = __dirname;

app.use(express.json({ limit: '3mb' }));
app.use(express.static(rootDir));

app.post('/api/render-pdf', async (req, res) => {
  const html = String(req.body?.html || '');
  if (!html.trim()) {
    res.status(400).json({ error: 'html is required' });
    return;
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="invoice.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF rendering failed:', error);
    res.status(500).json({ error: 'failed_to_render_pdf' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`invoice-tool listening on http://localhost:${port}`);
});
