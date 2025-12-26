/**
 * CATEGORY MASTER COLLECTION
 * 
 * This Firestore collection stores all valid product categories.
 * Benefits:
 * 1. Data Consistency - No typos or variations (e.g., "Asli Talbina" vs "asli talbina")
 * 2. Easy Management - Admin can add/remove categories from dashboard
 * 3. Dropdown Source - Product form uses this for category selection
 * 4. Auto-sync Navbar - Navbar links are generated from this collection
 * 
 * Structure:
 * categories/{categoryId}
 * {
 *   id: string,
 *   name: string,           // Display name (e.g., "Asli Talbina")
 *   slug: string,           // URL-friendly (e.g., "asli-talbina")
 *   order: number,          // Display order in navbar
 *   isActive: boolean,      // Show/hide in navbar
 *   createdAt: timestamp,
 *   updatedAt: timestamp
 * }
 */

// Initial categories to seed the database
export const initialCategories = [
    {
        id: 'asli-talbina',
        name: 'Asli Talbina',
        slug: 'asli-talbina',
        order: 1,
        isActive: true,
    },
    {
        id: 'kings-asli-honey',
        name: "King's Asli Honey",
        slug: 'kings-asli-honey',
        order: 2,
        isActive: true,
    },
];
