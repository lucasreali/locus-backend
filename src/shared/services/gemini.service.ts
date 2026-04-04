import { env } from "@/config/env";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BasicError as InternalServerError } from "@/shared/errors/BasicError";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    documentType: {
      type: Type.STRING,
      description: "SYLLABUS | ASSIGNMENT | OTHER"
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
              dueDate: { type: Type.STRING, description: "YYYY-MM-DD | null", nullable: true },
              type: { type: Type.STRING, description: "exam | assignment | project | presentation | other" }
            },
            required: ["title", "description", "dueDate", "type"]
          }
        }
      }
    },
    assignmentDetails: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        title: { type: Type.STRING, nullable: true },
        instructions: { type: Type.STRING, nullable: true },
        dueDate: { type: Type.STRING, description: "YYYY-MM-DD | null", nullable: true },
        requirements: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    }
  },
  required: ["documentType"]
};

export class GeminiService {
  async processSyllabusPdf(base64Data: string, mimeType: string = "application/pdf") {
    try {
      const prompt = `
<role>
Você é um assistente acadêmico avançado projetado para ajudar estudantes universitários a organizar sua rotina. Sua função é receber um documento PDF, identificar imediatamente sua natureza (se é um Plano de Ensino da disciplina inteira ou se é a descrição de uma Tarefa/Trabalho específico) e extrair os dados estruturados de acordo com o tipo de documento.
</role>

<instructions>
1. Analise o documento fornecido e classifique-o em uma das duas categorias:
   - "SYLLABUS": Plano de ensino, cronograma da disciplina, regras de avaliação do semestre, ementa. Geralmente contém o calendário completo.
   - "ASSIGNMENT": Instruções para um trabalho específico, lista de exercícios, roteiro de laboratório, estudo de caso ou redação. Focado em uma única entrega ou avaliação.
   - "OTHER": Caso o documento não se encaixe em nenhuma das categorias acima.

2. Se for um "SYLLABUS", extraia:
   - Nome da disciplina.
   - Nome do professor.
   - Lista de eventos (provas, prazos de projetos, apresentações) com título, descrição, data (em formato YYYY-MM-DD) e tipo.

3. Se for um "ASSIGNMENT", extraia:
   - Título da tarefa ou trabalho.
   - Instruções principais ou resumo do que deve ser feito.
   - Data de entrega (em formato YYYY-MM-DD).
   - Requisitos específicos (ex: formato do arquivo, trabalho em grupo, limite de páginas).

4. Datas: Se o ano não estiver explícito, infira com base no semestre/ano indicado no cabeçalho do documento. Se não houver data, retorne null.
</instructions>

<constraints>
- Retorne EXCLUSIVAMENTE um objeto JSON válido.
- Não utilize blocos markdown de código (como \`\`\`json).
- Não adicione explicações, saudações ou comentários.
- A propriedade documentType é OBRIGATÓRIA.
- Se documentType for "SYLLABUS", o objeto assignmentDetails DEVE ser null.
- Se documentType for "ASSIGNMENT", o objeto syllabusDetails DEVE ser null.
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

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
               role: "user",
               parts: [
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType
                    }
                  },
                  {
                    text: prompt
                  }
               ],
            }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2, // Low temperature for consistent JSON data extraction
        }
      });
      
      const responseText = response.text;
      if (!responseText) {
          throw new Error("No response returned from Gemini API");
      }
      return JSON.parse(responseText);

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new InternalServerError(
        "Failed to process PDF with AI",
        500
      );
    }
  }
}

export const geminiService = new GeminiService();
