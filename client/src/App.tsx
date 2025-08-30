import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PuraList } from '@/components/PuraList';
import { EducationalContent } from '@/components/EducationalContent';
import { SmartSearch } from '@/components/SmartSearch';
import { HelpCircle, Heart, BookOpen, MapPin } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('puras');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Pura Bali 🙏</h1>
              <p className="text-sm text-gray-600">Supporting Sacred Hindu Temples in Bali</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white shadow-sm">
            <TabsTrigger 
              value="puras" 
              className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              <Heart className="h-4 w-4 mr-2" />
              Pura & Donations
            </TabsTrigger>
            <TabsTrigger 
              value="education" 
              className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Hindu Culture
            </TabsTrigger>
            <TabsTrigger 
              value="search" 
              className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Smart Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="puras">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Sacred Pura Directory</CardTitle>
                <CardDescription>
                  Support the preservation and maintenance of Hindu temples across Bali
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PuraList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Hindu Bali Culture</CardTitle>
                <CardDescription>
                  Learn about the rich traditions, history, and spiritual practices of Balinese Hinduism
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EducationalContent />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Smart Search</CardTitle>
                <CardDescription>
                  Ask questions about Hindu Bali culture and get relevant information from our educational content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SmartSearch />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">
              Built with 🧡 for the preservation of Balinese Hindu culture and sacred temples
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Om Swastyastu 🕉️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;