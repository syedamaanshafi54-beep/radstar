
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = {
  title: "Frequently Asked Questions - Asli Talbina",
  description: "Find answers to common questions about Asli Talbina, its preparation, benefits, and more.",
};

const faqs = [
  {
    question: "What is Talbina?",
    answer: "Talbina is a traditional and wholesome dish made from barley flour, milk, and water, often sweetened with honey. It is celebrated for its nutritional benefits and soothing properties."
  },
  {
    question: "How do I prepare Asli Talbina?",
    answer: "It's simple! Add 2-4 tablespoons of Talbina to a pan, mix with milk or water, heat on low flame for 5-7 minutes while stirring, and sweeten if desired. You can enjoy it as a warm drink or a soft porridge."
  },
  {
    question: "Who can consume Asli Talbina?",
    answer: "Asli Talbina is ideal for all age groups, from children and students to working professionals and elderly individuals. It's a versatile food supplement for the whole family."
  },
  {
    question: "What are the key health benefits?",
    answer: "Key benefits include improving mental clarity, aiding digestion, boosting energy, supporting heart health, helping regulate blood sugar, and strengthening immunity with natural ingredients."
  },
  {
    question: "Is Asli Talbina certified and lab-tested?",
    answer: "Yes, every batch of Asli Talbina is lab-tested for safety and nutritional value. It is licensed by the Central Government Licensing Authority and produced under the supervision of qualified nutrition experts."
  },
  {
    question: "Are there any artificial preservatives or chemicals?",
    answer: "No. We have kept the original Talbina recipe free from chemicals and preservatives. The product's shelf life is maintained naturally."
  },
  {
    question: "How many flavors are available?",
    answer: "Asli Talbina is available in eight delicious variants: Regular, Safed Musli, Chocolate Almond, Mango, Pista Elichi, Apple Cherry, Strawberry, and Dry Fruits."
  },
  {
    question: "Where can I buy Asli Talbina?",
    answer: "You can purchase our products from over 150 outlets across Hyderabad & Secunderabad, through our official sales partners, via direct orders on WhatsApp and Instagram, and soon on major e-commerce platforms. For direct inquiries, call +91 90325 61974."
  },
  {
    question: "What are your store policies?",
    answer: 'You can find detailed information about our Return, Refund, Shipping, and Privacy Policies on our policies page. <a href="/policies.html" target="_blank" rel="noopener noreferrer" class="text-primary underline">Click here to view our store policies.</a>',
  }
];

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-16 lg:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg font-medium text-muted-foreground">
          Have questions? We've got answers.
        </p>
      </div>
      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
              <AccordionTrigger className="text-left text-lg hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-lg font-medium text-muted-foreground">
                <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
