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
    const otpDigits = otp.split('').map(d => `<td style="width:48px;height:48px;text-align:center;vertical-align:middle;background:#1f2937;font-size:24px;font-weight:900;color:#ffffff;padding:0;margin:0 4px;border-radius:6px">${d}</td>`).join('');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${brandName} • Sign-In Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';color:#374151;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 0;background-color:#f9fafb;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#ffffff;padding:28px;border-bottom:1px solid #e5e7eb;">
              <div style="font-weight:700;font-size:20px;letter-spacing:.3px;color:#111827;margin-bottom:10px">${brandName}</div>
              <div style="height:3px;width:56px;background:${accent};border-radius:2px;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;background-color:#ffffff;">
              <p style="margin:0 0 8px 0;font-size:22px;color:#111827;font-weight:700">Your secure sign-in code</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 16px 0">Hi ${userName}, use the code below to complete your sign-in. This code expires in 10 minutes.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="6">
                      <tr>
                        ${otpDigits}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <p style="margin:0;font-size:13px;color:#6b7280;font-weight:600;letter-spacing:2px;font-family:monospace;background:#f3f4f6;padding:12px 16px;border-radius:8px;border:1px solid #e5e7eb">${otp}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <a href="${loginUrl}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;">Open ${brandName}</a>
                  </td>
                </tr>
              </table>
              <div style="background:#fef3c7;border:1px solid #fcd34d;border-left:3px solid #f59e0b;color:#92400e;border-radius:10px;padding:12px 14px;margin-top:18px;font-size:13px"><strong>Security tip:</strong> Never share this code. ${brandName} support will never ask for it.</div>
              <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-top:16px">If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background-color:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center">© ${year} ${brandName}. All rights reserved.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    const textContent = `${brandName} - Your sign-in code\n\nHi ${userName},\nYour one-time sign-in code is: ${otp}\nIt expires in 10 minutes.\n\nOpen ${brandName}: ${loginUrl}\n\nIf you didn't request this code, you can ignore this email.\n\n© ${year} ${brandName}`;


    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@bravorewards.com',
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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
  body{margin:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';color:#374151;}
  .container{max-width:600px;margin:0 auto;padding:32px;}
  .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);}
  .header{background:#ffffff;padding:28px;border-bottom:1px solid #e5e7eb;}
  .brand{display:inline-block;font-weight:700;font-size:20px;letter-spacing:.3px;color:#111827}
  .accent{display:block;height:3px;width:56px;background:${accent};border-radius:2px;margin-top:10px}
  .content{padding:28px;background:#ffffff}
  .h1{margin:0 0 8px 0;font-size:22px;color:#111827;font-weight:700}
  .muted{color:#6b7280;font-size:14px;line-height:1.6}
  .list{margin:14px 0 0 0;padding:0}
  .list li{margin:8px 0 0 0}
  .button{display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;margin-top:14px}
  .footer{padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center}
  .preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all}
  @media only screen and (max-width:480px){.container{padding:16px!important}.content{padding:20px!important}.header{padding:20px!important}}
</style>
</head>
<body style="background-color:#f9fafb;margin:0;padding:0;">
  <div class="preheader">Welcome to ${brandName} — your account is ready.</div>
  <div class="container" style="max-width:600px;margin:0 auto;padding:32px;background-color:#f9fafb;">
    <div class="card" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div class="header" style="background:#ffffff;padding:28px;border-bottom:1px solid #e5e7eb;">
        <span class="brand" style="display:inline-block;font-weight:700;font-size:20px;letter-spacing:.3px;color:#111827">${brandName}</span>
        <span class="accent" style="display:block;height:3px;width:56px;background:${accent};border-radius:2px;margin-top:10px"></span>
      </div>
      <div class="content" style="padding:28px;background:#ffffff">
        <p class="h1" style="margin:0 0 8px 0;font-size:22px;color:#111827;font-weight:700">Welcome aboard, ${userName}!</p>
        <p class="muted">You're in. Your ${brandName} account is ready — here’s how to make the most of it:</p>
        <ul class="list">
          <li class="muted">Complete your profile to personalize your experience</li>
          <li class="muted">Join a community or create your own</li>
          <li class="muted">Start a sprint and begin earning premium rewards</li>
        </ul>
        <div style="margin-top:14px;text-align:center">
          <a href="${frontendUrl}" class="button" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;margin-top:14px">Launch Dashboard</a>
        </div>
        <p class="muted" style="color:#6b7280;font-size:14px;line-height:1.6;margin-top:18px">Need help? Reply to this email and our team will assist you.</p>
      </div>
      <div class="footer" style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center">© ${year} ${brandName}. All rights reserved.</div>
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
  console.log('Sending invitation email to:', email, 'for', communityName, 'as', role, 'with token', invitationToken);
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
  body{margin:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';color:#374151;}
  .container{max-width:600px;margin:0 auto;padding:32px;}
  .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);}
  .header{background:#ffffff;padding:28px;border-bottom:1px solid #e5e7eb;}
  .brand{display:inline-block;font-weight:700;font-size:20px;letter-spacing:.3px;color:#111827}
  .accent{display:block;height:3px;width:56px;background:${accent};border-radius:2px;margin-top:10px}
  .content{padding:28px;background:#ffffff}
  .h1{margin:0 0 8px 0;font-size:22px;color:#111827;font-weight:700}
  .muted{color:#6b7280;font-size:14px;line-height:1.6}
  .invite-box{background:#f0fdf4;border:1px solid #dcfce7;border-radius:12px;padding:20px;margin:20px 0;text-align:center}
  .invite-role{font-size:18px;font-weight:700;color:${accent};margin:0 0 8px 0}
  .button{display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;margin-top:14px}
  .footer{padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center}
  .preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all}
  .warn{background:#fef3c7;border:1px solid #fcd34d;border-left:3px solid #f59e0b;color:#92400e;border-radius:10px;padding:12px 14px;margin-top:18px;font-size:13px}
  @media only screen and (max-width:480px){.container{padding:16px!important}.content{padding:20px!important}.header{padding:20px!important}}
</style>
</head>
<body style="background-color:#f9fafb;margin:0;padding:0;">
  <div class="preheader">You've been invited to join ${communityName} on ${brandName}</div>
  <div class="container" style="max-width:600px;margin:0 auto;padding:32px;background-color:#f9fafb;">
    <div class="card" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div class="header" style="background:#ffffff;padding:28px;border-bottom:1px solid #e5e7eb;">
        <span class="brand" style="display:inline-block;font-weight:700;font-size:20px;letter-spacing:.3px;color:#111827">${brandName}</span>
        <span class="accent" style="display:block;height:3px;width:56px;background:${accent};border-radius:2px;margin-top:10px"></span>
      </div>
      <div class="content" style="padding:28px;background:#ffffff">
        <p class="h1" style="margin:0 0 8px 0;font-size:22px;color:#111827;font-weight:700">You're invited!</p>
        <p class="muted"><strong>${inviterName}</strong> has invited you to join <strong>${communityName}</strong> on ${brandName}.</p>
        <div class="invite-box" style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
          <p class="invite-role" style="font-size:18px;font-weight:700;color:${accent};margin:0 0 8px 0">Invited as ${role.toUpperCase()}</p>
          <p class="muted" style="margin:0;color:#6b7280;font-size:14px;line-height:1.6">Join the community and start earning reward points!</p>
        </div>
        <div style="text-align:center">
          <a href="${inviteUrl}" class="button" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;margin-top:14px">Accept Invitation</a>
        </div>
        <div class="warn" style="background:#fef3c7;border:1px solid #fcd34d;border-left:3px solid #f59e0b;color:#92400e;border-radius:10px;padding:12px 14px;margin-top:18px;font-size:13px">This invitation will expire in 7 days. If you don't have an account yet, you'll be able to create one when you accept.</div>
      </div>
      <div class="footer" style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center">© ${year} ${brandName}. All rights reserved.</div>
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

// Send Community Re-Added Email (for existing users)
export const sendCommunityAddedEmail = async (email, userName, communityName, inviterName, role) => {
  console.log('Sending community added email to:', email, 'for', communityName, 'as', role);
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardUrl = `${frontendUrl}/#/`;
    const year = new Date().getFullYear();
    const brandName = process.env.BRAND_NAME || 'Bravo Rewards';
    const accent = process.env.BRAND_ACCENT_HEX || '#22c55e';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>You've been added to ${communityName}</title>
<style>
  body{margin:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';color:#374151;}
  .container{max-width:600px;margin:0 auto;padding:32px;}
  .card{background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);}
  .header{background:#ffffff;padding:28px;border-bottom:1px solid #e5e7eb;}
  .brand{display:inline-block;font-weight:700;font-size:20px;letter-spacing:.3px;color:#111827}
  .accent{display:block;height:3px;width:56px;background:${accent};border-radius:2px;margin-top:10px}
  .content{padding:28px;background:#ffffff}
  .h1{margin:0 0 8px 0;font-size:22px;color:#111827;font-weight:700}
  .muted{color:#6b7280;font-size:14px;line-height:1.6}
  .invite-box{background:#f0fdf4;border:1px solid #dcfce7;border-radius:12px;padding:20px;margin:20px 0;text-align:center}
  .invite-role{font-size:18px;font-weight:700;color:${accent};margin:0 0 8px 0}
  .button{display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;margin-top:14px}
  .footer{padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center}
  .preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all}
  @media only screen and (max-width:480px){.container{padding:16px!important}.content{padding:20px!important}.header{padding:20px!important}}
</style>
</head>
<body style="background-color:#f9fafb;margin:0;padding:0;">
  <div class="preheader">You've been added to ${communityName} on ${brandName}</div>
  <div class="container" style="max-width:600px;margin:0 auto;padding:32px;background-color:#f9fafb;">
    <div class="card" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div class="header" style="background:#ffffff;padding:28px;border-bottom:1px solid #e5e7eb;">
        <span class="brand" style="display:inline-block;font-weight:700;font-size:20px;letter-spacing:.3px;color:#111827">${brandName}</span>
        <span class="accent" style="display:block;height:3px;width:56px;background:${accent};border-radius:2px;margin-top:10px"></span>
      </div>
      <div class="content" style="padding:28px;background:#ffffff">
        <p class="h1" style="margin:0 0 8px 0;font-size:22px;color:#111827;font-weight:700">Welcome back, ${userName}!</p>
        <p class="muted"><strong>${inviterName}</strong> has added you to <strong>${communityName}</strong> on ${brandName}.</p>
        <div class="invite-box" style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
          <p class="invite-role" style="font-size:18px;font-weight:700;color:${accent};margin:0 0 8px 0">Added as ${role.toUpperCase()}</p>
          <p class="muted" style="margin:0;color:#6b7280;font-size:14px;line-height:1.6">You can now access the community and start earning reward points!</p>
        </div>
        <div style="text-align:center">
          <a href="${dashboardUrl}" class="button" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;margin-top:14px">Open Dashboard</a>
        </div>
        <p class="muted" style="color:#6b7280;font-size:14px;line-height:1.6;margin-top:18px">Log in to your account to access ${communityName} and start collaborating with your team.</p>
      </div>
      <div class="footer" style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center">© ${year} ${brandName}. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`;

    const textContent = `Welcome back to ${communityName}!\n\nHi ${userName},\n\n${inviterName} has added you to ${communityName} on ${brandName} as ${role}.\n\nYou can now access the community and start earning reward points!\n\nOpen Dashboard: ${dashboardUrl}\n\n© ${year} ${brandName}`;

    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@bravorewards.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: `You've been added to ${communityName} on ${brandName}!`, Charset: 'UTF-8' },
        Body: {
          Text: { Data: textContent, Charset: 'UTF-8' },
          Html: { Data: htmlContent, Charset: 'UTF-8' }
        }
      }
    });

    const result = await ses.send(command);
    console.log('Community added email sent successfully:', result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error('Error sending community added email:', error);
    throw error;
  }
};