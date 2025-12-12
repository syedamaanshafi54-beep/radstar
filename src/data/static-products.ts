
import type { Product } from '@/lib/types';

export const staticProducts: Product[] = [
  {
    id: "1",
    slug: 'talbina-regular',
    name: 'Talbina Regular',
    tagline: 'The Original Super Breakfast',
    description: "Experience the timeless nourishment of Talbina Regular. Made from wholesome roasted barley, this traditional superfood is designed to soothe, strengthen, and revitalize. A perfect, healthy start to your day.",
    benefits: [
      'Soothes the heart and relieves sadness',
      'Boosts immunity and overall wellness',
      'Rich in Omega 3 & 6 fatty acids',
      'Supports mental fitness and clarity',
      'Strengthens bones with natural calcium'
    ],
    defaultPrice: 190,
    image: {
      id: 'product-regular',
      url: '/images/aslitalbina/TR.jpg',
      hint: 'product package',
    },
    category: 'Asli Talbina',
    ingredients: ['Roasted Barley', 'Dry Dates'],
    nutritionFacts: 'Serving Size: 30g, Calories: 110, Protein: 4g, Fiber: 5g'
  },
  {
    id: "2",
    slug: 'talbina-safed-musli',
    name: 'Talbina Safed Musli',
    tagline: 'The Blend of Vigor & Vitality',
    description: "Infused with the power of Safed Musli, this Talbina variant is your go-to for enhanced stamina and vitality. It's an invigorating blend that helps you overcome weakness and supports digestive health.",
    benefits: [
      'Increases stamina and provides vitality',
      'Helps overcome physical weakness',
      'Balances blood glucose levels',
      'Improves digestion and gut health',
      'Natural source of calcium for ligaments'
    ],
    defaultPrice: 449,
    image: {
      id: 'product-safed-musli',
      url: '/images/aslitalbina/TSM2.jpg',
      hint: 'product package safed musli'
    },
    category: 'Asli Talbina',
    ingredients: ['Roasted Barley', 'Dry Dates', 'Safed Musli Powder'],
    nutritionFacts: 'Serving Size: 30g, Calories: 115, Protein: 4.5g, Fiber: 5g'
  },
  {
    id: "3",
    slug: 'talbina-chocolate-almond',
    name: 'Talbina Chocolate Almond',
    tagline: 'The Brain-Boosting Indulgence',
    description: "A delicious fusion of rich chocolate, crunchy almonds, and nourishing barley. This variant is a mood-freshener that boosts brain function and supports healthy growth, making it a favorite for all ages.",
    benefits: [
      'Boosts brain function and enhances memory',
      'Helps control blood pressure',
      'Acts as a great appetizer for healthy growth',
      'Refreshes mood with rich chocolate flavor',
      'Rich in antioxidants and essential minerals'
    ],
    defaultPrice: 499,
    image: {
      id: 'product-chocolate-almond',
      url: '/images/aslitalbina/TCA2.jpg',
      hint: 'chocolate almond'
    },
    category: 'Asli Talbina',
    ingredients: ['Roasted Barley', 'Dry Dates', 'Chocolate', 'Almonds'],
    nutritionFacts: 'Serving Size: 30g, Calories: 130, Protein: 5g, Fat: 3g'
  },
  {
    id: "4",
    slug: 'talbina-mango',
    name: 'Talbina Mango',
    tagline: 'The Tropical Twist of Health',
    description: "Enjoy the vibrant, tropical flavor of mango combined with the wholesome goodness of Talbina. This refreshing blend promotes eye and skin health, aids in weight loss, and supports a healthy heart.",
    benefits: [
      'Promotes eye and skin health',
      'Rich in essential nutrients and vitamins',
      'Reduces inflammation in the body',
      'Supports a healthy heart',
      'Aids in weight loss and removes constipation'
    ],
    defaultPrice: 449,
    image: {
      id: 'product-mango',
      url: '/images/aslitalbina/TM (2).jpg',
      hint: 'mango product'
    },
    category: 'Asli Talbina',
    ingredients: ['Roasted Barley', 'Dry Dates', 'Mango Powder'],
    nutritionFacts: 'Serving Size: 30g, Calories: 120, Protein: 4g, Vitamin C: 15%'
  },
  {
    id: "5",
    slug: 'talbina-pista-elichi',
    name: 'Talbina Pista Elichi',
    tagline: 'The Aromatic Wellness Blend',
    description: "A fragrant and flavorful combination of pistachio, cardamom (elichi), and classic Talbina. This unique blend promotes healthy gut flora, helps lower blood sugar, and improves hemoglobin levels.",
    benefits: [
      'Promotes a healthy gut microbiome',
      'Helps lower blood sugar levels',
      'High in antioxidants from pistachios',
      'Improves hemoglobin and hair growth',
      'Cures acidity and soothes the stomach'
    ],
    defaultPrice: 499,
    image: {
      id: 'product-pista-elichi',
      url: '/images/aslitalbina/TPE (2).jpg',
      hint: 'pistachio cardamom'
    },
    category: 'Asli Talbina',
    ingredients: ['Roasted Barley', 'Dry Dates', 'Pistachios', 'Cardamom'],
    nutritionFacts: 'Serving Size: 30g, Calories: 125, Protein: 5g, Fat: 2.5g'
  },
  {
    id: "6",
    slug: 'talbina-apple-cherry',
    name: 'Talbina Apple Cherry',
    tagline: 'The Detoxifying Duo',
    description: "A delightful mix of crisp apple and tart cherry powders in a nourishing Talbina base. This variant is designed to fight body toxins, boost metabolism, and strengthen bone structure.",
    benefits: [
      'Helps fight body toxins and free radicals',
      'Boosts metabolism and tissue development',
      'Strengthens bone structure',
      'Rich in essential vitamins',
      'Improves sleep quality'
    ],
    defaultPrice: 449,
    image: {
      id: 'product-apple-cherry',
      url: '/images/aslitalbina/TAC.jpg',
      hint: 'apple cherry'
    },
    category: 'Asli Talbina',
    ingredients: ['Roasted Barley', 'Dry Dates', 'Dry Apple Powder', 'Dry Cherry Powder'],
    nutritionFacts: 'Serving Size: 30g, Calories: 120, Protein: 4g, Fiber: 6g'
  },
  {
    id: "7",
    slug: 'talbina-strawberry',
    name: 'Talbina Strawberry',
    tagline: 'The Berry-Fresh Boost',
    description: "A refreshing blend of luscious strawberries and wholesome Talbina. Perfect for promoting skin health and aiding in weight loss, this variant is a delicious way to get your daily nutrients.",
    benefits: [
      'Promotes eye and skin health',
      'Rich in nutrients and reduces inflammation',
      'Supports a healthy heart',
      'Aids in weight loss and digestion',
      'Excellent source of protein'
    ],
    defaultPrice: 449,
    image: {
      id: 'product-strawberry',
      url: '/images/aslitalbina/TS2.jpg',
      hint: 'strawberry product'
    },
    category: 'Asli Talbina',
    ingredients: ['Roasted Barley', 'Dry Dates', 'Spray-dried Strawberry Powder'],
    nutritionFacts: 'Serving Size: 30g, Calories: 120, Protein: 4g, Vitamin C: 20%'
  },
  {
    id: "8",
    slug: 'talbina-dry-fruits',
    name: 'Talbina Dry Fruits',
    tagline: 'The Ultimate Power Pack',
    description: "A premium blend packed with almonds, pistachios, cashews, and saffron. This variant is crafted to strengthen metabolism, improve brain and bone health, and provide a 3X boost in activeness.",
    benefits: [
      'Strengthens metabolism for 3X activeness',
      'Improves brain health and bone density',
      'Nourishes skin texture from within',
      'Aids in muscle development and red blood cell formation',
      'Helps relieve insomnia'
    ],
    defaultPrice: 599,
    salePrice: 549,
    image: {
      id: 'product-dry-fruits',
      url: '/images/aslitalbina/TDR.jpg',
      hint: 'dry fruits'
    },
    category: 'Asli Talbina',
    ingredients: ['Roasted Barley', 'Dry Dates', 'Almonds', 'Pistachios', 'Cashews', 'Saffron'],
    nutritionFacts: 'Serving Size: 30g, Calories: 140, Protein: 6g, Fat: 4g'
  },
   {
    id: "11",
    slug: 'talbina-toast',
    name: 'Talbina Toast',
    tagline: 'The Crispy, Healthy Snack',
    description: "The perfect guilt-free snack, our Talbina Toast is crispy, light, and packed with the goodness of barley. Enjoy it on its own or with your favorite toppings for a nutritious and satisfying crunch anytime.",
    benefits: [
      "A healthy, crunchy snack option",
      "Low in fat and cholesterol-free",
      "Good source of dietary fiber",
      "Pairs well with both sweet and savory toppings",
      "Great for a quick energy boost"
    ],
    defaultPrice: 249,
    category: 'Toast',
    image: {
        id: 'product-toast',
        url: '/images/aslitalbina/TT.jpg',
        hint: "toast snack"
    },
    ingredients: ["Roasted Barley Flour", "Whole Wheat Flour", "Yeast", "Salt"],
  },
  {
    id: "9-1kg",
    slug: 'kings-asli-honey-1kg',
    name: "King's Asli Honey (1kg)",
    tagline: 'The Royal Standard of Purity',
    description: "Sourced from the wildest corners of nature, our King's Asli Honey is raw, unprocessed, and unfiltered. It's a true natural treasure, containing all the beneficial enzymes and nutrients straight from the hive.",
    benefits: [
        "Natural energy booster",
        "Potent antibacterial and antifungal properties",
        "Soothes sore throats and coughs",
        "Rich in antioxidants",
        "Aids in digestion"
    ],
    defaultPrice: 799,
    category: "King's Asli Honey",
    image: {
        id: 'product-honey-1kg',
        url: "/images/aslitalbina/asli honey/WhatsApp Image 2025-07-13 at 10.05.44 PM.jpeg",
        hint: "honey jar"
    },
    ingredients: ["100% Raw Wild Honey"],
  },
  {
    id: "9-500g",
    slug: 'kings-asli-honey-500g',
    name: "King's Asli Honey (500g)",
    tagline: 'The Royal Standard of Purity',
    description: "Sourced from the wildest corners of nature, our King's Asli Honey is raw, unprocessed, and unfiltered. It's a true natural treasure, containing all the beneficial enzymes and nutrients straight from the hive.",
    benefits: [
        "Natural energy booster",
        "Potent antibacterial and antifungal properties",
        "Soothes sore throats and coughs",
        "Rich in antioxidants",
        "Aids in digestion"
    ],
    defaultPrice: 449,
    category: "King's Asli Honey",
    image: {
        id: 'product-honey-500g',
        url: "/images/aslitalbina/asli honey/WhatsApp Image 2025-07-13 at 10.05.44 PM.jpeg",
        hint: "honey jar"
    },
    ingredients: ["100% Raw Wild Honey"],
  },
    {
    id: "9-200g",
    slug: 'kings-asli-honey-200g',
    name: "King's Asli Honey (200g)",
    tagline: 'The Royal Standard of Purity',
    description: "Sourced from the wildest corners of nature, our King's Asli Honey is raw, unprocessed, and unfiltered. It's a true natural treasure, containing all the beneficial enzymes and nutrients straight from the hive.",
    benefits: [
        "Natural energy booster",
        "Potent antibacterial and antifungal properties",
        "Soothes sore throats and coughs",
        "Rich in antioxidants",
        "Aids in digestion"
    ],
    defaultPrice: 229,
    category: "King's Asli Honey",
    image: {
        id: 'product-honey-200g',
        url: "/images/aslitalbina/asli honey/WhatsApp Image 2025-07-13 at 10.05.44 PM.jpeg",
        hint: "honey jar"
    },
    ingredients: ["100% Raw Wild Honey"],
  }
];
