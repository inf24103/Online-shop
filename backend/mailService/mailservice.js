import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function mail(to, subject, html) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
        },
    });

    transporter.sendMail({
        to: to,
        subject: subject,
        html: html
    }).then(() => {
        console.log("mail send successfully");
    }).catch(err => {
        console.log(err);
    });
}