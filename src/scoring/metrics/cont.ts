/**
 * CONT — Contactability Score
 * ─────────────────────────────────────────────────────────────────────────────
 * Definition (OIE Spec Section 2.2):
 *   Probability that a valid, responsive human contact can be reached at
 *   the company.
 *
 * Formula (structural):
 *   CONT = linear weighted sum of contact signals
 *   Missing signals are excluded from the denominator (absent ≠ zero).
 *   Generic email (info@) is discounted vs. named individual email.
 *   Recency decay applied to contact_last_verified_date.
 *
 * Range: [0, 1]
 */

import type { FeatureSet } from '../featureExtractor';
import type { MetricResult } from '../types';
import { CONT_WEIGHTS } from '../config/scoring.config';

export function scoreCONT(features: FeatureSet): MetricResult {
  const contributing: string[] = [];
  const missing: string[] = [];

  let weightedSum = 0;
  let presentWeightSum = 0;

  // ── Email ───────────────────────────────────────────────────────────────────
  if (features.f_cont_email_present.present && features.f_cont_email_present.value) {
    const isVerified = features.f_cont_email_verified.present && features.f_cont_email_verified.value;
    const emailType = features.f_cont_email_type.present
      ? features.f_cont_email_type.value
      : 'unknown';
    const isGeneric = emailType === 'generic';

    if (isVerified && !isGeneric) {
      // Verified + named individual email — highest signal
      weightedSum += CONT_WEIGHTS.email_verified_named;
      presentWeightSum += CONT_WEIGHTS.email_verified_named;
      contributing.push('Verified named email contact');
    } else if (isVerified && isGeneric) {
      // Verified but generic — discounted
      weightedSum += CONT_WEIGHTS.email_verified_generic;
      presentWeightSum += CONT_WEIGHTS.email_verified_generic;
      contributing.push('Verified email (generic inbox — discounted)');
    } else {
      // Present but not verified
      weightedSum += CONT_WEIGHTS.email_present_unverified;
      presentWeightSum += CONT_WEIGHTS.email_present_unverified;
      contributing.push('Email present (unverified)');
    }
  } else if (features.f_cont_email_present.present && !features.f_cont_email_present.value) {
    // Email absent — flag present but false (we know there's no email)
    presentWeightSum += CONT_WEIGHTS.email_verified_named;
    missing.push('No email available');
  } else {
    // Flag not provided — truly unknown
    missing.push('email_present_flag (unknown)');
  }

  // ── Phone ───────────────────────────────────────────────────────────────────
  if (features.f_cont_phone_present.present && features.f_cont_phone_present.value) {
    const isVerified = features.f_cont_phone_verified.present && features.f_cont_phone_verified.value;
    if (isVerified) {
      weightedSum += CONT_WEIGHTS.phone_verified;
      presentWeightSum += CONT_WEIGHTS.phone_verified;
      contributing.push('Verified phone number');
    } else {
      weightedSum += CONT_WEIGHTS.phone_present;
      presentWeightSum += CONT_WEIGHTS.phone_present;
      contributing.push('Phone present (unverified)');
    }
  } else if (features.f_cont_phone_present.present && !features.f_cont_phone_present.value) {
    presentWeightSum += CONT_WEIGHTS.phone_verified;
    missing.push('No phone available');
  } else {
    missing.push('phone_present_flag (unknown)');
  }

  // ── Multiple Channels Bonus ──────────────────────────────────────────────────
  if (features.f_cont_email_present.present && features.f_cont_email_present.value &&
      features.f_cont_phone_present.present && features.f_cont_phone_present.value) {
    weightedSum += CONT_WEIGHTS.multiple_channels;
    presentWeightSum += CONT_WEIGHTS.multiple_channels;
    contributing.push('Multiple contact channels available (email + phone)');
  } else if ((features.f_cont_email_present.present && !features.f_cont_email_present.value) || 
             (features.f_cont_phone_present.present && !features.f_cont_phone_present.value)) {
    presentWeightSum += CONT_WEIGHTS.multiple_channels;
  }

  // ── LinkedIn ─────────────────────────────────────────────────────────────────
  if (features.f_cont_linkedin_present.present && features.f_cont_linkedin_present.value) {
    weightedSum += CONT_WEIGHTS.linkedin_present;
    presentWeightSum += CONT_WEIGHTS.linkedin_present;
    contributing.push('LinkedIn profile available');
  } else if (features.f_cont_linkedin_present.present && !features.f_cont_linkedin_present.value) {
    presentWeightSum += CONT_WEIGHTS.linkedin_present;
    missing.push('linkedin_url (missing)');
  } else {
    missing.push('linkedin_url (unknown)');
  }

  // ── Website ──────────────────────────────────────────────────────────────────
  if (features.f_cont_website_present.present && features.f_cont_website_present.value) {
    weightedSum += CONT_WEIGHTS.website_present;
    presentWeightSum += CONT_WEIGHTS.website_present;
    contributing.push('Company website available');
  } else if (features.f_cont_website_present.present && !features.f_cont_website_present.value) {
    presentWeightSum += CONT_WEIGHTS.website_present;
    missing.push('website (missing)');
  } else {
    missing.push('website (unknown)');
  }

  // ── Decision Maker Title ─────────────────────────────────────────────────────
  if (features.f_cont_decision_maker_title.present) {
    const v = features.f_cont_decision_maker_title.value ? CONT_WEIGHTS.decision_maker_title : 0;
    weightedSum += v;
    presentWeightSum += CONT_WEIGHTS.decision_maker_title;
    if (features.f_cont_decision_maker_title.value) {
      contributing.push('Decision-maker title match confirmed');
    } else {
      missing.push('No decision-maker title match');
    }
  } else {
    missing.push('decision_maker_title_match_flag (unknown)');
  }

  // ── Contact Recency ──────────────────────────────────────────────────────────
  // Applied as a multiplier on the existing email/phone score — not a standalone feature
  // We track it separately but don't add to presentWeightSum independently
  const recencyMultiplier = features.f_cont_contact_recency_decay.present
    ? features.f_cont_contact_recency_decay.value
    : 1.0; // no date → assume no decay (can't penalise unknown)

  if (features.f_cont_contact_recency_decay.present) {
    const daysText = features.f_cont_contact_recency_decay.value < 0.8
      ? 'stale contact data (recency penalty applied)'
      : 'contact data is fresh';
    contributing.push(`Contact recency: ${daysText} (decay factor: ${(recencyMultiplier * 100).toFixed(0)}%)`);
  }

  // ── Prior Successful Contact ─────────────────────────────────────────────────
  if (features.f_cont_prior_contact.present && features.f_cont_prior_contact.value) {
    weightedSum += CONT_WEIGHTS.prior_successful_contact;
    presentWeightSum += CONT_WEIGHTS.prior_successful_contact;
    contributing.push('Prior successful contact recorded in CRM');
  } else if (features.f_cont_prior_contact.present && !features.f_cont_prior_contact.value) {
    presentWeightSum += CONT_WEIGHTS.prior_successful_contact;
  } else {
    missing.push('prior_successful_contact_flag (CRM history unavailable)');
  }

  // ── Apply recency multiplier ─────────────────────────────────────────────────
  // Decay is applied to the weighted sum (not the denominator)
  // so it reduces scores on stale records proportionally
  const rawScore = presentWeightSum > 0 ? (weightedSum / presentWeightSum) * recencyMultiplier : 0;
  const score = Math.min(1.0, Math.max(0, rawScore));

  const reason = buildContReason(score, features);

  return {
    score,
    reason,
    contributing_evidence: contributing,
    missing_evidence: missing,
  };
}

function buildContReason(score: number, features: FeatureSet): string {
  if (score >= 0.70) return 'High contactability — verified contact with decision-maker access';
  if (score >= 0.45) return 'Moderate contactability — some contact details available';
  if (score >= 0.20) return 'Low contactability — limited or unverified contact information';
  return 'Very low contactability — minimal contact evidence';
}
