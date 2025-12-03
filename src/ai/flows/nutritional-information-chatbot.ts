'use server';
/**
 * @fileOverview Implements a chatbot that answers questions about the nutritional benefits and ingredients of Asli Talbina variants.
 *
 * - nutritionalInformationChatbot - A function that handles the chatbot interactions.
 * - NutritionalInformationChatbotInput - The input type for the nutritionalInformationChatbot function.
 * - NutritionalInformationChatbotOutput - The return type for the nutritionalInformationChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NutritionalInformationChatbotInputSchema = z.object({
  variant: z.string().describe('The Asli Talbina variant to query about (e.g., Regular, Chocolate Almond, etc.).'),
  question: z.string().describe('The question about the nutritional information or ingredients of the specified variant.'),
});
export type NutritionalInformationChatbotInput = z.infer<typeof NutritionalInformationChatbotInputSchema>;

const NutritionalInformationChatbotOutputSchema = z.object({
  answer: z.string().describe('The chatbot answer to the question about the specified Asli Talbina variant.'),
});
export type NutritionalInformationChatbotOutput = z.infer<typeof NutritionalInformationChatbotOutputSchema>;

export async function nutritionalInformationChatbot(input: NutritionalInformationChatbotInput): Promise<NutritionalInformationChatbotOutput> {
  return nutritionalInformationChatbotFlow(input);
}

const productDetails = {
  'Talbina Regular': {
    benefits: 'Super Breakfast - Immunity Booster - Omega 3-6 Fatty Acids - Balanced Diet - Mental Fitness - Activeness in Body - Calcium to Bone & Lower Back',
    description: 'Introducing harmonious blend that redefines nourishment. Embark on a flavor journey that combines the earthy richness of roasted barley with the natural sweetness of succulent dry dates. This unique medley not only fuels your body but also delights your palate. With each scoop, you\'re embracing the wholesome goodness of protein while savoring the authentic taste of nature\'s treasures. Powder offers a revitalizing experience like no other Elevate your nutrition game with this exceptional fusion and embrace the power of real ingredients. Unveil the perfect balance of taste and wellness in every sip.',
  },
  'Talbina Safed Musli': {
    benefits: 'Increase Stamina - Overcome Weakness - Balances Blood Glucose - Provide Vigor and Vitality - Improves Digestion - Stress Buster - Source of Calcium - Ligament to Bones',
    description: 'Immerse yourself in a symphony of flavors, as the robust warmth of roasted barley intertwines with the natural sweetness of dry dates, harmonizing with the gentle strength of safed musli powder. This extraordinary fusion isn\'t just a protein supplement; it\'s a culinary journey that transforms every sip into an indulgent experience. Crafted to invigorate your senses and support your body\'s wellness. Whether you\'re energizing your mornings or rejuvenating post-workout, elevate your nutrition with the richness of authentic tastes and real benefits.',
  },
  'Talbina Chocolate Almond': {
    benefits: 'Boost Brain Function - Control Blood Pressure - Healthy Growth - Good Appetizer - Height Growth - Memory Enhancer - Mood Freshener - Rich Antioxidant',
    description: 'Experience the irresistible blend of Asli Talbina\'s Choco Almond. This enticing blend invites you to indulge in the richness of roasted barley, the natural sweetness of dry dates, and the delectable fusion of chocolate with almonds. Treat yourself to a truly delightful and nourishing experience with every sip. Elevate your fitness journey and savor the captivating product. Chocolate contains essential minerals which play a crucial role in bone development and maintaining proper muscle function',
  },
  'Talbina Mango': {
    benefits: 'Promotes Eye Health - Improves Skin Health - Rich in Nutrients - Reduce Inflammations - Healthy Heart - Protein Source - Aids Weight Loss - Removes Constipation',
    description: 'Immerse yourself in a symphony of taste, as the deep richness of roasted barley intertwines with the natural sweetness of dry dates, enhanced by the vibrant essence of mango powder. This innovative blend is a culinary experience that turns each sip into a moment of pure delight. Created to invigorate your senses and provide essential nutrition, our blend captures the essence of these extraordinary ingredients. Embrace a fusion that encapsulates taste and wellness in every sip. Welcome a new era of nourishment, where vibrant taste meets unparalleled nutrition.',
  },
  'Talbina Pista Elichi': {
    benefits: 'Promotes Healthy Guts - Lower Blood Sugar - High in Antioxidant - Loaded Nutrients - Improves Hemoglobin - Better Hair Growth - Omega 3-6 Fatty Acids - Cures Acidity',
    description: 'Elevate your nutrition journey with this unique blend that combines the richness of roasted barley, Dry dates, pistachios, and the aromatic allure of cardamom. Each serving is a harmonious symphony of taste and wellness, meticulously crafted to invigorate your senses and fuel your body. Packed with high-quality protein, this blend not only satisfies your taste buds but also nourishes your muscles. Experience the vibrant combination while giving your body what deserves. Unveil a new dimension of taste and nutrition today.',
  },
  'Talbina Apple Cherry': {
    benefits: 'Fight Body Toxic - Tissue Developments - Boost Metabolism - Strengthen Bone Structure - Rich in Vitamins - Fight Free Radicals - Activeness in Body - Improves Sleep',
    description: 'Immerse yourself in the symphony of tastes as the robust essence of roasted barley entwines with the natural sweetness of dry dates, harmonizing with the refreshing notes of dry apple and the tangy allure of dry cherry powder. This exquisite blend isn\'t just a protein powerhouse, it\'s a culinary adventure that transforms each sip into a moment of pure indulgence. Crafted to invigorate your senses and support your body\'s needs, our Asli Talbina powder encapsulates the essence of these exceptional ingredients. Elevate your nutrition with the richness of real flavors and real benefits.',
  },
  'Talbina Strawberry': {
    benefits: 'Promotes Eye Health - Improves Skin Health - Rich in Nutrients - Reduce Inflammations - Healthy Heart - Protein Source - Aids Weight Loss - Removes Constipation',
    description: 'Embark on the voyage of flavor with a refreshing blend of Asli Talbina Strawberry. Combining roasted barley, dry dates, and luscious strawberries which are spray-dried, this harmonious fusion offers a revitalizing treat for your taste buds. Nourish your body with this natural goodness, crafted to provide a burst of freshness in every sip. Embrace the delightful flavors, awaken your senses, and enhance your well-being with each serving.',
  },
  'Talbina Dry Fruits': {
    benefits: 'Strengthen Metabolism - 3X Activeness in Body - Nourishing Skin Texture - Improves Brain Health - Improves Bone Density - Muscles Development - Form Red Blood Cells - Rids off Insomnia',
    description: 'Asli Talbina dry fruits is carefully crafted using a perfect combination of handpicked ingredients, with a harmonious blend of roasted barley, dry dates, almonds, pistachios, cashews, and saffron that not only enhance your fitness goals but also delight your taste buds. We prioritize purity and integrity ensuring you receive nothing but the best nature has to offer. We believe in the power of wholesome nutrition to support your active lifestyle',
  },
};

const nutritionalInformationChatbotPrompt = ai.definePrompt({
  name: 'nutritionalInformationChatbotPrompt',
  input: {schema: NutritionalInformationChatbotInputSchema},
  output: {schema: NutritionalInformationChatbotOutputSchema},
  prompt: `You are a chatbot designed to answer questions about Asli Talbina products. Use the following information to answer the user's question about the {{variant}} variant.\n\nDescription: {{{productDetails.[variant].description}}}\nBenefits: {{{productDetails.[variant].benefits}}}\n\nQuestion: {{{question}}}\n\nAnswer:`, // Accessing nested fields directly
});

const nutritionalInformationChatbotFlow = ai.defineFlow(
  {
    name: 'nutritionalInformationChatbotFlow',
    inputSchema: NutritionalInformationChatbotInputSchema,
    outputSchema: NutritionalInformationChatbotOutputSchema,
  },
  async input => {
    // const {
    //   output,
    // } = await nutritionalInformationChatbotPrompt(input);
    // return output!;
    const {
      variant,
      question,
    } = input;

    if (!productDetails[variant]) {
      return {
        answer: `Sorry, I don't have information about the ${variant} variant.`,
      };
    }

    const {
      output,
    } = await nutritionalInformationChatbotPrompt({
      variant: variant,
      question: question,
      productDetails: productDetails,
    });
    return output!;
  }
);
