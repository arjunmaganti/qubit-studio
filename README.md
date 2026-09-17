# Qu-Bit Studio

Qu-Bit studio is a dashboard for exploring a simplified model of a transmon, a 
type of superconducting qubit, and for finding parameter combinations that meet specified
frequency, noise, and stability constraints. The frontend is a Next.js/React application.
This physics calculations run in a separate Python backend using the scqubits library,
so all displayed numbers come from a single calculation source. In "Explore" mode, a user
sets device parameters like Josephson energy, charging energy, and offset charge. They can
then view the resulting frequencies and charge sensitivity alongside a 3D and 2D representation
of the chip. "Design" mode adds a search for parameter values matching a target frequency,
a sensitivity sweep across small parameter variations, a separate flux-tunable device model, 
and a comparison between two sets of material-derived electrical assumptions. Each of these
returns the specific values and constraints used to reach its result. There is also a chip
builder that lets users place layout components (capacitor pads, junctions, control lines)
on a canvas and derives EJ/EC values from the drawn geometry using stated area-to-energy 
conversions and equations. An AI-powered copilot, Myla, generates explanations for the current
selection from the live calculation output either through fixed logic or calling an external
LLM. The app includes a guided tour and a step-by-step build workflow, and supports saving
designs, sharing them via URL, and exporting a JSON report of a session's inputs and results.
The model does not account for coherence times, fabrication yield, or other properties of 
physical devices.

In order to view a more detailed overview of the architecture, please refer to DESIGN.md.

You can view the final app at: https://qubit-studio-indol.vercel.app/

# Contact

This project was developed for HackCMU hosted by ACM@CMU under the optimization track. If you have
any questions or concerns, please send them to:

Vaibhav Maddhi: vmaddhi@andrew.cmu.edu \
Arjun Maganti: amaganti@andrew.cmu.edu \
Harish Senthilkumar: hsenthil@andrew.cmu.edu
