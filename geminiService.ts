
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Story, Language, SoundType } from "./types";

// Helper to decode base64 to bytes
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to decode PCM data
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class GeminiService {
  private getAI() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment variables.");
    }
    return new GoogleGenAI({ apiKey });
  }

  async generateStoryStructure(prompt: string, language: Language, pageCount: number = 5): Promise<Story> {
    const ai = this.getAI();
    const langName = language === 'en' ? 'English' : 'Lithuanian';
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Create an enchanting children's story based on: "${prompt}". 
      
      CRITICAL REQUIREMENT: The main hero of the story MUST BE "Dziulis" (pronounced 'Jew-lis'). 
      Dziulis is a curious, kind-hearted magical boy with a blue star-topped hat and a small cape. 
      He solves problems with kindness and magic.
      
      THE STORY MUST BE WRITTEN IN ${langName.toUpperCase()}.
      Return the story as a JSON object with a title and exactly ${pageCount} pages. 
      Each page must have:
      1. "text": a rich paragraph of 4-6 sentences.
      2. "imagePrompt": detailed English description for a whimsical illustration of Dziulis.
      3. "soundEffects": An array of exactly 1 or 2 objects. Each object should have "word" (an exact word from the "text" that represents a sound or action like 'magic', 'train', 'bird', 'splash', 'laugh') and "type" (one of: 'magic', 'animal', 'nature', 'mechanical', 'transport', 'emotion').`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  soundEffects: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['magic', 'animal', 'nature', 'mechanical', 'transport', 'emotion'] }
                      },
                      required: ["word", "type"]
                    }
                  }
                },
                required: ["text", "imagePrompt", "soundEffects"]
              }
            }
          },
          required: ["title", "pages"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return { ...parsed, language } as Story;
  }

  async generateImage(prompt: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A magical children's book illustration: ${prompt}. Dziulis is a cute magical boy with a star hat. Soft cinematic lighting, vibrant colors, dreamy whimsical style, professional art quality.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to generate image");
  }

  async generateSpeech(text: string, language: Language): Promise<string> {
    const ai = this.getAI();
    const langName = language === 'en' ? 'English' : 'Lithuanian';
    const voice = language === 'en' ? 'Zephyr' : 'Kore';
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this story page slowly and expressively in ${langName}: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice } 
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Failed to generate speech");
    return base64Audio;
  }
}

export const gemini = new GeminiService();
