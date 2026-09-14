import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export interface OutreachVariants {
  coldEmail: string;
  followUpEmail: string;
  introEmail: string;
  whatsappMessage: string;
  linkedinMessage: string;
}

export async function generateOutreach(
  lead: Partial<Tables<'leads'>>,
  userProfile: Partial<Tables<'profiles'>>,
  businessProfile: any // Depending on your business profile type
): Promise<OutreachVariants> {
  // Construct the context for the AI
  const prompt = `You are a world-class B2B sales copywriter and closer. Your ultimate goal is to generate highly persuasive, deeply researched, and highly personalized outreach messages that compel the lead to book a meeting and close a deal.

USER PROFILE (The Sender):
Name: ${userProfile.full_name || 'A representative'}
Company: ${businessProfile?.company_name || userProfile.company_name || 'our company'}
Business Type / Services: ${businessProfile?.services?.join(', ') || userProfile.business_type || 'B2B Services'}
Industry/Niche: ${businessProfile?.business_niche || 'B2B'}
Website: ${businessProfile?.website || 'our website'}

LEAD PROFILE (The Recipient):
Lead Title / Requirement: ${lead.title || 'Business Requirement'}
Company: ${lead.company_name || 'the company'}
Contact Name: ${lead.contact_name || 'there'}
Description: ${lead.description || 'a recent requirement'}
Industry / Niche: ${lead.niche || lead.industry || 'B2B'}
Location: ${lead.location || 'your area'}
Budget: ${lead.budget || 'Not specified'}
Timeline: ${lead.timeline || 'Not specified'}
CRM Profile: ${lead.crm_profile || 'Not specified'}

Task: Generate 5 specific, highly personalized outreach variants based on the context above.
Crucial Instructions:
- Messages MUST be highly detailed, demonstrating that you have researched their specific requirement (${lead.title}).
- Focus entirely on value proposition, ROI, and solving their exact pain points.
- The primary goal of every message is to lock in a meeting or a deal.
- Use a professional, persuasive, yet conversational tone. Avoid robotic AI-sounding phrases.
- Each output MUST contain a clear, irresistible Call To Action (e.g., asking for a 10-minute call next Tuesday).

Return ONLY valid JSON (no markdown block, no backticks) with exactly these fields:
- coldEmail: A detailed, value-driven cold email highlighting exactly how you solve their problem and asking for a meeting. Include an engaging Subject Line.
- followUpEmail: A strategic follow-up email assuming they missed the first, adding a new piece of value or insight to compel a response.
- introEmail: A relationship-building introduction email that establishes authority and credibility while gently pushing for a discovery call.
- whatsappMessage: A punchy, highly engaging WhatsApp message that gets straight to the point about their requirement and asks for a quick chat (use 1-2 appropriate emojis).
- linkedinMessage: A professional but direct LinkedIn direct message focusing on synergies and booking a quick intro call.

Ensure the JSON is perfectly formatted.`;

  try {
    if (!apiKey || apiKey === 'REPLACE_WITH_YOUR_GEMINI_API_KEY') {
      throw new Error('Gemini API key missing.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    if (!text) {
      throw new Error('Received empty response from AI.');
    }

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedResult = JSON.parse(cleaned) as OutreachVariants;
    return parsedResult;
  } catch (error: any) {
    console.warn('Gemini API Error, falling back to local generation:', error);
    
    // Fallback logic when quota is exceeded or network fails
    const cName = lead.company_name || 'your company';
    const sName = userProfile.full_name || 'I';
    const sCompany = businessProfile?.company_name || userProfile.company_name || 'our team';
    
    return {
      coldEmail: `Subject: Addressing your requirement for ${lead.title || 'Business Services'}\n\nHi ${lead.contact_name || 'there'},\n\nI was researching ${cName} and noticed your active requirement regarding ${lead.title || 'your recent initiatives'}. \n\nAt ${sCompany}, we have a strong track record of delivering exactly what you're looking for, ensuring high quality and strict adherence to your timeline. Given your focus in the ${lead.industry || 'industry'} space, I am confident our solutions can drive immediate value for your team.\n\nWould you be open to a brief 10-minute introductory call next Tuesday to discuss how we can align our services with your goals?\n\nBest regards,\n${sName}\n${sCompany}`,
      followUpEmail: `Subject: Following up: ${lead.title || 'Your requirements'} & ${sCompany}\n\nHi ${lead.contact_name || 'there'},\n\nI’m following up on my previous note regarding your requirement for ${lead.title || 'business services'}. \n\nI know things get busy, but I wanted to reiterate that ${sCompany} is uniquely positioned to handle this for ${cName} efficiently. We'd love the opportunity to prove our capabilities and build a long-term partnership.\n\nDo you have 5 minutes this week for a quick chat to explore this further?\n\nBest,\n${sName}`,
      introEmail: `Subject: Introduction: ${sCompany} & ${cName} Synergies\n\nHello ${lead.contact_name || ''},\n\nI'm ${sName} with ${sCompany}. I've been closely following ${cName}'s growth and wanted to formally introduce ourselves. We specialize in providing top-tier solutions that perfectly align with your current requirement for ${lead.title || 'services'}.\n\nI’d love to connect and learn more about your operational priorities. Let me know what your calendar looks like for a brief introductory call.\n\nRegards,\n${sName}`,
      whatsappMessage: `Hi ${lead.contact_name || ''}! This is ${sName} from ${sCompany}. I saw your requirement for ${lead.title || 'services'} and we are perfectly equipped to deliver exactly what you need. Are you open to a quick 5-min call today or tomorrow to discuss how we can fulfill this for ${cName}? 🚀📈`,
      linkedinMessage: `Hi ${lead.contact_name || ''}, I saw the great work you're doing at ${cName} and your requirement for ${lead.title || 'services'}. I'm with ${sCompany} and we specialize in exactly this. I’d love to connect and jump on a quick call to share how we can bring immense value to your team. Let's talk!`
    };
  }
}
