
import { ChatMessage, SiteProfile } from '../types';
import { StorageService } from './storageService';

export const BotService = {
    // Check and sanitize message content
    moderateMessage: (content: string, profile: SiteProfile): string => {
        if (!profile.botConfig?.isModerationActive) return content;
        
        let cleanedContent = content;
        const badWords = profile.botConfig.badWords || [];
        
        badWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            cleanedContent = cleanedContent.replace(regex, '***');
        });
        
        return cleanedContent;
    },

    // Check if bot should auto-reply
    checkAutoReply: async (lastMessage: ChatMessage, profile: SiteProfile) => {
        if (!profile.botConfig?.isAutoReplyActive) return;
        
        // Only reply to non-admin messages in Support/DM context
        if (lastMessage.senderId === 'ADMIN' || lastMessage.senderId === 'BOT') return;

        // Logic: If Admin hasn't replied in 5 seconds (simulated check here, usually triggered on send)
        // Since this runs client side immediately after user sends:
        
        const botReply: ChatMessage = {
            id: 'bot_' + Date.now(),
            sessionId: lastMessage.sessionId,
            senderId: 'BOT',
            senderName: profile.botConfig.botName,
            content: profile.botConfig.autoReplyMessage,
            isRead: false,
            timestamp: new Date().toISOString()
        };

        // Delay slighty for realism
        setTimeout(async () => {
            // Check if admin replied in the meantime (optional, hard to do purely client side without subscription)
            // Just send auto reply for now
            await StorageService.sendChat(botReply);
        }, 1500);
    }
};
