import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  console.log('🚀 Starting Cover Image rendering pipeline...');

  const htmlPath = path.resolve(__dirname, '../cover_image.html');
  const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // 2x retina = 3840x2160 master
  });

  console.log(`Navigating to ${fileUrl}...`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // Ensure all fonts are ready
  await page.evaluate(async () => {
    await document.fonts.ready;
  });

  await page.waitForTimeout(1000);

  const brandDir = path.resolve(__dirname, '../assets/brand');
  const publicDir = path.resolve(__dirname, '../public');
  const artifactDir = 'C:/Users/pichk/.gemini/antigravity/brain/5cb9e247-671a-49cb-8e4a-3f75f90a0733';

  if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const pngOutBrand = path.join(brandDir, 'flowagent-cover-16x9.png');
  const jpgOutBrand = path.join(brandDir, 'flowagent-cover-16x9.jpg');
  const pngOutPublic = path.join(publicDir, 'flowagent-cover-16x9.png');
  const jpgOutPublic = path.join(publicDir, 'flowagent-cover-16x9.jpg');
  const pngOutArtifact = path.join(artifactDir, 'flowagent-cover-16x9.png');
  const jpgOutArtifact = path.join(artifactDir, 'flowagent-cover-16x9.jpg');

  console.log('Capturing PNG screenshot...');
  await page.screenshot({
    path: pngOutBrand,
    type: 'png',
  });

  console.log('Capturing JPG screenshot...');
  await page.screenshot({
    path: jpgOutBrand,
    type: 'jpeg',
    quality: 95,
  });

  // Copy to public and artifact folders
  fs.copyFileSync(pngOutBrand, pngOutPublic);
  fs.copyFileSync(jpgOutBrand, jpgOutPublic);
  fs.copyFileSync(pngOutBrand, pngOutArtifact);
  fs.copyFileSync(jpgOutBrand, jpgOutArtifact);

  await browser.close();

  console.log('✅ Render completed successfully!');
  console.log(`- PNG: ${pngOutBrand}`);
  console.log(`- JPG: ${jpgOutBrand}`);
  console.log(`- Public: ${pngOutPublic}`);
  console.log(`- Artifact: ${pngOutArtifact}`);
}

main().catch((err) => {
  console.error('❌ Error rendering cover image:', err);
  process.exit(1);
});
