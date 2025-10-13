'use client';

import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StateDebugger() {
  const { 
    generatedImages, 
    addGeneratedImage, 
    setGeneratedImages,
    resetGeneration 
  } = useAppStore();

  const addTestImage = () => {
    const testImage = {
      id: `test-${Date.now()}`,
      url: '/generated/generated_1760337589763_0.png', // 使用最新生成的图片
      prompt: '正面特写 - 测试',
      style: '产品特写',
      timestamp: Date.now(),
    };
    console.log('🧪 添加测试图片:', testImage);
    addGeneratedImage(testImage);
  };

  const addMultipleTestImages = () => {
    const testImages = [
      {
        id: `test-${Date.now()}-1`,
        url: '/generated/generated_1760337589763_0.png',
        prompt: '正面特写 - 户外背包正面展示',
        style: '产品特写',
        timestamp: Date.now(),
      },
      {
        id: `test-${Date.now()}-2`,
        url: '/generated/generated_1760337604382_1.png',
        prompt: '45度俯视 - 户外背包俯视角度',
        style: '产品特写',
        timestamp: Date.now(),
      },
      {
        id: `test-${Date.now()}-3`,
        url: '/generated/generated_1760337619577_2.png',
        prompt: '侧面轮廓 - 户外背包侧面展示',
        style: '产品特写',
        timestamp: Date.now(),
      }
    ];
    console.log('🧪 批量添加测试图片:', testImages);
    setGeneratedImages(testImages);
  };

  return (
    <Card className="mb-6 border-2 border-dashed border-yellow-300 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">🧪 状态调试器</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            当前图片数量: <strong>{generatedImages.length}</strong>
          </p>
          <div className="text-xs text-gray-500 max-h-32 overflow-y-auto">
            <pre>{JSON.stringify(generatedImages, null, 2)}</pre>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={addTestImage}
            variant="outline"
            size="sm"
            className="text-yellow-700 border-yellow-300"
          >
            添加单张测试图片
          </Button>
          
          <Button 
            onClick={addMultipleTestImages}
            variant="outline"
            size="sm"
            className="text-yellow-700 border-yellow-300"
          >
            添加多张测试图片
          </Button>
          
          <Button 
            onClick={resetGeneration}
            variant="outline"
            size="sm"
            className="text-red-700 border-red-300"
          >
            清空状态
          </Button>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>💡 使用此调试器测试状态管理和图片显示功能</p>
          <p>📝 检查浏览器控制台查看详细日志</p>
        </div>
      </CardContent>
    </Card>
  );
}