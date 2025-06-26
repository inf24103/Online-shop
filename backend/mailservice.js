import nodemailer from "nodemailer";

export async function mail(to, subject, text, html) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'fituranoreply',
            pass: 'fituranoreply@gmail.compasswort'
        }
    });

    let mailOptions = {
        from: 'fituranoreply@gmail.com',
        to: to,
        subject: subject,
        text: text,
        html: html
    };

    await transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}