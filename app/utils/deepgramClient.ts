import { Deepgram } from '@deepgram/sdk';

// Initialize Deepgram client
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY || '');

// Function to transcribe audio in real-time
export async function transcribeAudioStream(audioStream: ReadableStream) {
  try {
    const connection = deepgram.listen.live({
      punctuate: true,
      smart_format: true,
      model: 'nova-2',
      language: 'en-US',
      encoding: 'linear16',
      sample_rate: 16000,
    });

    // Handle transcription results
    connection.addListener('transcriptReceived', (transcription) => {
      const transcript = transcription.channel.alternatives[0].transcript;
      if (transcript) {
        return transcript;
      }
    });

    // Handle connection errors
    connection.addListener('error', (error) => {
      console.error('Deepgram connection error:', error);
      throw new Error('Transcription service error');
    });

    // Handle connection close
    connection.addListener('close', () => {
      console.log('Deepgram connection closed');
    });

    // Send audio data to Deepgram
    const reader = audioStream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      connection.send(value);
    }

    // Close the connection when done
    connection.finish();

    return connection;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

// Function to transcribe audio file
export async function transcribeAudioFile(audioBuffer: Buffer, mimeType: string) {
  try {
    const response = await deepgram.transcription.preRecorded(
      {
        buffer: audioBuffer,
        mimetype: mimeType,
      },
      {
        punctuate: true,
        smart_format: true,
        model: 'nova-2',
        language: 'en-US',
      }
    );

    return response.results?.channels[0]?.alternatives[0]?.transcript || '';
  } catch (error) {
    console.error('Error transcribing audio file:', error);
    throw new Error('Failed to transcribe audio file');
  }
}

// Class for handling real-time audio processing
export class AudioProcessor {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private input: MediaStreamAudioSourceNode | null = null;
  private deepgramConnection: any = null;
  private onTranscriptCallback: ((transcript: string) => void) | null = null;

  constructor(onTranscript: (transcript: string) => void) {
    this.onTranscriptCallback = onTranscript;
  }

  async initialize(): Promise<MediaStream> {
    try {
      // Get user media
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.input = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      // Connect nodes
      this.input.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // Initialize Deepgram connection
      this.deepgramConnection = deepgram.listen.live({
        punctuate: true,
        smart_format: true,
        model: 'nova-2',
        language: 'en-US',
        encoding: 'linear16',
        sample_rate: this.audioContext.sampleRate,
      });

      // Handle transcription results
      this.deepgramConnection.addListener('transcriptReceived', (transcription: any) => {
        const transcript = transcription.channel.alternatives[0].transcript;
        if (transcript && this.onTranscriptCallback) {
          this.onTranscriptCallback(transcript);
        }
      });

      // Handle audio processing
      this.processor.onaudioprocess = (e) => {
        const audioData = e.inputBuffer.getChannelData(0);
        const dataToSend = this.convertFloat32ToInt16(audioData);
        this.deepgramConnection.send(dataToSend);
      };

      return this.stream;
    } catch (error) {
      console.error('Error initializing audio processor:', error);
      throw new Error('Failed to initialize audio processor');
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.input) {
      this.input.disconnect();
      this.input = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.deepgramConnection) {
      this.deepgramConnection.finish();
      this.deepgramConnection = null;
    }
  }

  private convertFloat32ToInt16(buffer: Float32Array) {
    const l = buffer.length;
    const buf = new Int16Array(l);
    
    for (let i = 0; i < l; i++) {
      buf[i] = Math.min(1, Math.max(-1, buffer[i])) * 0x7FFF;
    }
    
    return buf.buffer;
  }
} 