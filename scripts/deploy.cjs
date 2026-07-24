const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Randomizing sitemap anchors in index.html...');
  execSync('node scripts/randomize_anchors.cjs', { stdio: 'inherit' });

  const rootPath = path.join(__dirname, '..');
  const deployPath = path.join(rootPath, 'dist_deploy');

  // Clean or recreate deploy path
  if (fs.existsSync(deployPath)) {
    fs.rmSync(deployPath, { recursive: true, force: true });
  }
  fs.mkdirSync(deployPath);

  // Copy files needed for deployment
  fs.copyFileSync(path.join(rootPath, 'index.html'), path.join(deployPath, 'index.html'));
  fs.copyFileSync(path.join(rootPath, 'style.css'), path.join(deployPath, 'style.css'));
  console.log('Copied core index and style files to deploy folder.');

  // Copy public directory assets
  const publicPath = path.join(rootPath, 'public');
  if (fs.existsSync(publicPath)) {
    const files = fs.readdirSync(publicPath);
    files.forEach(file => {
      const src = path.join(publicPath, file);
      const dest = path.join(deployPath, file);
      if (fs.lstatSync(src).isFile()) {
        fs.copyFileSync(src, dest);
        console.log(`Copied public/${file} to deploy folder.`);
      }
    });
  }

  // Read remote URL from main git config
  console.log('Retrieving git remote origin URL...');
  const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();
  if (!remoteUrl) {
    throw new Error('No remote origin URL found.');
  }

  process.chdir(deployPath);

  console.log('Initializing temporary git repository inside deploy folder...');
  execSync('git init');
  execSync('git checkout -b gh-pages');
  execSync('git add .');
  execSync('git commit -m "Deploy static HTML site with assets to GitHub Pages"');

  console.log(`Force pushing build to ${remoteUrl} [gh-pages]...`);
  execSync(`git push -f ${remoteUrl} gh-pages`);

  // Cleanup
  console.log('Cleaning up temporary deploy folder...');
  process.chdir(rootPath);
  fs.rmSync(deployPath, { recursive: true, force: true });

  console.log('Successfully deployed static HTML & CSS site with public assets to GitHub Pages!');
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
