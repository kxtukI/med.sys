class ChatSessionService {
  constructor() {
    this.sessions = new Map();
    this.MAX_REQUESTS_PER_DAY = 10;

    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  getSession(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        history: [],
        requestsToday: 0,
        lastReset: new Date(),
        createdAt: new Date(),
      });
    }

    const session = this.sessions.get(userId);

    const now = new Date();
    const hoursSinceReset = (now - session.lastReset) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      session.requestsToday = 0;
      session.lastReset = now;
    }

    return session;
  }

  canMakeRequest(userId) {
    const session = this.getSession(userId);
    return session.requestsToday < this.MAX_REQUESTS_PER_DAY;
  }

  getRemainingRequests(userId) {
    const session = this.getSession(userId);
    return Math.max(0, this.MAX_REQUESTS_PER_DAY - session.requestsToday);
  }

  incrementRequestCount(userId) {
    const session = this.getSession(userId);
    session.requestsToday++;
  }

  addMessage(userId, role, content) {
    const session = this.getSession(userId);
    session.history.push({
      role,
      content,
      timestamp: new Date(),
    });

    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }
  }

  getHistory(userId) {
    const session = this.getSession(userId);
    return session.history;
  }

  clearSession(userId) {
    this.sessions.delete(userId);
  }

  getSessionInfo(userId) {
    const session = this.getSession(userId);
    const now = new Date();
    const hoursSinceReset = (now - session.lastReset) / (1000 * 60 * 60);

    const nextResetHours = Math.ceil(24 - hoursSinceReset);

    return {
      messageCount: session.history.length,
      requestsToday: session.requestsToday,
      remainingRequests: this.getRemainingRequests(userId),
      maxRequestsPerDay: this.MAX_REQUESTS_PER_DAY,
      nextResetIn: `${nextResetHours} horas`,
      createdAt: session.createdAt,
    };
  }

  cleanupExpiredSessions() {
    const now = new Date();
    const INACTIVITY_TIMEOUT = 12 * 60 * 60 * 1000; 

    for (const [userId, session] of this.sessions.entries()) {
      const timeSinceCreation = now - session.createdAt;
      if (timeSinceCreation > INACTIVITY_TIMEOUT) {
        this.sessions.delete(userId);
        console.log(`🗑️ Sessão de chat do usuário ${userId} expirada e removida`);
      }
    }
  }

  getStats() {
    let totalSessions = this.sessions.size;
    let totalMessages = 0;

    for (const session of this.sessions.values()) {
      totalMessages += session.history.length;
    }

    return {
      activeSessions: totalSessions,
      totalMessages,
      maxRequestsPerDay: this.MAX_REQUESTS_PER_DAY,
    };
  }
}

export default new ChatSessionService();

