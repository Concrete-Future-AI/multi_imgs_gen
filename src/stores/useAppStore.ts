import { create } from 'zustand';
import { AppState, UploadedFile, StyleOption, GenerationProgress, GeneratedImage } from '@/types';
import { GENERATION_CONFIG } from '@/lib/constants';

interface AppStore extends AppState {
  // Actions
  setUploadedFile: (file: UploadedFile | null) => void;
  setSelectedStyle: (style: StyleOption | null) => void;
  setQuantity: (quantity: number) => void;
  setCustomPrompt: (prompt: string) => void;
  setGenerationProgress: (progress: GenerationProgress) => void;
  setGeneratedImages: (images: GeneratedImage[]) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  addGeneratedImage: (image: GeneratedImage) => void;
  clearAll: () => void;
  resetGeneration: () => void;
}

const initialState: AppState = {
  uploadedFile: null,
  selectedStyle: null,
  quantity: GENERATION_CONFIG.DEFAULT_IMAGES,
  customPrompt: '',
  generationProgress: {
    status: 'idle',
    progress: 0,
    message: '准备开始...',
    currentStep: 0,
    totalSteps: 4,
  },
  generatedImages: [],
  isGenerating: false,
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,

  setUploadedFile: (file) => set({ uploadedFile: file }),
  
  setSelectedStyle: (style) => set({ selectedStyle: style }),
  
  setQuantity: (quantity) => {
    const clampedQuantity = Math.max(
      GENERATION_CONFIG.MIN_IMAGES,
      Math.min(GENERATION_CONFIG.MAX_IMAGES, quantity)
    );
    set({ quantity: clampedQuantity });
  },
  
  setCustomPrompt: (prompt) => set({ customPrompt: prompt }),
  
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  
  setGeneratedImages: (images) => set({ generatedImages: images }),
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  addGeneratedImage: (image) => {
    const { generatedImages } = get();
    set({ generatedImages: [...generatedImages, image] });
  },
  
  clearAll: () => set(initialState),
  
  resetGeneration: () => set({
    generationProgress: {
      status: 'idle',
      progress: 0,
      message: '准备开始...',
      currentStep: 0,
      totalSteps: 4,
    },
    generatedImages: [],
    isGenerating: false,
  }),
}));