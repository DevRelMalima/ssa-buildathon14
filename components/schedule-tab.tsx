'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Sprout, Calendar, CloudRain } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';
import { LANGUAGES } from '@/lib/constants';
import Markdown from 'react-markdown';

export default function ScheduleTab({ language }: { language: string }) {
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedule, setSchedule] = useState<string | null>(null);

  const generateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !crop) {
      toast.error("Please enter both location and crop.");
      return;
    }
    
    setIsGenerating(true);
    setSchedule(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const langName = LANGUAGES.find(l => l.code === language)?.name || 'English';
      
      const prompt = `You are an expert agricultural extension officer helping smallholder farmers in West Africa.
The farmer is located in or near: "${location}".
They want to plant: "${crop}".

Provide a climate-smart planting schedule and advisory for this specific crop in this region.
Consider the typical wet and dry seasons for this location.
Include:
1. Best time to prepare land.
2. Optimal planting window.
3. Key milestones (weeding, fertilizing, harvesting).
4. A brief climate resilience tip (e.g., mulching, water conservation).

Respond entirely in ${langName}. Use simple, clear language that a farmer would understand. Format with clear headings and bullet points.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: prompt,
      });
      
      setSchedule(response.text || "Could not generate a schedule. Please try again.");
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast.error("Failed to generate schedule. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      toast.info("Getting your location...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocoding using a free API (Nominatim) for the prototype
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
            const data = await res.json();
            const locName = data.address.city || data.address.town || data.address.village || data.address.state || data.address.country;
            if (locName) {
              setLocation(locName);
              toast.success("Location found!");
            } else {
              setLocation(`${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`);
            }
          } catch (e) {
            setLocation(`${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`);
          }
        },
        (error) => {
          toast.error("Could not get location. Please enter it manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-stone-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-stone-50 border-b border-stone-100 pb-4">
          <CardTitle className="text-xl text-green-800">Climate-Smart Schedule</CardTitle>
          <CardDescription>Get a customized planting calendar based on your location and crop.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={generateSchedule} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-stone-700 font-medium">Your Location (Village, District, or Region)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <Input 
                    id="location" 
                    placeholder="e.g., Kano, Nigeria" 
                    className="pl-9 border-stone-300 focus-visible:ring-green-500"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <Button type="button" variant="outline" onClick={getLocation} className="border-stone-300 text-stone-600 hover:text-green-700 hover:border-green-500 hover:bg-green-50" title="Use GPS">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="crop" className="text-stone-700 font-medium">Crop to Plant</Label>
              <div className="relative">
                <Sprout className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <Input 
                  id="crop" 
                  placeholder="e.g., Maize, Cassava, Sorghum" 
                  className="pl-9 border-stone-300 focus-visible:ring-green-500"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg shadow-md mt-4"
              disabled={isGenerating || !location || !crop}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Schedule...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5 mr-2" />
                  Get Planting Schedule
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {schedule && (
        <Card className="border-blue-200 shadow-md bg-blue-50/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-blue-100/50 border-b border-blue-100 pb-4">
            <CardTitle className="text-xl text-blue-800 flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-blue-500" />
              Your Planting Advisory
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-stone prose-p:leading-relaxed prose-headings:text-blue-800 max-w-none">
              <Markdown>{schedule}</Markdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
