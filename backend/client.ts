import type { App } from './main'
import { treaty, type Treaty } from '@elysiajs/eden'
export { SortOrder, PaginationSchema } from './pagination'

export const getClient = (serverUrl: string, config?: Treaty.Config) => {
    const client = treaty<App>(serverUrl, config);
    return client
}
