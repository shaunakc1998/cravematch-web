export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  distance: string;
  price: string;
  rating: number;
  image: string;
  tags: string[];
}

export const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "Sakura Ramen House",
    cuisine: "Japanese",
    distance: "0.3 mi",
    price: "$$",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
    tags: ["Ramen", "Noodles", "Cozy"],
  },
  {
    id: "2",
    name: "Bella Napoli",
    cuisine: "Italian",
    distance: "0.5 mi",
    price: "$$$",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    tags: ["Pizza", "Pasta", "Wine"],
  },
  {
    id: "3",
    name: "Seoul Kitchen",
    cuisine: "Korean",
    distance: "0.8 mi",
    price: "$$",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80",
    tags: ["BBQ", "Spicy", "Trendy"],
  },
  {
    id: "4",
    name: "The Burger Joint",
    cuisine: "American",
    distance: "0.2 mi",
    price: "$",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
    tags: ["Burgers", "Fries", "Casual"],
  },
  {
    id: "5",
    name: "Taj Mahal Palace",
    cuisine: "Indian",
    distance: "1.2 mi",
    price: "$$",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
    tags: ["Curry", "Naan", "Authentic"],
  },
];
