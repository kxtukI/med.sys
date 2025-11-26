import GeminiService from '../services/GeminiService.js';
import ChatSessionService from '../services/ChatSessionService.js';

class ChatController {
  async send(req, res) {
    const { message } = req.body;
    const userId = req.userId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Mensagem não pode estar vazia' });
    }

    if (!GeminiService.validateMessage(message)) {
      return res.status(400).json({
        error: 'Mensagem inválida ou muito longa (máximo 2000 caracteres)',
      });
    }

    if (!ChatSessionService.canMakeRequest(userId)) {
      const info = ChatSessionService.getSessionInfo(userId);
      return res.status(429).json({
        error: `Limite diário atingido. Você já fez ${info.requestsToday} requisições hoje.`,
        remainingRequests: 0,
        resetIn: info.nextResetIn,
      });
    }

    const history = ChatSessionService.getHistory(userId);

    let aiResponse;
    try {
      aiResponse = await GeminiService.generateResponse(message, history);
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      return res.status(500).json({
        error: 'Erro ao processar sua mensagem. Tente novamente.',
      });
    }

    ChatSessionService.addMessage(userId, 'user', message);
    ChatSessionService.addMessage(userId, 'assistant', aiResponse);
    ChatSessionService.incrementRequestCount(userId);

    const sessionInfo = ChatSessionService.getSessionInfo(userId);

    return res.json({
      message: {
        user: message,
        assistant: aiResponse,
      },
      sessionInfo,
    });
  }

  async getHistory(req, res) {
    const userId = req.userId;
    const history = ChatSessionService.getHistory(userId);
    const info = ChatSessionService.getSessionInfo(userId);

    return res.json({
      messages: history,
      sessionInfo: info,
    });
  }

  async start(req, res) {
    const userId = req.userId;

    ChatSessionService.clearSession(userId);
    ChatSessionService.getSession(userId);

    return res.json({
      message: 'Nova sessão de chat iniciada',
      sessionInfo: ChatSessionService.getSessionInfo(userId),
    });
  }

  async clear(req, res) {
    const userId = req.userId;
    const session = ChatSessionService.getSession(userId);

    session.history = [];

    return res.json({
      message: 'Histórico de chat limpo',
      sessionInfo: ChatSessionService.getSessionInfo(userId),
    });
  }

  async getInfo(req, res) {
    const userId = req.userId;
    const sessionInfo = ChatSessionService.getSessionInfo(userId);

    return res.json({ sessionInfo });
  }

  async logout(req, res) {
    const userId = req.userId;
    ChatSessionService.clearSession(userId);

    return res.json({ message: 'Sessão de chat encerrada' });
  }
}

export default new ChatController();
