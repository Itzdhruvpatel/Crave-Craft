// Free-licence dish photos from Wikimedia Commons. Credit is shown on the recipe page.
export interface Photo {
  uri: string;
  author: string;
  license: string;
  page: string;
}

export const PHOTOS: Record<string, Photo> = {
  rotli: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Chapati_1.jpg/960px-Chapati_1.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Gaurav Dhwaj Khadka',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Chapati_1.jpg',
  },
  bhakri: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Bhakri_1.jpg/960px-Bhakri_1.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Hemal0105',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Bhakri_1.jpg',
  },
  methi_thepla: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/Mung_Dal_-_Bhindi_with_Methi_Thepla.jpg/960px-Mung_Dal_-_Bhindi_with_Methi_Thepla.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Anupama1002',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Mung_Dal_-_Bhindi_with_Methi_Thepla.jpg',
  },
  puri: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f4/Deep_frying_Puri_in_Kolkata%2C_India.jpg/960px-Deep_frying_Puri_in_Kolkata%2C_India.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Ravi Dwivedi',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Deep_frying_Puri_in_Kolkata,_India.jpg',
  },
  gujarati_dal: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/Gujarati_daal.jpg/960px-Gujarati_daal.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Dhaval S. Vyas',
    license: 'Public domain',
    page: 'https://commons.wikimedia.org/wiki/File:Gujarati_daal.jpg',
  },
  gujarati_kadhi: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/Gujarati_Kadhi_2026.jpg/960px-Gujarati_Kadhi_2026.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Shruti.shah',
    license: 'CC BY-SA 3.0',
    page: 'https://commons.wikimedia.org/wiki/File:Gujarati_Kadhi_2026.jpg',
  },
  dal_dhokli: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Gujarati_Daal-Dhokli.jpg/960px-Gujarati_Daal-Dhokli.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Kureshizeck',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Gujarati_Daal-Dhokli.jpg',
  },
  khichdi: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/%E0%A6%96%E0%A6%BF%E0%A6%9A%E0%A7%81%E0%A6%A1%E0%A6%BC%E0%A6%BF_%28Khichuri%29-MA18.jpg/960px-%E0%A6%96%E0%A6%BF%E0%A6%9A%E0%A7%81%E0%A6%A1%E0%A6%BC%E0%A6%BF_%28Khichuri%29-MA18.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Rajeeb Dutta',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:%E0%A6%96%E0%A6%BF%E0%A6%9A%E0%A7%81%E0%A6%A1%E0%A6%BC%E0%A6%BF_(Khichuri)-MA18.jpg',
  },
  vaghareli_khichdi: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Masala_Khichadi.jpg/960px-Masala_Khichadi.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Dkgohil',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Masala_Khichadi.jpg',
  },
  handvo: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Handavo3.jpg/960px-Handavo3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Dkgohil',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Handavo3.jpg',
  },
  bhinda_nu_shaak: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/A_thali_with_daal_roti_bhindi_ki_sabzi_and_mango_pickle.jpg/960px-A_thali_with_daal_roti_bhindi_ki_sabzi_and_mango_pickle.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Devika',
    license: 'CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:A_thali_with_daal_roti_bhindi_ki_sabzi_and_mango_pickle.jpg',
  },
  dudhi_chana: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f2/Lauki_Chana_Dal_Recipe_From_North_Indian_Cuisine_By_Sonia_Goyal.jpg/960px-Lauki_Chana_Dal_Recipe_From_North_Indian_Cuisine_By_Sonia_Goyal.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Sonia Goyal Jaipur',
    license: 'CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Lauki_Chana_Dal_Recipe_From_North_Indian_Cuisine_By_Sonia_Goyal.jpg',
  },
  turiya_nu_shaak: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Traditional_Ridge_Gourd_with_Kabuli_Chickpeas_curry.jpg/960px-Traditional_Ridge_Gourd_with_Kabuli_Chickpeas_curry.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Raseswari',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Traditional_Ridge_Gourd_with_Kabuli_Chickpeas_curry.jpg',
  },
  sev_tameta: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Sev_Tameta_Nu_Shaak.jpg/960px-Sev_Tameta_Nu_Shaak.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'UserWiki',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Sev_Tameta_Nu_Shaak.jpg',
  },
  ringan_no_olo: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Baingan_Ka_Bharta.JPG/960px-Baingan_Ka_Bharta.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Zeel Patel',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Baingan_Ka_Bharta.JPG',
  },
  undhiyu: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Undhiyu.jpg/960px-Undhiyu.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Jatan1992',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Undhiyu.jpg',
  },
  bharela_ringan: {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Bharwa-baingan-recipe.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
    author: 'Foodieseats',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Bharwa-baingan-recipe.jpg',
  },
  flower_bateta: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c8/Aloo_gobi.jpg/960px-Aloo_gobi.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: '',
    license: 'CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Aloo_gobi.jpg',
  },
  khaman: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/SPECIAL_SURATI_KHAMAN.jpg/960px-SPECIAL_SURATI_KHAMAN.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Devmanoj',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:SPECIAL_SURATI_KHAMAN.jpg',
  },
  khandvi: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Khandvi_%28gujarati_snack%29.jpg/960px-Khandvi_%28gujarati_snack%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Kanikatwl',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Khandvi_(gujarati_snack).jpg',
  },
  methi_muthiya: {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Methi_Muthiya_%28_fried_%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
    author: 'Sushant savla',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Methi_Muthiya_(_fried_).jpg',
  },
  batata_poha: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Poha_4.jpg/960px-Poha_4.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Gannu03',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Poha_4.jpg',
  },
  sev_usal: {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sev_Usal.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
    author: 'Pankaj210891',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Sev_Usal.jpg',
  },
  plain_rice: {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Steamed_rice_in_bowl_01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
    author: 'Anna Frodesiak',
    license: 'CC0',
    page: 'https://commons.wikimedia.org/wiki/File:Steamed_rice_in_bowl_01.jpg',
  },
  jeera_rice: {
    uri: "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c6/Jeera_Rice_%28only%29.jpg/960px-Jeera_Rice_%28only%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
    author: "JVRKPRASAD",
    license: "CC BY-SA 4.0",
    page: "https://commons.wikimedia.org/wiki/File:Jeera_Rice_(only).jpg",
  },
  kachumber: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Kachumber_Salad.JPG/960px-Kachumber_Salad.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Miansari66',
    license: 'CC0',
    page: 'https://commons.wikimedia.org/wiki/File:Kachumber_Salad.JPG',
  },
  cucumber_raita: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Cucumber-raita.jpg/960px-Cucumber-raita.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Sonia Goyal',
    license: 'CC BY-SA 2.0',
    page: 'https://commons.wikimedia.org/wiki/File:Cucumber-raita.jpg',
  },
  papad_roasted: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/36/Stack_of_papadums.jpg/960px-Stack_of_papadums.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Windell H. Oskay',
    license: 'CC BY 2.5',
    page: 'https://commons.wikimedia.org/wiki/File:Stack_of_papadums.jpg',
  },
  shiro: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Sooji_Halwa_%28Semolina_Pudding%29.JPG/960px-Sooji_Halwa_%28Semolina_Pudding%29.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Mdsmds0',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Sooji_Halwa_(Semolina_Pudding).JPG',
  },
  shrikhand: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/Shrikhand.JPG/960px-Shrikhand.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Miansari66',
    license: 'CC0',
    page: 'https://commons.wikimedia.org/wiki/File:Shrikhand.JPG',
  },
  sukhdi: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Sukhadi.JPG/960px-Sukhadi.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Zeel Patel',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Sukhadi.JPG',
  },
  kansar: {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Kansar-Lapsi.png?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled',
    author: "Dr. Ranna Pandya, Ishita Pandya & Queen's Kitchen",
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Kansar-Lapsi.png',
  },
  sabudana_khichdi: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/Sabudana_Khichdi_%E2%80%93_Traditional_Indian_Tapioca_Pearl_Dish.jpg/960px-Sabudana_Khichdi_%E2%80%93_Traditional_Indian_Tapioca_Pearl_Dish.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Manvi.kesharii',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Sabudana_Khichdi_%E2%80%93_Traditional_Indian_Tapioca_Pearl_Dish.jpg',
  },
  farali_bateta: {
    uri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Aalu_Jeera.jpg/960px-Aalu_Jeera.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
    author: 'Gaurav Dhwaj Khadka',
    license: 'CC BY-SA 4.0',
    page: 'https://commons.wikimedia.org/wiki/File:Aalu_Jeera.jpg',
  },
};
