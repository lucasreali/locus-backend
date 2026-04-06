import { env } from '@/config/env';
import { BasicError as InternalServerError } from '@/shared/errors/BasicError';
import { GoogleGenAI, type Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export const geminiService = {
	async extractFromDocument(
		base64Data: string,
		mimeType: string,
		prompt: string,
		responseSchema: Schema,
	) {
		try {
			const response = await ai.models.generateContent({
				model: 'gemini-2.5-flash',
				contents: [
					{
						role: 'user',
						parts: [
							{
								inlineData: {
									data: base64Data,
									mimeType,
								},
							},
							{
								text: prompt,
							},
						],
					},
				],
				config: {
					responseMimeType: 'application/json',
					responseSchema,
					temperature: 0.2,
				},
			});

			const responseText = response.text;
			if (!responseText) {
				throw new Error('No response returned from Gemini API');
			}
			return JSON.parse(responseText);
		} catch (error) {
			console.error('Gemini API Error:', error);
			throw new InternalServerError('Failed to process document with AI', 500);
		}
	},
};
