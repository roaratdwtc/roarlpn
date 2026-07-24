const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Building static site before deploying to Surge...');
  execSync('node scripts/build.cjs', { stdio: 'inherit' });

  const rootPath = path.join(__dirname, '..');
  const distPath = path.join(rootPath, 'dist');

  if (!fs.existsSync(distPath)) {
    throw new Error('Dist directory does not exist. Build failed.');
  }

  console.log('Launching Surge deployment...');
  console.log('Note: If this is your first time using Surge on this PC, it will prompt you to enter your email and choose a password.');
  
  // Run surge command pointing to the dist folder
  execSync('npx surge dist', { stdio: 'inherit', cwd: rootPath });

  console.log('Surge deployment complete!');
} catch (error) {
  console.error('Surge deployment failed:', error.message);
  process.exit(1);
}
