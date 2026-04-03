import { env } from "@/config/env";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BasicError as InternalServerError } from "@/shared/errors/BasicError";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    categoria: {
      type: Type.STRING,
      description: "A categoria principal do documento: 'SYLLABUS', 'ASSIGNMENT' ou 'OTHER'"
    },
    dados_extraidos: {
      type: Type.OBJECT,
      properties: {
        curso: {
          type: Type.STRING,
          description: "Nome inteiro do curso / disciplina."
        },
        professor: {
          type: Type.STRING,
          description: "Nome(s) do(s) professor(es), se listado."
        },
        eventos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              data: {
                type: Type.STRING,
                description: "Formatada em AAAA-MM-DD. Se apenas um mês, o último dia, por ex. 2026-10-31."
              },
              hora_inicio: {
                type: Type.STRING,
                description: "Opcional. Formato 24h (HH:mm)."
              },
              hora_fim: {
                type: Type.STRING,
                description: "Opcional. Formato 24h (HH:mm)."
              },
              titulo: {
                type: Type.STRING,
                description: "Título curto e claro (ex., 'Prova 1', 'Projeto Final', 'Feriado')."
              },
              descricao: {
                type: Type.STRING,
                description: "Uma ou duas sentenças detalhando a tarefa ou evento."
              },
              tipo: {
                type: Type.STRING,
                description: "Categorize como 'Assignment', 'Exam', 'Class', 'Holiday', 'Other' ou similar."
              }
            },
            required: ["data", "titulo"]
          }
        }
      },
      required: ["eventos"]
    }
  },
  required: ["categoria", "dados_extraidos"]
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
   - "OTHER": Caso o documento não se encaixe e nenhuma data / avaliação seja útil.

2. Se a categoria for "SYLLABUS" ou "ASSIGNMENT", proceda para a extração cuidadosa. Retorne os dados estritamente de acordo com o JSON schema especificado.
3. Certifique-se que o array de \`eventos\` contenha um objeto por cada marco importante de datas mencionadas (sejam prazos do Assignment, aulas e provas do Syllabus). Se datas de início e fim estiverem especificadas juntas, tente extrair de forma lógica de acordo com o schema ou coloque no horário.
4. Mantenha os \`titulos\` curtos, use a \`descricao\` para adicionar detalhes.
</instructions>

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
