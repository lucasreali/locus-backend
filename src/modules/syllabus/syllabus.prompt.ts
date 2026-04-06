import { type Schema, Type } from '@google/genai';

export type SyllabusEventType =
	| 'exam'
	| 'assignment'
	| 'project'
	| 'presentation'
	| 'other';

export type SyllabusExtractedEvent = {
	title: string;
	description: string;
	dueDate: string | null;
	type: string;
};

export type SyllabusDetails = {
	courseName?: string | null;
	professor?: string | null;
	events?: SyllabusExtractedEvent[];
};

export type SyllabusExtractionResult = {
	documentType: string;
	syllabusDetails?: SyllabusDetails | null;
	assignmentDetails?: {
		title?: string | null;
		instructions?: string | null;
		dueDate?: string | null;
		requirements?: string[];
	} | null;
};

export const syllabusExtractionSchema: Schema = {
	type: Type.OBJECT,
	properties: {
		documentType: {
			type: Type.STRING,
			description: 'SYLLABUS | ASSIGNMENT | OTHER',
		},
		syllabusDetails: {
			type: Type.OBJECT,
			nullable: true,
			properties: {
				courseName: { type: Type.STRING, nullable: true },
				professor: { type: Type.STRING, nullable: true },
				events: {
					type: Type.ARRAY,
					items: {
						type: Type.OBJECT,
						properties: {
							title: { type: Type.STRING },
							description: { type: Type.STRING },
							dueDate: {
								type: Type.STRING,
								description: 'YYYY-MM-DD | null',
								nullable: true,
							},
							type: {
								type: Type.STRING,
								description:
									'exam | assignment | project | presentation | other',
							},
						},
						required: ['title', 'description', 'dueDate', 'type'],
					},
				},
			},
		},
		assignmentDetails: {
			type: Type.OBJECT,
			nullable: true,
			properties: {
				title: { type: Type.STRING, nullable: true },
				instructions: { type: Type.STRING, nullable: true },
				dueDate: {
					type: Type.STRING,
					description: 'YYYY-MM-DD | null',
					nullable: true,
				},
				requirements: {
					type: Type.ARRAY,
					items: { type: Type.STRING },
				},
			},
		},
	},
	required: ['documentType'],
};

export const syllabusExtractionPrompt = `
<role>
You are an advanced academic assistant designed to help university students organize their routine. Your role is to receive a PDF document, immediately identify its nature (whether it is a full course syllabus or a specific assignment/task description), and extract structured data according to the document type.
</role>

<instructions>
1. Analyze the provided document and classify it into one of the following categories:
    - "SYLLABUS": Course syllabus, class schedule, semester grading rules, and course outline. Usually contains the full calendar.
    - "ASSIGNMENT": Instructions for a specific task, exercise list, lab guide, case study, or essay. Focused on a single submission or assessment.
    - "OTHER": If the document does not fit any of the categories above.

2. If it is a "SYLLABUS", extract:
    - Course name.
    - Professor name.
    - List of events (exams, project deadlines, presentations) with title, description, date (in YYYY-MM-DD format), and type.

3. If it is an "ASSIGNMENT", extract:
    - Assignment or task title.
    - Main instructions or a summary of what must be done.
    - Due date (in YYYY-MM-DD format).
    - Specific requirements (e.g., file format, group work, page limit).

4. Dates: If the year is not explicit, infer it from the semester/year shown in the document header. If no date is available, return null.
</instructions>

<constraints>
- Return EXCLUSIVELY a valid JSON object.
- Do not use markdown code blocks (such as \`\`\`json).
- Do not add explanations, greetings, or comments.
- The documentType property is REQUIRED.
- If documentType is "SYLLABUS", assignmentDetails MUST be null.
- If documentType is "ASSIGNMENT", syllabusDetails MUST be null.
</constraints>

<output_schema>
{
    "documentType": "SYLLABUS | ASSIGNMENT | OTHER",
    "syllabusDetails": {
        "courseName": "string | null",
        "professor": "string | null",
        "events": [
        {
            "title": "string",
            "description": "string",
            "dueDate": "YYYY-MM-DD | null",
            "type": "exam | assignment | project | presentation | other"
        }
        ]
    } | null,
    "assignmentDetails": {
        "title": "string | null",
        "instructions": "string | null",
        "dueDate": "YYYY-MM-DD | null",
        "requirements": ["string"]
    } | null
}
</output_schema>
`;
