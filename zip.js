// zip.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const JSZip = require('jszip');

const zip = new JSZip();

// List of files/folders to include
const filesToZip = [
    'dist/**/*',
    'manifest.json',
    'popup.html',
    'popup.css',
    'icon*.png'
];

console.log('Starting to zip files...');

// Find all matching files
const files = filesToZip.flatMap(pattern => glob.sync(pattern));

if (files.length === 0) {
    console.error('No files found to zip. Check your patterns in zip.js.');
    process.exit(1);
}

// Add files to the zip
files.forEach(file => {
    // Check if it's a directory (glob's 'dist/**/*' might return dirs)
    if (fs.statSync(file).isDirectory()) {
        return;
    }

    // Read file content
    const fileContent = fs.readFileSync(file);
    // Use relative path for zip file structure
    const relativePath = path.relative(__dirname, file);

    console.log(`Adding: ${relativePath}`);
    zip.file(relativePath, fileContent);
});

// Generate the zip file
zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    .then(content => {
        fs.writeFileSync('auto-evaluate-utec.zip', content);
        console.log('✅ Success! auto-evaluate-utec.zip created.');
    })
    .catch(err => {
        console.error('❌ Error creating zip file:', err);
    });
