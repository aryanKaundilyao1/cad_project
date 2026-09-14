import { ClientContext, Lead } from '../src/engine/types';

export const testClient: ClientContext = {
  id: 'c1',
  name: 'Global Ayurveda Exports',
  industry: 'Ayurveda',
  targetProducts: ['Ashwagandha', 'Ashwagandha Root Extract', 'KSM-66'],
  targetBuyerTypes: ['Importer', 'Wholesaler', 'OEM', 'Private Label'],
  targetCountries: ['USA', 'UK', 'Germany'],
  requiredCertifications: ['GMP'],
};

export const testLeads: Lead[] = [
  // 3 Google Maps Leads to demonstrate differentiation
  {
    id: 'l1',
    name: 'Lead A (Google Maps - Strong)',
    sources: ['Google Maps'],
    baselineOIEScore: 78,
    metrics: {
      businessCategory: 'Ayurveda Pharmacy & Manufacturer',
      hasWebsite: true,
      hasExportPage: true,
      oemMention: true,
      privateLabelMention: true,
      certificates: ['GMP', 'ISO 9001'],
      productKeywords: ['Ashwagandha', 'KSM-66', 'Brahmi'],
      hasPhone: true,
      hasEmail: true,
      contactCount: 4,
      country: 'USA',
    },
  },
  {
    id: 'l2',
    name: 'Lead B (Google Maps - Weak)',
    sources: ['Google Maps'],
    baselineOIEScore: 78,
    metrics: {
      businessCategory: 'Ayurveda Pharmacy',
      hasWebsite: true,
      hasExportPage: false,
      oemMention: false,
      privateLabelMention: false,
      certificates: [],
      productKeywords: ['Ashwagandha', 'Herbal Supplements'],
      hasPhone: true,
      hasEmail: false,
      contactCount: 1,
      country: 'USA',
    },
  },
  {
    id: 'l3',
    name: 'Lead C (Google Maps - Poor Fit)',
    sources: ['Google Maps'],
    baselineOIEScore: 78,
    metrics: {
      businessCategory: 'Yoga Studio',
      hasWebsite: false,
      hasExportPage: false,
      oemMention: false,
      privateLabelMention: false,
      certificates: [],
      productKeywords: ['Yoga Mats', 'Incense'],
      hasPhone: true,
      hasEmail: false,
      contactCount: 1,
      country: 'USA',
    },
  },

  // 2 Government Source Leads
  {
    id: 'l4',
    name: 'Gov Lead A (FSSAI Registry)',
    sources: ['Government'],
    baselineOIEScore: 65,
    metrics: {
      businessCategory: 'Ayurveda Manufacturer',
      hasWebsite: false,
      hasExportPage: false,
      certificates: ['GMP', 'FDA'],
      hasPhone: false,
      hasEmail: false,
      country: 'USA',
      businessDescription: 'Registered manufacturer of Ashwagandha Root Extract',
    },
  },
  {
    id: 'l5',
    name: 'Gov Lead B (FDA Imports)',
    sources: ['Government'],
    baselineOIEScore: 82,
    metrics: {
      businessCategory: 'Importer',
      hasWebsite: true,
      productKeywords: ['Ashwagandha', 'Turmeric'],
      hasPhone: false,
      hasEmail: false,
      country: 'USA',
      wholesaleMention: true,
    },
  },

  // Trade Database Lead
  {
    id: 'l6',
    name: 'TradeLead Importers LLC',
    sources: ['Trade Data'],
    baselineOIEScore: 85,
    metrics: {
      businessCategory: 'Nutraceuticals Importer',
      hasWebsite: true,
      productKeywords: ['Ashwagandha Extract'],
      hasPhone: true,
      hasEmail: true,
      country: 'UK',
      revenue: 15000000,
    },
  },

  // Marketplace Lead
  {
    id: 'l7',
    name: 'Alibaba Super Supplier',
    sources: ['Marketplace'],
    baselineOIEScore: 70,
    metrics: {
      businessCategory: 'Wholesaler',
      hasWebsite: false,
      productKeywords: ['Ashwagandha Powder', 'KSM-66'],
      hasPhone: true,
      hasEmail: true,
      country: 'Germany',
      certificates: ['GMP'],
      wholesaleMention: true,
    },
  },

  // Apollo Lead
  {
    id: 'l8',
    name: 'NutriLife Inc (Apollo)',
    sources: ['Apollo'],
    baselineOIEScore: 88,
    metrics: {
      businessCategory: 'Health & Wellness',
      hasWebsite: true,
      hasPhone: true,
      hasEmail: true,
      contactCount: 12,
      country: 'USA',
      employeeCount: 250,
      revenue: 45000000,
      businessDescription: 'Leading producer of stress relief supplements containing Ashwagandha.',
    },
  },

  // Website Crawled Lead
  {
    id: 'l9',
    name: 'Herbal Essence (Crawled)',
    sources: ['Website'],
    baselineOIEScore: 60,
    metrics: {
      businessCategory: 'Ayurveda',
      hasWebsite: true,
      hasPhone: true,
      hasEmail: true,
      productKeywords: ['Ashwagandha', 'Triphala'],
      country: 'USA',
      privateLabelMention: true,
    },
  }
];
