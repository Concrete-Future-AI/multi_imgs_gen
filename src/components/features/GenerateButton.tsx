import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { Button } from '@/components/ui/button';

export function GenerateButton() {
  const { uploadedFile, selectedStyle, isGenerating } = useAppStore();
  const { generateImages, isLoading } = useImageGeneration();

  const canGenerate = uploadedFile && selectedStyle && !isGenerating;

  return (
    <div className="flex justify-center">
      <Button
        size="lg"
        onClick={generateImages}
        disabled={!canGenerate}
        className="px-8 py-3 text-base font-medium"
      >
        <Sparkles className="h-5 w-5 mr-2" />
        {isLoading || isGenerating ? '正在生成...' : '开始生成'}
      </Button>
    </div>
  );
}