import { Platform } from 'react-native';
import { IAudioRecorder } from '../domain/IAudioRecorder';
import { WebAudioRecorder } from './WebAudioRecorder';
import { SimulatedAudioRecorder } from './SimulatedAudioRecorder';

export class AudioRecorderFactory {
  private static instance: IAudioRecorder | null = null;

  static getRecorder(): IAudioRecorder {
    if (this.instance) {
      return this.instance;
    }

    if (Platform.OS === 'web') {
      this.instance = new WebAudioRecorder();
    } else {
      this.instance = new SimulatedAudioRecorder();
    }

    return this.instance!;
  }
}
