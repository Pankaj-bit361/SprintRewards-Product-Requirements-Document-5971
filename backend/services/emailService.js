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
    
    // Create OTP digits as table cells for better email client compatibility
    const otpCells = otp.split('').map(d => `<td style="padding:8px 4px;"><div style="width:48px;height:56px;line-height:56px;text-align:center;background:#111827;border:1px solid #1f2937;border-radius:8px;font-size:24px;font-weight:800;color:#ffffff;">${d}</div></td>`).join('');
    
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${brandName} - Sign-In Code</title>
<style type="text/css">
  body { margin: 0; padding: 0; background-color: #0b1220; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e5e7eb; }
  table { border-collapse: collapse; width: 100%; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .card { background: #0f172a; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; }
  .header { background: #0b1220; padding: 24px; border-bottom: 1px solid #1f2937; }
  .brand { font-weight: 700; font-size: 18px; color: #ffffff; display: block; margin-bottom: 8px; }
  .accent-line { height: 3px; width: 50px; background: ${accent}; border-radius: 2px; margin-top: 8px; }
  .content { padding: 24px; }
  .h1 { margin: 0 0 12px 0; font-size: 20px; color: #ffffff; font-weight: 700; }
  .text { color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }
  .button { display: inline-block; background: ${accent}; color: #04150f; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 8px; margin-top: 16px; font-size: 14px; }
  .button:hover { opacity: 0.9; }
  .warn { background: #111827; border: 1px solid #1f2937; border-left: 3px solid #f59e0b; color: #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-top: 16px; font-size: 13px; }
  .footer { padding: 16px 24px; background: #0b1220; border-top: 1px solid #1f2937; color: #6b7280; font-size: 12px; text-align: center; }
  .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; }
  @media only screen and (max-width: 480px) {
    .container { padding: 12px !important; }
    .content { padding: 16px !important; }
    .header { padding: 16px !important; }
    .h1 { font-size: 18px; }
    td { padding: 4px 2px !important; }
    div[style*="width:48px"] { width: 40px !important; height: 48px !important; line-height: 48px !important; font-size: 20px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#0b1220;">
  <div class="preheader">Your one-time sign-in code for ${brandName}: ${otp}. Expires in 10 minutes.</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b1220;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" class="card">
                <tr>
                  <td class="header" style="background:#0b1220; padding:24px; border-bottom:1px solid #1f2937;">
                    <span class="brand" style="font-weight:700; font-size:18px; color:#ffffff; display:block; margin-bottom:8px;">${brandName}</span>
                    <div class="accent-line" style="height:3px; width:50px; background:${accent}; border-radius:2px; margin-top:8px;"></div>
                  </td>
                </tr>
                <tr>
                  <td class="content" style="padding:24px;">
                    <p class="h1" style="margin:0 0 12px 0; font-size:20px; color:#ffffff; font-weight:700;">Your secure sign-in code</p>
                    <p class="text" style="color:#9ca3af; font-size:14px; line-height:1.6; margin:0 0 16px 0;">Hi ${userName}, use the code below to complete your sign-in. This code expires in 10 minutes.</p>
                    <div style="text-align:center; margin:24px 0;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr style="text-align:center;">
                          ${otpCells}
                        </tr>
                      </table>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:16px 0;">
                          <a href="${loginUrl}" class="button" style="display:inline-block; background:${accent}; color:#04150f; text-decoration:none; font-weight:700; padding:12px 24px; border-radius:8px; font-size:14px;">Open ${brandName}</a>
                        </td>
                      </tr>
                    </table>
                    <div class="warn" style="background:#111827; border:1px solid #1f2937; border-left:3px solid #f59e0b; color:#e5e7eb; border-radius:8px; padding:12px 14px; margin-top:16px; font-size:13px;">
                      <strong>Security tip:</strong> Never share this code. ${brandName} support will never ask for it.
                    </div>
                    <p class="text" style="color:#9ca3af; font-size:14px; line-height:1.6; margin:16px 0 0 0;">If you didn't request this, you can safely ignore this email.</p>
                  </td>
                </tr>
                <tr>
                  <td class="footer" style="padding:16px 24px; background:#0b1220; border-top:1px solid #1f2937; color:#6b7280; font-size:12px; text-align:center;">
                    Copyright ${year} ${brandName}. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    const textContent = `${brandName} - Your sign-in code\n\nHi ${userName},\nYour one-time sign-in code is: ${otp}\nIt expires in 10 minutes.\n\nOpen ${brandName}: ${loginUrl}\n\nIf you didn't request this code, you can ignore this email.\n\nCopyright ${year} ${brandName}`;

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
<style type="text/css">
  body { margin: 0; padding: 0; background-color: #0b1220; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e5e7eb; }
  table { border-collapse: collapse; width: 100%; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .card { background: #0f172a; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; }
  .header { background: #0b1220; padding: 24px; border-bottom: 1px solid #1f2937; }
  .brand { font-weight: 700; font-size: 18px; color: #ffffff; display: block; margin-bottom: 8px; }
  .accent-line { height: 3px; width: 50px; background: ${accent}; border-radius: 2px; margin-top: 8px; }
  .content { padding: 24px; }
  .h1 { margin: 0 0 12px 0; font-size: 20px; color: #ffffff; font-weight: 700; }
  .text { color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }
  .button { display: inline-block; background: ${accent}; color: #04150f; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 8px; margin-top: 16px; font-size: 14px; }
  .button:hover { opacity: 0.9; }
  .footer { padding: 16px 24px; background: #0b1220; border-top: 1px solid #1f2937; color: #6b7280; font-size: 12px; text-align: center; }
  .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; }
  @media only screen and (max-width: 480px) {
    .container { padding: 12px !important; }
    .content { padding: 16px !important; }
    .header { padding: 16px !important; }
    .h1 { font-size: 18px; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#0b1220;">
  <div class="preheader">Welcome to ${brandName} - your account is ready.</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b1220;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" class="card">
                <tr>
                  <td class="header" style="background:#0b1220; padding:24px; border-bottom:1px solid #1f2937;">
                    <span class="brand" style="font-weight:700; font-size:18px; color:#ffffff; display:block; margin-bottom:8px;">${brandName}</span>
                    <div class="accent-line" style="height:3px; width:50px; background:${accent}; border-radius:2px; margin-top:8px;"></div>
                  </td>
                </tr>
                <tr>
                  <td class="content" style="padding:24px;">
                    <p class="h1" style="margin:0 0 12px 0; font-size:20px; color:#ffffff; font-weight:700;">Welcome aboard, ${userName}!</p>
                    <p class="text" style="color:#9ca3af; font-size:14px; line-height:1.6; margin:0 0 16px 0;">You're in. Your ${brandName} account is ready - here's how to make the most of it:</p>
                    <div style="margin:16px 0;">
                      <p style="color:#9ca3af; font-size:14px; line-height:1.8; margin:8px 0;">✓ Complete your profile to personalize your experience</p>
                      <p style="color:#9ca3af; font-size:14px; line-height:1.8; margin:8px 0;">✓ Join a community or create your own</p>
                      <p style="color:#9ca3af; font-size:14px; line-height:1.8; margin:8px 0;">✓ Start a sprint and begin earning premium rewards</p>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:16px 0;">
                          <a href="${frontendUrl}" class="button" style="display:inline-block; background:${accent}; color:#04150f; text-decoration:none; font-weight:700; padding:12px 24px; border-radius:8px; font-size:14px;">Launch Dashboard</a>
                        </td>
                      </tr>
                    </table>
                    <p class="text" style="color:#9ca3af; font-size:14px; line-height:1.6; margin:16px 0 0 0;">Need help? Reply to this email and our team will assist you.</p>
                  </td>
                </tr>
                <tr>
                  <td class="footer" style="padding:16px 24px; background:#0b1220; border-top:1px solid #1f2937; color:#6b7280; font-size:12px; text-align:center;">
                    Copyright ${year} ${brandName}. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    const textContent = `Welcome to ${brandName}, ${userName}!\n\nYour account is ready.\n\nNext steps:\n- Complete your profile\n- Join a community or create your own\n- Start a sprint and earn rewards\n\nLaunch Dashboard: ${frontendUrl}\n\nCopyright ${year} ${brandName}`;

    const command = new SendEmailCommand({
      Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@bravorewards.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Welcome to Bravo Rewards - Let\'s get you started', Charset: 'UTF-8' },
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
<style type="text/css">
  body { margin: 0; padding: 0; background-color: #0b1220; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e5e7eb; }
  table { border-collapse: collapse; width: 100%; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .card { background: #0f172a; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; }
  .header { background: #0b1220; padding: 24px; border-bottom: 1px solid #1f2937; }
  .brand { font-weight: 700; font-size: 18px; color: #ffffff; display: block; margin-bottom: 8px; }
  .accent-line { height: 3px; width: 50px; background: ${accent}; border-radius: 2px; margin-top: 8px; }
  .content { padding: 24px; }
  .h1 { margin: 0 0 12px 0; font-size: 20px; color: #ffffff; font-weight: 700; }
  .text { color: #9ca3af; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }
  .invite-box { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
  .invite-role { font-size: 18px; font-weight: 700; color: ${accent}; margin: 0 0 8px 0; }
  .button { display: inline-block; background: ${accent}; color: #04150f; text-decoration: none; font-weight: 700; padding: 12px 24px; border-radius: 8px; margin-top: 16px; font-size: 14px; }
  .button:hover { opacity: 0.9; }
  .warn { background: #111827; border: 1px solid #1f2937; border-left: 3px solid #f59e0b; color: #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-top: 16px; font-size: 13px; }
  .footer { padding: 16px 24px; background: #0b1220; border-top: 1px solid #1f2937; color: #6b7280; font-size: 12px; text-align: center; }
  .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; }
  @media only screen and (max-width: 480px) {
    .container { padding: 12px !important; }
    .content { padding: 16px !important; }
    .header { padding: 16px !important; }
    .h1 { font-size: 18px; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#0b1220;">
  <div class="preheader">You've been invited to join ${communityName} on ${brandName}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b1220;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" class="card">
                <tr>
                  <td class="header" style="background:#0b1220; padding:24px; border-bottom:1px solid #1f2937;">
                    <span class="brand" style="font-weight:700; font-size:18px; color:#ffffff; display:block; margin-bottom:8px;">${brandName}</span>
                    <div class="accent-line" style="height:3px; width:50px; background:${accent}; border-radius:2px; margin-top:8px;"></div>
                  </td>
                </tr>
                <tr>
                  <td class="content" style="padding:24px;">
                    <p class="h1" style="margin:0 0 12px 0; font-size:20px; color:#ffffff; font-weight:700;">You're invited!</p>
                    <p class="text" style="color:#9ca3af; font-size:14px; line-height:1.6; margin:0 0 16px 0;"><strong>${inviterName}</strong> has invited you to join <strong>${communityName}</strong> on ${brandName}.</p>
                    <div class="invite-box" style="background:#111827; border:1px solid #1f2937; border-radius:12px; padding:20px; margin:20px 0; text-align:center;">
                      <p class="invite-role" style="font-size:18px; font-weight:700; color:${accent}; margin:0 0 8px 0;">Invited as ${role.toUpperCase()}</p>
                      <p style="color:#9ca3af; font-size:14px; line-height:1.6; margin:0;">Join the community and start earning reward points!</p>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:16px 0;">
                          <a href="${inviteUrl}" class="button" style="display:inline-block; background:${accent}; color:#04150f; text-decoration:none; font-weight:700; padding:12px 24px; border-radius:8px; font-size:14px;">Accept Invitation</a>
                        </td>
                      </tr>
                    </table>
                    <div class="warn" style="background:#111827; border:1px solid #1f2937; border-left:3px solid #f59e0b; color:#e5e7eb; border-radius:8px; padding:12px 14px; margin-top:16px; font-size:13px;">
                      This invitation will expire in 7 days. If you don't have an account yet, you'll be able to create one when you accept.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td class="footer" style="padding:16px 24px; background:#0b1220; border-top:1px solid #1f2937; color:#6b7280; font-size:12px; text-align:center;">
                    Copyright ${year} ${brandName}. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textContent = `You're invited to join ${communityName}!\n\n${inviterName} has invited you to join ${communityName} on ${brandName} as ${role}.\n\nAccept invitation: ${inviteUrl}\n\nThis invitation will expire in 7 days.\n\nCopyright ${year} ${brandName}`;

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

