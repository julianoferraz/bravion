import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, Translations, translations } from "./translations";
import { supabase } from "@/integrations/supabase/client";

export type { Language } from "./translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectLanguage = async () => {
      // Check localStorage first for user preference
      const savedLang = localStorage.getItem("preferred-language") as Language;
      if (savedLang && (savedLang === "en" || savedLang === "pt")) {
        setLanguageState(savedLang);
        setIsLoading(false);
        return;
      }

      try {
        // Call edge function to detect language by IP
        const { data, error } = await supabase.functions.invoke("detect-language");
        
        if (!error && data?.language) {
          const detectedLang = data.language as Language;
          setLanguageState(detectedLang);
          localStorage.setItem("preferred-language", detectedLang);
        }
      } catch (err) {
        console.error("Language detection failed:", err);
        // Default to English
      }
      
      setIsLoading(false);
    };

    detectLanguage();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("preferred-language", lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
