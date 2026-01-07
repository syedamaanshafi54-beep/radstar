const nodemailer = require("nodemailer");

// Configure your SMTP server
const transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",   // e.g. smtp.gmail.com
    port: 465,                  // 587 (STARTTLS) or 465 (SSL)
    secure: true,              // true for 465, false for 587
    auth: {
        user: "admin@radstar.in",
        pass: "RadStar@1786#$",
    },
    tls: {
        rejectUnauthorized: false // useful for self-signed certs
    }
});

// Verify connection
transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP connection failed:", error);
    } else {
        console.log("SMTP connection successful!");
    }
});

// Send test email
async function sendTestEmail() {
    try {
        const info = await transporter.sendMail({
            from: "SMTP Tester <admin@radstar.in>",
            to: "itsmeabdulk@gmail.com",
            subject: "SMTP Test Email",
            text: "This is a test email sent using Node.js SMTP.",
        });

        console.log("Email sent successfully!");
        console.log("Message ID:", info.messageId);
    } catch (err) {
        console.error("Error sending email:", err);
    }
}

sendTestEmail();
