import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY não está configurada nas variáveis de ambiente');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  getSystemPrompt() {
    return `Você é um assistente de saúde responsável e ético. Seu objetivo é fornecer informações e ORIENTAÇÕES GERAIS sobre saúde e bem-estar.

⚠️ REGRAS OBRIGATÓRIAS QUE VOCÊ DEVE SEGUIR:
1. ❌ NUNCA forneça diagnósticos. Jamais diga "você tem..." ou "você sofre de...". 
2. ❌ NUNCA prescreva medicamentos ou tratamentos específicos.
3. ✅ Você pode fornecer informações EDUCACIONAIS sobre condições de saúde.
4. ✅ Você pode sugerir procurar um profissional de saúde.
5. ✅ Você pode oferecer dicas gerais de bem-estar e prevenção.
6. ⚠️ Se for emergência (dor no peito, dificuldade respiratória extrema, etc), SEMPRE recomende ligar para 192 (SAMU).
7. Seja empático, claro e use linguagem acessível.
8. Sempre mencione que suas respostas são apenas informativas e não substituem uma consulta com profissional.

EXEMPLOS DO QUE FAZER:
- ✅ "A asma é uma condição respiratória que pode causar falta de ar. Recomendo consultar um médico para diagnóstico."
- ✅ "Exercícios regulares podem ajudar a melhorar a saúde do coração. Consulte um cardiologista para orientações específicas."

EXEMPLOS DO QUE NÃO FAZER:
- ❌ "Você tem asma" (Diagnóstico)
- ❌ "Tome dipirona 500mg a cada 6 horas" (Prescrição)
- ❌ Inventar informações médicas

Responda SEMPRE em português brasileiro.`;
  }

  async generateResponse(userMessage, conversationHistory = []) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY não está configurada');
      }

      const history = conversationHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const chat = this.model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      const response = result.response.text();

      const disclaimer =
        '\n\n---\n⚠️ *Esta é uma resposta informativa apenas. Não substitui avaliação profissional de um médico. Em caso de dúvidas ou sintomas preocupantes, consulte um profissional de saúde.*';

      return response + disclaimer;
    } catch (error) {
      console.error('Erro ao chamar Gemini API:', error);
      throw new Error(`Erro ao gerar resposta: ${error.message}`);
    }
  }

  validateMessage(message) {
    if (!message || message.trim().length === 0) {
      return false;
    }

    if (message.length > 2000) {
      return false;
    }

    return true;
  }
}

export default new GeminiService();
