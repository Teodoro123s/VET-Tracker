import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { processChatbotMessage, executeAction, ChatMessage } from '../services/chatbotService';

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState ([
    { 
      text: "Hi! I'm your veterinary AI assistant. I can help you with appointments, navigation, sending emails, and answering questions about the app. How can I help you today?", 
      sender: 'bot',
      timestamp Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef (null);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage = {
      text: text.trim(),
      sender: 'user',
      timestamp Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Process message with AI
      const response = await processChatbotMessage(text);
      
      // Add bot response
      const botMessage = {
        text: response.message,
        sender: 'bot',
        timestamp Date()
      };
      setMessages(prev => [...prev, botMessage]);

      // Execute action if any
      if (response.action) {
        executeAction(response.action);
      }
    } catch (error) {
      const errorMessage = {
        text: "Sorry, I encountered an error. Please try again or contact support if the issue persists.",
        sender: 'bot',
        timestamp Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated});
  }, [messages]);

  // Quick action buttons
  const quickActions = [
    { text: "📅 Book Appointment", action: "book appointment" },
    { text: "🐕 My Pets", action: "go to customers" },
    { text: "📋 Medical Records", action: "view records" },
    { text: "🔔 Notifications", action: "show notifications" }
  ];

  return (
    
      {/* Floating Button */}
       setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        
        {!isOpen && (
          
            
          
        )}
      

      {/* Chat Container */}
      {isOpen && (
        
          {/* Chat Header */}
          
            
              
                
              
              
                Vet AI Assistant
                
                  {isTyping ? "Typing..." : "Online"}
                
              
            
             setIsOpen(false)}>
              
            
          
          
          {/* Messages List */}
          
            {messages.map((msg, index) => (
              
                
                  
                    {msg.text}
                  
                
                
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                
              
            ))}
            
            {isTyping && (
              
                
                  
                  
                  
                
              
            )}
          

          {/* Quick Actions */}
          {messages.length === 1 && (
            
              Quick Actions {quickActions.map((action, index) => (
                   sendMessage(action.action)}
                  >
                    {action.text}
                  
                ))}
              
            
          )}
          
          {/* Input Container */}
          
             sendMessage(inputText)}
              blurOnSubmit={false}
            />
             sendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
            >
              
            
          
        
      )}
    
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom,
    right,
    width,
    height,
    borderRadius,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation,
    shadowColor: '#000',
    shadowOffset: { width, height},
    shadowOpacity: 0.3,
    shadowRadius,
    zIndex,
  },
  pulseDot: {
    position: 'absolute',
    top,
    right,
    width,
    height,
    borderRadius,
    backgroundColor: '#4CAF50',
  },
  pulseInner: {
    width,
    height,
    borderRadius,
    backgroundColor: '#4CAF50',
    opacity: 0.8,
  },
  chatContainer: {
    position: 'absolute',
    bottom,
    right,
    width,
    height,
    backgroundColor: '#fff',
    borderRadius,
    elevation,
    shadowColor: '#000',
    shadowOffset: { width, height},
    shadowOpacity: 0.3,
    shadowRadius,
    zIndex,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding,
    borderBottomWidth,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius,
    borderTopRightRadius,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width,
    height,
    borderRadius,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight,
  },
  headerTitle: {
    fontSize,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize,
    color: '#4CAF50',
  },
  messagesList: {
    flex,
    padding,
  },
  messageContainer: {
    marginBottom,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  message: {
    maxWidth: '80%',
    padding,
    borderRadius,
  },
  userMessage: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius,
  },
  botMessage: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius,
  },
  messageText: {
    fontSize,
    lineHeight,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize,
    color: '#999',
    marginTop,
    marginHorizontal,
  },
  typingIndicator: {
    alignItems: 'flex-start',
    marginBottom,
  },
  typingDots: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding,
    borderRadius,
    borderBottomLeftRadius,
  },
  dot: {
    width,
    height,
    borderRadius,
    backgroundColor: '#999',
    marginHorizontal,
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.6 },
  dot3: { opacity: 0.8 },
  quickActions: {
    padding,
    borderTopWidth,
    borderTopColor: '#f0f0f0',
  },
  quickActionsTitle: {
    fontSize,
    color: '#666',
    marginBottom,
    fontWeight: '500',
  },
  quickActionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap,
  },
  quickActionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal,
    paddingVertical,
    borderRadius,
    marginBottom,
  },
  quickActionText: {
    fontSize,
    color: '#2196F3',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding,
    borderTopWidth,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    borderBottomLeftRadius,
    borderBottomRightRadius,
  },
  textInput: {
    flex,
    borderWidth,
    borderColor: '#e0e0e0',
    borderRadius,
    paddingHorizontal,
    paddingVertical,
    marginRight,
    maxHeight,
    fontSize,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    width,
    height,
    borderRadius,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#2196F3',
  },
});