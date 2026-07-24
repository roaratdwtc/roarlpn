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
  const filesToCopy = ['index.html', 'style.css', 'logo.jpg', 'favicon.svg', 'icons.svg'];
  filesToCopy.forEach(file => {
    const src = path.join(rootPath, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(deployPath, file));
      console.log(`Copied ${file} to deployment folder.`);
    }
  });

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
  execSync('git commit -m "Deploy static HTML site to GitHub Pages"');

  console.log(`Force pushing build to ${remoteUrl} [gh-pages]...`);
  execSync(`git push -f ${remoteUrl} gh-pages`);

  // Cleanup
  console.log('Cleaning up temporary deploy folder...');
  process.chdir(rootPath);
  fs.rmSync(deployPath, { recursive: true, force: true });

  console.log('Successfully deployed static HTML & CSS site to GitHub Pages!');
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
