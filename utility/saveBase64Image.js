const fs = require('fs');
const path = require('path');

// Save base64 image to local storage
exports.saveBase64Image = (base64String, prodName, qty) => {
    const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 image format');
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const imageExtension = matches[1].split('/')[1];
    const folderPath = path.join(__dirname, '../uploads');
    const fileName = `${Date.now()}.${imageExtension}`;
    const filePath = path.join(folderPath, fileName);

    // Ensure folder exists
    fs.mkdirSync(folderPath, { recursive: true });

    // Write file
    fs.writeFileSync(filePath, buffer);

    return fileName; // Or just return fileName or relative path for DB
};
