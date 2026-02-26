import { getClient } from '@danimai/backend'

export class Client {
    client: ReturnType<typeof getClient>['admin'];
    
    constructor(serverUrl: string) {
        this.client = getClient(serverUrl, {
            headers: {
                'Content-Type': 'application/json',
            },
        }).admin;
    }
}

export const client = new Client('http://localhost:8000').client;  
