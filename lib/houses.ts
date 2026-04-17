export interface HousePhoto {
    src: string
    alt: string
    label: string
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
            { src: "/images/EMMA9964.jpg", alt: "House 23 exterior", label: "House 23" },
            { src: "/images/EMMA0017.jpg", alt: "Spacious living room", label: "Living Room" },
            { src: "/images/EMMA01361.JPG", alt: "Kitchen", label: "Kitchen" },
            { src: "/images/EMMA0058.JPG", alt: "Office", label: "Office" },
            { src: "/images/EMMA01061.JPG", alt: "Master bedroom", label: "Master Bedroom" },
        ],
        allPhotos: [
            { src: "/images/EMMA9964.jpg", alt: "House 23 exterior", label: "Exterior" },
            { src: "/images/EMMA0017.jpg", alt: "Spacious living room", label: "Living Room" },
            { src: "/images/EMMA01361.JPG", alt: "Kitchen", label: "Kitchen" },
            { src: "/images/EMMA0058.JPG", alt: "Office", label: "Office" },
            { src: "/images/EMMA01061.JPG", alt: "Master bedroom", label: "Master Bedroom" },
            { src: "/images/EMMA9959.jpg", alt: "House entrance", label: "Entrance" },
            { src: "/images/EMMA9952.JPG", alt: "Garden view", label: "Garden" },
            { src: "/images/EMMA9936.JPG", alt: "Side view", label: "Side View" },
            { src: "/images/EMMA0004.JPG", alt: "Interior detail", label: "Interior" },
            { src: "/images/EMMA0009.JPG", alt: "Living space", label: "Living Space" },
            { src: "/images/EMMA0014.JPG", alt: "Dining area", label: "Dining Area" },
            { src: "/images/EMMA0023.JPG", alt: "Hallway", label: "Hallway" },
            { src: "/images/EMMA0032.JPG", alt: "Bedroom detail", label: "Bedroom" },
            { src: "/images/EMMA0037.JPG", alt: "Bathroom", label: "Bathroom" },
            { src: "/images/EMMA0111.JPG", alt: "Window view", label: "Window View" },
            { src: "/images/EMMA0115.JPG", alt: "Outdoor seating", label: "Outdoor Seating" },
            { src: "/images/EMMA0120.JPG", alt: "Patio area", label: "Patio" },
            { src: "/images/EMMA0125.JPG", alt: "Night view", label: "Night View" },
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
            { src: "/images/AXX_9712.JPG", alt: "House 22 exterior", label: "House 22" },
            { src: "/images/AXX_0066.JPG", alt: "Exterior", label: "Exterior" },
            { src: "/images/AXX_9898.JPG", alt: "Bedroom 1", label: "Bedroom 1" },
            { src: "/images/AXX_9539.JPG", alt: "Living room", label: "Living Room" },
            { src: "/images/AXX_9979.JPG", alt: "Bedroom 2", label: "Bedroom 2" },
        ],
        allPhotos: [
            { src: "/images/AXX_9680.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9513.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9516.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9530.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9534.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9571.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9581.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9597.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9617.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9627.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9631.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9645.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9650.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9671.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9695.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9712.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9734.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9736.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9739.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9746.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9754.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9765.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9768.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9795.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9806.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9813.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9817.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9825.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9829.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9835.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9840.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9854.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9858.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9862.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9867.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9869.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9871.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9882.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9890.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9912.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9947.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9953.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9954.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9956.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9966.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9986.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_9999.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_0050.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_0060.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_0072.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/AXX_0100.JPG", alt: "House 22", label: "House 22" },
            { src: "/images/house22-22.JPG", alt: "House 22 exterior", label: "Exterior" },
            { src: "/images/house22-27.JPG", alt: "House 22 exterior", label: "Exterior" },
            { src: "/images/house22-23.JPG", alt: "House 22 exterior", label: "Exterior" },
            { src: "/images/house22-26.JPG", alt: "House 22 exterior", label: "Exterior" },
            { src: "/images/house22-40.PNG", alt: "House 22 exterior", label: "Exterior" },
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
