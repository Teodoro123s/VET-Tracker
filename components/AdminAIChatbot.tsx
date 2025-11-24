import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function AdminAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your VET Tracker assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the floating button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Basic pattern matching for common queries
    if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
      return "You can manage appointments from the Appointments section. You can view, create, update, or cancel appointments there. Would you like me to guide you through the process?";
    }
    
    if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
      return "To manage customers, go to the Customers section. You can add new customers, view their details, and see their pet records. Need help with a specific customer task?";
    }
    
    if (lowerMessage.includes('pet') || lowerMessage.includes('animal')) {
      return "Pet management is available in the Customers section. Each customer can have multiple pets. You can add pets, update their information, and track their medical history.";
    }
    
    if (lowerMessage.includes('veterinarian') || lowerMessage.includes('vet') || lowerMessage.includes('doctor')) {
      return "You can manage veterinarians from the Veterinarians section. Add new vets, update their profiles, and assign them to appointments. What would you like to know?";
    }
    
    if (lowerMessage.includes('medical') || lowerMessage.includes('record') || lowerMessage.includes('history')) {
      return "Medical records are accessible through customer profiles. You can view detailed medical history, add new records, and track treatment plans for each pet.";
    }
    
    if (lowerMessage.includes('report') || lowerMessage.includes('analytics') || lowerMessage.includes('statistics')) {
      return "The dashboard shows key statistics including total customers, appointments, pets, and veterinarians. For detailed reports, check the respective sections.";
    }
    
    if (lowerMessage.includes('subscription') || lowerMessage.includes('payment') || lowerMessage.includes('billing')) {
      return "Subscription management is available in Settings. You can view your current plan, renewal dates, and upgrade options there.";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how to') || lowerMessage.includes('guide')) {
      return "I can help you with:\n• Managing appointments\n• Adding customers and pets\n• Managing veterinarians\n• Viewing medical records\n• Understanding dashboard statistics\n\nWhat would you like to learn about?";
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm here to help you navigate VET Tracker. What can I assist you with today?";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! Feel free to ask if you need anything else.";
    }
    
    // Default response
    return "I'm here to help! You can ask me about:\n• Appointments and scheduling\n• Customer and pet management\n• Veterinarian profiles\n• Medical records\n• Dashboard features\n\nWhat would you like to know?";
  };

  const handleSend = () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(userMessage.text),
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
      
      // Auto scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1000 + Math.random() * 1000);
  };

  const quickActions = [
    { icon: 'calendar-outline', text: 'Book Appointment', query: 'How do I book an appointment?' },
    { icon: 'people-outline', text: 'Add Customer', query: 'How do I add a new customer?' },
    { icon: 'paw-outline', text: 'Add Pet', query: 'How do I add a pet?' },
    { icon: 'help-circle-outline', text: 'Help', query: 'I need help' },
  ];

  const handleQuickAction = (query: string) => {
    setInputText(query);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <>
      {/* Floating Button */}
      <Animated.View style={[styles.floatingButton, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => setIsOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AI</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.chatContainer}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.botAvatar}>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>VET Assistant</Text>
                  <Text style={styles.headerSubtitle}>AI-powered help</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <View style={styles.quickActionsContainer}>
                <Text style={styles.quickActionsTitle}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                  {quickActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickActionButton}
                      onPress={() => handleQuickAction(action.query)}
                    >
                      <Ionicons name={action.icon as any} size={24} color="#7B2C2C" />
                      <Text style={styles.quickActionText}>{action.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageWrapper,
                    message.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper
                  ]}
                >
                  {message.sender === 'bot' && (
                    <View style={styles.botAvatarSmall}>
                      <Ionicons name="sparkles" size={12} color="#fff" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      message.sender === 'user' ? styles.userMessage : styles.botMessage
                    ]}
                  >
                    <Text style={[
                      styles.messageText,
                      message.sender === 'user' ? styles.userMessageText : styles.botMessageText
                    ]}>
                      {message.text}
                    </Text>
                    <Text style={[
                      styles.messageTime,
                      message.sender === 'user' ? styles.userMessageTime : styles.botMessageTime
                    ]}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {message.sender === 'user' && (
                    <View style={styles.userAvatarSmall}>
                      <Ionicons name="person" size={12} color="#fff" />
                    </View>
                  )}
                </View>
              ))}
              
              {isTyping && (
                <View style={styles.typingIndicator}>
                  <View style={styles.botAvatarSmall}>
                    <Ionicons name="sparkles" size={12} color="#fff" />
                  </View>
                  <View style={styles.typingBubble}>
                    <View style={styles.typingDots}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7B2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7B2C2C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  closeButton: {
    padding: 4,
  },
  quickActionsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  botAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7B2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  userAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  userMessage: {
    backgroundColor: '#7B2C2C',
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
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  botMessageTime: {
    color: '#999',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 16,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7B2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7B2C2C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
});
