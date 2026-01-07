
const nodemailer = require('nodemailer');

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

async function test() {
    console.log("Starting test...");
    try {
        const info = await transporter.sendMail({
            from: '"RadStar" <admin@radstar.in>',
            to: "admin@radstar.in",
            subject: "Simple JS Test",
            text: "Hello"
        });
        console.log("Email sent:", info.messageId);
        process.exit(0);
    } catch (err) {
        console.error("Error caught:");
        console.error(err);
        process.exit(1);
    }
}

test();
