export interface HousePhoto {
    src: string
    alt: string
    label: string
    category?: string
}

export interface HouseData {
    slug: string
    name: string
    tagline: string
    description: string[]
    heroImage: string
    location: string
    mapEmbed: string
    rating: number
    reviewCount: number
    guests: number
    bedrooms: number
    beds: number
    bathrooms: number
    pricePerNight: number
    cleaningFee: number
    serviceFee: number
    photos: HousePhoto[]
    allPhotos: HousePhoto[]
    highlights: {
        title: string
        description: string
        icon: "sparkle" | "location" | "calendar" | "lock" | "workspace" | "gamepad"
    }[]
    nearbyPlaces: {
        name: string
        distance: string
        type: "walk" | "drive"
    }[]
    areaDescription: string
}

export const houses: HouseData[] = [
    {
        slug: "house-23",
        name: "House 23",
        tagline: "Designed for privacy, calm and peace. Wake up to birdsong 😴, enjoy morning walks or jogs in our safe neighborhood, and unwind in a space that feels like peace. 🌴",
        description: [
            "Welcome to House 23 by Velstays. This architectural masterpiece seamlessly blends indoor and outdoor living, offering panoramic green zone views from the master bedroom and living room.",
            "Step inside to discover an open-concept living space bathed in natural light, featuring almost floor-to-ceiling windows, custom furnishings, and designer finishes throughout. The gourmet kitchen is equipped with professional-grade appliances, perfect for preparing memorable meals with locally sourced ingredients.",
            "Outside, your private living room overlooks the lush green surroundings, while the outdoor sitting area provides the perfect setting for al fresco dining and sunset cocktails. Velstays offers the ultimate calm experience.",
        ],
        heroImage: "/images/EMMA9964.jpg",
        location: "Kicukiro - Kigali, Rwanda",
        mapEmbed:
            "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1062.1763704881878!2d30.122715354221366!3d-1.987933949009095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca70024a51111%3A0xdedd2366044e8c36!2sHouse%2023!5e1!3m2!1sen!2srw!4v1774850432549!5m2!1sen!2srw",
        rating: 4.95,
        reviewCount: 42,
        guests: 3,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2,
        pricePerNight: 51,
        cleaningFee: 10,
        serviceFee: 0,
        photos: [
            { src: "/images/EMMA9964.jpg", alt: "House 23 exterior", label: "House 23", category: "Exterior" },
            { src: "/images/EMMA0017.jpg", alt: "Spacious living room", label: "Living Room", category: "Living Room" },
            { src: "/images/EMMA01361.JPG", alt: "Kitchen", label: "Kitchen", category: "Kitchen" },
            { src: "/images/EMMA0058.JPG", alt: "Office", label: "Office", category: "Office" },
            { src: "/images/EMMA01061.JPG", alt: "Master bedroom", label: "Master Bedroom", category: "Bedroom" },
        ],
        allPhotos: [
            { src: "/images/EMMA9964.jpg", alt: "House 23 exterior", label: "Exterior", category: "Exterior" },
            { src: "/images/EMMA0017.jpg", alt: "Spacious living room", label: "Living Room", category: "Living Room" },
            { src: "/images/EMMA01361.JPG", alt: "Kitchen", label: "Kitchen", category: "Kitchen" },
            { src: "/images/EMMA0058.JPG", alt: "Office", label: "Office", category: "Office" },
            { src: "/images/EMMA01061.JPG", alt: "Master bedroom", label: "Master Bedroom", category: "Bedroom" },
            { src: "/images/EMMA9959.jpg", alt: "House entrance", label: "Entrance", category: "Exterior" },
            { src: "/images/EMMA9952.JPG", alt: "Garden view", label: "Garden", category: "Outdoor" },
            { src: "/images/EMMA9936.JPG", alt: "Side view", label: "Side View", category: "Exterior" },
            { src: "/images/EMMA0004.JPG", alt: "Interior detail", label: "Interior", category: "Living Room" },
            { src: "/images/EMMA0009.JPG", alt: "Living space", label: "Living Space", category: "Living Room" },
            { src: "/images/EMMA0014.JPG", alt: "Dining area", label: "Dining Area", category: "Living Room" },
            { src: "/images/EMMA0023.JPG", alt: "Hallway", label: "Hallway", category: "Living Room" },
            { src: "/images/EMMA0032.JPG", alt: "Bedroom detail", label: "Bedroom", category: "Bedroom" },
            { src: "/images/EMMA0037.JPG", alt: "Bathroom", label: "Bathroom", category: "Bathroom" },
            { src: "/images/EMMA0111.JPG", alt: "Window view", label: "Window View", category: "Living Room" },
            { src: "/images/EMMA0115.JPG", alt: "Outdoor seating", label: "Outdoor Seating", category: "Outdoor" },
            { src: "/images/EMMA0120.JPG", alt: "Patio area", label: "Patio", category: "Outdoor" },
            { src: "/images/EMMA0125.JPG", alt: "Night view", label: "Night View", category: "Exterior" },
        ],
        highlights: [
            {
                title: "Private from the Get Go",
                description: "Enjoy the entire place to yourself, complete comfort, zero sharing.",
                icon: "lock",
            },
            {
                title: "Dedicated Workspace",
                description: "A quiet, well-equipped office space, perfect for remote work",
                icon: "workspace",
            },
            {
                title: "Exceptional hospitality",
                description: "42 guests gave the check-in process a 5-star rating.",
                icon: "sparkle",
            },
        ],
        nearbyPlaces: [
            { name: "Velvet Boutique Hotel Beach Access", distance: "2 min walk", type: "walk" },
            { name: "Lamane Bakery and Cafe", distance: "4 min drive", type: "drive" },
            { name: "Simba Supermarket", distance: "7 min drive", type: "drive" },
            { name: "Kigali Convention Center", distance: "13 min drive", type: "drive" },
            { name: "Kigali International Airport", distance: "14 min drive", type: "drive" },
            { name: "Luma & Lua Restaurant", distance: "12 min drive", type: "drive" },
        ],
        areaDescription:
            "Nestled in the vibrant city of Kigali, Velstays House 23 offers the perfect blend of seclusion and accessibility. Enjoy local attractions, cultural experiences, and proximity to acclaimed restaurants while staying in your own private paradise.",
    },
    {
        slug: "house-22",
        name: "House 22",
        tagline: "A cozy retreat nestled in the heart of Kigali. Modern comforts meet warm hospitality in this beautifully curated space. 🏡",
        description: [
            "Welcome to House 22 by Velstays. A beautifully designed home that combines modern aesthetics with the warmth of Rwandan hospitality, creating a truly unique stay experience.",
            "The open-plan living and dining area is flooded with natural light, while the fully equipped kitchen makes it easy to prepare your favorite meals. Each bedroom is thoughtfully furnished with premium linens and blackout curtains for a restful night's sleep.",
            "Enjoy your morning coffee on the private terrace overlooking the garden, or relax in the cozy living room after a day exploring Kigali. Velstays House 22 is your home away from home.",
        ],
        heroImage: "/images/AXX_9712.JPG",
        location: "Kicukiro - Kigali, Rwanda",
        mapEmbed:
            "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1062.1763704881878!2d30.122715354221366!3d-1.987933949009095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca70024a51111%3A0xdedd2366044e8c36!2sHouse%2022!5e1!3m2!1sen!2srw!4v1774850432549!5m2!1sen!2srw",
        rating: 4.75,
        reviewCount: 4,
        guests: 3,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2,
        pricePerNight: 41,
        cleaningFee: 10,
        serviceFee: 0,
        photos: [
            { src: "/images/AXX_9712.JPG", alt: "House 22 exterior", label: "House 22", category: "Living Room" },
            { src: "/images/AXX_0066.JPG", alt: "Outdoor patio", label: "Outdoor", category: "Outdoor" },
            { src: "/images/AXX_9898.JPG", alt: "Bedroom 1", label: "Bedroom 1", category: "Bedroom" },
            { src: "/images/AXX_9539.JPG", alt: "Living room", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9979.JPG", alt: "Bedroom 2", label: "Bedroom 2", category: "Bedroom" },
        ],
        allPhotos: [
            { src: "/images/AXX_9680.JPG", alt: "Sofa with throw blanket", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9513.JPG", alt: "Orange sofa with art", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9516.JPG", alt: "Sofa with palm and paintings", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9530.JPG", alt: "TV and coffee table", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9534.JPG", alt: "Coffee table detail", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9571.JPG", alt: "Sofa with curtains", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9581.JPG", alt: "Open plan living area", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9597.JPG", alt: "Coffee table and indoor garden", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9617.JPG", alt: "TV wall with plants", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9627.JPG", alt: "Entertainment area wide view", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9631.JPG", alt: "Living room with glass door", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9645.JPG", alt: "Decorative vase on side table", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9650.JPG", alt: "Coffee table close-up", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9671.JPG", alt: "Console decor with plants", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9695.JPG", alt: "Sofa pillows detail", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9712.JPG", alt: "Kitchen sink and utensils", label: "Kitchen", category: "Kitchen" },
            { src: "/images/AXX_9734.JPG", alt: "Kitchen counter and sink", label: "Kitchen", category: "Kitchen" },
            { src: "/images/AXX_9736.JPG", alt: "Coffee maker and blender", label: "Kitchen", category: "Kitchen" },
            { src: "/images/AXX_9739.JPG", alt: "Coffee maker close-up", label: "Kitchen", category: "Kitchen" },
            { src: "/images/AXX_9746.JPG", alt: "Stovetop and utensils", label: "Kitchen", category: "Kitchen" },
            { src: "/images/AXX_9754.JPG", alt: "Oven and stovetop full view", label: "Kitchen", category: "Kitchen" },
            { src: "/images/AXX_9765.JPG", alt: "Kitchen wide angle", label: "Kitchen", category: "Kitchen" },
            { src: "/images/AXX_9768.JPG", alt: "Dish rack and sink", label: "Kitchen", category: "Kitchen" },
            { src: "/images/AXX_9795.JPG", alt: "Open plan living and kitchen", label: "Kitchen", category: "Kitchen" },
            { src: "/images/AXX_9806.JPG", alt: "Full kitchen with fridge", label: "Kitchen", category: "Kitchen" },
            { src: "/images/AXX_9813.JPG", alt: "Kitchen sink window view", label: "Kitchen", category: "Kitchen" },
            { src: "/images/AXX_9817.JPG", alt: "Bed with wooden headboard", label: "Bedroom 1", category: "Bedroom" },
            { src: "/images/AXX_9825.JPG", alt: "Bedside lamp close-up", label: "Bedroom 1", category: "Bedroom" },
            { src: "/images/AXX_9829.JPG", alt: "Bean bags and board games", label: "Game Room", category: "Game Room" },
            { src: "/images/AXX_9835.JPG", alt: "Scrabble board and bean bag", label: "Game Room", category: "Game Room" },
            { src: "/images/AXX_9840.JPG", alt: "Scrabble with plant and bean bag", label: "Game Room", category: "Game Room" },
            { src: "/images/AXX_9854.JPG", alt: "Game room wide view", label: "Game Room", category: "Game Room" },
            { src: "/images/AXX_9858.JPG", alt: "Bathroom sink and shower", label: "Bathroom", category: "Bathroom" },
            { src: "/images/AXX_9862.JPG", alt: "Shower head close-up", label: "Bathroom", category: "Bathroom" },
            { src: "/images/AXX_9867.JPG", alt: "Sink faucet detail", label: "Bathroom", category: "Bathroom" },
            { src: "/images/AXX_9869.JPG", alt: "Bathroom faucet close-up", label: "Bathroom", category: "Bathroom" },
            { src: "/images/AXX_9871.JPG", alt: "Bedroom lamp and headboard", label: "Bedroom 1", category: "Bedroom" },
            { src: "/images/AXX_9882.JPG", alt: "Bedroom mirror and courtyard", label: "Bedroom 1", category: "Bedroom" },
            { src: "/images/AXX_9890.JPG", alt: "Bedside lamp angle", label: "Bedroom 1", category: "Bedroom" },
            { src: "/images/AXX_9898.JPG", alt: "Bedroom 1 lamp warm glow", label: "Bedroom 1", category: "Bedroom" },
            { src: "/images/AXX_9912.JPG", alt: "Living room decor through plants", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9947.JPG", alt: "Sofa side view with art", label: "Living Room", category: "Living Room" },
            { src: "/images/AXX_9953.JPG", alt: "Bedroom 2 mirror reflection", label: "Bedroom 2", category: "Bedroom" },
            { src: "/images/AXX_9954.JPG", alt: "Wavy headboard with lamp", label: "Bedroom 2", category: "Bedroom" },
            { src: "/images/AXX_9956.JPG", alt: "Bedroom 2 mirror and bed", label: "Bedroom 2", category: "Bedroom" },
            { src: "/images/AXX_9966.JPG", alt: "Bedroom 2 mirror wide", label: "Bedroom 2", category: "Bedroom" },
            { src: "/images/AXX_9979.JPG", alt: "Bedroom 2 headboard and lamp", label: "Bedroom 2", category: "Bedroom" },
            { src: "/images/AXX_9986.JPG", alt: "Bedroom 2 lamp close-up", label: "Bedroom 2", category: "Bedroom" },
            { src: "/images/AXX_9999.JPG", alt: "Bedroom 2 bed close-up", label: "Bedroom 2", category: "Bedroom" },
            { src: "/images/AXX_0050.JPG", alt: "Garden flowers and patio", label: "Outdoor", category: "Outdoor" },
            { src: "/images/AXX_0060.JPG", alt: "Patio table and garden", label: "Outdoor", category: "Outdoor" },
            { src: "/images/AXX_0066.JPG", alt: "Patio seating with garden view", label: "Outdoor", category: "Outdoor" },
            { src: "/images/AXX_0072.JPG", alt: "Patio and brick wall", label: "Outdoor", category: "Outdoor" },
            { src: "/images/AXX_0100.JPG", alt: "House 22 front gate", label: "Exterior", category: "Exterior" },
            { src: "/images/house22-22.JPG", alt: "House 22 exterior view", label: "Exterior", category: "Exterior" },
            { src: "/images/house22-27.JPG", alt: "House 22 exterior angle", label: "Exterior", category: "Exterior" },
            { src: "/images/house22-23.JPG", alt: "House 22 front view", label: "Exterior", category: "Exterior" },
            { src: "/images/house22-26.JPG", alt: "House 22 street view", label: "Exterior", category: "Exterior" },
            { src: "/images/house22-40.PNG", alt: "House 22 aerial view", label: "Exterior", category: "Exterior" },
        ],
        highlights: [
            {
                title: "Private from the Get Go",
                description: "Enjoy the entire place to yourself, complete comfort, zero sharing.",
                icon: "lock",
            },
            {
                title: "Game Room",
                description: "Unwind with games and entertainment, fun for everyone staying.",
                icon: "gamepad",
            },
            {
                title: "Exceptional hospitality",
                description: "28 guests gave the check-in process a 5-star rating.",
                icon: "sparkle",
            },
        ],
        nearbyPlaces: [
            { name: "Velvet Boutique Hotel Beach Access", distance: "2 min walk", type: "walk" },
            { name: "Lamane Bakery and Cafe", distance: "4 min drive", type: "drive" },
            { name: "Kigali Convention Center", distance: "13 min drive", type: "drive" },
            { name: "Kigali International Airport", distance: "14 min drive", type: "drive" },
        ],
        areaDescription:
            "Located in the heart of Kigali, Velstays House 22 offers easy access to the city's best attractions while providing a peaceful retreat. The neighborhood is safe, walkable, and full of character.",
    },
]

export function getHouseBySlug(slug: string): HouseData | undefined {
    return houses.find((h) => h.slug === slug)
}

export function getAllHouseSlugs(): string[] {
    return houses.map((h) => h.slug)
}

export const DEFAULT_HOUSE_SLUG = "house-23"
