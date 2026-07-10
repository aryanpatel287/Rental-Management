import { sendEmailUsingGmailAPI } from './gmail.mail.service.js';
import { sendEmailWithMailjet } from './mailjet.mail.service.js';

export async function sendEmail({ to, subject, html, text }) {
    try {
        const emailResponse = await sendEmailUsingGmailAPI({
            to,
            subject,
            html,
            text,
        });
        return emailResponse.message;
    } catch (error) {
        try {
            return await sendEmailWithMailjet({ to, subject, html, text });
        } catch (error) {
            console.error('Error sending email: ', error);
            throw error;
            return 'Failed to send email to ' + to;
        }
    }
}
