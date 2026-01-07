
import nodemailer from 'nodemailer';
import path from 'path';

const transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    port: 465,
    secure: true,
    auth: {
        user: "admin@radstar.in",
        pass: "RadStar@1786#$",
    },
    tls: {
        rejectUnauthorized: false
    }
});

async function main() {
    console.log("Attempting to send test email...");
    try {
        const info = await transporter.sendMail({
            from: '"RadStar" <admin@radstar.in>',
            to: "admin@radstar.in", // Send to self to test
            subject: "Test Email from CLI",
            text: "If you see this, email sending is working.",
        });
        console.log("Success! Message ID:", info.messageId);
    } catch (error) {
        console.error("Failed to send email.");
        console.error(error);
    }
}

main();
