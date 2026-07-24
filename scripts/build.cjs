const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const rootPath = path.join(__dirname, '..');
  const distPath = path.join(rootPath, 'dist');

  // 1. Run anchor randomization
  console.log('Running anchor text randomizer...');
  execSync('node scripts/randomize_anchors.cjs', { stdio: 'inherit' });

  // 2. Create dist folder
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
  }
  fs.mkdirSync(distPath);

  // 3. Copy files to dist folder
  const filesToCopy = ['index.html', 'style.css', 'logo.jpg', 'favicon.svg', 'icons.svg'];
  filesToCopy.forEach(file => {
    const src = path.join(rootPath, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(distPath, file));
      console.log(`Copied ${file} to dist/`);
    }
  });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
