
import type { EmailInterface, EmailOptions } from "./email.interface";
import { type CreateEmailResponse, Resend } from "resend";
import Handlebars from "handlebars";

export class ResendEmail implements EmailInterface {
    private readonly resend: Resend;

    constructor(resendApiKey: string, private readonly emailFrom: string, private readonly emailTemplateFolder: string) {
        this.resend = new Resend(resendApiKey);
    }
    async compileTemplate(template: string, context?: Record<string, any>): Promise<string> {
        const templateFolder = this.emailTemplateFolder;
        const templatePath = `${templateFolder}/${template}.hbs`;
        const templateContent = await Bun.file(templatePath).text();
        const compiledTemplate = Handlebars.compile(templateContent);
        return compiledTemplate(context);
    }

    async sendEmail(to: string | string[], options: EmailOptions): Promise<CreateEmailResponse> {
        const { subject, template, from, replyTo, cc, bcc, attachments, context } = options;
        const compiledTemplate = await this.compileTemplate(template, context);
        const email = await this.resend.emails.send({
            from: from ?? this.emailFrom,
            to,
            subject,
            html: compiledTemplate,
            replyTo,
            cc,
            bcc,
        });
        return email;
    }
}