import type { Names } from '../lib/types.ts';

export interface Collection {
  id: string;
  name: Names;
  dishIds: string[];
}

/** Festival and occasion menus. Dishes a family's diet doesn't allow are filtered out on screen. */
export const FESTIVALS: Collection[] = [
  { id: 'diwali', name: { en: 'Diwali', hi: 'दिवाली', gu: 'દિવાળી' }, dishIds: ['mohanthal', 'besan_ladoo', 'gulab_jamun', 'samosa', 'khandvi', 'patra', 'lilva_kachori', 'basundi', 'puri'] },
  { id: 'uttarayan', name: { en: 'Uttarayan', hi: 'उत्तरायण', gu: 'ઉત્તરાયણ' }, dishIds: ['undhiyu', 'puri', 'sukhdi', 'methi_muthiya', 'lilva_kachori', 'shrikhand', 'kachumber', 'chaas'] },
  { id: 'navratri', name: { en: 'Navratri fast', hi: 'नवरात्रि व्रत', gu: 'નવરાત્રી ઉપવાસ' }, dishIds: ['sabudana_khichdi', 'sabudana_vada', 'farali_pattice', 'rajgira_puri', 'samo_khichdi', 'farali_bateta', 'sheera_rajgira', 'makhana_kheer', 'farali_chevdo', 'upvas_thalipeeth'] },
  { id: 'ganesh', name: { en: 'Ganesh Chaturthi', hi: 'गणेश चतुर्थी', gu: 'ગણેશ ચતુર્થી' }, dishIds: ['ukadiche_modak', 'puran_poli', 'amti', 'kothimbir_vadi', 'besan_ladoo', 'varan', 'plain_rice'] },
  { id: 'holi', name: { en: 'Holi', hi: 'होली', gu: 'હોળી' }, dishIds: ['puran_poli', 'dahi_puri', 'pani_puri', 'bhel_puri', 'lassi', 'gulab_jamun', 'samosa'] },
  { id: 'janmashtami', name: { en: 'Janmashtami', hi: 'जन्माष्टमी', gu: 'જન્માષ્ટમી' }, dishIds: ['makhana_kheer', 'shrikhand', 'sabudana_khichdi', 'farali_bateta', 'rajgira_puri', 'sheera_rajgira'] },
  { id: 'durga_puja', name: { en: 'Durga Puja', hi: 'दुर्गा पूजा', gu: 'દુર્ગા પૂજા' }, dishIds: ['luchi', 'cholar_dal', 'aloo_posto', 'shukto', 'begun_bhaja', 'mishti_doi'] },
  { id: 'pongal', name: { en: 'Pongal', hi: 'पोंगल', gu: 'પોંગલ' }, dishIds: ['ven_pongal', 'sambar', 'coconut_chutney', 'medu_vada', 'semiya_payasam', 'kesari_bath'] },
  { id: 'guests', name: { en: 'Guests are coming', hi: 'मेहमान आ रहे हैं', gu: 'મહેમાન આવે છે' }, dishIds: ['paneer_butter_masala', 'dal_makhani', 'veg_pulao', 'bhature', 'chole', 'gulab_jamun', 'boondi_raita', 'masala_papad'] },
];

/** What to make with yesterday's leftovers. */
export const LEFTOVERS: Collection[] = [
  { id: 'rotli', name: { en: 'Leftover rotli', hi: 'बची रोटी', gu: 'વધેલી રોટલી' }, dishIds: ['vaghareli_rotli', 'veg_frankie'] },
  { id: 'rice', name: { en: 'Leftover rice', hi: 'बचे चावल', gu: 'વધેલો ભાત' }, dishIds: ['lemon_rice', 'veg_fried_rice', 'curd_rice', 'tomato_rice', 'puliyogare'] },
  { id: 'bread', name: { en: 'Leftover bread', hi: 'बची ब्रेड', gu: 'વધેલી બ્રેડ' }, dishIds: ['bread_upma', 'bombay_sandwich', 'veg_grilled_sandwich'] },
  { id: 'dal', name: { en: 'Leftover dal', hi: 'बची दाल', gu: 'વધેલી દાળ' }, dishIds: ['dal_dhokli', 'missi_roti'] },
  { id: 'khichdi', name: { en: 'Leftover khichdi', hi: 'बची खिचड़ी', gu: 'વધેલી ખીચડી' }, dishIds: ['thalipeeth', 'handvo'] },
];
