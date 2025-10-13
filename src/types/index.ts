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
  requiresScene?: boolean; // 是否需要场景描述
}

// 上传文件类型
export interface UploadedFile {
  file: File;
  preview: string;
  id: string;
  serverUrl?: string; // 服务器返回的文件URL
  serverKey?: string; // 服务器返回的文件key
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
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API错误响应类型
export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

// Axios错误类型
export interface AxiosError extends Error {
  response?: {
    data?: ApiErrorResponse;
    status: number;
    statusText: string;
  };
  request?: unknown;
  config?: unknown;
}

// 图片生成API响应类型
export interface GenerateApiResponse {
  success: boolean;
  images?: string[];
  analysis?: string;
  prompt?: string;
  error?: string;
  requestId?: string;
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
  sceneDescription: string; // 场景描述
  generatedImages: GeneratedImage[];
  generationProgress: GenerationProgress;
  isGenerating: boolean;
}