window.COTTAGE_DATA = {
  content: {
    lastReviewed: "2026-08-12"
  },
  host: {
    name: "Rick",
    phone: "519 427 9922",
    email: "rickyp3@me.com",
    directBookingNote: "Contact me directly for your next stay to save on third-party service fees and taxes."
  },
  property: {
    name: "64 Woodstock Ave Cottage",
    address: "64 Woodstock Ave, Long Point, ON",
    checkIn: "3:00 PM",
    checkOut: "10:00 AM"
  },
  essentials: [
    {
      id: "arrival-window",
      category: "Arrival",
      title: "Check-In and Check-Out",
      summary: "Check-in after 3:00 PM and check-out before 10:00 AM.",
      details: "If you need timing help for arrival or departure, contact the host in advance so arrangements can be confirmed."
    },
    {
      id: "property-location",
      category: "Property",
      title: "Cottage Address",
      summary: "64 Woodstock Ave, Long Point, ON.",
      details: "Use this address for navigation, deliveries, or if emergency services ever need the property location."
    },
    {
      id: "host-help",
      category: "Support",
      title: "Host Contact",
      summary: "Call or email Rick if you need help during your stay.",
      details: "Phone: 519 427 9922 | Email: rickyp3@me.com"
    },
    {
      id: "urgent-safety",
      category: "Emergency",
      title: "Emergency Help",
      summary: "Call 911 for fire, medical, or police emergencies.",
      details: "For non-emergency issues at the cottage, contact the host first so local support can be arranged quickly."
    },
    {
      id: "water-troubleshooting",
      category: "Utilities",
      title: "Water Pressure Help",
      summary: "If water pressure drops, check the pump switch in the utility closet.",
      details: "Avoid running the dishwasher, laundry, and long showers at the same time to keep pressure stable."
    },
    {
      id: "departure-basics",
      category: "Departure",
      title: "Departure Basics",
      summary: "Wash dishes, gather towels, take garbage out, and lock doors before leaving.",
      details: "Use the Departure checklist for the full list before checkout."
    }
  ],
  businessHighlights: [
    {
      id: "best-first-day",
      title: "Easy First-Day Options",
      summary: "Simple nearby picks for guests who want something low-friction after arrival.",
      businessIds: ["long-point-bird-observatory", "burning-kiln-winery", "long-point-eco-adventures"]
    },
    {
      id: "outdoor-favorites",
      title: "Outdoor Favorites",
      summary: "Good options if your group wants beach, trails, paddling, or wildlife experiences.",
      businessIds: ["long-point-eco-adventures", "big-creek-national-wildlife-area", "long-point-bird-observatory"]
    }
  ],
  wifi: {
    network: "LPCasa5",
    password: "SET_IN_PRIVATE_CONFIG"
  },
  spotify: {
    playlistUrl: "SET_IN_PRIVATE_CONFIG",
    speakers: []
  },
  calendar: {
    refreshMinutes: 30,
    bookingWindowDays: 180,
    fetchStrategies: [
      "direct",
      "https://api.allorigins.win/raw?url={{url}}"
    ],
    sources: [
      {
        name: "Airbnb",
        url: "SET_IN_PRIVATE_CONFIG"
      },
      {
        name: "VRBO",
        url: "SET_IN_PRIVATE_CONFIG"
      }
    ]
  },
  events: {
    refreshMinutes: 30,
    upcomingWindowDays: 60,
    liveFeeds: [
      {
        name: "LPRCA Events",
        url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.lprca.on.ca/events/feed/"
      },
      {
        name: "Long Point Biosphere Events",
        url: "https://api.rss2json.com/v1/api.json?rss_url=https://longpointbiosphere.com/events/feed/"
      }
    ],
    sourceLinks: [
      {
        name: "Long Point Region Conservation Events",
        url: "https://www.lprca.on.ca/events/",
        note: "Nature and local community events in the Long Point region.",
        category: "Local Source"
      },
      {
        name: "Long Point Biosphere Events",
        url: "https://longpointbiosphere.com/events/",
        note: "Regional workshops, open houses, and conservation events.",
        category: "Local Source"
      },
      {
        name: "Norfolk County Festivals and Events",
        url: "https://www.norfolkcounty.ca/recreation-culture-and-events/festivals-and-events/",
        note: "Official county event listings and seasonal festivals.",
        category: "County Source"
      },
      {
        name: "Port Rowan Farmers Market",
        url: "http://www.portrowanfarmersmarket.ca/",
        note: "Weekly market and vendor updates for Port Rowan.",
        category: "Local Source"
      }
    ]
  },
  businesses: [
    {
      id: "long-point-eco-adventures",
      category: "Tours",
      name: "Long Point Eco-Adventures",
      distance: "Local",
      phone: "877 743 8687",
      address: "1730 Front Rd, St. Williams, ON N0E 1P0",
      hours: "Daily 10:00 AM - 5:00 PM (some pages list 7:00 AM - 11:00 PM)",
      notes: "Outdoor adventure experiences and eco-focused activities."
    },
    {
      id: "long-point-island-huggers-tour",
      category: "Tours",
      name: "Long Point Island Huggers Tour",
      distance: "Local",
      phone: "519 718 9608",
      address: "Address not confirmed",
      hours: "Call for hours",
      notes: "Boat tour experience around Long Point waters. Listing details could not be confidently verified online."
    },
    {
      id: "tight-line-charters-guide-service",
      category: "Tours",
      name: "Tight Line Charters and Guide Service",
      distance: "Local",
      phone: "905 928 1686",
      address: "Long Point, ON N0E 1M0",
      hours: "Call for hours",
      notes: "Local guided charter experience in the Long Point area."
    },
    {
      id: "observatory-dome-experience",
      category: "Tours",
      name: "Observatory Dome Experience",
      distance: "Local",
      phone: "877 743 8687",
      address: "1730 Front Rd, St. Williams, ON N0E 1P0",
      hours: "Call for tour schedule",
      notes: "Stargazing and observatory experience at Long Point Eco-Adventures."
    },
    {
      id: "big-creek-kayak-tour",
      category: "Tours",
      name: "Big Creek Kayak Tour",
      distance: "Local",
      phone: "877 743 8687",
      address: "1730 Front Rd, St. Williams, ON N0E 1P0",
      hours: "Call for tour schedule",
      notes: "Guided kayak tour through Big Creek and surrounding wetlands."
    },
    {
      id: "elevation-mountain-bike-tours",
      category: "Tours",
      name: "Elevation Mountain Bike Tours",
      distance: "Local",
      phone: "519 427 3311",
      address: "1730 Front Rd, St. Williams, ON N0E 1P0",
      hours: "Call for tour schedule",
      notes: "Guided mountain biking experience for local trails in the area."
    },
    {
      id: "burning-kiln-winery",
      category: "Wineries",
      name: "Burning Kiln Winery",
      distance: "Local",
      phone: "519 586 9858",
      address: "1709 Front Rd, St. Williams, ON N0E 1P0",
      hours: "Daily 12:00 PM - 8:00 PM",
      notes: "Local winery with tasting experiences."
    },
    {
      id: "jimmy-riggin-fishing-charters",
      category: "Fishing",
      name: "Jimmy Riggin Fishing Charters",
      distance: "Local",
      phone: "519 586 7990",
      address: "136 Erie Blvd, Port Rowan, ON N0E 1M0",
      hours: "Call for hours",
      notes: "Guided charter fishing services."
    },
    {
      id: "long-point-pp-boat-launch",
      category: "Fishing",
      name: "Long Point Provincial Park Boat Launch",
      distance: "Local",
      phone: "888 668 7275",
      address: "Long Point Provincial Park, Port Rowan, ON N0E 1M0",
      hours: "Seasonal; check park hours and launch conditions",
      notes: "Public launch access inside Long Point Provincial Park. Day-use and park rules may apply."
    },
    {
      id: "long-point-pp-shore-fishing",
      category: "Fishing",
      name: "Long Point Provincial Park Shore Fishing Access",
      distance: "Local",
      phone: "888 668 7275",
      address: "Long Point Provincial Park shoreline, Port Rowan, ON N0E 1M0",
      hours: "Seasonal; check park access hours",
      notes: "Shore fishing access at Old Cut beach/shoreline areas within the park."
    },
    {
      id: "long-point-pp-docks",
      category: "Fishing",
      name: "Long Point Provincial Park Docks Area",
      distance: "Local",
      phone: "888 668 7275",
      address: "Long Point Provincial Park docks, Port Rowan, ON N0E 1M0",
      hours: "Seasonal; check park access hours",
      notes: "Dock area often used by anglers; follow posted park safety and access rules."
    },
    {
      id: "old-cut-marina",
      category: "Fishing",
      name: "Old Cut Marina",
      distance: "Local",
      phone: "Phone not listed",
      address: "Old Cut Blvd area, Port Rowan, ON N0E 1M0",
      hours: "Call or check listing for current hours",
      notes: "Marina and common fishing access area near Long Point Old Cut."
    },
    {
      id: "old-cut-boat-livery",
      category: "Fishing",
      name: "Old Cut Boat Livery",
      distance: "Local",
      phone: "Phone not listed",
      address: "Old Cut Blvd area, Port Rowan, ON N0E 1M0",
      hours: "Call or check listing for current hours",
      notes: "Small-boat launch and fishing access area near Old Cut."
    },
    {
      id: "long-point-causeway-canoe-launch",
      category: "Fishing",
      name: "Long Point Causeway Canoe Launch",
      distance: "Local",
      phone: "Phone not listed",
      address: "Long Point Causeway area, Port Rowan, ON N0E 1M0",
      hours: "Daylight access recommended; seasonal conditions apply",
      notes: "Useful launch point for canoe/kayak anglers; parking and water levels vary seasonally."
    },
    {
      id: "long-point-bird-observatory",
      category: "Nature",
      name: "Long Point Bird Observatory",
      distance: "Local",
      phone: "888 448 2473",
      address: "13 Old Cut Blvd, Port Rowan, ON N0E 1M0",
      hours: "Seasonal; visitor programs typically 9:00 AM - 12:00 PM during migration periods",
      notes: "Birding and conservation-focused destination."
    },
    {
      id: "big-creek-national-wildlife-area",
      category: "Nature",
      name: "Big Creek National Wildlife Area",
      distance: "Local",
      phone: "800 668 6767",
      address: "737 ON-59, Port Rowan, ON N0E 1M0",
      hours: "Seasonal access restrictions apply; check official advisories",
      notes: "Protected wildlife area with nature-viewing opportunities."
    },
    {
      id: "starks-golf-course",
      category: "Sports",
      name: "Starks Golf Course",
      distance: "Local",
      phone: "519 586 2802",
      address: "60 Dedrick Rd, Port Rowan, ON N0E 1M0",
      hours: "Typically opens around 8:00 AM; call to confirm daily schedule",
      notes: "Local golf course for guests and visitors."
    },
    {
      id: "long-point-provincial-park-sports",
      category: "Sports",
      name: "Long Point Provincial Park Activities",
      distance: "Local",
      phone: "519 586 2133",
      address: "250 Erie Blvd, Port Rowan, ON N0E 1M0",
      hours: "Seasonal day-use and posted program times",
      notes: "Outdoor sport possibilities include canoeing, fishing, hiking, and beach activities."
    },
    {
      id: "long-point-provincial-park-events",
      category: "Sports",
      name: "Long Point Provincial Park Outdoor Events",
      distance: "Local",
      phone: "519 586 2133",
      address: "250 Erie Blvd, Port Rowan, ON N0E 1M0",
      hours: "Scheduled sessions (for example morning and afternoon guided activities)",
      notes: "Seasonal guided activity sessions such as hiking basics and navigation skills."
    },
    {
      id: "turkey-point-provincial-park-sports",
      category: "Sports",
      name: "Turkey Point Provincial Park Activities",
      distance: "Nearby",
      phone: "519 426 3239",
      address: "194 Turkey Point Rd, Turkey Point, ON N0E 1T0",
      hours: "Seasonal day-use and park hours",
      notes: "Nearby options include mountain biking, canoeing, fishing, hiking, and swimming."
    },
    {
      id: "norfolk-trails-pathways",
      category: "Sports",
      name: "Norfolk County Trails and Pathways",
      distance: "Nearby",
      phone: "519 426 5870",
      address: "Norfolk County trail network (multiple access points)",
      hours: "Daytime use recommended",
      notes: "Cycling, walking, and mapped canoe/kayak route opportunities around the county."
    },
    {
      id: "simcoe-recreation-centre",
      category: "Sports",
      name: "Simcoe Recreation Centre",
      distance: "Nearby",
      phone: "519 426 5870",
      address: "182 South Dr, Simcoe, ON N3Y 2G5",
      hours: "Customer service desk typically Mon-Fri 7:30 AM - 8:00 PM; Sat 9:30 AM - 5:30 PM; Sun 8:30 AM - 2:00 PM",
      notes: "Regional sport complex with pools, courts, and recreation programs."
    },
    {
      id: "talbot-gardens-arena",
      category: "Sports",
      name: "Talbot Gardens Arena",
      distance: "Nearby",
      phone: "519 426 5870",
      address: "10 Talbot St N, Simcoe, ON",
      hours: "Program and drop-in schedules vary",
      notes: "Arena and skating programs in Norfolk County."
    },
    {
      id: "port-dover-arena",
      category: "Sports",
      name: "Port Dover Arena",
      distance: "Nearby",
      phone: "519 426 5870",
      address: "809 St George St, Port Dover, ON",
      hours: "Program and drop-in schedules vary",
      notes: "Community arena with seasonal skating and ice programs."
    },
    {
      id: "waterford-tricenturena",
      category: "Sports",
      name: "Waterford Tricenturena",
      distance: "Nearby",
      phone: "519 426 5870",
      address: "32 Church St E, Waterford, ON",
      hours: "Program and drop-in schedules vary",
      notes: "Arena facility with public skating and recreation sessions."
    },
    {
      id: "long-point-bay-anglers-association",
      category: "Sports",
      name: "Long Point Bay Anglers Association",
      distance: "Local",
      phone: "Phone not listed",
      address: "Long Point and Port Rowan area",
      hours: "Event timing varies by season",
      notes: "Local anglers association with fishing events and community tournament activity."
    },
    {
      id: "sandusk-golf-club",
      category: "Sports",
      name: "Sandusk Golf Club",
      distance: "Nearby",
      phone: "519 587 5886",
      address: "1445 Sandusk Rd, Jarvis, ON N0A 1J0",
      hours: "Tee-time based; call for current opening hours",
      notes: "Nearby golf option for guests exploring Norfolk County."
    },
    {
      id: "greens-at-renton",
      category: "Sports",
      name: "The Greens at Renton",
      distance: "Nearby",
      phone: "519 426 3308",
      address: "969 Concession 14 Townsend, Simcoe, ON",
      hours: "Tee-time based; call for current opening hours",
      notes: "Nearby golf course option in the Simcoe area."
    },
    {
      id: "burning-kiln-concerts-vineyard",
      category: "Live Music",
      name: "Burning Kiln Winery Concerts in the Vineyard",
      distance: "Local",
      phone: "519 586 9858",
      address: "1709 Front Rd, St. Williams, ON N0E 1P0",
      hours: "Seasonal concert dates; winery daily 12:00 PM - 8:00 PM",
      notes: "Popular outdoor concert series with touring and tribute acts."
    },
    {
      id: "sandpines-campfire-concert-series",
      category: "Live Music",
      name: "SANDPINES Campfire Concert Series",
      distance: "Local",
      phone: "Phone not listed",
      address: "50 Sea Queen Rd, Port Rowan, ON N0E 1M0",
      hours: "Seasonal evening concerts; check event dates",
      notes: "Large outdoor summer concert events hosted in Port Rowan."
    },
    {
      id: "211-main-live-music",
      category: "Live Music",
      name: "211 Main Live Music",
      distance: "Nearby",
      phone: "519 583 3251",
      address: "211 Main St, Port Dover, ON N0A 1N0",
      hours: "Live music nights typically around 7:30 PM - 10:30 PM",
      notes: "Regular live music programming at a nearby waterfront venue."
    },
    {
      id: "lighthouse-theatre-music-productions",
      category: "Live Music",
      name: "Lighthouse Theatre Music and Concert Productions",
      distance: "Nearby",
      phone: "519 583 2221",
      address: "247 Main St, Port Dover, ON N0A 1N0",
      hours: "Seasonal matinee and evening show schedule",
      notes: "Nearby theatre with recurring concert-style shows and musical productions."
    },
    {
      id: "turkey-point-hotel-live-entertainment",
      category: "Live Music",
      name: "Turkey Point Hotel Live Entertainment",
      distance: "Nearby",
      phone: "519 426 6236",
      address: "93 Cedar Dr, Turkey Point, ON N0E 1T0",
      hours: "Weekend entertainment schedule; evenings",
      notes: "Live music, themed nights, and rotating entertainment events."
    },
    {
      id: "south-coast-jazz-festival-port-dover",
      category: "Live Music",
      name: "South Coast Jazz Festival (Port Dover)",
      distance: "Nearby",
      phone: "Phone not listed",
      address: "801 St George St, Port Dover, ON N0A 1N0",
      hours: "Festival dates vary by season",
      notes: "Regional jazz festival programming with live performances."
    },
    {
      id: "boston-pizza-simcoe-live-local",
      category: "Live Music",
      name: "BP Live and Local Summer Patio Series",
      distance: "Nearby",
      phone: "Phone not listed",
      address: "9 Queensway W, Simcoe, ON N3Y 2M7",
      hours: "Scheduled evenings (commonly around 7:00 PM - 10:00 PM)",
      notes: "Summer patio live music series with local performers."
    },
    {
      id: "port-rowan-farmers-market",
      category: "Markets",
      name: "Port Rowan Farmers Market",
      distance: "Local",
      phone: "519 586 9532",
      address: "40 Sea Queen Rd, Port Rowan, ON N0E 1M0",
      hours: "Fridays 3:00 PM - 6:00 PM (June to Thanksgiving)",
      notes: "Local market featuring produce and regional goods."
    },
    {
      id: "little-farmers-market",
      category: "Markets",
      name: "The Little Farmers Market",
      distance: "Local",
      phone: "705 822 5544",
      address: "2283 Lakeshore Rd, Port Rowan, ON N0E 1M0",
      hours: "Mon-Fri 10:00 AM - 5:00 PM; Sat 9:00 AM - 5:00 PM; Sun closed",
      notes: "Local market-style produce stop serving the Port Rowan area."
    },
    {
      id: "simcoe-farmers-market",
      category: "Markets",
      name: "Simcoe Farmers Market",
      distance: "Nearby",
      phone: "519 429 2092",
      address: "172 South Dr, Simcoe, ON N3Y 1G6",
      hours: "Thursdays 8:00 AM - 3:00 PM",
      notes: "Regional farmers market with local produce and vendors."
    },
    {
      id: "trinity-acres",
      category: "Markets",
      name: "Trinity Acres",
      distance: "Nearby",
      phone: "Phone not listed",
      address: "493 Charlotteville Rd 7, Simcoe, ON N3Y 4K5",
      hours: "Hours not listed online",
      notes: "Farm market style destination in the Simcoe area."
    },
    {
      id: "waterford-farmers-market",
      category: "Markets",
      name: "Waterford Farmers Market",
      distance: "Nearby",
      phone: "Phone not listed",
      address: "39-77 Alice St, Waterford, ON N0E 1Y0",
      hours: "Typically listed around 8:00 AM - 8:00 PM; confirm current schedule",
      notes: "Nearby farmers market option in Waterford."
    },
    {
      id: "wholesome-pickins-market-bakery",
      category: "Markets",
      name: "Wholesome Pickins Market and Bakery",
      distance: "Nearby",
      phone: "519 582 1114",
      address: "500 Church St E, Delhi, ON N4B 1V3",
      hours: "Mon-Sat 9:00 AM - 6:00 PM; Sun 10:00 AM - 5:00 PM",
      notes: "Farm market and bakery destination with local products."
    },
    {
      id: "hometown-plants-farm-market",
      category: "Markets",
      name: "Hometown Plants and Farm Market",
      distance: "Nearby",
      phone: "519 586 3184",
      address: "187 Queen St E, St. Williams, ON N0E 1P0",
      hours: "Mon-Sat 9:00 AM - 5:00 PM; Sun 9:00 AM - 4:00 PM",
      notes: "Farm market option in nearby St. Williams."
    },
    {
      id: "cider-keg-farm-market",
      category: "Markets",
      name: "Cider Keg Farm Market",
      distance: "Nearby",
      phone: "519 428 0882",
      address: "1231 Norfolk 24 E, Vittoria, ON N0E 1W0",
      hours: "Hours not listed online",
      notes: "Popular farm market stop near the Turkey Point and Long Point route."
    },
    {
      id: "norfolk-harvest-farmstand",
      category: "Markets",
      name: "Norfolk Harvest Farmstand",
      distance: "Nearby",
      phone: "Phone not listed",
      address: "1971 Turkey Point Rd, Simcoe, ON N3Y 4J9",
      hours: "Hours not listed online",
      notes: "Farmstand option with local seasonal produce."
    },
    {
      id: "blueberry-hill-estates",
      category: "Wineries",
      name: "Blueberry Hill Estates",
      distance: "Local",
      phone: "519 586 2256",
      address: "1195 Front Rd, St. Williams, ON N0E 1P0",
      hours: "Mon-Thu 10:00 AM - 5:00 PM; Fri 10:00 AM - 5:30 PM; Sat 10:00 AM - 7:00 PM; Sun 10:00 AM - 6:00 PM",
      notes: "Estate winery destination in the local region."
    },
    {
      id: "inasphere-wines",
      category: "Wineries",
      name: "Inasphere Wines",
      distance: "Local",
      phone: "519 410 5930",
      address: "1454 Front Rd, Norfolk, ON N0E 1P0",
      hours: "Mon-Thu 12:00 PM - 5:00 PM; Fri 12:00 PM - 6:00 PM; Sat-Sun 11:00 AM - 6:00 PM",
      notes: "Local wines and tasting offerings."
    },
    {
      id: "bonnieheath-estate",
      category: "Wineries",
      name: "Bonnieheath Estate Lavender and Winery",
      distance: "Nearby",
      phone: "519 443 7125",
      address: "410 Concession 12 Townsend, Waterford, ON N3Y 4K3",
      hours: "Daily 11:00 AM - 5:00 PM",
      notes: "Estate winery and lavender farm in Norfolk County."
    },
    {
      id: "hounds-of-erie-winery",
      category: "Wineries",
      name: "Hounds of Erie Winery",
      distance: "Nearby",
      phone: "519 420 9097",
      address: "377 7th Concession Rd, Clear Creek, ON N0E 1C0",
      hours: "Wed-Fri 12:00 PM - 6:00 PM; Sat-Sun 11:00 AM - 5:00 PM",
      notes: "Small-batch Norfolk County winery experience."
    },
    {
      id: "frisky-beaver-wines",
      category: "Wineries",
      name: "Frisky Beaver Wines",
      distance: "Nearby",
      phone: "450 232 8371",
      address: "455 Radical Rd, Simcoe, ON N3Y 4K2",
      hours: "Seasonal hours; check current schedule online",
      notes: "Popular winery destination with seasonal tasting hours."
    },
    {
      id: "charlotteville-brewing",
      category: "Breweries",
      name: "Charlotteville Brewing Company",
      distance: "Nearby",
      phone: "519 619 7868",
      address: "1207 Charlotteville West Quarter Line, Simcoe, ON N3Y 4K1",
      hours: "Fri 1:00 PM - 8:00 PM; Sat 12:00 PM - 8:00 PM; Sun 12:00 PM - 6:00 PM",
      notes: "Farm brewery in Norfolk County with seasonal offerings."
    },
    {
      id: "meuse-brewing",
      category: "Breweries",
      name: "Meuse Brewing Company",
      distance: "Nearby",
      phone: "519 709 9327",
      address: "1903 Windham Rd 3, Scotland, ON N0E 1R0",
      hours: "Fri 12:00 PM - 6:00 PM; Sat 12:00 PM - 7:00 PM; Sun 12:00 PM - 5:00 PM",
      notes: "Craft brewery destination commonly visited from Norfolk cottage areas."
    },
    {
      id: "ramblin-road-brewery-farm",
      category: "Breweries",
      name: "Ramblin' Road Brewery Farm",
      distance: "Nearby",
      phone: "519 582 1444",
      address: "2970 Swimming Pool Rd, La Salette, ON N0E 1H0",
      hours: "See current listing hours online",
      notes: "Brewery farm with patio and seasonal operations."
    },
    {
      id: "flux-brewing",
      category: "Breweries",
      name: "Flux Brewing Company",
      distance: "Nearby",
      phone: "226 655 0222",
      address: "185 Oakland Rd, Scotland, ON N0E 1R0",
      hours: "Tue-Thu 12:00 PM - 9:00 PM; Fri-Sat 12:00 PM - 10:00 PM; Sun 12:00 PM - 6:00 PM",
      notes: "Craft brewery and taproom in the Norfolk region."
    },
    {
      id: "wishbone-brewing",
      category: "Breweries",
      name: "Wishbone Brewing Company",
      distance: "Nearby",
      phone: "Phone not listed",
      address: "80 Alice St Unit 2, Waterford, ON N0E 1Y0",
      hours: "Typically opens around 11:00 AM; check current listing hours",
      notes: "Small local brewery in nearby Waterford."
    },
    {
      id: "new-limburg-brewery",
      category: "Breweries",
      name: "New Limburg Brewery and Restaurant",
      distance: "Nearby",
      phone: "519 707 4141",
      address: "2353 Nixon Rd, Simcoe, ON N3Y 4K6",
      hours: "Typically opens around 12:00 PM; check current listing hours",
      notes: "Brewery and restaurant venue in the Simcoe area."
    },
    {
      id: "frannis-attic",
      category: "Shopping",
      name: "Franni's Attic (Antiques)",
      distance: "Local",
      phone: "519 410 4861",
      address: "1011 Bay St, Port Rowan, ON N0E 1M0",
      hours: "Typically opens around 11:00 AM; call to confirm current days",
      notes: "Antiques and unique vintage finds."
    },
    {
      id: "doerksen-country-store",
      category: "Shopping",
      name: "Doerksen Country Store Inc",
      distance: "Local",
      phone: "519 586 3901",
      address: "1086 Bay St, Port Rowan, ON N0E 1M0",
      hours: "Typically opens around 8:00 AM; call to confirm current hours",
      notes: "General retail and country store essentials."
    },
    {
      id: "port-rowan-home-building-centre",
      category: "Shopping",
      name: "Port Rowan Home Building Centre",
      distance: "Local",
      phone: "519 586 7336",
      address: "1089 Bay St, Port Rowan, ON N0E 1M0",
      hours: "Typically opens around 8:00 AM; call to confirm current hours",
      notes: "Hardware, home improvement, and cottage supply store."
    },
    {
      id: "y-knot-shop",
      category: "Shopping",
      name: "The Y Knot Shop",
      distance: "Local",
      phone: "519 718 0018",
      address: "1049 Bay St, Port Rowan, ON N0E 1M0",
      hours: "Typically opens around 10:00 AM; call to confirm current hours",
      notes: "Local boutique and gift shopping option."
    },
    {
      id: "cheshires-on-bay",
      category: "Shopping",
      name: "Cheshires on Bay",
      distance: "Local",
      phone: "519 586 5866",
      address: "1016 Bay St, Port Rowan, ON N0E 1M0",
      hours: "Typically opens around 10:00 AM; call to confirm current hours",
      notes: "Gift and specialty retail shop in Port Rowan."
    },
    {
      id: "port-rowan-thrift-shoppe",
      category: "Shopping",
      name: "Port Rowan Thrift Shoppe",
      distance: "Local",
      phone: "519 586 7186",
      address: "1026 Bay St, Port Rowan, ON N0E 1M0",
      hours: "Typically opens around 9:00 AM; call to confirm current hours",
      notes: "Community thrift store with second-hand finds."
    },
    {
      id: "books-on-bay",
      category: "Shopping",
      name: "Books On Bay",
      distance: "Local",
      phone: "Phone not listed",
      address: "1014 Bay St, Port Rowan, ON N0E 1M0",
      hours: "Typically opens around 10:00 AM; call to confirm current hours",
      notes: "Independent used and specialty book shop."
    },
    {
      id: "wiggans-foods-clover-farm",
      category: "Shopping",
      name: "Wiggans Foods Clover Farm",
      distance: "Local",
      phone: "519 586 7498",
      address: "1031 Bay St, Port Rowan, ON N0E 1M0",
      hours: "Typically opens around 8:00 AM; call to confirm current hours",
      notes: "Local grocery and convenience essentials."
    },
    {
      id: "rustic-garage-gift-decor",
      category: "Shopping",
      name: "The Rustic Garage Gift and Decor",
      distance: "Local",
      phone: "519 983 2251",
      address: "141 Front Rd, Port Rowan, ON N0E 1M0",
      hours: "Typically opens around 11:00 AM; call to confirm current hours",
      notes: "Gift and decor store with cottage-style home accents."
    },
    {
      id: "lily-mart",
      category: "Shopping",
      name: "Lily Mart",
      distance: "Nearby",
      phone: "519 586 3565",
      address: "190 Townline St, St. Williams, ON N0E 1P0",
      hours: "Typically open daily; call to confirm current hours",
      notes: "Nearby convenience store for quick essentials when visiting Long Point."
    },
    {
      id: "the-chip-ship",
      category: "Food",
      name: "The Chip Ship",
      distance: "Local",
      phone: "519 586 3302",
      address: "39 Rogers Ave, Port Rowan, ON N0E 1M0",
      hours: "Daily 11:00 AM - 9:00 PM",
      notes: "Popular local food stop."
    },
    {
      id: "udderlee-kool",
      category: "Food",
      name: "Udderlee Kool",
      distance: "Local",
      phone: "226 888 0789",
      address: "134 Erie Blvd, Port Rowan, ON N0E 1M0",
      hours: "Daily 8:00 AM - 9:00 PM",
      notes: "Ice cream, fast food, and convenience grocery options."
    },
    {
      id: "old-cut-dairy-bar-pizza",
      category: "Food",
      name: "Old Cut Dairy Bar and Pizza Co.",
      distance: "Local",
      phone: "226 398 1234",
      address: "17 Rogers Ave, Port Rowan, ON N0E 1M0",
      hours: "Mon-Wed 12:00 PM - 8:00 PM; Thu-Sat 12:00 PM - 9:00 PM; Sun 12:00 PM - 8:00 PM",
      notes: "Casual pizza and dairy bar in the Long Point area."
    },
    {
      id: "chef-stans",
      category: "Food",
      name: "Chef Stan's",
      distance: "Local",
      phone: "Phone not listed",
      address: "1029 Bay St, Port Rowan, ON N0E 1M0",
      hours: "See current listing hours online",
      notes: "Local restaurant. Phone and detailed hours were not clearly published in available source text."
    },
    {
      id: "boat-house-restaurant",
      category: "Food",
      name: "The Boat House Restaurant",
      distance: "Local",
      phone: "Phone not listed",
      address: "10 Seaqueen Rd, Port Rowan, ON N0E 1M0",
      hours: "See current listing hours online",
      notes: "Waterfront dining option in Port Rowan."
    },
    {
      id: "pizza-buoys",
      category: "Food",
      name: "Pizza Buoys",
      distance: "Local",
      phone: "Phone not listed",
      address: "153 Front Rd, Port Rowan, ON N0E 1M0",
      hours: "Typically around 3:00 PM - 8:00 PM; confirm current schedule",
      notes: "Local pizza option near Long Point."
    },
    {
      id: "godfathers-pizza-port-rowan",
      category: "Food",
      name: "Godfathers Pizza - Port Rowan",
      distance: "Local",
      phone: "Phone not listed",
      address: "1049 Bay St, Port Rowan, ON N0E 1M0",
      hours: "Typically around 11:00 AM - 10:00 PM; confirm current schedule",
      notes: "Chain pizza takeout and delivery location."
    },
    {
      id: "olde-tyme-deli-eatery",
      category: "Food",
      name: "Olde Tyme Deli and Eatery",
      distance: "Local",
      phone: "Phone not listed",
      address: "1023 Bay St, Port Rowan, ON N0E 1M0",
      hours: "Hours not listed online",
      notes: "Deli and eatery in Port Rowan."
    },
    {
      id: "marshview-patio-bar",
      category: "Food",
      name: "Marshview Patio and Bar",
      distance: "Local",
      phone: "519 427 6455",
      address: "1730 Front Rd, St. Williams, ON N0E 1P0",
      hours: "Breakfast daily 7:00 AM - 10:30 AM; Lunch/Dinner daily 11:30 AM - 8:00 PM",
      notes: "Restaurant at Long Point Eco-Adventures serving Long Point visitors."
    },
    {
      id: "baer-fishing-adventures",
      category: "Fishing",
      name: "Baer Fishing Adventures",
      distance: "Local",
      phone: "519 718 8113",
      address: "Address not confirmed",
      hours: "Call for hours",
      notes: "Guided fishing adventures for visitors. Listing details could not be confidently verified online."
    },
    {
      id: "south-coast-fishing-charters",
      category: "Fishing",
      name: "South Coast Fishing Charters",
      distance: "Nearby",
      phone: "Phone not listed",
      address: "1 Submariners Way, Port Burwell, ON N0J 1T0",
      hours: "Call or check charter site for schedule",
      notes: "Nearby charter option often used by anglers visiting the Long Point region."
    }
  ],
  rules: [
    {
      id: "quiet-hours",
      category: "Noise",
      title: "Quiet Hours",
      summary: "Please keep outdoor noise low between 11:00 PM and 8:00 AM.",
      details: "Respect nearby cottages by moving music indoors and avoiding loud group activity late at night."
    },
    {
      id: "fires-only-pit",
      category: "Safety",
      title: "Fire Pit Use",
      summary: "Fires are allowed only in the designated fire pit.",
      details: "Never leave fire unattended. Keep water nearby and fully extinguish embers before sleeping."
    },
    {
      id: "no-smoking",
      category: "Cleanliness",
      title: "No Smoking Indoors",
      summary: "Smoking and vaping are not permitted inside the cottage.",
      details: "Use outdoor areas only and dispose of waste safely in metal bins."
    },
    {
      id: "pets-policy",
      category: "Pets",
      title: "Pet Courtesy",
      summary: "Pets are welcome if supervised and cleaned up after.",
      details: "Please keep pets off beds and furniture unless covered with your own blanket."
    }
  ],
  tips: [
    {
      id: "wifi-access",
      category: "Wi-Fi",
      title: "Wi-Fi Access",
      summary: "Wi-Fi network: LPCasa5",
      details: "Password is available in your private host config."
    },
    {
      id: "water",
      category: "Utilities",
      title: "Water System",
      summary: "If water pressure drops, check that the pump switch in the utility closet is on.",
      details: "Avoid running the dishwasher, laundry, and long showers at the same time to keep pressure stable."
    },
    {
      id: "trash",
      category: "Departure",
      title: "Trash and Recycling",
      summary: "Please take garbage to the black bin beside the garage.",
      details: "Tie bags securely and place them in the black bin so pickup is easy."
    },
    {
      id: "wildlife",
      category: "Outdoors",
      title: "Wildlife Awareness",
      summary: "Store food indoors and keep car doors closed after unloading.",
      details: "Avoid leaving coolers on the deck overnight, especially near dusk."
    },
    {
      id: "boating",
      category: "Activities",
      title: "Boat Launch Tip",
      summary: "Best launch window is before 9:00 AM to avoid weekend queues.",
      details: "Bring life jackets, check the weather, and keep dock access clear for neighbors."
    },
    {
      id: "beach-rinse",
      category: "Cleanliness",
      title: "Rinse After the Beach",
      summary: "Please use the outdoor shower after beach visits before entering the cottage.",
      details: "Rinsing off outdoors helps keep sand out of the house and off the plumbing."
    },
    {
      id: "bbq-cleanup",
      category: "Kitchen",
      title: "BBQ Cleanup",
      summary: "Please scrape the BBQ after use.",
      details: "A quick scrape keeps it ready for the next guests."
    },
    {
      id: "bathroom-basics",
      category: "Bathroom",
      title: "Bathroom Basics",
      summary: "Please rinse the shower walls and place used towels on the shower floor.",
      details: "This helps housekeeping and keeps the bathroom fresh for the next guests."
    },
    {
      id: "exterior-lights",
      category: "Lighting",
      title: "Exterior Lights",
      summary: "The deck and pergola lights are controlled from the posts near the stairs and front door.",
      details: "Use the post at the top of the stairs for the deck lights and the post by the front door for the pergola lights."
    },
    {
      id: "tech-guide",
      category: "Entertainment",
      title: "Streaming and Speakers",
      summary: "The bedroom TVs can be cast from your phone, and Google speakers are in most rooms.",
      details: "Choose the room name from your device list when casting, or try voice commands like ‘Hey Google, play music on all speakers.’"
    }
  ],
  checklists: {
    arrival: [
      "Connect to Wi-Fi",
      "Review cottage rules",
      "Confirm thermostat comfort settings"
    ],
    departure: [
      "Wash dishes and empty dishwasher",
      "Take garbage to the black bin beside the garage",
      "Put all used towels on the shower floor",
      "Scrape the BBQ as best you can after use",
      "Turn off lights and small appliances",
      "Lock doors and close windows"
    ]
  }
};

if (window.COTTAGE_PRIVATE_DATA && typeof window.COTTAGE_PRIVATE_DATA === "object") {
  mergeDeep(window.COTTAGE_DATA, window.COTTAGE_PRIVATE_DATA);
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function mergeDeep(target, source) {
  Object.keys(source).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (Array.isArray(sourceValue)) {
      target[key] = sourceValue;
      return;
    }

    if (isPlainObject(sourceValue)) {
      if (!isPlainObject(targetValue)) {
        target[key] = {};
      }
      mergeDeep(target[key], sourceValue);
      return;
    }

    target[key] = sourceValue;
  });
}
