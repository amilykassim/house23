"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion"

const ratingCategories = [
  { label: "Cleanliness", score: 5.0 },
  { label: "Accuracy", score: 4.9 },
  { label: "Check-in", score: 5.0 },
  { label: "Communication", score: 5.0 },
  { label: "Location", score: 4.9 },
  { label: "Value", score: 4.8 },
]

const reviews = [
  {
    id: 1,
    name: "Linda",
    avatar: "L",
    location: "Kenya",
    date: "December 2025",
    rating: 5,
    text: "Deborah was an amazing host. I booked her place on short notice and she ensured everything was ready for us. The house is beautifully designed with small touches that makes the place very elegant. She's quick to support if you need anything, I'm grateful that being foreigners she helped get a reliable taxi to the airport at night. I'll definitely book her again next time I'm in Kigali.",
  },
  {
    id: 2,
    name: "Estelle",
    avatar: "E",
    location: "Johannesburg, South Africa",
    date: "October 2025",
    rating: 5,
    text: "Had a lovely stay at Deborah's place. It was peaceful & safe. Deborah, you have a very beautiful and well-kept house. Staying there truly felt like being at home. The tall walls make the place spacious and breathable, adding to the comfort. I really enjoyed my stay. As a host, you were very responsive and helpful. Thank you for the wonderful hospitality!",
  },
  {
    id: 3,
    name: "Lisa",
    avatar: "L",
    location: "Kigali, Rwanda",
    date: "November 2025",
    rating: 5,
    text: "Deborah was a wonderful host, always helpful, even with communicating with local drivers. The place is gorgeous! Well kept and in a nice quiet area, perfect for morning walks, or just a quiet stay. Would recommend 100% to anyone visiting Kigali and will definitely be staying there on future trips.",
  },
  {
    id: 4,
    name: "Marie-Reine",
    avatar: "MR",
    location: "Toronto, Canada",
    date: "January 2026",
    rating: 5,
    text: "The place was cozy and clean, and Deborah was a great and flexible host.",
  },
  {
    id: 5,
    name: "Magdalena",
    avatar: "M",
    location: "Kigali, Rwanda",
    date: "March 2026",
    rating: 5,
    text: "Loved Deborah's nicely decorated and comfortable place. Deborah proved to be a great host and I can definitely recommend her Airbnb.",
  },
  {
    id: 6,
    name: "Nelly",
    avatar: "N",
    location: "United Kingdom",
    date: "July 2025",
    rating: 5,
    text: "The host was very friendly and helped whenever we needed help. It felt like i was home and very private. Place is cute and safe. Generally i loved my stay plus it was close to almost all the nice places to visit.",
  },
  {
    id: 7,
    name: "Stephan",
    avatar: "S",
    location: "Pretoria, South Africa",
    date: "January 2026",
    rating: 5,
    text: "Had a lovely stay in a quiet area of Kigali in this spacious and private home. Adequate amenities and modern interior, well maintained outside area.",
  },
  {
    id: 8,
    name: "Elvis",
    avatar: "E",
    location: "Kigali, Rwanda",
    date: "August 2025",
    rating: 5,
    text: "Second time staying at House 23, so might as well say it's a favorite now. Several new amenities including books and games made the place cozier and nicer than the first time. The place is squeaky clean and not a thing is out of place. The host Deborah is super welcoming and always ready to lend a helping hand.",
  },
  {
    id: 9,
    name: "Serge Buhendwa",
    avatar: "SB",
    location: "Kigali, Rwanda",
    date: "July 2025",
    rating: 3,
    text: "The apartment in self is good and I appreciate the dedicated home office. However the only 2 downside was the location which was a bit difficult to find and remote. Hence difficult to get transportation and to provide direction.",
  },
  {
    id: 10,
    name: "Karen",
    avatar: "K",
    location: "Kigali, Rwanda",
    date: "June 2025",
    rating: 5,
    text: "It was greattt. Beautiful place, great host, good vibes, exactly like the pictures but in my opinion even better than the pictures. Very clean, the place was easy to find and the host went out of her way to make me feel really comfortable.",
  },
  {
    id: 11,
    name: "Evelyne",
    avatar: "E",
    location: "Kampala, Uganda",
    date: "April 2025",
    rating: 5,
    text: "Deborah gave us such a nice warm welcome to her beautiful, cozy and comfortable place. Set out in a clean, quiet, secure and organized environment, Deborah's place made our stay peaceful and pleasant. Privacy, good proximity to the center of the city and with quick access to transport.",
  },
  {
    id: 12,
    name: "Elvis",
    avatar: "E",
    location: "Kigali, Rwanda",
    date: "April 2025",
    rating: 5,
    text: "Our stay at House23 was a great experience. The place was very peaceful and tranquil. Every detail in the house was carefully thought out, such as the neat office and the overall cleanliness of the house. Deborah is very responsive and made sure we felt at home.",
  },
  {
    id: 13,
    name: "Obianuju",
    avatar: "O",
    location: "Kigali, Rwanda",
    date: "March 2026",
    rating: 5,
    text: "Deborah was nice and always at our service! I really enjoyed my stay and will definitely come back 🙌",
  },
  {
    id: 14,
    name: "Dominique K.",
    avatar: "DK",
    location: "Kigali, Rwanda",
    date: "February 2026",
    rating: 5,
    text: "Deborah's place is clean and well organized, great service from her security guard, all around a great place to stay while visiting Kigali.",
  },
  {
    id: 15,
    name: "Maria",
    avatar: "M",
    location: "Kigali, Rwanda",
    date: "March 2026",
    rating: 5,
    text: "Spacious and cozy accommodation in Kigali. It even has a workspace for working. Communication with the host was great, and the place was very clean.",
  },
  {
    id: 16,
    name: "Gisabo",
    avatar: "G",
    location: "Kigali, Rwanda",
    date: "January 2026",
    rating: 5,
    text: "Deborah is an amazing host. The place is clean, and the neighborhood is peaceful.",
  },
  {
    id: 17,
    name: "Sera",
    avatar: "S",
    location: "Uganda",
    date: "December 2025",
    rating: 5,
    text: "Serene, quiet environment! The home is beautiful 🤩 Debbie, you'll definitely be seeing my face again! You & yours are amazing.",
  },
  {
    id: 18,
    name: "Joyce",
    avatar: "J",
    location: "Nairobi, Kenya",
    date: "August 2025",
    rating: 5,
    text: "Lovely stay! The house matches the description. Deborah was very thoughtful! She gave us a bouquet and a lovely handwritten note. The place is beautiful peaceful, near the town.",
  },
  {
    id: 19,
    name: "Benjamin",
    avatar: "B",
    location: "Kigali, Rwanda",
    date: "July 2025",
    rating: 5,
    text: "Deborah is a dedicated host and has a great team, remarkable response time. This house is extra modern. Deborah is honest, lovable, professional. She enjoys communicating, and being eye level with you.",
  },
  {
    id: 20,
    name: "Sam",
    avatar: "S",
    location: "Entebbe, Uganda",
    date: "February 2026",
    rating: 5,
    text: "Clean, simple house. Host was kind, easy check-in. Secure and quiet neighborhood, would return again.",
  },
  {
    id: 21,
    name: "Oluwakemi",
    avatar: "O",
    location: "Lagos, Nigeria",
    date: "May 2025",
    rating: 5,
    text: "Deborah is a very welcoming and lovely host, her apartment is so beautiful, you can feel that everything was done with so much intention. I'd definitely look forward to coming back to Deborah's place.",
  },
  {
    id: 22,
    name: "Omorinsola",
    avatar: "O",
    location: "Kigali, Rwanda",
    date: "May 2025",
    rating: 5,
    text: "Dee was such a lovely host—kind, incredibly welcoming, swift to answer questions, and happy to recommend great spots to visit. House 23 felt like home. Very neat, very cozy, and thoughtfully arranged with everything we needed.",
  },
  {
    id: 23,
    name: "Vanessa",
    avatar: "V",
    location: "Kigali, Rwanda",
    date: "May 2025",
    rating: 5,
    text: "This Airbnb was a gem! Easily accessible with smooth road access, the space was incredibly clean, spacious, and felt like a home away from home. What truly made the stay unforgettable was the host—warm, welcoming, and genuinely the sweetest person I've met.",
  },
  {
    id: 24,
    name: "Nadege",
    avatar: "N",
    location: "Kigali, Rwanda",
    date: "May 2025",
    rating: 5,
    text: "Absolutely loved my stay! This place was just so comfortable, heavy on cleanliness 👌🏽, and had everything I needed. The vibe was perfect, and I felt right at home the entire time. Easily one of the best Airbnb experiences I've had.",
  },
  {
    id: 25,
    name: "Mukire",
    avatar: "M",
    location: "Kigali, Rwanda",
    date: "April 2025",
    rating: 5,
    text: "I had such a lovely stay at Debby's Place, She is incredibly warm, welcoming and thoughtful. The place itself is spotless, cozy and well taken care of with cozy touches in the rooms. Plus quick responses.",
  },
  {
    id: 26,
    name: "Dennis",
    avatar: "D",
    location: "Kigali, Rwanda",
    date: "October 2025",
    rating: 5,
    text: "A lovely host, very responsive and the premise is very clean, very well decorated.",
  },
  {
    id: 27,
    name: "Tahniyath",
    avatar: "T",
    location: "Kayonza, Rwanda",
    date: "October 2025",
    rating: 5,
    text: "The place is beautiful and as it is in the pictures, she is a friendly host.",
  },
  {
    id: 28,
    name: "Mensah",
    avatar: "M",
    location: "Accra, Ghana",
    date: "April 2025",
    rating: 5,
    text: "I just wanted to take a moment to thank you for our fantastic stay at your Airbnb in Kigali. The place was even more beautiful, neat, and inviting than the pictures showed! We truly felt at home in such a safe and secure environment.",
  },
  {
    id: 29,
    name: "Suzanne",
    avatar: "S",
    location: "Kigali, Rwanda",
    date: "June 2025",
    rating: 5,
    text: "House 23 is amazing, a pure gem. Well decorated, super comfortable. The neighborhood is great, with excellent restaurants and coffee shops nearby. I recommend!",
  },
  {
    id: 30,
    name: "Yang",
    avatar: "Y",
    location: "Miami, Florida",
    date: "June 2025",
    rating: 5,
    text: "Deborah's place is fully equipped with all you need. My stay was pleasurable and Deborah is a friendly host. 10/10 would recommend.",
  },
  {
    id: 31,
    name: "Amanda",
    avatar: "A",
    location: "Kigali, Rwanda",
    date: "June 2025",
    rating: 5,
    text: "Amazing and peaceful place😍 and most of all the host was so nice and welcoming 😍. Everything you need you can find it there👏🏾👏🏾",
  },
  {
    id: 32,
    name: "Andrew",
    avatar: "A",
    location: "Rutland, Massachusetts",
    date: "June 2025",
    rating: 5,
    text: "Deborah is extremely kind and so thoughtful. The space was beautiful and in a nice private location. Everything was clean and I'd highly recommend staying at her place!",
  },
  {
    id: 33,
    name: "Lilian",
    avatar: "L",
    location: "Kigali, Rwanda",
    date: "May 2025",
    rating: 5,
    text: "The place was amazing, clean, serene, with an amazing deco. The host is very responsive, friendly. Would definitely recommend 100%.",
  },
  {
    id: 34,
    name: "Milan",
    avatar: "M",
    location: "Stuttgart, Germany",
    date: "March 2026",
    rating: 5,
    text: "The place was nicely decorated and very clean. On Maps, the location is shown as different from where it actually is. But the host helped steer me in the right direction. The owner was very accommodating and nice.",
  },
  {
    id: 35,
    name: "Djihad",
    avatar: "D",
    location: "Kigali, Rwanda",
    date: "November 2025",
    rating: 5,
    text: "Top place..👍🏿 I recommend you the place ..",
  },
  {
    id: 36,
    name: "Ddumba",
    avatar: "D",
    location: "Kampala, Uganda",
    date: "August 2025",
    rating: 5,
    text: "I enjoyed my stay. It's calm, peaceful, and secure. I will come back again. I highly recommend.",
  },
  {
    id: 37,
    name: "Alex",
    avatar: "A",
    location: "Johannesburg, South Africa",
    date: "August 2025",
    rating: 5,
    text: "I had a wonderful stay the apartment is in a great location the host is very responsive and it Looks even better i highly recommend it.",
  },
  {
    id: 38,
    name: "Cynthia",
    avatar: "C",
    location: "Kigali, Rwanda",
    date: "July 2025",
    rating: 5,
    text: "The house felt like home and the service was beyond❤️ plus the host was extremely friendly and helpful.",
  },
  {
    id: 39,
    name: "Aracely",
    avatar: "A",
    location: "San Diego, California",
    date: "July 2025",
    rating: 5,
    text: "Just what we needed for our quick stop in Kigali! Very comfortable.",
  },
  {
    id: 40,
    name: "Ayodele",
    avatar: "A",
    location: "Kigali, Rwanda",
    date: "November 2025",
    rating: 5,
    text: "Awesome...",
  },
  {
    id: 41,
    name: "Kangero",
    avatar: "K",
    location: "Dar es Salaam, Tanzania",
    date: "July 2025",
    rating: 5,
    text: "⭐️⭐️⭐️⭐️⭐️",
  },
  {
    id: 42,
    name: "Edmilson",
    avatar: "E",
    location: "Nyamata, Rwanda",
    date: "July 2025",
    rating: 5,
    text: "Great stay for those who want to relax in a quiet neighborhood.",
  },
]

function RatingBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground rounded-full"
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      <span className="text-sm font-medium text-foreground w-8">{score.toFixed(1)}</span>
    </div>
  )
}

function ReviewCard({ review }: { review: typeof reviews[0] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {review.avatar}
        </div>
        <div>
          <p className="font-semibold text-foreground">{review.name}</p>
          <p className="text-sm text-muted-foreground">{review.location}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[...Array(review.rating)].map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-foreground text-foreground" />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">{review.date}</span>
      </div>
      <p className="text-foreground leading-relaxed text-sm">{review.text}</p>
    </div>
  )
}

export function ReviewsSection() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <section id="reviews" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="mx-auto max-w-7xl">
        {/* Rating Header */}
        <FadeIn className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
          <div className="flex items-center gap-3">
            <Star className="h-8 w-8 fill-foreground text-foreground" />
            <span className="font-serif text-4xl font-semibold text-foreground">4.95</span>
          </div>
          <div className="h-8 w-px bg-border hidden md:block" />
          <p className="text-lg text-foreground">
            <span className="font-semibold">42 reviews</span> from amazing guests like yourself
          </p>
        </FadeIn>

        {/* Rating Categories */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12 pb-12 border-b border-border" staggerDelay={0.08}>
          {ratingCategories.map((category) => (
            <StaggerItem key={category.label}>
              <p className="text-sm text-muted-foreground mb-2">{category.label}</p>
              <RatingBar score={category.score} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Reviews Grid */}
        <StaggerContainer className="grid md:grid-cols-2 gap-x-16 gap-y-10 mb-10" staggerDelay={0.1}>
          {reviews.slice(0, 6).map((review) => (
            <StaggerItem key={review.id}>
              <ReviewCard review={review} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Show All Reviews */}
        <div className="flex flex-wrap gap-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="rounded-full px-8 hover:bg-transparent hover:border-foreground hover:text-foreground">
                Show all 42 reviews
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden bg-background rounded-[30px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl flex items-center gap-3">
                  <Star className="h-6 w-6 fill-foreground text-foreground" />
                  4.95 · 42 reviews
                </DialogTitle>
              </DialogHeader>
              <div className="mt-6 space-y-8 bg-background overflow-y-auto max-h-[calc(80vh-100px)]">
                {reviews.map((review) => (
                  <div key={review.id} className="pb-8 border-b border-border last:border-0">
                    <ReviewCard review={review} />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            size="lg"
            className="rounded-full px-8"
            asChild
          >
            <a
              href="https://www.airbnb.com/rooms/1386016117652787910/reviews?adults=2&check_in=2026-04-29&check_out=2026-04-30&guests=2&search_mode=regular_search&source_impression_id=p3_1774901794_P3F5uRC-80t7XaE1&previous_page_section_name=1000&federated_search_id=6efa6b4f-e9dd-424e-9ac5-a4a2f0af86c1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Verify our reviews on Airbnb
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
