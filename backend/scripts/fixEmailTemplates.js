import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '../services/emailService.js');

let content = fs.readFileSync(filePath, 'utf8');

// Fix Welcome email subject
content = content.replace(
  /Subject: { Data: 'Welcome to SprintRewards — Let's get you started'/,
  "Subject: { Data: `Welcome to ${brandName} — Let's get you started`"
);

// Fix Invitation email subject
content = content.replace(
  /Subject: { Data: `You're invited to join \${communityName} on SprintRewards!`/,
  "Subject: { Data: `You're invited to join ${communityName} on ${brandName}!`"
);

fs.writeFileSync(filePath, content);
console.log('✅ Email templates fixed!');

