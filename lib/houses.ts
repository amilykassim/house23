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
        icon: "sparkle" | "location" | "calendar" | "lock"
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
            "Welcome to Casamigo House 23. This architectural masterpiece seamlessly blends indoor and outdoor living, offering panoramic green zone views from the master bedroom and living room.",
            "Step inside to discover an open-concept living space bathed in natural light, featuring almost floor-to-ceiling windows, custom furnishings, and designer finishes throughout. The gourmet kitchen is equipped with professional-grade appliances, perfect for preparing memorable meals with locally sourced ingredients.",
            "Outside, your private living room overlooks the lush green surroundings, while the outdoor sitting area provides the perfect setting for al fresco dining and sunset cocktails. Casamigo offers the ultimate Kigalian experience.",
        ],
        heroImage: "/images/EMMA9964.jpg",
        location: "Kicukiro - Kigali, Rwanda",
        mapEmbed:
            "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1062.1763704881878!2d30.122715354221366!3d-1.987933949009095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca70024a51111%3A0xdedd2366044e8c36!2sHouse%2023!5e0!3m2!1sen!2srw!4v1774850432549!5m2!1sen!2srw",
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
            { src: "/images/EMMA9964.jpg", alt: "House 23 exterior", label: "Casamigo House 23" },
            { src: "/images/EMMA0017.jpg", alt: "Spacious living room", label: "Living Room" },
            { src: "/images/EMMA0136.jpg", alt: "Kitchen", label: "Kitchen" },
            { src: "/images/EMMA0227.jpg", alt: "Exterior view", label: "Exterior" },
            { src: "/images/EMMA0107.jpg", alt: "Master bedroom", label: "Master Bedroom" },
        ],
        allPhotos: [
            { src: "/images/EMMA9964.jpg", alt: "House 23 exterior", label: "Exterior" },
            { src: "/images/EMMA0017.jpg", alt: "Spacious living room", label: "Living Room" },
            { src: "/images/EMMA0136.jpg", alt: "Kitchen", label: "Kitchen" },
            { src: "/images/EMMA0227.jpg", alt: "Exterior view", label: "Exterior" },
            { src: "/images/EMMA0107.jpg", alt: "Master bedroom", label: "Master Bedroom" },
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
                description: "Enjoy the entire place to yourself — complete comfort, zero sharing.",
                icon: "lock",
            },
            {
                title: "Exceptional hospitality",
                description: "42 guests gave the check-in process a 5-star rating.",
                icon: "sparkle",
            },
            {
                title: "Great location",
                description: "100% of recent guests gave the location a 5-star rating.",
                icon: "location",
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
            "Nestled in the vibrant city of Kigali, Casamigo House 23 offers the perfect blend of seclusion and accessibility. Enjoy local attractions, cultural experiences, and proximity to acclaimed restaurants while staying in your own private paradise.",
    },
    {
        slug: "house-22",
        name: "House 22",
        tagline: "A cozy retreat nestled in the heart of Kigali. Modern comforts meet warm hospitality in this beautifully curated space. 🏡",
        description: [
            "Welcome to Casamigo House 22. A beautifully designed home that combines modern aesthetics with the warmth of Rwandan hospitality, creating a truly unique stay experience.",
            "The open-plan living and dining area is flooded with natural light, while the fully equipped kitchen makes it easy to prepare your favorite meals. Each bedroom is thoughtfully furnished with premium linens and blackout curtains for a restful night's sleep.",
            "Enjoy your morning coffee on the private terrace overlooking the garden, or relax in the cozy living room after a day exploring Kigali. House 22 is your home away from home.",
        ],
        heroImage: "/images/EMMA9979.JPG",
        location: "Kicukiro - Kigali, Rwanda",
        mapEmbed:
            "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1062.1763704881878!2d30.122715354221366!3d-1.987933949009095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca70024a51111%3A0xdedd2366044e8c36!2sHouse%2022!5e0!3m2!1sen!2srw!4v1774850432549!5m2!1sen!2srw",
        rating: 4.9,
        reviewCount: 28,
        guests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2,
        pricePerNight: 45,
        cleaningFee: 10,
        serviceFee: 0,
        photos: [
            { src: "/images/EMMA9979.JPG", alt: "House 22 exterior", label: "Casamigo House 22" },
            { src: "/images/EMMA0043.JPG", alt: "Living area", label: "Living Room" },
            { src: "/images/EMMA0053.JPG", alt: "Kitchen area", label: "Kitchen" },
            { src: "/images/EMMA0061.JPG", alt: "Bedroom", label: "Bedroom" },
            { src: "/images/EMMA0084.JPG", alt: "Bathroom", label: "Bathroom" },
        ],
        allPhotos: [
            { src: "/images/EMMA9979.JPG", alt: "House 22 exterior", label: "Exterior" },
            { src: "/images/EMMA0043.JPG", alt: "Living area", label: "Living Room" },
            { src: "/images/EMMA0053.JPG", alt: "Kitchen area", label: "Kitchen" },
            { src: "/images/EMMA0061.JPG", alt: "Bedroom", label: "Bedroom" },
            { src: "/images/EMMA0084.JPG", alt: "Bathroom", label: "Bathroom" },
            { src: "/images/EMMA0091.JPG", alt: "Second bathroom", label: "Bathroom 2" },
            { src: "/images/EMMA0047.JPG", alt: "Hallway", label: "Hallway" },
            { src: "/images/EMMA0059.JPG", alt: "Kitchen detail", label: "Kitchen Detail" },
            { src: "/images/EMMA0101.JPG", alt: "Terrace", label: "Terrace" },
            { src: "/images/EMMA0162.JPG", alt: "Garden view", label: "Garden" },
            { src: "/images/EMMA0193.JPG", alt: "Outdoor area", label: "Outdoor Area" },
            { src: "/images/EMMA0207.JPG", alt: "Evening view", label: "Evening View" },
            { src: "/images/EMMA0219.JPG", alt: "Surrounding area", label: "Surroundings" },
            { src: "/images/EMMA0231.JPG", alt: "Neighborhood", label: "Neighborhood" },
        ],
        highlights: [
            {
                title: "Private from the Get Go",
                description: "Enjoy the entire place to yourself — complete comfort, zero sharing.",
                icon: "lock",
            },
            {
                title: "Exceptional hospitality",
                description: "28 guests gave the check-in process a 5-star rating.",
                icon: "sparkle",
            },
            {
                title: "Great location",
                description: "95% of recent guests gave the location a 5-star rating.",
                icon: "location",
            },
        ],
        nearbyPlaces: [
            { name: "Velvet Boutique Hotel Beach Access", distance: "2 min walk", type: "walk" },
            { name: "Lamane Bakery and Cafe", distance: "4 min drive", type: "drive" },
            { name: "Kigali Convention Center", distance: "13 min drive", type: "drive" },
            { name: "Kigali International Airport", distance: "14 min drive", type: "drive" },
        ],
        areaDescription:
            "Located in the heart of Kigali, Casamigo House 22 offers easy access to the city's best attractions while providing a peaceful retreat. The neighborhood is safe, walkable, and full of character.",
    },
]

export function getHouseBySlug(slug: string): HouseData | undefined {
    return houses.find((h) => h.slug === slug)
}

export function getAllHouseSlugs(): string[] {
    return houses.map((h) => h.slug)
}

export const DEFAULT_HOUSE_SLUG = "house-23"
