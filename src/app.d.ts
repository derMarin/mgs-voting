// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			admin?: {
				isAuthenticated: boolean;
			};
			jury?: {
				id: string;
				name: string;
				juryType: 'core' | 'category';
				allowedCategoryIds: string[] | null;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
