
import nodemailer from 'nodemailer';
import { ORDER_CONFIRMATION_TEMPLATE, FORGOT_PASSWORD_TEMPLATE } from './email-templates';
import path from 'path';

// Zoho SMTP Configuration
const transporter = nodemailer.createTransport({
    host: "smtp.zoho.in",
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER || "admin@radstar.in",
        pass: process.env.SMTP_PASS || "RadStar@1786#$",
    },
    tls: {
        rejectUnauthorized: false
    }
});

interface EmailAttachment {
    filename: string;
    path: string;
    cid: string;
}

const LOGO_ATTACHMENT: EmailAttachment = {
    filename: "2.png",
    path: path.join(process.cwd(), "public/logos/2.png"),
    cid: "radstarlogo"
};

export async function sendEmail({
    to,
    subject,
    html,
    text
}: {
    to: string;
    subject: string;
    html: string;
    text: string;
}) {
    try {
        const info = await transporter.sendMail({
            from: '"RadStar" <admin@radstar.in>',
            to,
            subject,
            html,
            text,
            attachments: [LOGO_ATTACHMENT]
        });
        console.log(`Email sent to ${to}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
    }
}

export async function sendOrderConfirmationEmail(
    to: string,
    customerName: string,
    orderNumber: string,
    orderDate: string,
    orderUrl: string
) {
    const currentYear = new Date().getFullYear();
    const html = ORDER_CONFIRMATION_TEMPLATE
        .replace('{{customer_name}}', customerName)
        .replace('{{order_number}}', orderNumber)
        .replace('{{order_date}}', orderDate)
        .replace('{{order_url}}', orderUrl)
        .replace('{{current_year}}', currentYear.toString());

    return sendEmail({
        to,
        subject: `Your order ${orderNumber} has been successfully placed ✅`,
        html,
        text: `Hi ${customerName}, your order ${orderNumber} has been placed successfully.`
    });
}

export async function sendPasswordResetEmail(
    to: string,
    resetLink: string
) {
    const currentYear = new Date().getFullYear();
    const html = FORGOT_PASSWORD_TEMPLATE
        .replace('{{reset_link}}', resetLink)
        .replace('{{current_year}}', currentYear.toString());

    return sendEmail({
        to,
        subject: "Reset your password",
        html,
        text: `Reset your password by visiting this link: ${resetLink}`
    });
}
