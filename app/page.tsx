'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, CalendarDays, Settings2, Sprout } from 'lucide-react';
import DiagnoseTab from '@/components/diagnose-tab';
import ScheduleTab from '@/components/schedule-tab';
import { LANGUAGES } from '@/lib/constants';

export default function Home() {
  const [language, setLanguage] = useState('en');

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-20 md:pb-0">
      <header className="bg-green-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6" />
            <h1 className="text-xl font-bold tracking-tight">AgriAssist AI</h1>
          </div>
          <Select value={language} onValueChange={(val) => val && setLanguage(val)}>
            <SelectTrigger className="w-[140px] bg-green-800 border-green-600 text-white focus:ring-green-500">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-4">
        <Tabs defaultValue="diagnose" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-stone-200/50 p-1 rounded-xl">
            <TabsTrigger value="diagnose" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm py-2.5">
              <Leaf className="w-4 h-4 mr-2" />
              Diagnose
            </TabsTrigger>
            <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm py-2.5">
              <CalendarDays className="w-4 h-4 mr-2" />
              Schedule
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagnose" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <DiagnoseTab language={language} />
          </TabsContent>
          
          <TabsContent value="schedule" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <ScheduleTab language={language} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
