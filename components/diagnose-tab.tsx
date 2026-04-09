'use client';

import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Webcam from 'react-webcam';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';
import { LANGUAGES } from '@/lib/constants';
import Markdown from 'react-markdown';

export default function DiagnoseTab({ language }: { language: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
      setIsCameraOpen(false);
      setResult(null);
    }
  }, [webcamRef]);

  const analyzeImage = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    try {
      // Initialize Gemini API
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      // Extract base64 data
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      
      const langName = LANGUAGES.find(l => l.code === language)?.name || 'English';
      
      const prompt = `You are an expert agricultural extension officer helping smallholder farmers in West Africa.
Analyze this crop image carefully.
1. Identify the crop if possible.
2. Identify any visible pests, diseases, nutrient deficiencies, or stress factors.
3. Provide actionable, low-cost, and locally accessible recommendations to treat or manage the issue.
4. If the crop looks healthy, confirm it and give a brief tip for maintaining health.

Respond entirely in ${langName}. Use simple, clear language that a farmer would understand. Avoid overly technical jargon. Format with clear headings and bullet points.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              }
            },
            { text: prompt }
          ]
        }
      });
      
      setResult(response.text || "Could not generate an analysis. Please try again.");
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast.error("Failed to analyze image. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-stone-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-stone-50 border-b border-stone-100 pb-4">
          <CardTitle className="text-xl text-green-800">Crop Diagnosis</CardTitle>
          <CardDescription>Take a photo or upload an image of your crop to identify pests, diseases, or stress.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {!image && !isCameraOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-stone-300 hover:border-green-500 hover:bg-green-50 transition-colors"
                onClick={() => setIsCameraOpen(true)}
              >
                <div className="p-3 bg-green-100 text-green-700 rounded-full">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="font-medium text-stone-700">Take Photo</span>
              </Button>
              
              <div 
                {...getRootProps()} 
                className={`h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? 'border-green-500 bg-green-50' : 'border-stone-300 hover:border-green-500 hover:bg-green-50'}`}
              >
                <input {...getInputProps()} />
                <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="font-medium text-stone-700">Upload Image</span>
              </div>
            </div>
          )}

          {isCameraOpen && (
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex flex-col">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-4">
                <Button variant="destructive" size="icon" className="rounded-full h-12 w-12" onClick={() => setIsCameraOpen(false)}>
                  <X className="w-6 h-6" />
                </Button>
                <Button variant="default" size="icon" className="rounded-full h-12 w-12 bg-white text-black hover:bg-stone-200" onClick={capture}>
                  <Camera className="w-6 h-6" />
                </Button>
              </div>
            </div>
          )}

          {image && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-100 aspect-video sm:aspect-auto sm:max-h-[400px] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Crop to analyze" className="max-w-full max-h-full object-contain" />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 rounded-full shadow-md"
                  onClick={() => { setImage(null); setResult(null); }}
                  disabled={isAnalyzing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {!result && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg shadow-md"
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Crop...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Analyze Image
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-200 shadow-md bg-green-50/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-green-100/50 border-b border-green-100 pb-4">
            <CardTitle className="text-xl text-green-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Diagnosis & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-stone prose-p:leading-relaxed prose-headings:text-green-800 max-w-none">
              <Markdown>{result}</Markdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
