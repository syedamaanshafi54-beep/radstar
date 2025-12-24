export type Review = {
    id?: string;
    productId: string;
    userId: string;
    userName: string;
    rating: number; // 1-5
    comment: string;
    createdAt: any; // Firestore Timestamp
};
