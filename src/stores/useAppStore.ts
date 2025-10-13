import { create } from 'zustand';
import { AppState, UploadedFile, StyleOption, GenerationProgress, GeneratedImage } from '@/types';
import { GENERATION_CONFIG } from '@/lib/constants';

interface AppStore extends AppState {
  // Actions
  setUploadedFile: (file: UploadedFile | null) => void;
  setSelectedStyle: (style: StyleOption | null) => void;
  setQuantity: (quantity: number) => void;
  setSceneDescription: (description: string) => void;
  setGeneratedImages: (images: GeneratedImage[]) => void;
  addGeneratedImage: (image: GeneratedImage) => void;
  setGenerationProgress: (progress: GenerationProgress) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  clearAll: () => void;
  resetGeneration: () => void;
}

const initialState: AppState = {
  uploadedFile: null,
  selectedStyle: null,
  quantity: GENERATION_CONFIG.DEFAULT_IMAGES,
  sceneDescription: '',
  generatedImages: [],
  generationProgress: {
    status: 'idle',
    progress: 0,
    message: '',
  },
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
  
  setSceneDescription: (description) => set({ sceneDescription: description }),
  
  setGeneratedImages: (images) => set({ generatedImages: images }),
  
  addGeneratedImage: (image) => {
    const { generatedImages } = get();
    set({ generatedImages: [...generatedImages, image] });
  },
  
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  clearAll: () => set(initialState),
  
  resetGeneration: () => set({
    generatedImages: [],
  }),
}));