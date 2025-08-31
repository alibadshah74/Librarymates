import nodemailer from 'nodemailer';

// Create a transporter object using the SMTP settings
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({to, subject, body})=>{
    const response = await transporter.sendMail({
        from: process.env.SENDER_EMAI,
        to,
        subject,
        html: body,
    })

    return response
}

export default sendEmail