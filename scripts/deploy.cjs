const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Building Vite production bundle...');
  execSync('npm run build', { stdio: 'inherit' });

  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build folder (dist) not found.');
  }

  // Read remote URL from main git config
  console.log('Retrieving git remote origin URL...');
  const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();
  if (!remoteUrl) {
    throw new Error('No remote origin URL found.');
  }

  process.chdir(distPath);

  console.log('Initializing temporary git repository inside dist...');
  execSync('git init');
  execSync('git checkout -b gh-pages');
  execSync('git add .');
  execSync('git commit -m "Deploy to GitHub Pages"');

  console.log(`Force pushing build to ${remoteUrl} [gh-pages]...`);
  execSync(`git push -f ${remoteUrl} gh-pages`);

  // Cleanup
  console.log('Cleaning up temporary git files...');
  fs.rmSync('.git', { recursive: true, force: true });

  console.log('Successfully deployed to GitHub Pages!');
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
