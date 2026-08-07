import { LightProvider, Torch } from "@/components/noir/light-context"
import { StoryHero } from "@/components/noir/story-hero"
import { Statement, TorchHint } from "@/components/noir/statement"
import { PhotoWall, type WallPhoto } from "@/components/noir/photo-wall"
import { HouseCards } from "@/components/noir/house-cards"
import { NoirFooter } from "@/components/noir/noir-footer"
import { FloatLamp } from "@/components/noir/float-lamp"

const WALL_HOUSE_23: WallPhoto[] = [
  { src: "/images/EMMA9964.jpg", alt: "House 23 exterior", house: "House 23", caption: "The exterior, first light", ratio: "3/2" },
  { src: "/images/EMMA0017.jpg", alt: "Living room", house: "House 23", caption: "The living room", ratio: "4/3" },
  { src: "/images/EMMA01061.JPG", alt: "Master bedroom", house: "House 23", caption: "Master bedroom, green-zone view", ratio: "3/4" },
  { src: "/images/EMMA9952.JPG", alt: "Garden", house: "House 23", caption: "The garden", ratio: "4/3" },
  { src: "/images/EMMA0058.JPG", alt: "Office", house: "House 23", caption: "A real office, real quiet", ratio: "3/4" },
  { src: "/images/EMMA01361.JPG", alt: "Kitchen", house: "House 23", caption: "The kitchen", ratio: "4/3" },
  { src: "/images/EMMA0115.JPG", alt: "Outdoor seating", house: "House 23", caption: "Evenings outside", ratio: "3/4" },
  { src: "/images/EMMA0125.JPG", alt: "Night view", house: "House 23", caption: "The house at night", ratio: "3/2" },
]

const WALL_HOUSE_22: WallPhoto[] = [
  { src: "/images/AXX_9513.JPG", alt: "Living room with orange sofa", house: "House 22", caption: "The living room", ratio: "4/3" },
  { src: "/images/AXX_9898.JPG", alt: "Bedroom 1", house: "House 22", caption: "Bedroom 1, lamp on", ratio: "3/4" },
  { src: "/images/AXX_9765.JPG", alt: "Kitchen", house: "House 22", caption: "The open kitchen", ratio: "4/3" },
  { src: "/images/AXX_9854.JPG", alt: "Game room", house: "House 22", caption: "Game room", ratio: "3/4" },
  { src: "/images/AXX_0066.JPG", alt: "Patio", house: "House 22", caption: "The patio", ratio: "4/3" },
  { src: "/images/AXX_9979.JPG", alt: "Bedroom 2", house: "House 22", caption: "Bedroom 2", ratio: "3/4" },
  { src: "/images/AXX_9795.JPG", alt: "Open-plan living", house: "House 22", caption: "Open plan", ratio: "4/3" },
  { src: "/images/AXX_0100.JPG", alt: "Front gate", house: "House 22", caption: "The gate", ratio: "3/2" },
]

export default function HomePage() {
  return (
    <LightProvider>
      <Torch />

      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-5 mix-blend-difference text-white text-[0.85rem] font-medium uppercase tracking-[0.16em]">
        <span className="text-[1.15rem] font-bold tracking-[0.04em]">Velstays</span>
        <span className="hidden sm:block">Two private homes — Kigali</span>
      </nav>

      <StoryHero />

      <Statement
        id="privacy"
        index="01"
        label="Privacy"
        title={
          <>
            Behind the gate, House 23 belongs to{" "}
            <em className="not-italic text-primary">no one but you.</em>
          </>
        }
        body="No lobby, no shared walls, no other guests — the whole house, its office, its garden and its green-zone views are yours from check-in to checkout."
      >
        <TorchHint />
      </Statement>

      <PhotoWall photos={WALL_HOUSE_23} />

      <Statement
        id="design"
        index="02"
        label="Design"
        title={
          <>
            House 22 glows <em className="not-italic text-primary">lamp-warm</em> — designed down
            to the last detail.
          </>
        }
        body="Custom furnishings, a game room for slow afternoons, a private terrace for morning coffee. Nothing accidental; nothing in your way."
      />

      <PhotoWall photos={WALL_HOUSE_22} />

      <HouseCards />

      <NoirFooter />

      <FloatLamp />
    </LightProvider>
  )
}
