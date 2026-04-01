// Email verification service
const nodemailer = require('nodemailer');

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationEmail = async (email, code) => {
  try {
    // Create transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password
      }
    });

    // Email template
    const mailOptions = {
      from: `Carbon Cases <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Carbon Cases',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Arial', sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 32px; font-weight: bold; color: #d4af37; margin-bottom: 10px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .code-box { background: #1a1a1a; border: 2px solid #d4af37; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .code { font-size: 36px; font-weight: bold; color: #d4af37; letter-spacing: 8px; }
            .message { color: #cccccc; line-height: 1.6; margin: 20px 0; }
            .footer { text-align: center; color: #666666; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333333; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CARBON CASES</div>
              <div class="title">Welcome to Carbon Cases</div>
            </div>
            
            <div class="message">
              <p>Thank you for joining Carbon Cases! To complete your registration, please use the verification code below:</p>
            </div>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <div class="message">
              <p><strong>This code will expire in 10 minutes.</strong></p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 Carbon Cases. All rights reserved.</p>
              <p>Premium Carbon Fiber Products</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Verification email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    
    // Fallback: Show code in console
    console.log('\n📧 ========================================');
    console.log('📧 VERIFICATION CODE (Email failed to send)');
    console.log('📧 ========================================');
    console.log(`📧 To: ${email}`);
    console.log(`📧 Code: ${code}`);
    console.log('📧 ========================================\n');
    
    return true;
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail
};
