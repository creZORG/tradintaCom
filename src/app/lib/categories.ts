export type Category = {
    id: string;
    name: string;
    subcategories: string[];
    icon?: React.ReactNode;
    imageId: string;
}

export const categories: Category[] = [
    {
        id: "industrial",
        name: "Industrial & Manufacturing Supplies",
        subcategories: [
            "Machinery & Equipment",
            "Electrical Components & Tools",
            "Packaging Materials",
            "Industrial Chemicals & Solvents",
            "Lubricants & Oils",
            "Welding & Construction Tools",
            "Industrial Safety Gear"
        ],
        imageId: "cat-industrial"
    },
    {
        id: "construction",
        name: "Construction & Building Materials",
        subcategories: [
            "Cement, Sand & Aggregates",
            "Roofing Materials (Iron sheets, Tiles)",
            "Steel & Metal Products",
            "Paints & Coatings",
            "Plumbing & Electrical Fittings",
            "Doors, Windows & Accessories",
            "Glass & Ceramics"
        ],
        imageId: "cat-construction"
    },
    {
        id: "food-beverage",
        name: "Food & Beverage",
        subcategories: [
            "Processed Foods (snacks, cereals, sauces)",
            "Beverages (juices, water, soft drinks, tea, coffee)",
            "Dairy & Baking Products",
            "Spices & Condiments",
            "Packaging for Food & Beverage Manufacturers",
            "Frozen Foods (for B2B bulk supply)"
        ],
        imageId: "cat-food"
    },
    {
        id: "beauty-hygiene",
        name: "Beauty, Hygiene & Personal Care",
        subcategories: [
            "Soaps & Detergents",
            "Haircare Products (shampoo, oils, relaxers)",
            "Skin & Body Care",
            "Perfumes, Deodorants & Sprays",
            "Feminine Hygiene Products",
            "Oral & Dental Care",
            "Sanitizers & Disinfectants"
        ],
        imageId: "cat-beauty"
    },
    {
        id: "packaging-printing",
        name: "Packaging, Printing & Branding",
        subcategories: [
            "Plastic Containers & Bottles",
            "Labels & Stickers",
            "Cartons, Boxes & Pouches",
            "Industrial Packaging Films",
            "Printing & Branding Services",
            "Recyclable / Eco Packaging"
        ],
        imageId: "cat-packaging"
    },
     {
        id: "automotive",
        name: "Automotive & Transport Supplies",
        subcategories: [
            "Car Care Products (cleaners, wax, polish)",
            "Spare Parts & Accessories",
            "Tires & Batteries",
            "Motor Oils & Fluids",
            "Safety & Maintenance Equipment"
        ],
        imageId: "cat-automotive"
    },
    {
        id: "agriculture",
        name: "Agriculture & Agri-Processing",
        subcategories: [
            "Seeds, Fertilizers & Pesticides",
            "Animal Feed & Veterinary Supplies",
            "Farm Tools & Irrigation Equipment",
            "Food Processing Machinery",
            "Agro Chemicals",
            "Packaging for Agricultural Products"
        ],
        imageId: "cat-agriculture"
    },
    {
        id: "fashion-textiles",
        name: "Fashion, Textiles & Apparel",
        subcategories: [
            "Fabrics & Raw Materials",
            "Workwear & Uniforms",
            "Footwear (safety, industrial, casual)",
            "Bags & Accessories",
            "Sewing Machines & Tailoring Tools"
        ],
        imageId: "cat-textiles"
    }
];
