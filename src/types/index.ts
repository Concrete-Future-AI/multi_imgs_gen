// 图片生成相关类型定义
export interface ImageGenerationRequest {
  productImage: File;
  style: string;
  quantity: number;
  customPrompt?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  images?: string[];
  error?: string;
  requestId?: string;
}

// 风格选项类型
export interface StyleOption {
  id: string;
  name: string;
  description: string;
  preview: string;
  prompt: string;
}

// 上传文件类型
export interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

// 生成进度类型
export interface GenerationProgress {
  status: 'idle' | 'uploading' | 'analyzing' | 'generating' | 'completed' | 'error';
  progress: number;
  message: string;
  currentStep?: number;
  totalSteps?: number;
}

// API响应基础类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 产品分析结果类型
export interface ProductAnalysis {
  category: string;
  features: string[];
  colors: string[];
  style: string;
  description: string;
}

// 生成的图片信息类型
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  timestamp: number;
}

// 应用状态类型
export interface AppState {
  uploadedFile: UploadedFile | null;
  selectedStyle: StyleOption | null;
  quantity: number;
  customPrompt: string;
  generationProgress: GenerationProgress;
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
}