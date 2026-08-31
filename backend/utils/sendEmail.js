const emailjs = require("@emailjs/nodejs");

const sendEmail = async (subject, email, otp, name) => {
    try {
        const templateParams = {
            subject,
            email,
            otp,
            name,
        };

        await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            templateParams,
            {
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY,
            }
        );

        console.log(`Email sent successfully to ${email}`);

    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw error;
    }
};

module.exports = sendEmail;