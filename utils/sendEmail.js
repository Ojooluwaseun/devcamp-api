const sgMail = require('@sendgrid/mail');
const sendEmail = async (options) => {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
     
        const msg = {
            to: options.email,
            from: `${process.env.FROM_NAME}<${process.env.FROM_EMAIL}>`,
            subject: options.subject,
            text: options.message,
            };
        await sgMail.send(msg)
      
    }
       

module.exports = sendEmail;
