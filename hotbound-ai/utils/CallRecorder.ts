export class CallRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private isRecording = false;
  
    async startRecording(stream: MediaStream) {
      try {
        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
  
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };
  
        this.mediaRecorder.start();
        this.isRecording = true;
      } catch (error) {
        console.error('Error starting recording:', error);
        throw error;
      }
    }
  
    stopRecording(): Promise<Blob> {
      return new Promise((resolve, reject) => {
        if (!this.mediaRecorder) {
          reject(new Error('No recording in progress'));
          return;
        }
  
        this.mediaRecorder.onstop = () => {
          const recordedBlob = new Blob(this.recordedChunks, {
            type: 'audio/webm;codecs=opus'
          });
          this.isRecording = false;
          resolve(recordedBlob);
        };
  
        this.mediaRecorder.stop();
      });
    }
  
    isCurrentlyRecording(): boolean {
      return this.isRecording;
    }
  }