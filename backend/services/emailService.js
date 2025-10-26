import { SES, SendEmailCommand } from '@aws-sdk/client-ses';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS SES
const ses = new SES({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  region: process.env.AWS_REGION || 'us-east-1'
});

// Generate OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
export const sendOTPEmail = async (email, otp, userName = 'User') => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const loginUrl = `${frontendUrl}/#/login`;
    const year = new Date().getFullYear();
    const brandName = process.env.BRAND_NAME || 'Bravo Rewards';
    const accent = process.env.BRAND_ACCENT_HEX || '#22c55e';
    const otpDigits = otp.split('').map(d => '<span class="digit">'+d+'</span>').join('');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${brandName} • Sign-In Code</title>
<style>
  body{margin:0;background-color:#0b1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';color:#e5e7eb;}
  .container{max-width:600px;margin:0 auto;padding:32px;}
  .card{background:#0f172a;border:1px solid #1f2937;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.35);}
  .header{background:linear-gradient(135deg,#0b1220,#0f172a);padding:28px;border-bottom:1px solid #1f2937;}
  .brand{display:inline-block;font-weight:700;font-size:20px;letter-spacing:.3px;color:#ffffff}
  .accent{display:block;height:3px;width:56px;background:${accent};border-radius:2px;margin-top:10px}
  .content{padding:28px}
  .h1{margin:0 0 8px 0;font-size:22px;color:#ffffff}
  .muted{color:#9ca3af;font-size:14px;line-height:1.6}
  .otp{text-align:center;margin:22px 0;font-size:0;white-space:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch}
  .digit{display:inline-block;width:52px;height:60px;line-height:60px;margin:0 6px;border-radius:12px;background:linear-gradient(180deg,#111827 0%,#0b1220 100%);border:1px solid #1f2937;font-size:26px;font-weight:800;color:#ffffff;box-shadow:0 6px 16px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.03);font-variant-numeric:tabular-nums;vertical-align:middle}
  @media only screen and (max-width:480px){.digit{width:42px;height:50px;line-height:50px;margin:0 3px;font-size:22px}.container{padding:16px!important}.content{padding:20px!important}.header{padding:20px!important}}
  .button{display:inline-block;background:${accent};color:#04150f;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;margin-top:10px}
  .footer{padding:18px 28px;background:#0b1220;border-top:1px solid #1f2937;color:#6b7280;font-size:12px;text-align:center}
  .warn{background:#111827;border:1px solid #1f2937;border-left:3px solid #f59e0b;color:#e5e7eb;border-radius:10px;padding:12px 14px;margin-top:18px}
  .preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all}
</style>
</head>
<body>
  <div class="preheader">Your one-time sign-in code for ${brandName}: ${otp}. Expires in 10 minutes.</div>
  <div class="container">
    <div class="card">
      <div class="header">
        <span class="brand">${brandName}</span>
        <span class="accent"></span>
      </div>
      <div class="content">
        <p class="h1">Your secure sign-in code</p>
        <p class="muted">Hi ${userName}, use the code below to complete your sign-in. This code expires in 10 minutes.</p>
        <div class="otp">
          ${otpDigits}
        </div>
        <div style="text-align:center">
          <a href="${loginUrl}" class="button">Open ${brandName}</a>
        </div>
        <div class="warn"><strong>Security tip:</strong> Never share this code. ${brandName} support will never ask for it.</div>
        <p class="muted">If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div class="footer">© ${year} ${brandName}. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`;
    const textContent = `${brandName} - Your sign-in code\n\nHi ${userName},\nYour one-time sign-in code is: ${otp}\nIt expires in 10 minutes.\n\nOpen ${brandName}: ${loginUrl}\n\nIf you didn't request this code, you can ignore this email.\n\n© ${year} ${brandName}`;


    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@`.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: `Your Secure ${brandName} Sign-In Code`, Charset: 'UTF-8' },
        Body: {
          Text: { Data: textContent, Charset: 'UTF-8' },
          Html: { Data: htmlContent, Charset: 'UTF-8' }
        }
      }
    });

    const result = await ses.send(command);
    console.log('OTP email sent successfully:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

// Send Welcome Email
export const sendWelcomeEmail = async (email, userName = 'User') => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const year = new Date().getFullYear();
    const brandName = process.env.BRAND_NAME || 'Bravo Rewards';
    const accent = process.env.BRAND_ACCENT_HEX || '#22c55e';
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to ${brandName}</title>
<style>
  body{margin:0;background-color:#0b1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';color:#e5e7eb;}
  .container{max-width:600px;margin:0 auto;padding:32px;}
  .card{background:#0f172a;border:1px solid #1f2937;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.35);}
  .header{background:linear-gradient(135deg,#0b1220,#0f172a);padding:28px;border-bottom:1px solid #1f2937;}
  .brand{display:inline-block;font-weight:700;font-size:20px;letter-spacing:.3px;color:#ffffff}
  .accent{display:block;height:3px;width:56px;background:${accent};border-radius:2px;margin-top:10px}
  .content{padding:28px}
  .h1{margin:0 0 8px 0;font-size:22px;color:#ffffff}
  .muted{color:#9ca3af;font-size:14px;line-height:1.6}
  .list{margin:14px 0 0 0;padding:0}
  .list li{margin:8px 0 0 0}
  .button{display:inline-block;background:${accent};color:#04150f;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;margin-top:14px}
  .footer{padding:18px 28px;background:#0b1220;border-top:1px solid #1f2937;color:#6b7280;font-size:12px;text-align:center}
  .preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all}
  @media only screen and (max-width:480px){.container{padding:16px!important}.content{padding:20px!important}.header{padding:20px!important}}
</style>
</head>
<body>
  <div class="preheader">Welcome to ${brandName} — your account is ready.</div>
  <div class="container">
    <div class="card">
      <div class="header">
        <span class="brand">${brandName}</span>
        <span class="accent"></span>
      </div>
      <div class="content">
        <p class="h1">Welcome aboard, ${userName}!</p>
        <p class="muted">You're in. Your ${brandName} account is ready — here’s how to make the most of it:</p>
        <ul class="list">
          <li class="muted">Complete your profile to personalize your experience</li>
          <li class="muted">Join a community or create your own</li>
          <li class="muted">Start a sprint and begin earning premium rewards</li>
        </ul>
        <div style="margin-top:14px">
          <a href="${frontendUrl}" class="button">Launch Dashboard</a>
        </div>
        <p class="muted" style="margin-top:18px">Need help? Reply to this email and our team will assist you.</p>
      </div>
      <div class="footer">© ${year} ${brandName}. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`;
    const textContent = `Welcome to ${brandName}, ${userName}!\n\nYour account is ready.\n\nNext steps:\n• Complete your profile\n• Join a community or create your own\n• Start a sprint and earn rewards\n\nLaunch Dashboard: ${frontendUrl}\n\n© ${year} ${brandName}`;


    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@bravorewards.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Welcome to Bravo Rewards — Let’s get you started', Charset: 'UTF-8' },
        Body: {
          Text: { Data: textContent, Charset: 'UTF-8' },
          Html: { Data: htmlContent, Charset: 'UTF-8' }
        }
      }
    });

    const result = await ses.send(command);
    console.log('Welcome email sent successfully:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

// Send Invitation Email
export const sendInvitationEmail = async (email, communityName, inviterName, role, invitationToken) => {
  try {
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/login?invite=${invitationToken}`;
    const year = new Date().getFullYear();
    const brandName = process.env.BRAND_NAME || 'Bravo Rewards';
    const accent = process.env.BRAND_ACCENT_HEX || '#22c55e';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>You're invited to ${communityName}</title>
<style>
  body{margin:0;background-color:#0b1220;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';color:#e5e7eb;}
  .container{max-width:600px;margin:0 auto;padding:32px;}
  .card{background:#0f172a;border:1px solid #1f2937;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.35);}
  .header{background:linear-gradient(135deg,#0b1220,#0f172a);padding:28px;border-bottom:1px solid #1f2937;}
  .brand{display:inline-block;font-weight:700;font-size:20px;letter-spacing:.3px;color:#ffffff}
  .accent{display:block;height:3px;width:56px;background:${accent};border-radius:2px;margin-top:10px}
  .content{padding:28px}
  .h1{margin:0 0 8px 0;font-size:22px;color:#ffffff}
  .muted{color:#9ca3af;font-size:14px;line-height:1.6}
  .invite-box{background:linear-gradient(180deg,#111827 0%,#0b1220 100%);border:1px solid #1f2937;border-radius:12px;padding:20px;margin:20px 0;text-align:center}
  .invite-role{font-size:18px;font-weight:700;color:${accent};margin:0 0 8px 0}
  .button{display:inline-block;background:${accent};color:#04150f;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;margin-top:14px}
  .footer{padding:18px 28px;background:#0b1220;border-top:1px solid #1f2937;color:#6b7280;font-size:12px;text-align:center}
  .preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all}
  .warn{background:#111827;border:1px solid #1f2937;border-left:3px solid #f59e0b;color:#e5e7eb;border-radius:10px;padding:12px 14px;margin-top:18px;font-size:13px}
  @media only screen and (max-width:480px){.container{padding:16px!important}.content{padding:20px!important}.header{padding:20px!important}}
</style>
</head>
<body>
  <div class="preheader">You've been invited to join ${communityName} on ${brandName}</div>
  <div class="container">
    <div class="card">
      <div class="header">
        <span class="brand">${brandName}</span>
        <span class="accent"></span>
      </div>
      <div class="content">
        <p class="h1">You're invited!</p>
        <p class="muted"><strong>${inviterName}</strong> has invited you to join <strong>${communityName}</strong> on ${brandName}.</p>
        <div class="invite-box">
          <p class="invite-role">Invited as ${role.toUpperCase()}</p>
          <p class="muted" style="margin:0">Join the community and start earning reward points!</p>
        </div>
        <div style="text-align:center">
          <a href="${inviteUrl}" class="button">Accept Invitation</a>
        </div>
        <div class="warn">This invitation will expire in 7 days. If you don't have an account yet, you'll be able to create one when you accept.</div>
      </div>
      <div class="footer">© ${year} ${brandName}. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`;

    const textContent = `You're invited to join ${communityName}!\n\n${inviterName} has invited you to join ${communityName} on ${brandName} as ${role}.\n\nAccept invitation: ${inviteUrl}\n\nThis invitation will expire in 7 days.\n\n© ${year} ${brandName}`;

    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@bravorewards.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: `You're invited to join ${communityName} on ${brandName}!`, Charset: 'UTF-8' },
        Body: {
          Text: { Data: textContent, Charset: 'UTF-8' },
          Html: { Data: htmlContent, Charset: 'UTF-8' }
        }
      }
    });

    const result = await ses.send(command);
    console.log('Invitation email sent successfully:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw error;
  }
};
