import Mailjet from 'node-mailjet';
import envConfig from '../../config/envconfig.js';

//Mailjet Service
let mailjet;
try {
    mailjet = Mailjet.apiConnect(
        envConfig.MJ_APIKEY_PUBLIC,
        envConfig.MJ_APIKEY_PRIVATE,
    );
    console.log('Mailjet is ready to send email');
} catch (error) {
    console.error('Error connecting to Mailjet API: ', error);
    throw error;
}

async function sendEmailWithMailjet({ to, subject, html, text }) {
    const request = mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
            {
                From: {
                    Email: envConfig.MJ_USER,
                    Name: 'Perplexity AI',
                },
                To: [
                    {
                        Email: to,
                        Name: 'Perplexity AI',
                    },
                ],
                Subject: subject,
                TextPart: text || '',
                HTMLPart: html,
            },
        ],
    });

    try {
        await request;
        return {
            message: 'email sent successfully to ' + to,
        };
    } catch (err) {
        console.log(err.statusCode);
        throw err;
    }
}

export { sendEmailWithMailjet };
