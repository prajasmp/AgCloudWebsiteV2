import { handler as serverActionHandler } from './server-action.js';

export async function handler(event, context) {
  return await serverActionHandler(event, context);
}
