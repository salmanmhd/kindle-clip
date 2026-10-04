'use client';

import { useState, useRef } from 'react';
import { Share2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { toast } from 'sonner';

interface ShareButtonProps {
  text: string;
  bookTitle: string;
  author?: string | null;
}

export default function ShareButton({ text, bookTitle, author }: ShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    
    try {
      // Small delay to ensure rendering is complete
      await new Promise(r => setTimeout(r, 100));
      
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        style: {
          display: 'flex',
        }
      });
      
      const link = document.createElement('a');
      link.download = `quote-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Image saved successfully!');
    } catch (error) {
      toast.error('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleShare}
        disabled={isGenerating}
        className="text-muted hover:text-ink transition-colors p-2 rounded-full focus:outline-none"
        title="Save as Image"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {/* Hidden Card for rendering */}
      <div className="overflow-hidden h-0 w-0 absolute pointer-events-none opacity-0">
        <div 
          ref={cardRef} 
          className="flex flex-col justify-center items-center bg-[#F5F0E1] p-12 text-[#4A3E35] w-[1080px] h-[1080px]"
        >
          <div className="max-w-[800px] text-center">
            <p className="font-serif text-[42px] leading-relaxed text-balance">
              "{text}"
            </p>
            <div className="mt-16 pt-8 border-t border-[#DFD7C2]">
              <p className="font-sans text-[24px] uppercase tracking-[0.2em] font-medium">
                {bookTitle}
              </p>
              {author && (
                <p className="font-sans text-[20px] text-[#A3998B] mt-2">
                  {author}
                </p>
              )}
            </div>
            
            <div className="mt-12 text-[18px] font-sans text-[#A3998B] tracking-widest uppercase">
              Kindle Clipper
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
