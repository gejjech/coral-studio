import type { CustomTool } from './threads';

export const tools = {
	'user-input': {
		transport: {
			type: 'http',
			url: '/api/mcp-tools/user-input'
		},
		toolSchema: {
			name: 'user-input',
			description: 'Request input from the user. Hangs until input is received.',
			inputSchema: {
				type: 'object',
				properties: {
					message: { type: 'string' }
				}
			}
		}
	}
} satisfies { [name: string]: CustomTool };
