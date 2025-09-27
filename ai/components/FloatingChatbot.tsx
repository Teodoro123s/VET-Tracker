import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { processChatbotMessage, executeAction, ChatMessage } from '../services/chatbotService';

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      text: "Hi! I'm your veterinary AI assistant. I can help you with appointments, navigation, sending emails, and answering questions about the app. How can I help you today?", 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Process message with AI
      const response = await processChatbotMessage(text);
      
      // Add bot response
      const botMessage: ChatMessage = {
        text: response.message,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);

      // Execute action if any
      if (response.action) {
        executeAction(response.action);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        text: "Sorry, I encountered an error. Please try again or contact support if the issue persists.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Quick action buttons
  const quickActions = [
    { text: "📅 Book Appointment", action: "book appointment" },
    { text: "🐕 My Pets", action: "go to customers" },
    { text: "📋 Medical Records", action: "view records" },
    { text: "🔔 Notifications", action: "show notifications" }
  ];

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity 
        style={styles.floatingButton} 
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <Ionicons name={isOpen ? "close" : "chatbubble"} size={24} color="#fff" />
        {!isOpen && (
          <View style={styles.pulseDot}>
            <View style={styles.pulseInner} />
          </View>
        )}
      </TouchableOpacity>

      {/* Chat Container */}
      {isOpen && (
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.botAvatar}>
                <Ionicons name="medical" size={16} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Vet AI Assistant</Text>
                <Text style={styles.headerSubtitle}>
                  {isTyping ? "Typing..." : "Online"}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Messages List */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, index) => (
              <View key={index} style={[
                styles.messageContainer,
                msg.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer
              ]}>
                <View style={[
                  styles.message, 
                  msg.sender === 'user' ? styles.userMessage : styles.botMessage
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.userMessageText : styles.botMessageText
                  ]}>
                    {msg.text}
                  </Text>
                </View>
                <Text style={styles.timestamp}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
            
            {isTyping && (
              <View style={styles.typingIndicator}>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <View style={styles.quickActions}>
              <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
              <View style={styles.quickActionButtons}>
                {quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickActionButton}
                    onPress={() => sendMessage(action.action)}
                  >
                    <Text style={styles.quickActionText}>{action.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {/* Input Container */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage(inputText)}
              blurOnSubmit={false}
            />
            <TouchableOpacity 
              style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
            >
              <Ionicons 
                name="send" 
                size={18} 
                color={inputText.trim() ? "#fff" : "#999"} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  pulseDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  pulseInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    opacity: 0.8,
  },
  chatContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 320,
    height: 450,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 999,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#4CAF50',
  },
  messagesList: {
    flex: 1,
    padding: 12,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    marginHorizontal: 4,
  },
  typingIndicator: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typingDots: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.8 },
  quickActions: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  quickActionsTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  quickActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickActionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 80,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#2196F3',
  },
});