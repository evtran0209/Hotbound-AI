export class SpeechProcessor {
    private mediaRecorder: MediaRecorder | null = null;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private stream: MediaStream | null = null;
  
    constructor(
      private onTranscript: (text: string) => void,
      private onAudioData: (data: Blob) => void
    ) {}
  
    async initialize() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
  
        const source = this.audioContext.createMediaStreamSource(this.stream);
        source.connect(this.analyser);
  
        this.mediaRecorder = new MediaRecorder(this.stream, {
          mimeType: 'audio/webm',
        });
  
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.onAudioData(event.data);
          }
        };
  
        this.mediaRecorder.start(100); // Capture audio in 100ms chunks
        return this.stream;
      } catch (error) {
        console.error('Error initializing speech processor:', error);
        throw error;
      }
    }
  
    getAnalyser() {
      return this.analyser;
    }
  
    setVolume(volume: number) {
      if (this.stream) {
        const audioTracks = this.stream.getAudioTracks();
        audioTracks.forEach(track => {
          const constraints = track.getConstraints();
          track.applyConstraints({
            ...constraints,
            volume: volume
          });
        });
      }
    }
  
    stop() {
      if (this.mediaRecorder?.state === 'recording') {
        this.mediaRecorder.stop();
      }
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      if (this.audioContext) {
        this.audioContext.close();
      }
    }
  }