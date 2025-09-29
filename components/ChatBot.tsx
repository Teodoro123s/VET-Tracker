import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Animated, Modal } from 'react-native';
import { firebaseService } from '../lib/services/firebaseService';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface ChatBotProps {
  tenantId: string;
}

export default function ChatBot({ tenantId }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! I\'m your veterinary assistant. I can help you find information about customers, pets, and medical records. What would you like to know?', isBot: true, timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const addMessage = (text: string, isBot: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const processMessage = async (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    try {
      // Customer queries
      if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
        if (lowerMessage.includes('how many') || lowerMessage.includes('count')) {
          const customers = await firebaseService.getCustomers(tenantId);
          return `You currently have ${customers.length} customers in your system.`;
        }
        if (lowerMessage.includes('find') || lowerMessage.includes('search')) {
          return 'To find a customer, go to the Customers page and use the search box in the top right. You can search by name, phone, or email.';
        }
        return 'You can manage customers from the main Customers page. There you can view, add, edit, and search for customers.';
      }

      // Pet queries
      if (lowerMessage.includes('pet') || lowerMessage.includes('animal')) {
        if (lowerMessage.includes('how many') || lowerMessage.includes('count')) {
          const customers = await firebaseService.getCustomers(tenantId);
          let totalPets = 0;
          for (const customer of customers) {
            const pets = await firebaseService.getPets(tenantId, customer.id);
            totalPets += pets.length;
          }
          return `There are ${totalPets} pets registered in your system.`;
        }
        return 'To view pets, click on any customer to see their pet details. You can add new pets and manage medical records from the customer detail page.';
      }

      // Medical records
      if (lowerMessage.includes('medical') || lowerMessage.includes('record') || lowerMessage.includes('history')) {
        return 'Medical records can be viewed and added from each pet\'s detail page. Click on a customer, then click on their pet to see medical history.';
      }

      // Navigation help
      if (lowerMessage.includes('how to') || lowerMessage.includes('navigate')) {
        return 'Navigation: Customers → Customer Details → Pet Details → Medical Records. Use the search functions on each page to find specific information quickly.';
      }

      // Species/Breeds
      if (lowerMessage.includes('species') || lowerMessage.includes('breed')) {
        const species = await firebaseService.getSpecies(tenantId);
        return `You have ${species.length} species configured. You can manage species and breeds from the Records page.`;
      }

      // General help
      if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return 'I can help you with:\n• Finding customer information\n• Pet management guidance\n• Medical records navigation\n• System statistics\n• General navigation tips\n\nJust ask me anything about your veterinary system!';
      }

      // Default response
      return 'I can help you with customer management, pet information, medical records, and system navigation. Could you be more specific about what you\'re looking for?';

    } catch (error) {
      return 'I\'m having trouble accessing the data right now. Please try again in a moment.';
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText('');
    addMessage(userMessage, false);
    
    setIsTyping(true);
    
    setTimeout(async () => {
      const response = await processMessage(userMessage);
      setIsTyping(false);
      addMessage(response, true);
    }, 1000);
  };

  return (
    <>
      {/* Floating Chat Button - only show when chat is closed */}
      {!isOpen && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setIsOpen(true)}
        >
          <Text style={styles.floatingButtonText}>💬</Text>
        </TouchableOpacity>
      )}

      {/* Chat Pop-up - appears in same position as button */}
      {isOpen && (
        <Animated.View
          style={[
            styles.chatContainer,
            {
              opacity: slideAnim,
              transform: [{
                scale: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}
        >
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Vet Assistant</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    message.isBot ? styles.botMessage : styles.userMessage
                  ]}
                >
                  <Text style={[
                    styles.messageText,
                    message.isBot ? styles.botMessageText : styles.userMessageText
                  ]}>
                    {message.text}
                  </Text>
                </View>
              ))}
              
              {isTyping && (
                <View style={[styles.messageContainer, styles.botMessage]}>
                  <Text style={styles.typingText}>Assistant is typing...</Text>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything..."
                multiline={false}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#800000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 1000,
  },
  floatingButtonText: {
    fontSize: 24,
  },

  chatContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 320,
    height: 400,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#800000',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    padding: 8,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  messageText: {
    padding: 8,
    borderRadius: 12,
    fontSize: 12,
    lineHeight: 16,
  },
  botMessageText: {
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
  userMessageText: {
    backgroundColor: '#800000',
    color: '#fff',
  },
  typingText: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    color: '#666',
    fontStyle: 'italic',
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    maxHeight: 60,
    fontSize: 12,
  },
  sendButton: {
    backgroundColor: '#800000',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
});