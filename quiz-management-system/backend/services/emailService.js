const nodemailer = require('nodemailer');

const sendQuizAssignmentEmail = async ({ studentEmail, studentPassword, quizTitle, quizLink }) => {
  const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASSWORD || '';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4f46e5; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Quiz Invitation</h2>
      </div>
      <div style="padding: 24px; color: #334155;">
        <p>Hello,</p>
        <p>You have been assigned to take the quiz: <strong>${quizTitle}</strong>.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Quiz:</strong> ${quizTitle}</p>
          <p style="margin: 4px 0;"><strong>Login Email:</strong> ${studentEmail}</p>
          <p style="margin: 4px 0;"><strong>Password:</strong> ${studentPassword}</p>
        </div>
        <p>Click the link below to access your quiz:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${quizLink}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: bold;">
            Start Quiz
          </a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Direct link: <a href="${quizLink}">${quizLink}</a></p>
      </div>
    </div>
  `;

  try {
    if (!user || user === 'test_user') {
      console.log(`\n================ SIMULATED EMAIL SENT ================`);
      console.log(`TO: ${studentEmail}`);
      console.log(`QUIZ: ${quizTitle}`);
      console.log(`PASSWORD: ${studentPassword}`);
      console.log(`LINK: ${quizLink}`);
      console.log(`======================================================\n`);
      return { success: true, simulated: true };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `"Quiz Assessment System" <${user}>`,
      to: studentEmail,
      subject: `Assigned Quiz: ${quizTitle}`,
      html: htmlContent,
    });

    console.log(`[Email Service] Sent email to ${studentEmail}, Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service Warning] Failed to send SMTP email: ${error.message}`);
    console.log(`\n================ FALLBACK LOG EMAIL ================`);
    console.log(`TO: ${studentEmail}`);
    console.log(`QUIZ: ${quizTitle}`);
    console.log(`PASSWORD: ${studentPassword}`);
    console.log(`LINK: ${quizLink}`);
    console.log(`====================================================\n`);
    return { success: true, fallback: true, error: error.message };
  }
};

module.exports = { sendQuizAssignmentEmail };
