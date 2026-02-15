import type { CreateEmailResponse } from "resend";

export interface EmailOptions {
    subject: string;
    template: string;
    from?: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: File[];
    context?: Record<string, any>;
    templateFolder?: string;
}

export interface EmailInterface {
    compileTemplate(template: string, context?: Record<string, any>): Promise<string>;
    sendEmail(to: string | string[], options: EmailOptions): Promise<CreateEmailResponse>;
}