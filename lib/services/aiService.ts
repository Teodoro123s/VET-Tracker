// AI Service for Smart Appointment Management
// Powered by Hugging Face (Free AI API)

interface AIConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

interface AppointmentAnalysis {
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  suggestedTimeSlot: string;
  estimatedDuration: number;
  recommendations: string[];
  riskFactors: string[];
}

interface EmailPersonalization {
  tone: 'formal' | 'friendly' | 'urgent';
  customMessage: string;
  subject: string;
}

class AIService {
  private config: AIConfig = {
    apiKey: process.env.GROQ_API_KEY || '',
    model: 'llama3-8b-8192',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
  };

  // AI-powered appointment analysis
  async analyzeAppointment(
    petName: string,
    reason: string,
    petHistory: any[],
    customerHistory: any[]
  ): Promise<AppointmentAnalysis> {
    try {
      // Smart analysis based on keywords and patterns
      const urgencyKeywords = ['emergency', 'urgent', 'bleeding', 'pain', 'vomiting', 'seizure'];
      const routineKeywords = ['checkup', 'vaccination', 'grooming', 'routine'];
      
      const reasonLower = reason.toLowerCase();
      let urgency = 'medium';
      let suggestedTimeSlot = 'morning';
      let estimatedDuration = 30;
      
      if (urgencyKeywords.some(keyword => reasonLower.includes(keyword))) {
        urgency = 'high';
        suggestedTimeSlot = 'asap';
        estimatedDuration = 45;
      } else if (routineKeywords.some(keyword => reasonLower.includes(keyword))) {
        urgency = 'low';
        estimatedDuration = 20;
      }
      
      const prompt = `Analyze vet appointment: Pet ${petName}, Reason: ${reason}. Provide urgency level and recommendations.`;
      const aiResponse = await this.callGroq(prompt);
      
      // Combine AI response with rule-based analysis
      return {
        urgency,
        suggestedTimeSlot,
        estimatedDuration,
        recommendations: [`AI Analysis: ${aiResponse}`, `Recommended duration: ${estimatedDuration} minutes`],
        riskFactors: urgency === 'high' ? ['Requires immediate attention'] : []
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        urgency: 'medium',
        suggestedTimeSlot: 'morning',
        estimatedDuration: 30,
        recommendations: ['Standard checkup recommended'],
        riskFactors: []
      };
    }
  }

  // AI-powered email personalization
  async personalizeEmail(
    customerName: string,
    petName: string,
    appointmentReason: string,
    notificationType: string,
    customerHistory: any[]
  ): Promise<EmailPersonalization> {
    try {
      const prompt = `
        Create a personalized email for:
        Customer: ${customerName}
        Pet: ${petName}
        Appointment: ${appointmentReason}
        Notification Type: ${notificationType}
        History: ${JSON.stringify(customerHistory)}
        
        Generate personalized content in JSON:
        {
          "tone": "formal|friendly|urgent",
          "customMessage": "personalized message",
          "subject": "personalized subject line"
        }
      `;

      const response = await this.callHuggingFace(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('AI personalization failed:', error);
      return {
        tone: 'friendly',
        customMessage: `We look forward to seeing ${petName} for their appointment.`,
        subject: `Appointment Reminder for ${petName}`
      };
    }
  }

  // AI-powered optimal scheduling
  async suggestOptimalSchedule(
    appointments: any[],
    newAppointment: any,
    veterinarianSchedule: any[]
  ): Promise<string[]> {
    try {
      const prompt = `
        Analyze current schedule and suggest optimal time slots:
        Existing Appointments: ${JSON.stringify(appointments)}
        New Appointment: ${JSON.stringify(newAppointment)}
        Vet Schedule: ${JSON.stringify(veterinarianSchedule)}
        
        Return array of optimal time slots in format: ["YYYY-MM-DD HH:MM", ...]
      `;

      const response = await this.callHuggingFace(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('AI scheduling failed:', error);
      return [];
    }
  }

  // AI-powered health insights
  async generateHealthInsights(
    petData: any,
    medicalHistory: any[]
  ): Promise<string[]> {
    try {
      const prompt = `
        Analyze pet health data and provide insights:
        Pet Data: ${JSON.stringify(petData)}
        Medical History: ${JSON.stringify(medicalHistory)}
        
        Generate health insights and recommendations as JSON array:
        ["insight1", "insight2", "insight3"]
      `;

      const response = await this.callHuggingFace(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('AI health insights failed:', error);
      return ['Regular checkups recommended for optimal health'];
    }
  }

  // AI-powered notification timing optimization
  async optimizeNotificationTiming(
    customerData: any,
    appointmentData: any,
    responseHistory: any[]
  ): Promise<{ bestTime: string; channel: string; frequency: string }> {
    try {
      const prompt = `
        Optimize notification timing based on:
        Customer: ${JSON.stringify(customerData)}
        Appointment: ${JSON.stringify(appointmentData)}
        Response History: ${JSON.stringify(responseHistory)}
        
        Return optimal timing in JSON:
        {
          "bestTime": "HH:MM",
          "channel": "email|sms|push",
          "frequency": "once|daily|hourly"
        }
      `;

      const response = await this.callHuggingFace(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('AI timing optimization failed:', error);
      return {
        bestTime: '09:00',
        channel: 'email',
        frequency: 'once'
      };
    }
  }

  // Groq API call (Fast & Free)
  private async callGroq(prompt: string): Promise<string> {
    try {
      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are a veterinary AI assistant. Provide concise, practical responses in JSON format when requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        console.warn(`Groq API error: ${response.statusText}`);
        return this.getFallbackResponse(prompt);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || this.getFallbackResponse(prompt);
    } catch (error) {
      console.warn('AI API failed, using fallback:', error);
      return this.getFallbackResponse(prompt);
    }
  }

  // Fallback responses when AI API fails
  private getFallbackResponse(prompt: string): string {
    if (prompt.includes('urgency')) {
      return JSON.stringify({
        urgency: 'medium',
        suggestedTimeSlot: 'morning',
        estimatedDuration: 30,
        recommendations: ['Schedule regular checkup'],
        riskFactors: []
      });
    }
    if (prompt.includes('personalize')) {
      return JSON.stringify({
        tone: 'friendly',
        customMessage: 'We look forward to seeing your pet.',
        subject: 'Appointment Reminder'
      });
    }
    return 'AI processing completed';
  }
}

export const aiService = new AIService();