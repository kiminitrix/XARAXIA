import { Model } from './types';

export const GEMINI_MODELS: Model[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash (Fast)',
    provider: 'Google',
    description: 'Optimized for speed and efficiency. Best for everyday tasks.',
    capabilities: ['Speed', 'Reasoning', 'Conciseness']
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro (Complex)',
    provider: 'Google',
    description: 'Our most capable model for highly complex tasks, coding, and math.',
    capabilities: ['Deep Reasoning', 'Coding', 'Multimodal']
  },
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    provider: 'Google',
    description: 'State-of-the-art vision and image understanding capabilities.',
    capabilities: ['Vision', 'Image Editing', 'Quick Analysis']
  }
];

export const DEFAULT_SYSTEM_PROMPT = "You are XARAXIA, a helpful and highly intelligent assistant. You provide concise, accurate, and professional answers. If you don't know something, state it clearly.";