## Eight verified winners, none from the exclusion list

Read organizer-hosted Devpost galleries and each project’s exact award block. **Important trap:** Hack the North’s gallery labels some *finalists* “Winner.” I excluded those. Implementation descriptions below are **team-reported**, not independently executed; GitHub file trees were additionally checked for Kinemo, DriveWise, and ScrewYouIKEA.

### 1. Kinemo — PennApps XXVI 2025, **1st Place Overall**
[Primary source](https://devpost.com/software/kinemo) · [Code](https://github.com/arvinmefsha/kinemo)

**Mechanism:** Two people become game controllers using one webcam. OpenCV → MediaPipe body landmarks → NumPy velocity/acceleration calculations → Pygame collision and timing rules. Three games: boxing, fruit slicing, reaction race. Boxing includes timed dodges, stun windows, attack cooldowns; fruit slicing uses hand velocity and renders slice angle.

**Built vs future:** Three playable games and gesture-controlled menu; team reports taking it around the venue for other hackers to play. Repository contains separate game, input, fighter-state, and tracking modules. Additional games and better UI control ownership were future work.

**Lesson:** Real-time interaction rules, not pose detection alone, create the compelling technical demo.

### 2. ScrewYouIKEA — HackHarvard 2025, **Best First-Time Hack**
[Primary source](https://devpost.com/software/screwyouikea) · [Code](https://github.com/donaragalstyan/ScrewYouIkea)

**Mechanism:** Manual PDF → page images with PDF.js → structured parts/instructions using Gemini Pro → generated Scene JSON/step code → procedural Three.js assembly animation. Familiar physical frustration becomes a navigable spatial representation.

**Built vs future:** Team reports end-to-end conversion of real IKEA manuals. Repository exposes extraction routes and a Three.js runner. **Conversational voice help was not complete:** despite broad pitch language, “wire the voice interface to live Gemini QA” appears under next steps. AR/VR also future. Geometric fidelity was not independently validated.

### 3. DriveWise — PennApps XXV 2024, **Best Statistics + Best Community Impact**
[Primary source](https://devpost.com/software/drivewise-g09s5y) · [Code](https://github.com/pranavponnusamy/Drivewise)

**Mechanism:** Map historical crashes onto road edges; combine crash density, turn-angle penalties, and driver-experience parameter in modified A* routing. Team reports processing 3.1 million accident points spanning 22 years using OSM/OSMnx and spatial queries.

**Built vs future:** Route-planning prototype and web/mobile interfaces; regional expansion was future work. **“Safer” is an unvalidated proxy:** raw crash counts can reflect traffic volume, and no real-world reduction in accidents is established.

**Lesson:** A visible route changes because the mathematical objective changes—not because an LLM narrates a recommendation.

### 4. LooGuessr — Hack the North 2024, **MappedIn indoor-mapping prize**
[Primary source](https://devpost.com/software/looguessr)

**Mechanism:** Friends post campus photographs; players guess their locations, earn points, then inspect detailed indoor maps. React mobile website, MappedIn SDK, Express/Node, MongoDB.

**Built vs future:** Daily photo sharing/guessing and map exploration described as implemented. Global tournaments, 360° stitched views, face blurring, and delayed image publication were future work. Switched from native Android to mobile web because of SDK support.

**Lesson:** Multiplayer play can produce useful spatial knowledge, although this particular concept is close to GeoGuessr rather than a new opportunity to copy.

### 5. Flexy (And I Know It) — HackHarvard 2024, **AllHealth Track**
[Primary source](https://devpost.com/software/flexy-and-i-know-it)

**Mechanism:** Phone video → MediaPipe/OpenCV landmarks → joint-angle and cosine-similarity comparisons with demonstration poses. Users draw circles, waves, and infinity loops through body movement.

**Built vs future:** Real-time pose comparison and movement-to-drawing interaction; custom demonstration dataset. Wearables and VR were future. Faster healing, safe rehabilitation, and clinical accuracy are **not demonstrated outcomes**.

**Lesson:** Turn an otherwise invisible motor skill into a visible artifact. For HackCMU, transfer that interaction outside medical claims.

### 6. Chilladelphia — PennApps XXV 2024, **Best Sustainability, Bloomberg**
[Primary source](https://devpost.com/software/chilladelphia)

**Mechanism:** Download aerial imagery → DetectTrees segmentation → compute green-pixel percentage → geospatial “chill” map and address lookup, alongside cooling resources.

**Built vs future:** Concrete imagery-analysis pipeline and React/Node/Mongo map prototype. Coverage was limited by storage; citywide expansion and partnerships were future. Green coverage is a proxy, **not a measured street-temperature model**. Team tried several imagery APIs before resorting to a scraper.

**Lesson:** A useful derived map can come from transforming existing imagery; obtaining dependable input data can be harder than the model.

### 7. MatchTube — PennApps XXV 2024, **Best Use of MongoDB Atlas**
[Primary source](https://devpost.com/software/matchtube)

**Mechanism:** Import Google Takeout YouTube viewing/search history → parse titles/data → sentence-transformer embeddings → MongoDB vector similarity → match people by observed interests.

**Built vs future:** Upload, embedding, matching, and authentication pipeline described. Production deployment, messaging, richer profiles, and expanded platforms were future. No evidence matching predicts relationship quality.

**Lesson:** User-owned digital traces can become a structured preference model without a questionnaire—but full history import is both a privacy and demo-onboarding liability.

### 8. Freak-cha — HackHarvard 2025, **Funniest Hack**
[Primary source](https://devpost.com/software/freak-cha)

**Mechanism:** Answer randomized true/false questions with tongue gestures. Team collected/labeled tongue images, trained YOLOv8 detection, and integrated webcam feedback and facial-embedding similarity.

**Built vs future:** Working gesture-based verification prototype reported. **“AI cannot replicate it” is unsupported**, and no anti-spoofing benchmark is supplied. This is an unusual physical input system, not evidence of secure authentication.

## Three opportunity areas—not copies

1. **Fairness-aware group outings.** Instead of “find a restaurant,” jointly optimize meeting point, route, arrival time, dietary constraints, and *maximum individual burden*. Show a Pareto frontier; one person changes a constraint and everyone’s plan repairs live. **24h cut:** three phones, a small real walking graph, finite venue set, exact search. Demo proves the tradeoff against “pick the midpoint.” Risk: unreliable venue/route data.

2. **Shared physical tasks as executable state machines.** Coordinate two people cooking or packing with limited tools and dependencies. A deterministic scheduler assigns tasks; QR/phone confirmations update physical state; an unexpected delay repairs the schedule. **24h cut:** one well-defined workflow, two phones, one shared resource. Unlike a recipe chatbot, the system resolves real resource contention and exposes its critical path.

3. **Cooperative physical puzzles with asymmetric information.** Each person sees only part of a spatial problem; webcam/phone movement supplies another part. Players must communicate and jointly satisfy geometry/timing constraints to unlock the next stage. **24h cut:** one polished room-scale puzzle, no generated content, visible tracking confidence and generous tolerances. Distinct from webcam sports: communication and complementary roles are the core mechanic. Risk: tracking reliability; test two participants immediately.

**Files/issues:** No workspace files created. Updated the research skill’s existing reference with the finalist-badge pitfall. HTTP sources worked; one guessed HackMIT URL returned 404. No videos watched or applications executed.