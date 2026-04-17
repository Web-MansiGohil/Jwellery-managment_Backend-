import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text, html) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const info = await transporter.sendMail({
        from: { name: "Mansi Gohil", address: process.env.SMTP_USER },
        to,
        subject,
        text,
        html: html || `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <p style="font-size: 16px; color: #555;">${text}</p>
            <p style="font-size: 14px; color: #888; margin-top: 20px;">This email was sent automatically. Please do not reply.</p>
        </div>
        `
    });

    console.log("Email sent successfully", info.messageId);

    return true;
};

export { sendEmail };