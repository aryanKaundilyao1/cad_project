import fs from 'fs';

let content = fs.readFileSync('src/pages/opportunities/OpportunitiesPage.tsx', 'utf-8');

// 1. Add table header
const thTarget = `<th className="px-4 py-4">Industry / Country</th>`;
const thReplacement = `<th className="px-4 py-4">Contact Details</th>\n                  <th className="px-4 py-4">Industry / Country</th>`;
content = content.replace(thTarget, thReplacement);

// 2. Add table cell extraction logic & ui
const tdTarget = `<td className="px-4 py-4 text-muted-foreground text-xs">
                          <div className="truncate max-w-[120px]">{l.industry || '-'}</div>
                          <div className="truncate max-w-[120px] mt-0.5">{l.country || '-'}</div>
                        </td>`;
const tdReplacement = `                        <td className="px-4 py-4 text-muted-foreground text-xs">
                          {(() => {
                            const meta = l.metadata || {};
                            const extractString = (val: any) => {
                              if (!val) return '';
                              if (Array.isArray(val)) return val.length > 0 ? String(val[0]) : '';
                              return String(val);
                            };
                            const phone = l.phone || extractString(meta.phone || meta.phones || meta.mobile || meta.contact_number || meta.telephone || meta['Phone Number'] || meta['phone number'] || meta.phoneNumber || meta.phone_number);
                            const email = l.email || extractString(meta.email || meta.emails || meta.email_address || meta.contact_email);
                            return (
                              <div className="space-y-1">
                                {phone ? <div className="truncate max-w-[150px] text-primary flex items-center gap-1"><span className="w-3 h-3 block opacity-50">📞</span> {phone}</div> : <div className="text-white/20 italic">No Phone</div>}
                                {email ? <div className="truncate max-w-[150px] text-blue-400 flex items-center gap-1"><span className="w-3 h-3 block opacity-50">✉️</span> {email}</div> : null}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground text-xs">
                          <div className="truncate max-w-[120px]">{l.industry || '-'}</div>
                          <div className="truncate max-w-[120px] mt-0.5">{l.country || '-'}</div>
                        </td>`;
content = content.replace(tdTarget, tdReplacement);

// 3. Update colSpan in empty states
content = content.replace(/colSpan=\{9\}/g, 'colSpan={10}');

fs.writeFileSync('src/pages/opportunities/OpportunitiesPage.tsx', content);
console.log("Updated OpportunitiesPage.tsx to include Contact Details.");
