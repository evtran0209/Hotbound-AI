interface CallMetrics {
    duration: number;
    speakingTime: {
      user: number;
      agent: number;
    };
    turnTaking: number;
    silenceDuration: number;
  }
  
  export class CallAnalytics {
    private startTime: number = 0;
    private lastSpeakerChange: number = 0;
    private currentSpeaker: 'user' | 'agent' | null = null;
    private speakingTime = {
      user: 0,
      agent: 0
    };
    private turnChanges = 0;
    private silenceThreshold = 1000; // 1 second
    private totalSilence = 0;
    private lastActivity: number = 0;
  
    startCall() {
      this.startTime = Date.now();
      this.lastActivity = this.startTime;
    }
  
    recordSpeaking(speaker: 'user' | 'agent') {
      const now = Date.now();
      
      // Calculate silence if applicable
      if (this.lastActivity) {
        const timeSinceLastActivity = now - this.lastActivity;
        if (timeSinceLastActivity > this.silenceThreshold) {
          this.totalSilence += timeSinceLastActivity;
        }
      }
  
      // Record turn changes
      if (this.currentSpeaker !== speaker) {
        this.turnChanges++;
        this.lastSpeakerChange = now;
      }
  
      // Update speaking time
      if (this.currentSpeaker) {
        const duration = now - this.lastActivity;
        this.speakingTime[this.currentSpeaker] += duration;
      }
  
      this.currentSpeaker = speaker;
      this.lastActivity = now;
    }
  
    getMetrics(): CallMetrics {
      const now = Date.now();
      const duration = now - this.startTime;
  
      return {
        duration,
        speakingTime: this.speakingTime,
        turnTaking: this.turnChanges,
        silenceDuration: this.totalSilence
      };
    }
  
    generateSummary(): string {
      const metrics = this.getMetrics();
      const durationMinutes = Math.round(metrics.duration / 60000);
      const userSpeakingPercentage = Math.round((metrics.speakingTime.user / metrics.duration) * 100);
      const agentSpeakingPercentage = Math.round((metrics.speakingTime.agent / metrics.duration) * 100);
      const silencePercentage = Math.round((metrics.silenceDuration / metrics.duration) * 100);
  
      return `
  Call Duration: ${durationMinutes} minutes
  Speaking Distribution:
  - You: ${userSpeakingPercentage}%
  - Prospect: ${agentSpeakingPercentage}%
  - Silence: ${silencePercentage}%
  Turn Changes: ${metrics.turnTaking}
      `.trim();
    }
  }