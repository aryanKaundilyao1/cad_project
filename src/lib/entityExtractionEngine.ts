export class EntityExtractionEngine {
  
  /**
   * Main entry point to extract entities from an unstructured raw string 
   * or clean up a badly mapped row object.
   */
  static extractEntities(rawText: string, currentLead: any = {}): any {
    const lead = { ...currentLead };
    const text = typeof rawText === 'string' ? rawText : JSON.stringify(rawText);

    if (!text || text.trim() === '') return lead;

    // 1. Extract Email
    if (!lead.email || lead.email.length < 5) {
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const emails = text.match(emailRegex);
      if (emails && emails.length > 0) {
        lead.email = emails[0].toLowerCase();
      }
    }

    // 2. Extract Phone
    if (!lead.phone || lead.phone.length < 7) {
      const phoneRegex = /(\+91[\-\s]?\d{10}|\b\d{10}\b|\b\d{11,12}\b)/g;
      const phones = text.match(phoneRegex);
      if (phones && phones.length > 0) {
        // Find the first valid-looking phone
        const cleanPhone = phones[0].replace(/[^\d+]/g, '');
        if (cleanPhone.length >= 10) lead.phone = cleanPhone;
      }
    }

    // 3. Extract Website
    if (!lead.website || lead.website.length < 5) {
      const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
      const urls = text.match(urlRegex);
      if (urls && urls.length > 0) {
        lead.website = urls[0].replace(/['")\]]/g, ''); // cleanup trailing brackets
      }
    }

    // 4. Extract Company Name from Text (Heuristic)
    if (!lead.company_name || lead.company_name.length < 3 || this.isRawBlob(lead.company_name)) {
      const companyRegex = /([A-Z][a-zA-Z0-9&\-\s]+?(?:Private Limited|Pvt Ltd|LLC|Corp|Limited|Ltd|Inc\.|Co\.|Enterprises|Corporation|Industries|Agency|Associates))/i;
      const match = text.match(companyRegex);
      if (match && match[0]) {
        lead.company_name = match[0].trim();
      } else if (this.isRawBlob(lead.company_name)) {
        lead.company_name = null; // Clear it so we don't save blobs as titles
      }
    }

    // 5. Extract Project Name (Heuristic)
    if (!lead.project_name || lead.project_name.length < 3 || this.isRawBlob(lead.project_name)) {
      const projectRegex = /([A-Z][a-zA-Z0-9&\-\s]+?(?:Project|Plant|Facility|Expansion|Tower|Building|Park|Complex|Hospital|School))/i;
      const match = text.match(projectRegex);
      if (match && match[0]) {
        lead.project_name = match[0].trim();
      } else if (this.isRawBlob(lead.project_name)) {
        lead.project_name = null;
      }
    }

    // 6. Extract State / Geography
    if (!lead.state) {
      const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Gujarat', 'Tamil Nadu', 'Uttar Pradesh', 'Haryana', 'Telangana', 'West Bengal', 'Bihar', 'Rajasthan'];
      for (const state of states) {
        if (text.toLowerCase().includes(state.toLowerCase())) {
          lead.state = state;
          lead.country = lead.country || 'India';
          break;
        }
      }
    }

    // 7. Ensure description is populated if empty
    if (!lead.description && text.length > 50) {
      // Just take the first 500 characters of the raw text as fallback description
      lead.description = text.substring(0, 500).trim() + (text.length > 500 ? '...' : '');
    } else if (this.isRawBlob(lead.description)) {
      // If description is identical to raw blob, it's fine, it's a description.
    }

    // Generate Lead Title
    lead.lead_title = this.generateLeadTitle(lead);

    return lead;
  }

  static generateLeadTitle(lead: any): string {
    if (lead.project_name && lead.project_name.length > 3) {
      return lead.project_name;
    }
    if (lead.company_name && lead.company_name.length > 3) {
      return lead.company_name;
    }
    if (lead.contact_person && lead.contact_person.length > 3) {
      return `Opportunity: ${lead.contact_person}`;
    }
    if (lead.email) {
      return `Opportunity: ${lead.email}`;
    }
    return "Unstructured Lead";
  }

  // Helper to determine if a string is a raw unstructured blob 
  // (e.g. contains an email, phone, and is very long)
  private static isRawBlob(str: string): boolean {
    if (!str) return false;
    if (str.length > 150 && (str.includes('@') || str.match(/\d{10}/))) return true;
    return false;
  }
}
