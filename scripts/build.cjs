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

  // 3. Copy index.html and style.css
  fs.copyFileSync(path.join(rootPath, 'index.html'), path.join(distPath, 'index.html'));
  console.log('Copied index.html to dist/');

  fs.copyFileSync(path.join(rootPath, 'style.css'), path.join(distPath, 'style.css'));
  console.log('Copied style.css to dist/');

  // 4. Copy public directory assets
  const publicPath = path.join(rootPath, 'public');
  if (fs.existsSync(publicPath)) {
    const files = fs.readdirSync(publicPath);
    files.forEach(file => {
      const src = path.join(publicPath, file);
      const dest = path.join(distPath, file);
      if (fs.lstatSync(src).isFile()) {
        fs.copyFileSync(src, dest);
        console.log(`Copied public/${file} to dist/`);
      }
    });
  }

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
