import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  time: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou a IA do Med.Sys. Como posso te ajudar hoje?',
      sender: 'system',
      time: getCurrentTime()
    }
  ]);

  const [isTyping, setIsTyping] = useState(false);

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  async function handleSend() {
    if (inputText.trim() === '') return;

    const userText = inputText;
    setInputText('');

    // 1. Mensagem do Usuário
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      time: getCurrentTime()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    // Rola a lista
    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

    try {
      // 2. Chama a API
      const response = await api.post('/chat/send', { message: userText });
      const data = response.data;

      console.log("Resposta da IA:", JSON.stringify(data, null, 2));

      // --- CORREÇÃO DA EXTRAÇÃO DE TEXTO ---
      let aiResponseText = "";

      // Prioridade 1: Estrutura vista no print { message: { assistant: "..." } }
      if (data.message && data.message.assistant) {
          aiResponseText = data.message.assistant;
      }
      // Prioridade 2: Estrutura direta { assistant: "..." }
      else if (data.assistant) {
          aiResponseText = data.assistant;
      }
      // Prioridade 3: Estrutura aninhada alternativa { response: { assistant: "..." } }
      else if (data.response && data.response.assistant) {
          aiResponseText = data.response.assistant;
      }
      // Prioridade 4: Mensagem direta simples { message: "Texto..." }
      else if (data.message && typeof data.message === 'string') {
          aiResponseText = data.message;
      }
      // Fallback: Se não achar nada, mostra o JSON para debug (mas não quebra)
      else {
          aiResponseText = "Não entendi a resposta do servidor.";
      }

      // GARANTIA DE STRING: Converte para string se não for, evitando o crash do .replace
      if (typeof aiResponseText !== 'string') {
          aiResponseText = JSON.stringify(aiResponseText);
      }

      // Limpa quebras de linha literais "\n" que às vezes vêm da IA
      aiResponseText = aiResponseText.replace(/\\n/g, '\n');

      const systemMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'system',
        time: getCurrentTime()
      };

      setMessages(prev => [...prev, systemMsg]);

    } catch (error) {
      console.log("Erro no Chat:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, estou com dificuldades técnicas. Tente novamente.",
        sender: 'system',
        time: getCurrentTime()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.systemBubble
      ]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.systemText]}>
          {item.text}
        </Text>
        <Text style={[styles.timeText, isUser ? styles.userTime : styles.systemTime]}>
          {item.time}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat IA</Text>
        <View style={{width: 28}}/>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {isTyping && (
        <Text style={styles.typingText}>A IA está digitando...</Text>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua dúvida..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor="#999"
            onSubmitEditing={handleSend}
          />

          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={20} color="#2A9F85" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <View style={{height: 20}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    backgroundColor: '#2A9F85', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  backButton: { padding: 5 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  listContent: { padding: 20, paddingBottom: 10 },

  messageBubble: {
    maxWidth: '80%', padding: 15, borderRadius: 20, marginBottom: 15,
  },
  userBubble: {
    alignSelf: 'flex-end', backgroundColor: '#2A9F85',
    borderBottomRightRadius: 5
  },
  systemBubble: {
    alignSelf: 'flex-start', backgroundColor: '#F0F4F8',
    borderBottomLeftRadius: 5
  },

  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  systemText: { color: '#333' },

  timeText: { fontSize: 10, marginTop: 5, alignSelf: 'flex-end' },
  userTime: { color: 'rgba(255,255,255,0.7)' },
  systemTime: { color: '#999' },

  typingText: { marginLeft: 20, marginBottom: 10, color: '#2A9F85', fontSize: 12, fontStyle: 'italic' },

  inputContainer: {
    backgroundColor: '#f0f0f0', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 15, paddingVertical: 10, marginHorizontal: 15,
    borderRadius: 30, marginBottom: 10, borderWidth: 1, borderColor: '#ddd'
  },
  input: {
    flex: 1, height: 40, paddingHorizontal: 10, color: '#333'
  },
  sendButton: {
    marginLeft: 10, width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    elevation: 2
  },
});
